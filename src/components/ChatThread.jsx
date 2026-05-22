import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase.js'

function formatTime(str) {
  return new Date(str).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function formatDay(str) {
  return new Date(str).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function ChatThread({ orderId, taskId }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)
  const sender = localStorage.getItem('user_role') ?? 'Opérateur'

  useEffect(() => {
    fetchMessages()
    const filter = orderId
      ? `order_id=eq.${orderId}`
      : `task_id=eq.${taskId}`
    const channel = supabase
      .channel(`comments-${orderId ?? taskId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments', filter }, fetchMessages)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [orderId, taskId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function fetchMessages() {
    const query = supabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: true })
    if (orderId) query.eq('order_id', orderId)
    else query.eq('task_id', taskId)
    const { data } = await query
    setMessages(data ?? [])
  }

  async function send() {
    if (!text.trim()) return
    setSending(true)
    await supabase.from('comments').insert({
      order_id: orderId ?? null,
      task_id: taskId ?? null,
      content: text.trim(),
      sender,
    })
    setText('')
    setSending(false)
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  let lastDay = null

  return (
    <div className="flex flex-col">
      <div className="max-h-64 overflow-y-auto px-4 py-3 space-y-2">
        {messages.length === 0 && (
          <p className="text-xs text-stone-400 text-center py-4">Aucun message pour l'instant.</p>
        )}
        {messages.map(msg => {
          const isMe = msg.sender === sender
          const day = formatDay(msg.created_at)
          const showDay = day !== lastDay
          lastDay = day

          return (
            <div key={msg.id}>
              {showDay && (
                <p className="text-center text-xs text-stone-400 my-2">{day}</p>
              )}
              <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[75%]">
                  {!isMe && (
                    <p className="text-xs text-stone-400 mb-0.5 ml-1">{msg.sender}</p>
                  )}
                  <div className={`px-3 py-2 rounded-2xl text-sm leading-snug ${
                    isMe
                      ? 'bg-[#2d4a6b] text-white rounded-br-sm'
                      : 'bg-stone-200 text-stone-800 rounded-bl-sm'
                  }`}>
                    {msg.content}
                  </div>
                  <p className={`text-xs text-stone-400 mt-0.5 ${isMe ? 'text-right mr-1' : 'ml-1'}`}>
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-end gap-2 px-4 py-3 border-t border-stone-100">
        <textarea
          rows={1}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Écrire un message..."
          className="flex-1 px-3 py-2 text-sm rounded-2xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#2d4a6b]/20 focus:border-[#2d4a6b] resize-none"
        />
        <button
          onClick={send}
          disabled={!text.trim() || sending}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-[#2d4a6b] text-white disabled:opacity-40 transition-colors hover:bg-[#1e3349] flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </button>
      </div>
    </div>
  )
}
