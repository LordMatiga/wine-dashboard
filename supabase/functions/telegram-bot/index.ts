import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Pool } from "https://deno.land/x/postgres@v0.17.0/mod.ts"

const TELEGRAM_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!.trim()
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")!
const DB_URL = Deno.env.get("SUPABASE_DB_URL")!
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`
console.log("token length:", TELEGRAM_TOKEN.length)

const TYPE_LABELS: Record<string, string> = {
  fiche_client: "Fiche client",
  logistique: "Logistique",
  compta: "Compta",
  tarif: "Tarif",
  autre: "Autre",
}

async function sendMessage(chat_id: number, text: string) {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id, text, parse_mode: "HTML" }),
  })
}

async function transcribeVoice(fileId: string): Promise<string> {
  console.log("file_id length:", fileId.length, "file_id:", fileId)

  const fileRes = await fetch(`${TELEGRAM_API}/getFile`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ file_id: fileId }).toString(),
  })
  console.log("getFile HTTP status:", fileRes.status)
  const fileData = await fileRes.json()
  console.log("getFile response:", JSON.stringify(fileData))

  if (!fileData.ok || !fileData.result?.file_path) {
    throw new Error(`getFile failed: ${JSON.stringify(fileData)}`)
  }

  const downloadUrl = `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${fileData.result.file_path}`
  console.log("downloading:", downloadUrl)
  const audioRes = await fetch(downloadUrl)
  console.log("audio download status:", audioRes.status)
  const audioBlob = await audioRes.blob()

  const form = new FormData()
  form.append("file", audioBlob, "voice.ogg")
  form.append("model", "whisper-large-v3")
  form.append("language", "fr")

  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${GROQ_API_KEY}` },
    body: form,
  })
  const data = await res.json()
  return data.text
}

async function categorize(text: string) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `Tu es un assistant qui catégorise des demandes professionnelles pour Grün Falcot & Co, société de courtage en vins. Réponds uniquement avec un JSON valide sans markdown.
Champs à extraire :
- client_name : nom du client mentionné (null si absent)
- supplier_name : nom du fournisseur ou domaine mentionné (null si absent)
- description : résumé clair en une phrase à l'infinitif de ce qui est demandé
- type : "fiche_client" | "logistique" | "compta" | "tarif" | "autre"
- urgent : true si la demande est urgente, sinon false`,
        },
        { role: "user", content: text },
      ],
      response_format: { type: "json_object" },
    }),
  })
  const data = await res.json()
  return JSON.parse(data.choices[0].message.content)
}

serve(async (req) => {
  if (req.method !== "POST") return new Response("OK", { status: 200 })

  try {
    const update = await req.json()
    const message = update.message
    if (!message) return new Response("OK", { status: 200 })

    const chatId = message.chat.id
    let text: string | null = null

    if (message.text && !message.text.startsWith("/")) {
      text = message.text
    } else if (message.voice) {
      console.log("voice object:", JSON.stringify(message.voice))
      await sendMessage(chatId, "⏳ Traitement en cours...")
      text = await transcribeVoice(message.voice.file_id)
    } else {
      if (message.text?.startsWith("/start")) {
        await sendMessage(chatId, "👋 Bot Grün Falcot actif. Envoyez un message vocal ou texte pour créer une tâche.")
      }
      return new Response("OK", { status: 200 })
    }

    const task = await categorize(text)

    const pool = new Pool(DB_URL, 1, true)
    const conn = await pool.connect()
    try {
      await conn.queryObject(
        `INSERT INTO tasks (client_name, supplier_name, description, type, urgent, status)
         VALUES ($1, $2, $3, $4, $5, 'Entrante')`,
        [
          task.client_name ?? null,
          task.supplier_name ?? null,
          task.description ?? null,
          task.type ?? "autre",
          task.urgent ?? false,
        ]
      )
    } finally {
      conn.release()
      await pool.end()
    }

    const urgentTag = task.urgent ? " 🔴" : ""
    const label = TYPE_LABELS[task.type] ?? "Autre"
    const client = task.client_name ? ` — ${task.client_name}` : ""
    await sendMessage(chatId, `✅ Tâche enregistrée${urgentTag}\n<b>${label}${client}</b>\n${task.description ?? ""}`)

    return new Response("OK", { status: 200 })
  } catch (e) {
    console.error("telegram-bot error:", e)
    return new Response("OK", { status: 200 })
  }
})
