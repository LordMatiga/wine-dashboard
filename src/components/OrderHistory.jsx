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
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from('order_history')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false })

      if (error) {
        setError(error.message)
      } else {
        setHistory(data ?? [])
      }
      setLoading(false)
    }
    fetch()
  }, [orderId])

  if (loading) {
    return <p className="text-xs text-zinc-400 text-center py-4">Chargement...</p>
  }

  if (error) {
    return <p className="text-xs text-red-400 text-center py-4">Erreur : {error}</p>
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
