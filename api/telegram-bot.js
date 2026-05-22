const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN?.trim()
const GROQ_API_KEY = process.env.GROQ_API_KEY
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SERVICE_ROLE_KEY

const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`

const TYPE_LABELS = {
  fiche_client: 'Fiche client',
  logistique: 'Logistique',
  compta: 'Compta',
  tarif: 'Tarif',
  autre: 'Autre',
}

async function sendMessage(chatId, text) {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  })
}

async function transcribeVoice(fileId) {
  const fileRes = await fetch(`${TELEGRAM_API}/getFile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ file_id: fileId }).toString(),
  })
  const fileData = await fileRes.json()

  if (!fileData.ok || !fileData.result?.file_path) {
    throw new Error(`getFile failed: ${JSON.stringify(fileData)}`)
  }

  const audioRes = await fetch(
    `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${fileData.result.file_path}`
  )
  const audioBuffer = await audioRes.arrayBuffer()

  const form = new FormData()
  form.append('file', new Blob([audioBuffer], { type: 'audio/ogg' }), 'voice.ogg')
  form.append('model', 'whisper-large-v3')
  form.append('language', 'fr')

  const transcribeRes = await fetch(
    'https://api.groq.com/openai/v1/audio/transcriptions',
    { method: 'POST', headers: { Authorization: `Bearer ${GROQ_API_KEY}` }, body: form }
  )
  const transcribeData = await transcribeRes.json()
  return transcribeData.text
}

async function splitIntents(text) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `Tu analyses un message professionnel pour détecter s'il contient plusieurs demandes distinctes et indépendantes.
Une demande distincte = une action qui peut être traitée séparément (passer une commande, préparer une fiche client, signaler un problème logistique, envoyer une facture, etc.).
Si le message contient UNE SEULE demande : {"segments":["<texte complet>"]}
Si le message contient PLUSIEURS demandes distinctes, découpe en segments autonomes (chaque segment doit être compréhensible seul) : {"segments":["demande 1 avec contexte","demande 2 avec contexte"]}
Réponds uniquement en JSON PUR.`,
        },
        { role: 'user', content: text },
      ],
      response_format: { type: 'json_object' },
    }),
  })
  const data = await res.json()
  try {
    const parsed = JSON.parse(data.choices[0].message.content)
    return Array.isArray(parsed.segments) && parsed.segments.length > 0 ? parsed.segments : [text]
  } catch {
    return [text]
  }
}

