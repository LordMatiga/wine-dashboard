import { useState } from 'react'
import AutocompleteInput from './AutocompleteInput.jsx'

const TASK_TYPES = [
  { value: 'fiche_client', label: 'Fiche client' },
  { value: 'logistique',   label: 'Logistique' },
  { value: 'compta',       label: 'Compta' },
  { value: 'tarif',        label: 'Tarif' },
  { value: 'autre',        label: 'Autre' },
]

const STATUSES = ['Entrante', 'À traiter', 'Traitée']

const STATUS_ACTIVE = {
  'Entrante': 'bg-blue-50 text-blue-800 border-blue-300',
  'À traiter': 'bg-amber-50 text-amber-800 border-amber-300',
  'Traitée': 'bg-emerald-50 text-emerald-800 border-emerald-300',
}

export default function EditTaskModal({ task, onSave, onClose }) {
  const [form, setForm] = useState({
    type: task.type ?? 'autre',
    client_name: task.client_name ?? '',
    supplier_name: task.supplier_name ?? '',
    description: task.description ?? '',
    urgent: task.urgent ?? false,
    status: task.status ?? 'Entrante',
  })
  const [saving, setSaving] = useState(false)
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
      await onSave(task.id, updates)
    } finally {
      setSaving(false)
    }
  }

  const showSupplier = form.type === 'commande' || form.type === 'tarif'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-zinc-50 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200">
          <div>
            <h2 className="text-base font-semibold text-zinc-800">Modifier la tâche</h2>
            <p className="text-xs text-zinc-500 font-mono mt-0.5">{task.id?.slice(0, 8)}…</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-200 hover:text-zinc-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Type</label>
            <select
              value={form.type}
              onChange={e => { set('type', e.target.value); markModified() }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#2d4a6b]/20 focus:border-[#2d4a6b]"
            >
              {TASK_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Client</label>
            <input
              type="text"
              value={form.client_name}
              onChange={e => set('client_name', e.target.value)}
              onInput={markModified}
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#2d4a6b]/20 focus:border-[#2d4a6b]"
            />
          </div>

          {showSupplier && (
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Fournisseur</label>
              <div onInput={markModified}>
                <AutocompleteInput
                  value={form.supplier_name}
                  onChange={val => setForm(f => ({ ...f, supplier_name: val }))}
                  placeholder="Fournisseur..."
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Description</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              onInput={markModified}
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#2d4a6b]/20 focus:border-[#2d4a6b] resize-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="task-urgent"
              checked={form.urgent}
              onChange={e => { set('urgent', e.target.checked); markModified() }}
              className="w-4 h-4 accent-red-600"
            />
            <label htmlFor="task-urgent" className="text-sm text-zinc-600 cursor-pointer">
              Marquer comme urgent 🔴
            </label>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-2">Statut</label>
            <div className="flex gap-2">
              {STATUSES.map(s => (
                <button
                  key={s}
                  onClick={() => set('status', s)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium border transition-colors ${
                    form.status === s
                      ? STATUS_ACTIVE[s]
                      : 'bg-zinc-100 text-zinc-500 border-zinc-200 hover:bg-zinc-200'
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
                  id="task-resetStatus"
                  checked={resetStatus}
                  onChange={e => setResetStatus(e.target.checked)}
                  className="rounded border-zinc-300 cursor-pointer"
                />
                <label htmlFor="task-resetStatus" className="text-xs text-zinc-600 cursor-pointer">
                  Repasser en « À traiter »
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-zinc-200">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-zinc-200 text-zinc-600 hover:bg-zinc-100 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#2d4a6b] hover:bg-[#1e3349] transition-colors ${saving ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}
