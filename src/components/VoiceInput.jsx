import { useState, useRef } from 'react'
import DocumentUpload from './DocumentUpload.jsx'
import { TYPE_LABELS } from '../lib/constants.js'
import { supabase } from '../lib/supabase.js'

export default function VoiceInput() {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState('idle') // idle | recording | processing | done | error | doc_done
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [uploadedDoc, setUploadedDoc] = useState(null)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const mimeTypeRef = useRef('')
  const fileInputRef = useRef(null)

  function reset() {
    setMode('idle')
    setText('')
    setResult(null)
    setErrorMsg('')
    setUploadedDoc(null)
  }

  function close() {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop()
    }
    setOpen(false)
    setTimeout(reset, 300)
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // iOS Safari accepts audio/mp4 via isTypeSupported but crashes on construction —
      // safest to let it pick its own format with no mimeType option.
      const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)
      const preferred = isIOS ? [] : ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
      const supported = preferred.find(t => {
        try { return MediaRecorder.isTypeSupported(t) } catch { return false }
      }) ?? ''

      chunksRef.current = []
      const recorder = new MediaRecorder(stream, supported ? { mimeType: supported } : {})
      mimeTypeRef.current = recorder.mimeType || supported || 'audio/mp4'

      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current })
        submitAudio(blob, mimeTypeRef.current)
      }

      recorder.start()
      recorderRef.current = recorder
      setMode('recording')
    } catch {
      setErrorMsg('mic_denied')
      setMode('error')
    }
  }

  function stopRecording() {
    recorderRef.current?.stop()
    setMode('processing')
  }

  async function submitAudio(blob, mimeType) {
    setMode('processing')
    try {
      const base64 = await blobToBase64(blob)
      const res = await fetch('/api/voice-input', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: base64, mimeType }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur serveur')
      setResult(data)
      setMode('done')
    } catch (e) {
      setErrorMsg(e.message)
      setMode('error')
    }
  }

  async function submitText() {
    if (!text.trim()) return
    setMode('processing')
    try {
      const res = await fetch('/api/voice-input', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur serveur')
      setResult(data)
      setMode('done')
    } catch (e) {
      setErrorMsg(e.message)
      setMode('error')
    }
  }

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result.split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => { setOpen(true); reset() }}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-[#2d4a6b] text-white shadow-lg flex items-center justify-center hover:bg-[#1e3349] active:scale-95 transition-all"
        title="Nouvelle saisie"
      >
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) close() }}
        >
          <div className="bg-stone-50 rounded-2xl w-full max-w-lg shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200">
              <h2 className="text-sm font-semibold text-stone-800">Nouvelle saisie</h2>
              <button
                onClick={close}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-500 hover:bg-stone-200 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="px-5 py-5">
              {/* Idle */}
              {mode === 'idle' && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <textarea
                      rows={3}
                      value={text}
                      onChange={e => setText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitText() } }}
                      placeholder="Tapez votre demande ou utilisez le micro..."
                      className="flex-1 px-3 py-2.5 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#c5a059]/30 focus:border-[#c5a059] resize-none"
                      autoFocus
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={startRecording}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-stone-100 text-stone-700 text-base font-semibold border border-stone-800 hover:bg-stone-200 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                      </svg>
                      Vocal
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-stone-100 text-stone-700 text-sm font-medium border border-stone-200 hover:bg-stone-200 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                        </svg>
                        Document
                      </button>
                      <button
                        onClick={submitText}
                        disabled={!text.trim()}
                        className="flex-1 px-4 py-3 rounded-xl bg-[#2d4a6b] text-white text-sm font-medium hover:bg-[#1e3349] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Envoyer
                      </button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                      onChange={async e => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        setMode('processing')
                        try {
                          const ext = file.name.split('.').pop()
                          const uid = `${Date.now()}_${Math.random().toString(36).slice(2)}`
                          const path = `unlinked/${uid}.${ext}`
                          const { error: se } = await supabase.storage.from('documents').upload(path, file, { contentType: file.type })
                          if (se) throw se
                          const { error: de } = await supabase.from('documents').insert({ filename: file.name, storage_path: path, mime_type: file.type })
                          if (de) throw de
                          setUploadedDoc(file.name)
                          setMode('doc_done')
                        } catch (err) {
                          setErrorMsg(err.message)
                          setMode('error')
                        }
                        e.target.value = ''
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Recording */}
              {mode === 'recording' && (
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center animate-pulse">
                      <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm text-stone-600">Enregistrement en cours...</p>
                  <button
                    onClick={stopRecording}
                    className="px-6 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
                  >
                    Arrêter
                  </button>
                </div>
              )}

              {/* Processing */}
              {mode === 'processing' && (
                <div className="flex flex-col items-center gap-3 py-6">
                  <div className="w-8 h-8 border-2 border-[#2d4a6b] border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-stone-500">Traitement en cours...</p>
                </div>
              )}

              {/* Done */}
              {mode === 'done' && result && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-stone-800">
                      {result.items?.length > 1 ? `${result.items.length} entrées enregistrées` : 'Enregistré'}
                    </span>
                  </div>

                  {result.items?.map((item, i) => (
                    <div key={i} className="bg-stone-100 rounded-xl px-4 py-3 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          item.type === 'commande' ? 'bg-[#2d4a6b]/10 text-[#2d4a6b]' :
                          item.type === 'fiche_client' ? 'bg-purple-100 text-purple-800' :
                          item.type === 'logistique' ? 'bg-orange-100 text-orange-800' :
                          item.type === 'compta' ? 'bg-blue-100 text-blue-800' :
                          item.type === 'tarif' ? 'bg-teal-100 text-teal-800' :
                          'bg-stone-200 text-stone-600'
                        }`}>
                          {TYPE_LABELS[item.type] ?? item.type}
                        </span>
                        {item.client && <span className="text-sm font-medium text-stone-700">{item.client}</span>}
                        {item.urgent && <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />}
                      </div>
                      {item.fournisseur && (
                        <p className="text-xs text-stone-500">Fournisseur : {item.fournisseur}</p>
                      )}
                      {item.description && (
                        <p className="text-xs text-stone-600 leading-relaxed">{item.description}</p>
                      )}
                      {item.id && (
                        <DocumentUpload
                          orderId={item.table === 'orders' ? item.id : null}
                          taskId={item.table === 'tasks' ? item.id : null}
                          onUploaded={() => {}}
                        />
                      )}
                    </div>
                  ))}

                  <button
                    onClick={reset}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#2d4a6b] text-white text-sm font-medium hover:bg-[#1e3349] transition-colors"
                  >
                    Nouvelle saisie
                  </button>
                </div>
              )}

              {/* Doc done */}
              {mode === 'doc_done' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-stone-800">Document enregistré</span>
                  </div>
                  <div className="bg-stone-100 rounded-xl px-4 py-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-stone-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    <span className="text-sm text-stone-700 truncate">{uploadedDoc}</span>
                  </div>
                  <p className="text-xs text-stone-400 text-center">Visible dans l'onglet Documents</p>
                  <button onClick={reset} className="w-full px-4 py-2.5 rounded-xl bg-[#2d4a6b] text-white text-sm font-medium hover:bg-[#1e3349] transition-colors">
                    Nouvelle saisie
                  </button>
                </div>
              )}

              {/* Error */}
              {mode === 'error' && (
                <div className="space-y-3">
                  {errorMsg === 'mic_denied' ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🎙️</span>
                        <p className="text-sm font-semibold text-amber-800">Accès au microphone refusé</p>
                      </div>
                      {/iPhone|iPad|iPod/.test(navigator.userAgent) ? (
                        /CriOS/.test(navigator.userAgent) ? (
                          <div className="text-xs text-amber-700 space-y-1">
                            <p className="font-medium">Sur Chrome iPhone :</p>
                            <ol className="list-decimal list-inside space-y-1">
                              <li>Ouvre l'app <strong>Réglages</strong> iPhone</li>
                              <li>Descends jusqu'à <strong>Chrome</strong></li>
                              <li>Active <strong>Microphone</strong></li>
                              <li>Reviens ici et réessaie</li>
                            </ol>
                          </div>
                        ) : (
                          <div className="text-xs text-amber-700 space-y-1">
                            <p className="font-medium">Sur Safari iPhone :</p>
                            <ol className="list-decimal list-inside space-y-1">
                              <li>Ouvre l'app <strong>Réglages</strong> iPhone</li>
                              <li>Descends jusqu'à <strong>Safari</strong></li>
                              <li>Appuie sur <strong>Microphone</strong></li>
                              <li>Sélectionne <strong>Autoriser</strong></li>
                              <li>Reviens ici et réessaie</li>
                            </ol>
                          </div>
                        )
                      ) : (
                        <div className="text-xs text-amber-700 space-y-1">
                          <p className="font-medium">Dans ton navigateur :</p>
                          <ol className="list-decimal list-inside space-y-1">
                            <li>Clique sur l'icône 🔒 dans la barre d'adresse</li>
                            <li>Trouve <strong>Microphone</strong></li>
                            <li>Change en <strong>Autoriser</strong></li>
                            <li>Recharge la page et réessaie</li>
                          </ol>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{errorMsg}</p>
                  )}
                  <button
                    onClick={reset}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-100 transition-colors"
                  >
                    Réessayer
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
