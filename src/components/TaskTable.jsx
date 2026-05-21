import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import StatusBadge from './StatusBadge.jsx'

const TYPE_STYLES = {
  fiche_client: { wrapper: 'bg-purple-50 text-purple-800 border border-purple-200', label: 'Fiche client' },
  logistique:   { wrapper: 'bg-orange-50 text-orange-800 border border-orange-200', label: 'Logistique' },
  compta:       { wrapper: 'bg-blue-50 text-blue-800 border border-blue-200',   label: 'Compta' },
  tarif:        { wrapper: 'bg-teal-50 text-teal-800 border border-teal-200',   label: 'Tarif' },
  autre:        { wrapper: 'bg-zinc-100 text-zinc-600 border border-zinc-200',  label: 'Autre' },
}

function TypeBadge({ type }) {
  const style = TYPE_STYLES[type] ?? TYPE_STYLES.autre
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style.wrapper}`}>
      {style.label}
    </span>
  )
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function SkeletonRow() {
  return (
    <div className="px-4 py-3 border-b border-zinc-200">
      <div className="animate-pulse flex gap-3">
        <div className="h-4 bg-zinc-200 rounded w-24" />
        <div className="h-4 bg-zinc-200 rounded w-32 flex-1" />
        <div className="h-4 bg-zinc-200 rounded w-20" />
      </div>
    </div>
  )
}

export default function TaskTable({ onEdit, onNew }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  async function fetchTasks() {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })
    setTasks(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchTasks()
    const channel = supabase
      .channel('tasks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchTasks)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  return (
    <div className="bg-zinc-50 rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-100 border-b border-zinc-200">
        <div className="hidden sm:flex gap-6 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
          Tâches
        </div>
        <button
          onClick={onNew}
          className="ml-auto px-3 py-1.5 rounded-lg text-xs font-medium bg-[#2d4a6b] text-white hover:bg-[#1e3349] transition-colors"
        >
          + Nouvelle tâche
        </button>
      </div>

      <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2 bg-zinc-50 border-b border-zinc-200 text-xs font-semibold text-zinc-400 uppercase tracking-wide">
        <div className="col-span-2">Date</div>
        <div className="col-span-1">Type</div>
        <div className="col-span-2">Client</div>
        <div className="col-span-2">Fournisseur</div>
        <div className="col-span-3">Description</div>
        <div className="col-span-1">Statut</div>
        <div className="col-span-1">Urgent</div>
      </div>

      {loading ? (
        Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
          <span className="text-4xl mb-3">📋</span>
          <p className="text-sm">Aucune tâche</p>
        </div>
      ) : (
        tasks.map(task => (
          <div
            key={task.id}
            onClick={() => onEdit(task)}
            className="border-b border-zinc-200 last:border-0 cursor-pointer"
          >
            <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-zinc-100/70 transition-colors">
              <div className="col-span-2 text-xs text-zinc-500">{formatDate(task.created_at)}</div>
              <div className="col-span-1"><TypeBadge type={task.type} /></div>
              <div className="col-span-2 text-sm font-medium text-zinc-800 truncate">{task.client_name ?? '—'}</div>
              <div className="col-span-2 text-sm text-zinc-600 truncate">{task.supplier_name ?? '—'}</div>
              <div className="col-span-3 text-xs text-zinc-500 line-clamp-2">{task.description ?? '—'}</div>
              <div className="col-span-1"><StatusBadge status={task.status} /></div>
              <div className="col-span-1 text-base">{task.urgent ? '🔴' : ''}</div>
            </div>

            <div className="sm:hidden px-4 py-3 hover:bg-zinc-100/70 transition-colors">
              <div className="flex items-start justify-between mb-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <TypeBadge type={task.type} />
                  {task.urgent && <span className="text-sm">🔴</span>}
                </div>
                <StatusBadge status={task.status} />
              </div>
              <p className="text-sm font-medium text-zinc-800 mb-0.5">{task.client_name ?? '—'}</p>
              {task.description && (
                <p className="text-xs text-zinc-500 line-clamp-2 mb-2">{task.description}</p>
              )}
              <span className="text-xs text-zinc-500">{formatDate(task.created_at)}</span>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
