import { useState, useRef } from 'react'
import DocumentUpload from './DocumentUpload.jsx'

const TYPE_LABELS = {
  commande: 'Commande',
  fiche_client: 'Fiche client',
  logistique: 'Logistique',
  compta: 'Compta',
  tarif: 'Tarif',
  autre: 'Autre',
}

export default function VoiceInput() {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState('idle') // idle | recording | processing | done | error
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const mimeTypeRef = useRef('')

  function reset() {
    setMode('idle')
    setText('')
    setResult(null)
    setErrorMsg('')
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
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4'

      mimeTypeRef.current = mimeType
      chunksRef.current = []

      const recorder = new MediaRecorder(stream, { mimeType })
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: mimeType })
        submitAudio(blob, mimeType)
      }

      recorder.start()
      recorderRef.current = recorder
      setMode('recording')
    } catch {
      setErrorMsg("Accès au microphone refusé. Autorise-le dans les réglages du navigateur.")
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
                    <button
                      onClick={submitText}
                      disabled={!text.trim()}
                      className="w-full px-4 py-3 rounded-xl bg-[#2d4a6b] text-white text-sm font-medium hover:bg-[#1e3349] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Envoyer
                    </button>
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

              {/* Error */}
              {mode === 'error' && (
                <div className="space-y-3">
                  <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{errorMsg}</p>
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
