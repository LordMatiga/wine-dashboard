const STATUS_STYLES = {
  'Entrante': {
    wrapper: 'bg-blue-50 text-blue-800 border border-blue-200',
    dot: 'bg-blue-400',
  },
  'À traiter': {
    wrapper: 'bg-amber-50 text-amber-800 border border-amber-200',
    dot: 'bg-amber-400',
  },
  'Traitée': {
    wrapper: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    dot: 'bg-emerald-400',
  },
}

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] ?? {
    wrapper: 'bg-stone-100 text-stone-800 border border-stone-200',
    dot: 'bg-stone-400',
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${style.wrapper}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {status}
    </span>
  )
}
