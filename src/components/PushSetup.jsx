import { useState } from 'react'
import { subscribeToPush } from '../lib/webpush.js'
import { supabase } from '../lib/supabase.js'
import { askNotificationPermission, subscribeToPush } from '../lib/webpush.js'

export default function PushSetup({ onClose }) {
  const [step, setStep] = useState('choose')
  const [message, setMessage] = useState('')

  async function handleSubscribe(userLabel) {
  try {
    // 1. Demande de permission directe (clic utilisateur par exemple)
    const hasPermission = await askNotificationPermission();
    if (!hasPermission) throw new Error('Permission refusée');

    // 2. Maintenant on s'abonne
    const subscription = await subscribeToPush(userLabel);
      await supabase
        .from('push_subscriptions')
        .upsert(
          { user_label: userLabel, subscription: subscription.toJSON() },
          { onConflict: 'user_label' }
        )
      setStep('done')
      setMessage('Notifications activées !')
    } catch (e) {
      setStep('error')
      setMessage(e.message)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-zinc-50 rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-zinc-800">🔔 Activer les notifications</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-200 transition-colors"
          >
            ✕
          </button>
        </div>

        {step === 'choose' && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-zinc-600 mb-1">Qui êtes-vous ?</p>
            <button
              onClick={() => handleSubscribe('assistant')}
              className="bg-[#2d4a6b] text-white px-4 py-3 rounded-xl text-sm font-medium hover:bg-[#1e3349] transition-colors"
            >
              Je suis Timothée (assistant)
            </button>
            <button
              onClick={() => handleSubscribe('patron')}
              className="bg-[#2d4a6b] text-white px-4 py-3 rounded-xl text-sm font-medium hover:bg-[#1e3349] transition-colors"
            >
              Je suis le gérant (patron)
            </button>
          </div>
        )}

        {step === 'done' && (
          <p className="text-sm text-emerald-700 text-center py-2">{message}</p>
        )}

        {step === 'error' && (
          <p className="text-sm text-red-600 text-center py-2">{message}</p>
        )}
      </div>
    </div>
  )
}
