import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase.js'
import { formatDate, groupByDay } from '../lib/utils.js'
import { TYPE_STYLES } from '../lib/constants.js'
import StatusBadge from './StatusBadge.jsx'
import MessageBadge from './MessageBadge.jsx'

export default function AllFeedPanel({ onSelectOrder, onSelectTask, search = '', statusFilter = 'Tous', typeFilter = 'Tous', dateFrom = '', dateTo = '', commentCounts = {} }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const [ordersRes, tasksRes] = await Promise.all([
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('tasks').select('*').order('created_at', { ascending: false }),
    ])
    const orders = (ordersRes.data ?? []).map(o => ({ ...o, _source: 'order' }))
    const tasks  = (tasksRes.data  ?? []).map(t => ({ ...t, _source: 'task'  }))
    setItems([...orders, ...tasks].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)))
    setLoading(false)
  }

  useEffect(() => {
    load()
    const channel = supabase
      .channel('allfeed-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks'  }, load)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return items.filter(item => {
      const text = item._source === 'order' ? item.transcription : item.description
      if (q && ![item.client_name, item.supplier_name, text].some(f => (f ?? '').toLowerCase().includes(q))) return false
      if (statusFilter !== 'Tous' && item.status !== statusFilter) return false
      if (typeFilter && typeFilter !== 'Tous') {
        if (typeFilter === 'commande') { if (item._source !== 'order') return false }
        else { if (item._source !== 'task' || item.type !== typeFilter) return false }
      }
      if (dateFrom || dateTo) {
        const d = new Date(item.created_at)
        if (dateFrom && d < new Date(dateFrom)) return false
        if (dateTo && d > new Date(dateTo + 'T23:59:59')) return false
      }
      return true
    })
  }, [items, search, statusFilter, typeFilter, dateFrom, dateTo])

  if (loading) return <p className="text-xs text-stone-400 text-center py-16">Chargement...</p>

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-stone-500">
        <span className="text-4xl mb-3">📭</span>
        <p className="text-sm">Aucun élément</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {Object.entries(groupByDay(filtered)).map(([day, dayItems]) => (
        <div key={day} className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="px-4 py-2 bg-stone-50 border-b border-stone-200">
            <p className="text-xs font-medium text-stone-500 capitalize">{day}</p>
          </div>
          {dayItems.map(item => {
            const isOrder = item._source === 'order'
            const text = isOrder ? item.transcription : item.description
            const typeStyle = !isOrder ? (TYPE_STYLES[item.type] ?? TYPE_STYLES.autre) : null
            return (
              <div
                key={`${item._source}-${item.id}`}
                onClick={() => isOrder ? onSelectOrder(item) : onSelectTask(item)}
                className="flex items-center gap-3 px-4 py-3 border-b border-stone-100 last:border-0 hover:bg-stone-50 cursor-pointer transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {isOrder ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#2d4a6b]/10 text-[#2d4a6b] border border-[#2d4a6b]/20 flex-shrink-0">
                        Commande
                      </span>
                    ) : (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${typeStyle.wrapper}`}>
                        {typeStyle.label}
                      </span>
                    )}
                    {item.urgent && <span className="inline-block w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />}
                    <span className="font-medium text-sm text-stone-800 truncate">{item.client_name ?? '—'}</span>
                  </div>
                  {text && <p className="text-xs text-stone-400 line-clamp-1">{text}</p>}
                  <p className="text-xs text-stone-400 mt-0.5">{formatDate(item.created_at)}</p>
                </div>
                <div className="flex-shrink-0 flex flex-col items-end gap-1">
                  <StatusBadge status={item.status} />
                  <MessageBadge count={commentCounts[item.id]} />
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
