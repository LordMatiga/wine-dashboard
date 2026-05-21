import AutocompleteInput from './AutocompleteInput.jsx'

const FILTERS = ['Tous', 'Entrante', 'Traitée', 'À traiter']

export default function SearchFilters({ search, onSearch, statusFilter, onStatusFilter, dateFrom, dateTo, onDateFrom, onDateTo }) {
  return (
    <div className="bg-zinc-50 rounded-xl border border-zinc-200 shadow-sm p-4 flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <AutocompleteInput
          value={search}
          onChange={onSearch}
          placeholder="Client, fournisseur, mot-clé..."
          className="flex-1"
        />
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => onStatusFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === f
                  ? 'bg-[#2d4a6b] text-white'
                  : 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2 items-center flex-wrap">
        <span className="text-xs text-zinc-500 font-medium">Du</span>
        <input
          type="date"
          value={dateFrom}
          onChange={e => onDateFrom(e.target.value)}
          className="px-3 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d4a6b]/20 focus:border-[#2d4a6b]/60 transition bg-white"
        />
        <span className="text-xs text-zinc-500 font-medium">au</span>
        <input
          type="date"
          value={dateTo}
          onChange={e => onDateTo(e.target.value)}
          className="px-3 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d4a6b]/20 focus:border-[#2d4a6b]/60 transition bg-white"
        />
        {(dateFrom || dateTo) && (
          <button
            onClick={() => { onDateFrom(''); onDateTo('') }}
            className="text-xs text-zinc-400 hover:text-zinc-600 underline"
          >
            Effacer
          </button>
        )}
      </div>
    </div>
  )
}
