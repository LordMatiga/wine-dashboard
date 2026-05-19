import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import StatusBadge from './StatusBadge.jsx'

const TYPE_LABELS = {
  fiche_client: 'Fiche client',
  logistique: 'Logistique',
  compta: 'Compta',
  tarif: 'Tarif',
  autre: 'Autre',
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function UrgentPanel({ onSelectOrder, onSelectTask }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [ordersRes, tasksRes] = await Promise.all([
        supabase.from('orders').select('*').eq('urgent', true).order('created_at', { ascending: false }),
        supabase.from('tasks').select('*').eq('urgent', true).order('created_at', { ascending: false }),
      ])
      const orders = (ordersRes.data ?? []).map(o => ({ ...o, _source: 'order' }))
      const tasks = (tasksRes.data ?? []).map(t => ({ ...t, _source: 'task' }))
      const merged = [...orders, ...tasks].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      )
      setItems(merged)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return <p className="text-xs text-zinc-400 text-center py-16">Chargement...</p>
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
        <span className="text-4xl mb-3">✅</span>
        <p className="text-sm">Aucun élément urgent</p>
      </div>
    )
  }

  return (
    <ul className="divide-y divide-zinc-100">
      {items.map(item => {
        const isOrder = item._source === 'order'
        const text = isOrder ? item.transcription : item.description

        return (
          <li
            key={`${item._source}-${item.id}`}
            onClick={() => isOrder ? onSelectOrder(item) : onSelectTask(item)}
            className="flex items-start gap-3 px-4 py-3 hover:bg-zinc-50 cursor-pointer transition-colors"
          >
            <span className="text-base mt-0.5 shrink-0">🔴</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {isOrder ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#2d4a6b] text-white">
                    Commande
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
                    {TYPE_LABELS[item.type] ?? 'Tâche'}
                  </span>
                )}
                <StatusBadge status={item.status} />
                <span className="text-xs text-zinc-400 ml-auto whitespace-nowrap">{formatDate(item.created_at)}</span>
              </div>
              <p className="text-sm font-medium text-zinc-800 truncate">{item.client_name ?? '—'}</p>
              {text && <p className="text-xs text-zinc-500 line-clamp-2 mt-0.5">{text}</p>}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
