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
import TaskTable from './components/TaskTable.jsx'
import EditTaskModal from './components/EditTaskModal.jsx'
import UrgentPanel from './components/UrgentPanel.jsx'

const ROLE_LABELS = { assistant: 'Timothée', patron: 'Gérant' }

const TABS = [
  { id: 'commandes', label: 'Commandes' },
  { id: 'taches', label: 'Tâches' },
  { id: 'urgent', label: '🔴 Urgent' },
  { id: 'notifications', label: 'Notifications' },
]

export default function App() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Tous')
  const [editingOrder, setEditingOrder] = useState(null)
  const [editingTask, setEditingTask] = useState(null)
  const [error, setError] = useState(null)
  const [showPushSetup, setShowPushSetup] = useState(false)
  const [activeTab, setActiveTab] = useState('commandes')
  const [userRole, setUserRole] = useState(() => localStorage.getItem('user_role') ?? null)

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

  async function handleUpdateTask(id, updates) {
    let error
    if (id) {
      ;({ error } = await supabase.from('tasks').update(updates).eq('id', id))
    } else {
      ;({ error } = await supabase.from('tasks').insert(updates))
    }
    if (error) {
      setError(error.message)
    } else {
      setEditingTask(null)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-100">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 flex items-center gap-1 flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              activeTab === tab.id
                ? 'bg-[#2d4a6b] text-white'
                : 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <button
          onClick={() => setShowPushSetup(true)}
          className="ml-auto px-3 py-2 rounded-xl text-xs font-medium bg-zinc-200 text-zinc-600 hover:bg-zinc-300 transition whitespace-nowrap"
        >
          {userRole ? `Rôle : ${ROLE_LABELS[userRole] ?? userRole}` : '🔔 Configurer'}
        </button>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {activeTab === 'commandes' && (
          <>
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
        )}

        {activeTab === 'taches' && (
          <TaskTable onEdit={setEditingTask} onNew={() => setEditingTask({})} />
        )}

        {activeTab === 'urgent' && (
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
            <UrgentPanel
              onSelectOrder={order => { setEditingOrder(order); setActiveTab('commandes') }}
              onSelectTask={task => setEditingTask(task)}
            />
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
            <NotificationsPanel
              onSelectOrder={order => {
                setEditingOrder(order)
                setActiveTab('commandes')
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

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onSave={handleUpdateTask}
          onClose={() => setEditingTask(null)}
        />
      )}

      {showPushSetup && (
        <PushSetup
          onClose={() => setShowPushSetup(false)}
          onRoleSet={role => setUserRole(role)}
        />
      )}
    </div>
  )
}
