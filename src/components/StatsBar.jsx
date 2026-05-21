export default function StatsBar({ orders }) {
  const total = orders.length
  const ent = orders.filter(o => o.status === 'Entrante').length
  const tra = orders.filter(o => o.status === 'Traitée').length
  const atr = orders.filter(o => o.status === 'À traiter').length

  return (
    <p className="text-xs text-stone-500 text-center py-2">
      Total {total} · Entrantes {ent} · Traitées {tra} · À traiter {atr}
    </p>
  )
}
