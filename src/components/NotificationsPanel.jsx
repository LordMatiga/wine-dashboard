import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase.js'
import { formatDate } from '../lib/utils.js'
import StatusBadge from './StatusBadge.jsx'

const STORAGE_KEY = 'dismissed_notification_ids'

function getDismissed() {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) }
  catch { return new Set() }
}

function saveDismissed(set) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]))
}

export default function NotificationsPanel({ onSelectOrder, onDelete, search = '', statusFilter = 'Tous', dateFrom = '', dateTo = '' }) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadNotifications = async () => {
      const { data } = await supabase
        .from('order_history')
        .select('*, orders(id, client_name, supplier_name, status)')
        .not('changes->status', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50)

      const dismissed = getDismissed()
      setNotifications((data ?? []).filter(n => !dismissed.has(n.id)))
      setLoading(false)
    }
    loadNotifications()
  }, [])

  function dismiss(id) {
    const dismissed = getDismissed()
    dismissed.add(id)
    saveDismissed(dismissed)
    setNotifications(prev => prev.filter(n => n.id !== id))
    onDelete(id)
  }

  function dismissAll() {
    const dismissed = getDismissed()
    notifications.forEach(n => { dismissed.add(n.id); onDelete(n.id) })
    saveDismissed(dismissed)
    setNotifications([])
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return notifications.filter(entry => {
      const order = entry.orders
      const after = entry.changes?.status?.after
      if (q && ![(order?.client_name), (order?.supplier_name)].some(f => (f ?? '').toLowerCase().includes(q))) return false
      if (statusFilter !== 'Tous' && after !== statusFilter) return false
      if (dateFrom || dateTo) {
        const d = new Date(entry.created_at)
        if (dateFrom && d < new Date(dateFrom)) return false
        if (dateTo && d > new Date(dateTo + 'T23:59:59')) return false
      }
      return true
    })
  }, [notifications, search, statusFilter, dateFrom, dateTo])

  if (loading) {
    return <p className="text-xs text-stone-400 text-center py-8">Chargement...</p>
  }

  if (notifications.length === 0) {
    return <p className="text-sm text-stone-400 text-center py-8">Aucune notification</p>
  }

  return (
    <>
      <div className="flex justify-end px-4 py-2 border-b border-stone-100">
        <button
          onClick={dismissAll}
          className="text-xs text-stone-400 hover:text-red-500 transition"
        >
          Tout supprimer
        </button>
      </div>
      <ul className="divide-y divide-stone-100">
        {filtered.map(entry => {
          const statusChange = entry.changes?.status
          const before = statusChange?.before
          const after = statusChange?.after
          const order = entry.orders
          const icon = after === 'Traitée' ? '✅' : '🔔'

          return (
            <li
              key={entry.id}
              onClick={() => order && onSelectOrder(order)}
              className="flex items-start gap-3 px-4 py-3 hover:bg-stone-100 cursor-pointer transition-colors"
            >
              <span className="text-lg mt-0.5 shrink-0">{icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-stone-800 truncate">
                    {order?.client_name ?? '—'}
                  </p>
                  <span className="text-xs text-stone-400 whitespace-nowrap shrink-0">
                    {formatDate(entry.created_at)}
                  </span>
                </div>
                <p className="text-xs text-stone-400 mb-1.5">{order?.supplier_name ?? ''}</p>
                <div className="flex items-center gap-1.5 text-xs text-stone-500">
                  <span>{before}</span>
                  <span>→</span>
                  <StatusBadge status={after} />
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); dismiss(entry.id) }}
                className="ml-auto p-1.5 rounded-lg text-stone-300 hover:text-red-500 hover:bg-red-50 transition flex-shrink-0"
                aria-label="Supprimer"
              >
                🗑
              </button>
            </li>
          )
        })}
      </ul>
    </>
  )
}
