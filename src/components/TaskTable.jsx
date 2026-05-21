import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import StatusBadge from './StatusBadge.jsx'

function groupByDay(items) {
  const groups = {}
  items.forEach(item => {
    const key = new Date(item.created_at).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
    if (!groups[key]) groups[key] = []
    groups[key].push(item)
  })
  return groups
}

const TYPE_STYLES = {
  fiche_client: { wrapper: 'bg-purple-50 text-purple-800 border border-purple-200', label: 'Fiche client' },
  logistique:   { wrapper: 'bg-orange-50 text-orange-800 border border-orange-200', label: 'Logistique' },
  compta:       { wrapper: 'bg-blue-50 text-blue-800 border border-blue-200',   label: 'Compta' },
  tarif:        { wrapper: 'bg-teal-50 text-teal-800 border border-teal-200',   label: 'Tarif' },
  autre:        { wrapper: 'bg-stone-100 text-stone-600 border border-stone-200',  label: 'Autre' },
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
    <div className="px-4 py-3 border-b border-stone-200">
      <div className="animate-pulse flex gap-3">
        <div className="h-4 bg-stone-200 rounded w-24" />
        <div className="h-4 bg-stone-200 rounded w-32 flex-1" />
        <div className="h-4 bg-stone-200 rounded w-20" />
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide">Tâches</h2>
        <button
          onClick={onNew}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#c5a059] text-white hover:bg-[#1e3349] transition-colors"
        >
          + Nouvelle tâche
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-stone-500 bg-white rounded-2xl border border-stone-200">
          <span className="text-4xl mb-3">📋</span>
          <p className="text-sm">Aucune tâche</p>
        </div>
      ) : (
        Object.entries(groupByDay(tasks)).map(([day, dayTasks]) => (
          <div key={day} className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="px-4 py-2 bg-stone-50 border-b border-stone-200">
              <p className="text-xs font-medium text-stone-500 capitalize">{day}</p>
            </div>
            {/* Desktop header pour chaque groupe */}
            <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2 bg-stone-50/50 border-b border-stone-100 text-xs font-semibold text-stone-400 uppercase tracking-wide">
              <div className="col-span-2">Date</div>
              <div className="col-span-1">Type</div>
              <div className="col-span-2">Client</div>
              <div className="col-span-2">Fournisseur</div>
              <div className="col-span-3">Description</div>
              <div className="col-span-1">Statut</div>
              <div className="col-span-1">Urgent</div>
            </div>
            {dayTasks.map(task => (
              <div
                key={task.id}
                onClick={() => onEdit(task)}
                className="border-b border-stone-100 last:border-0 cursor-pointer hover:bg-stone-50 transition-colors"
              >
                <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-3 items-center">
                  <div className="col-span-2 text-xs text-stone-500 flex items-center">
                    {task.urgent && <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1.5 flex-shrink-0" />}
                    {formatDate(task.created_at)}
                  </div>
                  <div className="col-span-1"><TypeBadge type={task.type} /></div>
                  <div className="col-span-2 text-sm font-medium text-stone-800 truncate">{task.client_name ?? '—'}</div>
                  <div className="col-span-2 text-sm text-stone-600 truncate">{task.supplier_name ?? '—'}</div>
                  <div className="col-span-3 text-xs text-stone-500 line-clamp-2">{task.description ?? '—'}</div>
                  <div className="col-span-1"><StatusBadge status={task.status} /></div>
                  <div className="col-span-1 text-base">{task.urgent ? '🔴' : ''}</div>
                </div>
                <div className="sm:hidden flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <TypeBadge type={task.type} />
                      {task.urgent && <span className="inline-block w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />}
                      <span className="font-medium text-sm text-stone-800 truncate">{task.client_name ?? '—'}</span>
                    </div>
                    <p className="text-xs text-stone-400 line-clamp-1">{task.description ?? ''}</p>
                    <p className="text-xs text-stone-400 mt-0.5">{formatDate(task.created_at)}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <StatusBadge status={task.status} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  )
}