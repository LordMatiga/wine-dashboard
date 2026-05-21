import { useState } from 'react'
import { subscribeToPush } from '../lib/webpush.js'
import { supabase } from '../lib/supabase.js'

export default function PushSetup({ onClose, onRoleSet }) {
  const [step, setStep] = useState('choose')
  const [message, setMessage] = useState('')

  async function handleSubscribe(userLabel) {
    try {
      const subscription = await subscribeToPush(userLabel)
      const sub = subscription.toJSON()

      // Supprimer l'ancienne entrée pour ce device si elle existe
      await supabase
        .from('push_subscriptions')
        .delete()
        .filter('subscription->>endpoint', 'eq', sub.endpoint)

      // Insérer la nouvelle subscription
      await supabase
        .from('push_subscriptions')
        .insert({ user_label: userLabel, subscription: sub })

      localStorage.setItem('user_role', userLabel)
      onRoleSet?.(userLabel)
      setStep('done')
      setMessage('Notifications activées !')
    } catch (e) {
      setStep('error')
      setMessage(e.message)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-stone-50 rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-stone-800">🔔 Activer les notifications</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-500 hover:bg-stone-200 transition-colors"
          >
            ✕
          </button>
        </div>

        {step === 'choose' && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-stone-600 mb-1">Qui êtes-vous ?</p>
            <button
              onClick={() => handleSubscribe('assistant')}
              className="bg-[#2d4a6b] text-white px-4 py-3 rounded-xl text-sm font-medium hover:bg-[#1e3349] transition-colors"
            >
              Je suis assistant
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
