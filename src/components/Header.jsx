export default function Header() {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-wine-700 flex items-center justify-center text-white text-lg">
            🍷
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 leading-tight">GRUN Falco &amp; Compagnie</p>
            <p className="text-xs text-slate-500 leading-tight">Suivi des commandes</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Temps réel
        </div>
      </div>
    </header>
  )
}
