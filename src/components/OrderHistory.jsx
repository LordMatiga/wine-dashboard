import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { formatDate } from '../lib/utils.js'

const FIELD_LABELS = {
  client_name:   'Client',
  supplier_name: 'Fournisseur',
  transcription: 'Retranscription',
  description:   'Description',
  status:        'Statut',
  type:          'Type',
  urgent:        'Urgent',
}

export default function OrderHistory({ orderId, taskId }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadHistory = async () => {
      const table  = taskId  ? 'task_history'  : 'order_history'
      const column = taskId  ? 'task_id'        : 'order_id'
      const id     = taskId  ?? orderId

      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq(column, id)
        .order('created_at', { ascending: false })

      if (error) {
        setError(error.message)
      } else {
        setHistory(data ?? [])
      }
      setLoading(false)
    }
    loadHistory()
  }, [orderId, taskId])

  if (loading) {
    return <p className="text-xs text-stone-400 text-center py-4">Chargement...</p>
  }

  if (error) {
    return <p className="text-xs text-red-400 text-center py-4">Erreur : {error}</p>
  }

  if (history.length === 0) {
    return <p className="text-stone-400 text-sm text-center py-4">Aucun historique</p>
  }

  return (
    <ul className="divide-y divide-stone-100">
      {history.map(entry => (
        <li key={entry.id} className="py-3">
          <p className="text-xs text-stone-400 mb-1.5">{formatDate(entry.created_at)}</p>
          <div className="space-y-1">
            {Object.entries(entry.changes).map(([field, value]) => {
              const avant = value['before'] ?? '—'
              const apres = value['after'] ?? '—'
              return (
                <div key={field} className="text-sm mt-1">
                  <span className="font-medium text-stone-600">{FIELD_LABELS[field] || field} : </span>
                  <span className="line-through text-stone-400">{avant}</span>
                  <span className="text-stone-400 mx-1">→</span>
                  <span className="text-stone-800">{apres}</span>
                </div>
              )
            })}
          </div>
        </li>
      ))}
    </ul>
  )
}
