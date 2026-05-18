const FILTERS = ['Tous', 'En attente', 'Traitée', 'Erreur IA']

export default function SearchFilters({ search, onSearch, statusFilter, onStatusFilter }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">🔍</span>
        <input
          type="text"
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder="Client, fournisseur, mot-clé..."
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-wine-700/20 focus:border-wine-700 placeholder-slate-400"
        />
      </div>
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => onStatusFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === f
                ? 'bg-wine-700 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>
    </div>
  )
}
