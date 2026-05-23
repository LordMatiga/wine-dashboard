import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase.js'
import { formatDate, groupByDay } from '../lib/utils.js'
import { TYPE_STYLES } from '../lib/constants.js'
import StatusBadge from './StatusBadge.jsx'
import MessageBadge from './MessageBadge.jsx'
import SkeletonRow from './SkeletonRow.jsx'

function TypeBadge({ type }) {
  const style = TYPE_STYLES[type] ?? TYPE_STYLES.autre
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style.wrapper}`}>
      {style.label}
    </span>
  )
}

export default function TaskTable({ onEdit, onNew, typeFilter = 'Tous', commentCounts = {} }) {
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

  const visibleTasks = useMemo(() => {
    if (!typeFilter || typeFilter === 'Tous' || typeFilter === 'commande') return tasks
    return tasks.filter(t => t.type === typeFilter)
  }, [tasks, typeFilter])

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
      ) : visibleTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-stone-500 bg-white rounded-2xl border border-stone-200">
          <span className="text-4xl mb-3">📋</span>
          <p className="text-sm">Aucune tâche</p>
        </div>
      ) : (
        Object.entries(groupByDay(visibleTasks)).map(([day, dayTasks]) => (
          <div key={day} className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="px-4 py-2 bg-stone-50 border-b border-stone-200">
              <p className="text-xs font-medium text-stone-500 capitalize">{day}</p>
            </div>
            <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2 bg-stone-50/50 border-b border-stone-100 text-xs font-semibold text-stone-400 uppercase tracking-wide">
              <div className="col-span-2">Date</div>
              <div className="col-span-1">Type</div>
              <div className="col-span-2">Client</div>
              <div className="col-span-2">Fournisseur</div>
              <div className="col-span-3">Description</div>
              <div className="col-span-1">Statut</div>
              <div className="col-span-1"></div>
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
                  <div className="col-span-1"><MessageBadge count={commentCounts[task.id]} /></div>
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
                  <div className="flex-shrink-0 flex flex-col items-end gap-1">
                    <StatusBadge status={task.status} />
                    <MessageBadge count={commentCounts[task.id]} />
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
