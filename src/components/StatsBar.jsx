export default function StatsBar({ orders }) {
  const total = orders.length
  const pending = orders.filter(o => o.status === 'En attente').length
  const done = orders.filter(o => o.status === 'Traitée').length
  const errors = orders.filter(o => o.status === 'Erreur IA').length

  const cards = [
    { label: 'Total commandes', value: total, wrapper: 'bg-white', text: 'text-slate-800' },
    { label: 'En attente', value: pending, wrapper: 'bg-amber-50', text: 'text-amber-700' },
    { label: 'Traitées', value: done, wrapper: 'bg-emerald-50', text: 'text-emerald-700' },
    { label: 'Erreurs IA', value: errors, wrapper: 'bg-red-50', text: 'text-red-700' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cards.map(card => (
        <div key={card.label} className={`${card.wrapper} rounded-xl border border-slate-100 p-4 shadow-sm`}>
          <p className="text-xs text-slate-500 mb-1">{card.label}</p>
          <p className={`text-2xl font-bold ${card.text}`}>{card.value}</p>
        </div>
      ))}
    </div>
  )
}
