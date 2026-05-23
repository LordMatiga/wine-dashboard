import { useState } from 'react'
import AutocompleteInput from './AutocompleteInput.jsx'
import DocumentsList from './DocumentsList.jsx'
import DocumentUpload from './DocumentUpload.jsx'
import ChatThread from './ChatThread.jsx'
import { STATUSES, STATUS_ACTIVE } from '../lib/constants.js'
import { generatePDF } from '../lib/pdfExport.js'
import { supabase } from '../lib/supabase.js'

const TASK_TYPES = [
  { value: 'fiche_client', label: 'Fiche client' },
  { value: 'logistique',   label: 'Logistique' },
  { value: 'compta',       label: 'Compta' },
  { value: 'tarif',        label: 'Tarif' },
  { value: 'autre',        label: 'Autre' },
]

export default function EditTaskModal({ task, onSave, onDelete, onClose }) {
  const [form, setForm] = useState({
    type:          task.type          ?? 'autre',
    client_name:   task.client_name   ?? '',
    supplier_name: task.supplier_name ?? '',
    description:   task.description   ?? '',
    urgent:        task.urgent        ?? false,
    status:        task.status        ?? 'Entrante',
  })
  const [saving, setSaving]           = useState(false)
  const [pdfLoading, setPdfLoading]   = useState(false)
  const [activeTab, setActiveTab]     = useState('fiche')
  const [showRaw, setShowRaw]         = useState(false)
  const [resetStatus, setResetStatus] = useState(true)
  const [userModified, setUserModified] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [docRefresh, setDocRefresh]   = useState(0)

  const isNew = !task.id
  const TABS = isNew ? [] : [
    { id: 'fiche',     label: 'Fiche' },
    { id: 'documents', label: 'Documents' },
    { id: 'messages',  label: 'Messages' },
  ]

  function set(key, value) { setForm(prev => ({ ...prev, [key]: value })) }

  function markModified() {
    if (!isNew && !userModified) {
      setUserModified(true)
      setForm(f => ({ ...f, status: 'À traiter' }))
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const updates = { ...form }
      if (userModified && resetStatus) updates.status = 'À traiter'
      await onSave(task.id, updates)
    } finally {
      setSaving(false)
    }
  }

  async function handleDownloadPDF() {
    setPdfLoading(true)
    const { data: docs } = await supabase
      .from('documents')
      .select('filename, mime_type, created_at')
      .eq('task_id', task.id)
      .order('created_at', { ascending: false })
    generatePDF({ ...task, _source: 'task' }, docs ?? [])
    setPdfLoading(false)
  }

  const showSupplier = form.type === 'commande' || form.type === 'tarif'

  // ── Fiche form (shared between tabbed and new-task layouts) ─────────────
  const ficheContent = (
    <div className="px-4 py-4 space-y-4">
      <div>
        <label className="block text-xs font-medium text-stone-700 mb-1">Type</label>
        <select
          value={form.type}
          onChange={e => { set('type', e.target.value); markModified() }}
          className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#c5a059]/20 focus:border-[#c5a059]"
        >
          {TASK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

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

      {showSupplier && (
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
      )}

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-medium text-stone-700">Description</label>
          {task.raw_transcription && (
            <button type="button" onClick={() => setShowRaw(v => !v)} className="text-xs text-[#2d4a6b] hover:underline">
              {showRaw ? 'Masquer' : 'Texte complet'}
            </button>
          )}
        </div>
        {showRaw && task.raw_transcription && (
          <div className="mb-2 px-3 py-2 text-sm text-stone-600 bg-stone-100 rounded-lg border border-stone-200 whitespace-pre-wrap">
            {task.raw_transcription}
          </div>
        )}
        <textarea
          rows={4}
          value={form.description}
          onChange={e => set('description', e.target.value)}
          onInput={markModified}
          className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#c5a059]/20 focus:border-[#c5a059] resize-none"
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
        <label htmlFor="task-urgent" className="text-sm text-stone-600 cursor-pointer">Urgent 🔴</label>
      </div>

      <div>
        <label className="block text-xs font-medium text-stone-700 mb-2">Statut</label>
        <div className="flex gap-2">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => set('status', s)}
              className={`flex-1 py-2 px-1 rounded-lg text-xs font-medium border transition-colors ${
                form.status === s ? STATUS_ACTIVE[s] : 'bg-stone-100 text-stone-500 border-stone-200 hover:bg-stone-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        {!isNew && userModified && (
          <label className="flex items-center gap-2 mt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={resetStatus}
              onChange={e => setResetStatus(e.target.checked)}
              className="rounded border-stone-300"
            />
            <span className="text-xs text-stone-600">Repasser en « À traiter »</span>
          </label>
        )}
      </div>
    </div>
  )

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-stone-900/50 backdrop-blur-sm"
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
      >
        <div className="flex flex-col bg-stone-50 w-full max-h-[90vh] rounded-t-2xl sm:rounded-2xl sm:max-w-lg sm:shadow-xl overflow-hidden">

          {/* ── Header ─────────────────────────────────────────────────── */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-stone-200 bg-stone-50">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-stone-800 leading-tight">
                {isNew ? 'Nouvelle tâche' : 'Tâche'}
              </h2>
              {task.id && <p className="text-[11px] text-stone-400 font-mono">{task.id.slice(0, 8)}…</p>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {task.id && (
                <button
                  onClick={handleDownloadPDF}
                  disabled={pdfLoading}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-stone-500 border border-stone-200 rounded-lg hover:bg-stone-100 transition-colors disabled:opacity-50"
                >
                  {pdfLoading
                    ? <span className="w-3.5 h-3.5 border border-stone-400 border-t-transparent rounded-full animate-spin" />
                    : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                  }
                  PDF
                </button>
              )}
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-500 hover:bg-stone-200 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* ── Tab bar (existing tasks only) ──────────────────────────── */}
          {!isNew && (
            <div className="flex-shrink-0 flex bg-white border-b border-stone-200">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2.5 text-xs font-medium transition-colors relative ${
                    activeTab === tab.id ? 'text-[#2d4a6b]' : 'text-stone-400 hover:text-stone-600'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#2d4a6b] rounded-full" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* ── Scrollable content ─────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto">
            {(isNew || activeTab === 'fiche') && ficheContent}

            {!isNew && activeTab === 'documents' && (
              <div className="px-4 py-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-stone-500">Documents joints</span>
                  <DocumentUpload taskId={task.id} onUploaded={() => setDocRefresh(n => n + 1)} />
                </div>
                <DocumentsList taskId={task.id} refreshKey={docRefresh} />
              </div>
            )}

            {!isNew && activeTab === 'messages' && (
              <ChatThread taskId={task.id} />
            )}
          </div>

          {/* ── Footer ─────────────────────────────────────────────────── */}
          <div className="flex-shrink-0 flex items-center justify-between gap-3 px-4 py-3 border-t border-stone-200 bg-stone-50">
            {task.id
              ? <button onClick={() => setConfirmDelete(true)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 border border-red-200 transition-colors">Supprimer</button>
              : <div />
            }
            <div className="flex items-center gap-2">
              <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium border border-stone-200 text-stone-600 hover:bg-stone-100 transition-colors">
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
          </div>
        </div>
      </div>

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-900/40" onClick={() => setConfirmDelete(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-stone-200 px-6 py-5 max-w-xs w-full">
            <h3 className="text-sm font-semibold text-stone-800 mb-1">Supprimer cette tâche ?</h3>
            <p className="text-xs text-stone-500 mb-4">Cette action est irréversible.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 px-3 py-2 rounded-xl text-sm font-medium border border-stone-200 text-stone-600 hover:bg-stone-100 transition-colors">
                Annuler
              </button>
              <button onClick={() => onDelete(task.id)} className="flex-1 px-3 py-2 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
