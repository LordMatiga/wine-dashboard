import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'

function getPublicUrl(path) {
  const { data } = supabase.storage.from('documents').getPublicUrl(path)
  return data.publicUrl
}

function isImage(mime) {
  return mime?.startsWith('image/')
}

export default function DocumentsList({ orderId, taskId, refreshKey }) {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => {
    fetchDocs()
  }, [orderId, taskId, refreshKey])

  async function fetchDocs() {
    setLoading(true)
    let query = supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })
    if (orderId) query = query.eq('order_id', orderId)
    else if (taskId) query = query.eq('task_id', taskId)
    const { data } = await query
    setDocs(data ?? [])
    setLoading(false)
  }

  async function deleteDoc(doc) {
    await supabase.storage.from('documents').remove([doc.storage_path])
    await supabase.from('documents').delete().eq('id', doc.id)
    setConfirmDelete(null)
    fetchDocs()
  }

  if (loading) return <p className="text-xs text-stone-400 py-1">Chargement…</p>
  if (!docs.length) return <p className="text-xs text-stone-400 py-1">Aucun document joint.</p>

  return (
    <div className="flex flex-wrap gap-2">
      {docs.map(doc => {
        const url = getPublicUrl(doc.storage_path)
        const img = isImage(doc.mime_type)
        return (
          <div
            key={doc.id}
            className="relative group w-20 h-20 rounded-lg overflow-hidden border border-stone-200 bg-stone-100 flex items-center justify-center"
          >
            {img ? (
              <a href={url} target="_blank" rel="noopener noreferrer">
                <img src={url} alt={doc.filename} className="w-20 h-20 object-cover" />
              </a>
            ) : (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 p-2 text-center w-full h-full justify-center"
              >
                <svg className="w-7 h-7 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <span className="text-[10px] text-stone-500 truncate w-full text-center leading-tight">{doc.filename}</span>
              </a>
            )}

            {confirmDelete === doc.id ? (
              <div className="absolute inset-0 bg-stone-900/70 flex flex-col items-center justify-center gap-1">
                <button
                  onClick={() => deleteDoc(doc)}
                  className="text-[10px] text-white bg-red-500 px-2 py-0.5 rounded"
                >
                  Suppr.
                </button>
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="text-[10px] text-stone-200"
                >
                  Non
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(doc.id)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-stone-900/60 text-white text-[10px] items-center justify-center hidden group-hover:flex"
              >
                ✕
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
