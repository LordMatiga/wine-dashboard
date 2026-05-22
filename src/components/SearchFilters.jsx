const STATUS_FILTERS = ['Tous', 'Entrante', 'À traiter', 'Traitée']

const TYPE_OPTIONS = [
  { value: 'Tous', label: 'Tous types' },
  { value: 'commande', label: 'Commande' },
  { value: 'fiche_client', label: 'Fiche client' },
  { value: 'logistique', label: 'Logistique' },
  { value: 'compta', label: 'Compta' },
  { value: 'tarif', label: 'Tarif' },
  { value: 'autre', label: 'Autre' },
]

export default function SearchFilters({ search, onSearch, statusFilter, onStatusFilter, typeFilter = 'Tous', onTypeFilter, dateFrom, dateTo, onDateFrom, onDateTo }) {
  return (
    <div className="bg-stone-50 rounded-xl border border-stone-200 shadow-sm p-2 flex flex-col gap-2">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder="Client, fournisseur, mot-clé..."
          className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#c5a059]/20 focus:border-[#c5a059] placeholder-stone-400"
        />
        <div className="flex gap-1.5 flex-wrap items-center">
          <select
            value={typeFilter}
            onChange={e => onTypeFilter?.(e.target.value)}
            className="px-2.5 py-1 rounded-lg text-xs font-medium border border-stone-200 bg-white text-stone-600 focus:outline-none focus:ring-2 focus:ring-[#c5a059]/20 focus:border-[#c5a059] cursor-pointer"
          >
            {TYPE_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {STATUS_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => onStatusFilter(f)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === f
                  ? 'bg-[#c5a059] text-white'
                  : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2 items-center flex-wrap">
        <span className="text-xs text-stone-500 font-medium">Du</span>
        <input
          type="date"
          value={dateFrom}
          onChange={e => onDateFrom(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#c5a059]/20 focus:border-[#c5a059]/60 transition bg-white"
        />
        <span className="text-xs text-stone-500 font-medium">au</span>
        <input
          type="date"
          value={dateTo}
          onChange={e => onDateTo(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#c5a059]/20 focus:border-[#c5a059]/60 transition bg-white"
        />
        {(dateFrom || dateTo) && (
          <button
            onClick={() => { onDateFrom(''); onDateTo('') }}
            className="text-xs text-stone-400 hover:text-stone-600 underline"
          >
            Effacer
          </button>
        )}
      </div>
    </div>
  )
}
