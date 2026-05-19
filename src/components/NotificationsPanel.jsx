import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import StatusBadge from './StatusBadge.jsx'

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function NotificationsPanel({ onSelectOrder, onDelete }) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Fonction de récupération initiale
    const fetchNotifications = async () => {
      try {
        setLoading(true); // On commence par charger
        const { data, error } = await supabase
          .from('notifications')
          .select('*, orders(*)') // Assure-toi que cette jointure est correcte
          .order('created_at', { ascending: false });

        if (error) throw error;
        setNotifications(data || []);
      } catch (err) {
        console.error("Erreur de chargement:", err);
      } finally {
        setLoading(false); // Le chargement est fini
      }
    };

    fetchNotifications();

    // 2. Abonnement temps réel
    const channel = supabase.channel('custom-all-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        setNotifications(prev => [payload.new, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // Exécuté une seule fois au montage
const handleDelete = async (id) => {
  // Supprime immédiatement de l'affichage pour que ce soit fluide
  setNotifications(prev => prev.filter(notif => notif.id !== id));

  // Supprime de la base de données Supabase
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("Erreur lors de la suppression:", error);
    // Si tu veux être perfectionniste, tu peux rajouter la notification dans la liste ici en cas d'erreur
  }
};
  if (loading) {
    return <p className="text-xs text-zinc-400 text-center py-8">Chargement...</p>
  }

  if (notifications.length === 0) {
    return <p className="text-sm text-zinc-400 text-center py-8">Aucune notification</p>
  }

  return (
    <ul className="divide-y divide-zinc-100">
      {notifications.map(entry => {
        const statusChange = entry.changes?.status
        const before = statusChange?.before
        const after = statusChange?.after
        const order = entry.orders
        const icon = after === 'Traitée' ? '✅' : '🔔'

        return (
          <li
            key={entry.id}
            onClick={() => order && onSelectOrder(order)}
            className="flex items-start gap-3 px-4 py-3 hover:bg-zinc-100 cursor-pointer transition-colors"
          >
            <span className="text-lg mt-0.5 shrink-0">{icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-zinc-800 truncate">
                  {order?.client_name ?? '—'}
                </p>
                <span className="text-xs text-zinc-400 whitespace-nowrap shrink-0">
                  {formatDate(entry.created_at)}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mb-1.5">{order?.supplier_name ?? ''}</p>
              <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                <span>{before}</span>
                <span>→</span>
                <StatusBadge status={after} />
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setNotifications(prev => prev.filter(n => n.id !== entry.id)); onDelete(entry.id) }}
              className="ml-auto p-1.5 rounded-lg text-zinc-300 hover:text-red-500 hover:bg-red-50 transition flex-shrink-0"
              aria-label="Supprimer"
            >
              🗑
            </button>
          </li>
        )
      })}
    </ul>
  )
}
