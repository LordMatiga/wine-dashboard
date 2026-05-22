import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase.js'

export default function DocumentUpload({ orderId, taskId, onUploaded }) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef(null)

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const uid = `${Date.now()}_${Math.random().toString(36).slice(2)}`
      const folder = orderId ?? taskId ?? 'unlinked'
      const path = `${folder}/${uid}.${ext}`

      const { error: storageErr } = await supabase.storage
        .from('documents')
        .upload(path, file, { contentType: file.type })
      if (storageErr) throw storageErr

      const { error: dbErr } = await supabase.from('documents').insert({
        order_id: orderId ?? null,
        task_id: taskId ?? null,
        filename: file.name,
        storage_path: path,
        mime_type: file.type,
      })
      if (dbErr) throw dbErr

      onUploaded?.()
    } catch (err) {
      alert('Erreur upload : ' + err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleFile}
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-stone-200 text-stone-600 hover:bg-stone-100 transition-colors disabled:opacity-50"
      >
        {uploading ? (
          <div className="w-3 h-3 border border-stone-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        )}
        {uploading ? 'Upload...' : 'Joindre un document'}
      </button>
    </>
  )
}
