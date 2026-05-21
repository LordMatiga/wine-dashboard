import { useState } from 'react'
import AutocompleteInput from './AutocompleteInput.jsx'
import OrderHistory from './OrderHistory.jsx'

const STATUSES = ['Entrante', 'À traiter', 'Traitée']

const STATUS_ACTIVE = {
  'Entrante': 'bg-blue-50 text-blue-800 border-blue-300',
  'À traiter': 'bg-amber-50 text-amber-800 border-amber-300',
  'Traitée': 'bg-emerald-50 text-emerald-800 border-emerald-300',
}

export default function EditModal({ order, onSave, onClose }) {
  const [form, setForm] = useState({
    client_name: order.client_name ?? '',
    supplier_name: order.supplier_name ?? '',
    transcription: order.transcription ?? '',
    urgent: order.urgent ?? false,
    status: order.status ?? 'Entrante',
  })
  const [saving, setSaving] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [resetStatus, setResetStatus] = useState(true)
  const [userModified, setUserModified] = useState(false)

  function set(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function markModified() {
    if (!userModified) {
      setUserModified(true)
      setForm(f => ({ ...f, status: 'À traiter' }))
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const updates = { ...form }
      if (userModified && resetStatus) {
        updates.status = 'À traiter'
      }
      await onSave(order.id, updates)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-stone-50 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200">
          <div>
            <h2 className="text-base font-semibold text-stone-800">Modifier la commande</h2>
            <p className="text-xs text-stone-500 font-mono mt-0.5">{order.id?.slice(0, 8)}…</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHistory(h => !h)}
              className="text-xs text-stone-500 hover:text-stone-800 underline cursor-pointer bg-transparent border-none p-0"
            >
              {showHistory ? '← Retour' : 'Historique'}
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-500 hover:bg-stone-200 hover:text-stone-600 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          {showHistory ? (
            <OrderHistory orderId={order.id} />
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Client</label>
                <input
                  type="text"
                  value={form.client_name}
                  onChange={e => set('client_name', e.target.value)}
                  onInput={markModified}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#c5a059]/20 focus:border-[#c5a059]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Fournisseur</label>
                <div onInput={markModified}>
                  <AutocompleteInput
                    value={form.supplier_name}
                    onChange={val => setForm(f => ({ ...f, supplier_name: val }))}
                    placeholder="Fournisseur..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Retranscription</label>
                <textarea
                  rows={4}
                  value={form.transcription}
                  onChange={e => set('transcription', e.target.value)}
                  onInput={markModified}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#c5a059]/20 focus:border-[#c5a059] resize-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="urgent"
                  checked={form.urgent ?? false}
                  onChange={e => setForm(f => ({ ...f, urgent: e.target.checked }))}
                  className="w-4 h-4 accent-red-600"
                />
                <label htmlFor="urgent" className="text-sm text-stone-600 cursor-pointer">
                  Marquer comme urgent 🔴
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-2">Statut</label>
                <div className="flex gap-2">
                  {STATUSES.map(s => (
                    <button
                      key={s}
                      onClick={() => set('status', s)}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium border transition-colors ${
                        form.status === s
                          ? STATUS_ACTIVE[s]
                          : 'bg-stone-100 text-stone-500 border-stone-200 hover:bg-stone-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {userModified && (
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="resetStatus"
                      checked={resetStatus}
                      onChange={e => setResetStatus(e.target.checked)}
                      className="rounded border-stone-300 cursor-pointer"
                    />
                    <label htmlFor="resetStatus" className="text-xs text-stone-600 cursor-pointer">
                      Repasser en « À traiter »
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer — visible uniquement en mode formulaire */}
        {!showHistory && (
          <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-stone-200">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-stone-200 text-stone-600 hover:bg-stone-100 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#c5a059] hover:bg-[#1e3349] transition-colors ${saving ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
