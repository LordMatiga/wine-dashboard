import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'

function getPublicUrl(path) {
  const { data } = supabase.storage.from('documents').getPublicUrl(path)
  return data.publicUrl
}

function isImage(mime) {
  return mime?.startsWith('image/')
}

function formatDate(str) {
  return new Date(str).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const TYPE_LABELS = {
  fiche_client: 'Fiche client',
  logistique: 'Logistique',
  compta: 'Compta',
  tarif: 'Tarif',
  autre: 'Autre',
}

export default function DocumentsPanel() {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => {
    fetchDocs()
  }, [])

  async function fetchDocs() {
    setLoading(true)
    const { data } = await supabase
      .from('documents')
      .select('*, orders(client_name), tasks(client_name, type)')
      .order('created_at', { ascending: false })
    setDocs(data ?? [])
    setLoading(false)
  }

  async function deleteDoc(doc) {
    await supabase.storage.from('documents').remove([doc.storage_path])
    await supabase.from('documents').delete().eq('id', doc.id)
    setConfirmDelete(null)
    fetchDocs()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-[#2d4a6b] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!docs.length) {
    return (
      <div className="text-center py-12 text-stone-500 text-sm">
        Aucun document enregistré.
      </div>
    )
  }

  return (
    <div className="divide-y divide-stone-100">
      {docs.map(doc => {
        const url = getPublicUrl(doc.storage_path)
        const img = isImage(doc.mime_type)
        const linkedClient = doc.orders?.client_name ?? doc.tasks?.client_name
        const linkedLabel = doc.orders
          ? 'Commande'
          : doc.tasks
          ? (TYPE_LABELS[doc.tasks.type] ?? 'Tâche')
          : null

        return (
          <div key={doc.id} className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 group">
            <a href={url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
              {img ? (
                <img
                  src={url}
                  alt={doc.filename}
                  className="w-12 h-12 rounded-lg object-cover border border-stone-200"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center">
                  <svg className="w-6 h-6 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
              )}
            </a>

            <div className="flex-1 min-w-0">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-stone-800 hover:text-[#2d4a6b] truncate block"
              >
                {doc.filename}
              </a>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                {linkedLabel && (
                  <span className="text-xs text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                    {linkedLabel}
                  </span>
                )}
                {linkedClient && (
                  <span className="text-xs text-stone-500">{linkedClient}</span>
                )}
                {!linkedLabel && !linkedClient && (
                  <span className="text-xs text-stone-400">Non lié</span>
                )}
              </div>
              <span className="text-xs text-stone-400">{formatDate(doc.created_at)}</span>
            </div>

            {confirmDelete === doc.id ? (
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => deleteDoc(doc)}
                  className="px-2 py-1 rounded text-xs font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  Supprimer
                </button>
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="px-2 py-1 rounded text-xs font-medium border border-stone-200 text-stone-600 hover:bg-stone-100 transition-colors"
                >
                  Non
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(doc.id)}
                className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
