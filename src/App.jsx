import { useState, useEffect, useMemo } from 'react'
import { supabase } from './lib/supabase.js'
import { sendPushNotification } from './lib/webpush.js'
import Header from './components/Header.jsx'
import StatsBar from './components/StatsBar.jsx'
import SearchFilters from './components/SearchFilters.jsx'
import OrderTable from './components/OrderTable.jsx'
import EditModal from './components/EditModal.jsx'
import PushSetup from './components/PushSetup.jsx'
import NotificationsPanel from './components/NotificationsPanel.jsx'

export default function App() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Tous')
  const [editingOrder, setEditingOrder] = useState(null)
  const [error, setError] = useState(null)
  const [showPushSetup, setShowPushSetup] = useState(false)
  const [activeTab, setActiveTab] = useState('orders')

  async function fetchOrders() {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setOrders(data ?? [])
      setError(null)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchOrders()

    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  const filteredOrders = useMemo(() => {
    const q = search.toLowerCase()
    return orders.filter(o => {
      const matchSearch =
        !q ||
        (o.client_name ?? '').toLowerCase().includes(q) ||
        (o.supplier_name ?? '').toLowerCase().includes(q) ||
        (o.transcription ?? '').toLowerCase().includes(q)

      const matchStatus = statusFilter === 'Tous' || o.status === statusFilter

      return matchSearch && matchStatus
    })
  }, [orders, search, statusFilter])

  async function handleUpdate(id, updates) {
    const { error } = await supabase.from('orders').update(updates).eq('id', id)
    if (error) {
      setError(error.message)
    } else {
      if (updates.status) {
        sendPushNotification(updates.status, editingOrder?.client_name).catch(console.error)
      }
      setEditingOrder(null)
      fetchOrders()
    }
  }

  return (
    <div className="min-h-screen bg-zinc-100">
      <Header />

      {/* Barre d'onglets */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 flex gap-1">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
            activeTab === 'orders'
              ? 'bg-[#2d4a6b] text-white'
              : 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300'
          }`}
        >
          Commandes
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
            activeTab === 'notifications'
              ? 'bg-[#2d4a6b] text-white'
              : 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300'
          }`}
        >
          Notifications
        </button>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {activeTab === 'orders' ? (
          <>
            <div className="flex justify-end">
              <button
                onClick={() => setShowPushSetup(true)}
                className="text-xs text-zinc-400 hover:text-zinc-600"
              >
                🔔 Activer notifications
              </button>
            </div>

            <SearchFilters
              search={search}
              onSearch={setSearch}
              statusFilter={statusFilter}
              onStatusFilter={setStatusFilter}
            />

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                ⚠️ Erreur : {error}
              </div>
            )}

            <OrderTable orders={filteredOrders} loading={loading} onEdit={setEditingOrder} />

            {!loading && (
              <p className="text-xs text-zinc-500 text-right">
                {filteredOrders.length} résultat{filteredOrders.length !== 1 ? 's' : ''}
                {search || statusFilter !== 'Tous' ? ` sur ${orders.length}` : ''}
              </p>
            )}

            <StatsBar orders={orders} />
          </>
        ) : (
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
            <NotificationsPanel
              onSelectOrder={order => {
                setEditingOrder(order)
                setActiveTab('orders')
              }}
              onDelete={async (id) => {
                await supabase.from('order_history').delete().eq('id', id)
              }}
            />
          </div>
        )}
      </main>

      {editingOrder && (
        <EditModal
          order={editingOrder}
          onSave={handleUpdate}
          onClose={() => setEditingOrder(null)}
        />
      )}

      {showPushSetup && (
        <PushSetup onClose={() => setShowPushSetup(false)} />
      )}
    </div>
  )
}
