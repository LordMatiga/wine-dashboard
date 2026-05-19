import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import webPush from "https://esm.sh/web-push@3.6.6"

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!

webPush.setVapidDetails(
  "mailto:contact@grunfalcot.fr",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
)

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      }
    })
  }

  const { status, client_name } = await req.json()
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { data: subs } = await supabase.from("push_subscriptions").select("*")

  if (!subs || subs.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), { status: 200 })
  }

  let targetLabel = ""
  let title = ""
  let body = ""

  if (status === "Traitée") {
    targetLabel = "patron"
    title = "✅ Commande traitée"
    body = `${client_name} a été traitée`
  } else if (status === "À traiter") {
    targetLabel = "assistant"
    title = "🔔 Commande à traiter"
    body = `${client_name} nécessite une action`
  }

  const targets = subs.filter((s: any) => s.user_label === targetLabel)
  let sent = 0

  for (const sub of targets) {
    try {
      await webPush.sendNotification(sub.subscription, JSON.stringify({ title, body }))
      sent++
    } catch (e) {
      console.error("Push failed:", e)
    }
  }

  return new Response(JSON.stringify({ sent }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  })
})
