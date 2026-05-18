import { useState } from 'react'

const STATUSES = ['En attente', 'Traitée', 'Erreur IA']

const STATUS_ACTIVE = {
  'En attente': 'bg-amber-50 text-amber-800 border-amber-300',
  'Traitée': 'bg-emerald-50 text-emerald-800 border-emerald-300',
  'Erreur IA': 'bg-red-50 text-red-800 border-red-300',
}

export default function EditModal({ order, onSave, onClose }) {
  const [form, setForm] = useState({
    client_name: order.client_name ?? '',
    supplier_name: order.supplier_name ?? '',
    transcription: order.transcription ?? '',
    status: order.status ?? 'En attente',
  })
  const [saving, setSaving] = useState(false)

  function set(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await onSave(order.id, form)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Modifier la commande</h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{order.id?.slice(0, 8)}…</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Client</label>
            <input
              type="text"
              value={form.client_name}
              onChange={e => set('client_name', e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-wine-700/20 focus:border-wine-700"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Fournisseur</label>
            <input
              type="text"
              value={form.supplier_name}
              onChange={e => set('supplier_name', e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-wine-700/20 focus:border-wine-700"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Retranscription</label>
            <textarea
              rows={4}
              value={form.transcription}
              onChange={e => set('transcription', e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-wine-700/20 focus:border-wine-700 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">Statut</label>
            <div className="flex gap-2">
              {STATUSES.map(s => (
                <button
                  key={s}
                  onClick={() => set('status', s)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium border transition-colors ${
                    form.status === s
                      ? STATUS_ACTIVE[s]
                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-4 py-2 rounded-lg text-sm font-medium text-white bg-wine-700 hover:bg-wine-800 transition-colors ${saving ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}
