const STATUS_STYLES = {
  'En attente': {
    wrapper: 'bg-amber-50 text-amber-800',
    dot: 'bg-amber-400',
  },
  'Traitée': {
    wrapper: 'bg-emerald-50 text-emerald-800',
    dot: 'bg-emerald-400',
  },
  'Erreur IA': {
    wrapper: 'bg-red-50 text-red-800',
    dot: 'bg-red-400',
  },
}

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] ?? {
    wrapper: 'bg-slate-50 text-slate-800',
    dot: 'bg-slate-400',
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${style.wrapper}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {status}
    </span>
  )
}
