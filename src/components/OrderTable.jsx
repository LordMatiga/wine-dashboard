import StatusBadge from './StatusBadge.jsx'

function groupByDay(items) {
  const groups = {}
  items.forEach(item => {
    const key = new Date(item.created_at).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
    if (!groups[key]) groups[key] = []
    groups[key].push(item)
  })
  return groups
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function SkeletonRow() {
  return (
    <div className="px-4 py-3 border-b border-stone-200">
      <div className="animate-pulse flex gap-3">
        <div className="h-4 bg-stone-200 rounded w-24" />
        <div className="h-4 bg-stone-200 rounded w-32 flex-1" />
        <div className="h-4 bg-stone-200 rounded w-20" />
      </div>
    </div>
  )
}

function MessageBadge({ count }) {
  if (!count) return null
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-[#c5a059] text-white">
      💬 {count}
    </span>
  )
}

export default function OrderTable({ orders, loading, onEdit, commentCounts = {} }) {
  return (
    <div className="space-y-4">
      {/* Desktop header - Note: garde le header ici, il sera répété par groupe pour un look cohérent */}
      {loading ? (
        Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-stone-500 bg-white rounded-2xl border border-stone-200">
          <span className="text-4xl mb-3">🔎</span>
          <p className="text-sm">Aucune commande trouvée</p>
        </div>
      ) : (
        Object.entries(groupByDay(orders)).map(([day, dayOrders]) => (
          <div key={day} className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="px-4 py-2 bg-stone-50 border-b border-stone-200">
              <p className="text-xs font-medium text-stone-500 capitalize">{day}</p>
            </div>
            
            {/* Header desktop spécifique au groupe */}
            <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2.5 bg-stone-50/50 border-b border-stone-100 text-xs font-semibold text-stone-500 uppercase tracking-wide">
              <div className="col-span-2">Date</div>
              <div className="col-span-2">Client</div>
              <div className="col-span-2">Fournisseur</div>
              <div className="col-span-4">Retranscription</div>
              <div className="col-span-2">Statut</div>
            </div>

            {dayOrders.map(order => (
              <div
                key={order.id}
                onClick={() => onEdit(order)}
                className="border-b border-stone-100 last:border-0 cursor-pointer hover:bg-stone-50 transition-colors"
              >
                {/* Desktop row */}
                <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-3 items-center">
                  <div className="col-span-2 text-xs text-stone-500 flex items-center">
                    {order.urgent && <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1.5 flex-shrink-0" />}
                    {formatDate(order.created_at)}
                  </div>
                  <div className="col-span-2 text-sm font-medium text-stone-800 truncate">{order.client_name ?? '—'}</div>
                  <div className="col-span-2 text-sm text-stone-600 truncate">{order.supplier_name ?? '—'}</div>
                  <div className="col-span-3 text-xs text-stone-500 line-clamp-2">{order.transcription ?? '—'}</div>
                  <div className="col-span-1"><MessageBadge count={commentCounts[order.id]} /></div>
                  <div className="col-span-2"><StatusBadge status={order.status} /></div>
                </div>
                {/* Mobile card */}
                <div className="sm:hidden flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {order.urgent && <span className="inline-block w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />}
                      <span className="font-medium text-sm text-stone-800 truncate">{order.client_name ?? '—'}</span>
                    </div>
                    <p className="text-xs text-stone-400 line-clamp-1">{order.supplier_name ?? ''}</p>
                    <p className="text-xs text-stone-400 mt-0.5">{formatDate(order.created_at)}</p>
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-end gap-1">
                    <StatusBadge status={order.status} />
                    <MessageBadge count={commentCounts[order.id]} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  )
}