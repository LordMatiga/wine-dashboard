export default function Header() {
  return (
    <header className="sticky top-0 z-30 bg-zinc-50 border-b border-zinc-300 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 relative flex items-center justify-center">
        <div className="flex items-center gap-3">
          <img
            src="/logo-grunfalcot.png"
            alt="Grün Falcot & Co."
            className="h-11 w-auto"
          />
          <div>
            <p className="text-sm font-bold text-zinc-800 leading-tight">Grün Falcot &amp; Co</p>
            <p className="text-xs text-zinc-500 leading-tight">Suivi des commandes</p>
          </div>
        </div>
        <div className="absolute right-4 sm:right-6 flex items-center gap-2 text-xs text-zinc-500">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Temps réel
        </div>
      </div>
    </header>
  )
}
