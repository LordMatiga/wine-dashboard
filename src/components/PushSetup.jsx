import { useState } from 'react'
import { subscribeToPush } from '../lib/webpush.js'
import { supabase } from '../lib/supabase.js'

const ROLE_LABELS = { assistant: 'Assistant', patron: 'Gérant' }

export default function PushSetup({ onClose, onRoleSet }) {
  const currentRole = localStorage.getItem('user_role')
  const [step, setStep] = useState(currentRole ? 'current' : 'choose')
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

        {step === 'current' && (
          <div className="flex flex-col gap-3">
            <div className="bg-stone-100 rounded-xl px-4 py-3 text-center">
              <p className="text-xs text-stone-500 mb-0.5">Connecté en tant que</p>
              <p className="text-sm font-semibold text-stone-800">{ROLE_LABELS[currentRole] ?? currentRole}</p>
            </div>
            <p className="text-xs text-stone-400 text-center">Les notifications sont actives sur cet appareil.</p>
            <button
              onClick={() => setStep('choose')}
              className="border border-stone-300 text-stone-600 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-stone-100 transition-colors"
            >
              Changer de rôle
            </button>
          </div>
        )}

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
