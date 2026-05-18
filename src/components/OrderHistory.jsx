import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'

const FIELD_LABELS = {
  client_name: 'Client',
  supplier_name: 'Fournisseur',
  transcription: 'Retranscription',
  status: 'Statut',
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function OrderHistory({ orderId }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('order_history')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setHistory(data ?? [])
        setLoading(false)
      })
  }, [orderId])

  if (loading) {
    return (
      <div className="py-4 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse h-10 bg-zinc-100 rounded-lg" />
        ))}
      </div>
    )
  }

  if (history.length === 0) {
    return <p className="text-zinc-400 text-sm text-center py-4">Aucun historique</p>
  }

  return (
    <ul className="divide-y divide-zinc-100">
      {history.map(entry => (
        <li key={entry.id} className="py-3">
          <p className="text-xs text-zinc-400 mb-1.5">{formatDate(entry.created_at)}</p>
          <div className="space-y-1">
            {Object.entries(entry.changes ?? {}).map(([field, change]) => {
              const label = FIELD_LABELS[field] ?? field
              const before = change?.before ?? '—'
              const after = change?.after ?? '—'
              return (
                <p key={field} className="text-sm">
                  <span className="font-medium text-zinc-600">{label} : </span>
                  <span className="text-zinc-400 line-through">{before}</span>
                  {' → '}
                  <span className="text-zinc-800">{after}</span>
                </p>
              )
            })}
          </div>
        </li>
      ))}
    </ul>
  )
}
