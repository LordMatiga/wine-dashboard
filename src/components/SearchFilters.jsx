import AutocompleteInput from './AutocompleteInput.jsx'

const FILTERS = ['Tous', 'Entrante', 'Traitée', 'À traiter']

export default function SearchFilters({ search, onSearch, statusFilter, onStatusFilter }) {
  return (
    <div className="bg-zinc-50 rounded-xl border border-zinc-200 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
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
  )
}
