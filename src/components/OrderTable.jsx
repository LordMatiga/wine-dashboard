import StatusBadge from './StatusBadge.jsx'

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function SkeletonRow() {
  return (
    <div className="px-4 py-3 border-b border-zinc-200">
      <div className="animate-pulse flex gap-3">
        <div className="h-4 bg-zinc-200 rounded w-24" />
        <div className="h-4 bg-zinc-200 rounded w-32 flex-1" />
        <div className="h-4 bg-zinc-200 rounded w-20" />
      </div>
    </div>
  )
}

export default function OrderTable({ orders, loading, onEdit }) {
  return (
    <div className="bg-zinc-50 rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
      {/* Desktop header */}
      <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2.5 bg-zinc-100 border-b border-zinc-200 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
        <div className="col-span-2">Date</div>
        <div className="col-span-2">Client</div>
        <div className="col-span-2">Fournisseur</div>
        <div className="col-span-4">Retranscription</div>
        <div className="col-span-2">Statut</div>
      </div>

      {loading ? (
        Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
          <span className="text-4xl mb-3">🔎</span>
          <p className="text-sm">Aucune commande trouvée</p>
        </div>
      ) : (
        orders.map(order => (
          <div
            key={order.id}
            onClick={() => onEdit(order)}
            className="border-b border-zinc-200 last:border-0 cursor-pointer"
          >
            {/* Desktop row */}
            <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-zinc-100/70 transition-colors">
              <div className="col-span-2 text-xs text-zinc-500 flex items-center">
                {order.urgent && <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1.5 flex-shrink-0" />}
                {formatDate(order.created_at)}
              </div>
              <div className="col-span-2 text-sm font-medium text-zinc-800 truncate">{order.client_name ?? '—'}</div>
              <div className="col-span-2 text-sm text-zinc-600 truncate">{order.supplier_name ?? '—'}</div>
              <div className="col-span-4 text-xs text-zinc-500 line-clamp-2">{order.transcription ?? '—'}</div>
              <div className="col-span-2"><StatusBadge status={order.status} /></div>
            </div>

            {/* Mobile card */}
            <div className="sm:hidden px-4 py-3 hover:bg-zinc-100/70 transition-colors">
              <div className="flex items-start justify-between mb-1.5">
                <div>
                  <p className="text-sm font-medium text-zinc-800">{order.client_name ?? '—'}</p>
                  <p className="text-xs text-zinc-500">{order.supplier_name ?? '—'}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {order.urgent && <span className="text-red-500 text-xs font-bold">🔴</span>}
                  <StatusBadge status={order.status} />
                </div>
              </div>
              {order.transcription && (
                <p className="text-xs text-zinc-500 line-clamp-2 mb-2">{order.transcription}</p>
              )}
              <span className="text-xs text-zinc-500">{formatDate(order.created_at)}</span>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
