export default function StatsBar({ orders }) {
  const total = orders.length
  const att = orders.filter(o => o.status === 'En attente').length
  const tra = orders.filter(o => o.status === 'Traitée').length
  const err = orders.filter(o => o.status === 'Erreur IA').length

  return (
    <p className="text-xs text-zinc-500 text-center py-2">
      Total {total} · En attente {att} · Traitées {tra} · Erreurs {err}
    </p>
  )
}
