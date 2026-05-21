export default function Header({ onNotifClick }) {
  return (
    <header className="z-30 bg-zinc-50 border-b border-zinc-300 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-11 grid grid-cols-3 items-center">
        {/* Spacer pour équilibrer */}
        <div />
        
        {/* Logo centré */}
        <div className="flex justify-center h-full w-full">
          <img
            src="/logo-grunfalcot.png"
            alt="Grün Falcot & Co."
            className="h-auto w-auto object contain "
          />
        </div>

        {/* Notifications à droite */}
        <div className="flex items-center justify-end gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <button
            onClick={onNotifClick}
            className="text-zinc-400 hover:text-zinc-600 text-sm p-1"
          >
            🔔
          </button>
        </div>
      </div>
    </header>
  )
}