export default function Header({ onNotifClick, onLogout, connected }) {
  return (
    <header className="z-30 bg-stone-50 border-b border-stone-300 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-11 grid grid-cols-[1fr_auto_1fr] items-center">
        
        <div className="flex items-center">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
        </div>

        {/* Colonne centrale : Logo centré */}
        <div className="flex justify-center items-center h-full overflow-hidden">
          <img
            src="/logo-grunfalcot.png"
            alt="Grün Falcot & Co."
            className="max-h-full w-auto object-contain py-1"
          />
        </div>

        {/* Colonne droite : Notifications */}
        <div className="flex items-center justify-end gap-2">
          <button onClick={onNotifClick} className="text-stone-400 hover:text-stone-600 text-sm p-1">🔔</button>
          <button onClick={onLogout} className="text-stone-400 hover:text-stone-600 text-sm p-1" title="Déconnexion">⎋</button>
        </div>
      </div>
    </header>
  )
}