async function categorize(text) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `### MISSION
Tu es un agent d'extraction de données logistiques pour Grün Falcot & Co, agence de courtage en vins.
Tu analyses un message et tu dois identifier la NATURE de la demande, extraire les informations pertinentes et retourner un JSON structuré.
Réponds uniquement en JSON PUR, sans réflexion, sans markdown.

### PERSONNES À IGNORER (NE JAMAIS EXTRAIRE comme client ou fournisseur) :
- Steve, Axel, Axelle (ce sont les opérateurs)

### RÉFÉRENTIEL FOURNISSEURS — utilise UNIQUEMENT ces noms exacts (correction phonétique obligatoire) :
ALPHONSE MELLOT, BONSERINE, BRUMONT ALAIN, CAZES, CHATEAU DE LA GREFFIERE, COULY DUTHEIL, COURBIS DOMAINE, DE LADOUCETTE, DESCAVES, DEVILLARD, DUBOST, GEORGES VERNAY, HAUTS CHASSIS DOMAINE, JAUME ALAIN, LAFAGE DOMAINE, LEDA - MAISON LEDA, LES ENTREFAUX, LORON, LOUIS LATOUR, LOUIS MOREAU, MAGNIEN FREDERIC MAISON, MAGNIEN MICHEL DOMAINE, MARGÜI VINEYARDS, MAS DE DAUMAS GASSAC, OPCO COMMERCE, PIERRE CHAVIN, RAFFIN VINI, REGNARD, ROLET DOMAINE, SAINT COSME, SAS G3F, SCHLUMBERGER DOMAINES, SIMONNET-FEBVRE, SNC ROEDERER DISTRIBUTION, SPIRIBAM, VINI BE GOOD, VINITERROIRS, VINS DU MONDE, VINUSTRALE
Exemples phonétiques : "5 come" / "cinq comme" / "sein caume" = SAINT COSME | "de villars" = DEVILLARD | "vernet" = GEORGES VERNAY
Si aucune correspondance possible : null

### TYPES DE DEMANDES :
1. commande : passer une commande chez un fournisseur pour un client. Mots-clés : "commande", "commander", "bouteilles", "caisses", "livraison pour"
2. fiche_client : fiche de préparation pour un rendez-vous. Mots-clés : "fiche", "prépare", "rendez-vous", "RDV", "dossier", "semaine"
3. logistique : problème livraison/transporteur/adresse/stock. Mots-clés : "pas reçu", "livraison", "livreur", "adresse", "problème", "retard"
4. compta : factures, avoirs, paiements. Mots-clés : "facture", "avoir", "paiement", "comptabilité", "envoie", "perdu"
5. tarif : demande d'envoi de tarif fournisseur. Mots-clés : "tarif", "prix", "pousse", "envoie le tarif"
6. autre : tout ce qui ne rentre dans aucune catégorie

### DÉTECTION URGENCE :
urgent = true si : "urgent", "urgence", "asap", "rapidement", "dès que possible", "priorité", "immédiatement"

### RÈGLES CLIENT :
- Retranscris le nom EXACTEMENT comme prononcé
- Inclus la localisation si mentionnée (ex: "à Dardilly", "Lyon 6")
- Met en MAJUSCULES
- Arrête la capture dès que tu entends des dates, quantités ou noms de cuvées
- IGNORE Steve, Axel, Axelle

### FORMAT DE SORTIE :
Pour commande :
{"type":"commande","urgent":false,"client":"NOM CLIENT","fournisseur":"NOM RÉFÉRENTIEL ou null","description":"résumé exhaustif et complet de la demande"}

Pour fiche_client, logistique, compta, autre :
{"type":"fiche_client","urgent":false,"client":"NOM CLIENT ou null","fournisseur":null,"description":"résumé exhaustif et complet"}

Pour tarif :
{"type":"tarif","urgent":false,"client":"NOM CLIENT ou null","fournisseur":"NOM RÉFÉRENTIEL ou null","description":"résumé exhaustif et complet"}`,
        },
        { role: 'user', content: text },
      ],
      response_format: { type: 'json_object' },
    }),
  })
  const data = await res.json()
  return JSON.parse(data.choices[0].message.content)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(200).send('OK')
    return
  }

  try {
    const message = req.body?.message
    if (!message) {
      res.status(200).send('OK')
      return
    }

    const chatId = message.chat.id
    let text = null

    if (message.text && !message.text.startsWith('/')) {
      text = message.text
    } else if (message.voice) {
      await sendMessage(chatId, '⏳ Traitement en cours...')
      text = await transcribeVoice(message.voice.file_id)
    } else {
      if (message.text?.startsWith('/start')) {
        await sendMessage(chatId, '👋 Bot Grün Falcot actif. Envoyez un message vocal ou texte pour créer une tâche.')
      }
      res.status(200).send('OK')
      return
    }

    const supabaseHeaders = {
      'Content-Type': 'application/json',
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      Prefer: 'return=minimal',
    }

    const segments = await splitIntents(text)

    for (const segment of segments) {
      const result = await categorize(segment)
      const urgentTag = result.urgent ? ' 🔴' : ''
      const clientDisplay = result.client ? ` — ${result.client}` : ''

      if (result.type === 'commande') {
        await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
          method: 'POST',
          headers: supabaseHeaders,
          body: JSON.stringify({
            client_name: result.client ?? null,
            supplier_name: result.fournisseur ?? null,
            transcription: result.description ?? segment,
            raw_transcription: text,
            urgent: result.urgent ?? false,
            status: 'Entrante',
          }),
        })
        await sendMessage(chatId, `✅ Commande enregistrée${urgentTag}\n<b>Commande${clientDisplay}</b>\n${result.description ?? ''}`)
      } else {
        await fetch(`${SUPABASE_URL}/rest/v1/tasks`, {
          method: 'POST',
          headers: supabaseHeaders,
          body: JSON.stringify({
            client_name: result.client ?? null,
            supplier_name: result.fournisseur ?? null,
            description: result.description ?? null,
            raw_transcription: text,
            type: result.type ?? 'autre',
            urgent: result.urgent ?? false,
            status: 'Entrante',
          }),
        })
        const label = TYPE_LABELS[result.type] ?? 'Autre'
        await sendMessage(chatId, `✅ Tâche enregistrée${urgentTag}\n<b>${label}${clientDisplay}</b>\n${result.description ?? ''}`)
      }
    }

    res.status(200).send('OK')
  } catch (e) {
    console.error('telegram-bot error:', e)
    res.status(200).send('OK')
  }
}
