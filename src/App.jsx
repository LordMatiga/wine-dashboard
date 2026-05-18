import { useState, useEffect, useMemo } from 'react'
import { supabase } from './lib/supabase.js'
import Header from './components/Header.jsx'
import StatsBar from './components/StatsBar.jsx'
import SearchFilters from './components/SearchFilters.jsx'
import OrderTable from './components/OrderTable.jsx'
import EditModal from './components/EditModal.jsx'

export default function App() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Tous')
  const [editingOrder, setEditingOrder] = useState(null)
  const [error, setError] = useState(null)

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
      setEditingOrder(null)
      fetchOrders()
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        <StatsBar orders={orders} />
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
          <p className="text-xs text-slate-400 text-right">
            {filteredOrders.length} résultat{filteredOrders.length !== 1 ? 's' : ''}
            {search || statusFilter !== 'Tous' ? ` sur ${orders.length}` : ''}
          </p>
        )}
      </main>

      {editingOrder && (
        <EditModal
          order={editingOrder}
          onSave={handleUpdate}
          onClose={() => setEditingOrder(null)}
        />
      )}
    </div>
  )
}
