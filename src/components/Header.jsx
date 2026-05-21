export default function Header() {
  return (
    <header className="z-30 bg-zinc-50 border-b border-zinc-300 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 relative flex flex-col items-center">
        <img
          src="/logo-grunfalcot.png"
          alt="Grün Falcot & Co."
          className="h-[52px] w-auto"
        />
        <p className="text-xs text-zinc-500 mt-1">Suivi des commandes</p>
        <div className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 flex items-center gap-2 text-xs text-zinc-500">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Temps réel
        </div>
      </div>
    </header>
  )
}
