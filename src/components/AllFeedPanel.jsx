import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import StatusBadge from './StatusBadge.jsx'

const TYPE_STYLES = {
  fiche_client: { wrapper: 'bg-purple-50 text-purple-800 border border-purple-200', label: 'Fiche client' },
  logistique:   { wrapper: 'bg-orange-50 text-orange-800 border border-orange-200', label: 'Logistique' },
  compta:       { wrapper: 'bg-blue-50 text-blue-800 border border-blue-200',       label: 'Compta' },
  tarif:        { wrapper: 'bg-teal-50 text-teal-800 border border-teal-200',       label: 'Tarif' },
  autre:        { wrapper: 'bg-zinc-100 text-zinc-600 border border-zinc-200',      label: 'Autre' },
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function AllFeedPanel({ onSelectOrder, onSelectTask }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const [ordersRes, tasksRes] = await Promise.all([
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('tasks').select('*').order('created_at', { ascending: false }),
    ])
    const orders = (ordersRes.data ?? []).map(o => ({ ...o, _source: 'order' }))
    const tasks  = (tasksRes.data  ?? []).map(t => ({ ...t, _source: 'task'  }))
    const merged = [...orders, ...tasks].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    )
    setItems(merged)
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

  if (loading) {
    return <p className="text-xs text-zinc-400 text-center py-16">Chargement...</p>
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
        <span className="text-4xl mb-3">📭</span>
        <p className="text-sm">Aucun élément</p>
      </div>
    )
  }

  return (
    <ul className="divide-y divide-zinc-100">
      {items.map(item => {
        const isOrder = item._source === 'order'
        const text = isOrder ? item.transcription : item.description
        const typeStyle = !isOrder ? (TYPE_STYLES[item.type] ?? TYPE_STYLES.autre) : null

        return (
          <li
            key={`${item._source}-${item.id}`}
            onClick={() => isOrder ? onSelectOrder(item) : onSelectTask(item)}
            className="flex items-start gap-3 px-4 py-3 hover:bg-zinc-50 cursor-pointer transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {isOrder ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#2d4a6b]/10 text-[#2d4a6b] border border-[#2d4a6b]/20">
                    Commande
                  </span>
                ) : (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeStyle.wrapper}`}>
                    {typeStyle.label}
                  </span>
                )}
                {item.urgent && (
                  <span className="inline-block w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                )}
                <StatusBadge status={item.status} />
                <span className="text-xs text-zinc-400 ml-auto whitespace-nowrap">{formatDate(item.created_at)}</span>
              </div>
              <p className="text-sm font-medium text-zinc-800 truncate">{item.client_name ?? '—'}</p>
              {text && <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">{text}</p>}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
