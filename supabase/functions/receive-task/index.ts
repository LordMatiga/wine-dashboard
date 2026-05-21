import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Pool } from "https://deno.land/x/postgres@v0.17.0/mod.ts"

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: CORS })
  }

  try {
    const rawParsed = await req.json()
    const raw = Object.fromEntries(Object.entries(rawParsed).map(([k, v]) => [k.trim(), v]))

    console.log("raw JSON reçu:", JSON.stringify(raw))

    const pool = new Pool(Deno.env.get("SUPABASE_DB_URL")!, 1, true)
    const conn = await pool.connect()

    try {
      await conn.queryObject(
        `INSERT INTO tasks (client_name, supplier_name, description, type, urgent, status)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          raw.client      ?? raw.client_name   ?? null,
          raw.fournisseur ?? raw.supplier_name  ?? null,
          raw.description ?? null,
          raw.type        ?? "autre",
          raw.urgent      ?? false,
          raw.status      ?? "Entrante",
        ]
      )
    } finally {
      conn.release()
      await pool.end()
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    })
  }
})
