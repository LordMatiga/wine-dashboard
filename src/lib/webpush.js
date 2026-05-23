const VAPID_PUBLIC_KEY = 'BFbC0CaAWWPdp0bLb5nb0BWB1aUq_q9BtlycnOezW541Z8xzp9goO3e2aT2qRsLeRlry1SykLINwXgPfSPe4Q3A'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

export async function subscribeToPush(userLabel) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push non supporté sur ce navigateur')
  }
  const registration = await navigator.serviceWorker.ready
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Permission refusée')

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
  })
  return subscription
}

export async function sendPushNotification(status, client_name, type = 'commande') {
  return // notifications temporairement désactivées
  const res = await fetch('https://ydrlwtmgvgbbgbminydv.supabase.co/functions/v1/send-push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + import.meta.env.VITE_SUPABASE_ANON_KEY
    },
    body: JSON.stringify({ status, client_name, type })
  })
  const json = await res.json().catch(() => ({}))
  console.log('[push] status=%s sent=%d http=%d', status, json.sent ?? '?', res.status)
  if (!res.ok) throw new Error(`Edge Function error ${res.status}: ${JSON.stringify(json)}`)
}
