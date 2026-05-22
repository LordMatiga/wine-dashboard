import { useState, useEffect, useMemo } from 'react'
import { supabase } from './lib/supabase.js'
import { sendPushNotification } from './lib/webpush.js'
import LoginPage from './components/LoginPage.jsx'
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
import AllFeedPanel from './components/AllFeedPanel.jsx'
import VoiceInput from './components/VoiceInput.jsx'

export default function App() {
  const [session, setSession] = useState(undefined)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Tous')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [editingOrder, setEditingOrder] = useState(null)
  const [editingTask, setEditingTask] = useState(null)
  const [error, setError] = useState(null)
  const [showPushSetup, setShowPushSetup] = useState(false)
  const [activeTab, setActiveTab] = useState('tout')
  const [userRole, setUserRole] = useState(() => localStorage.getItem('user_role') ?? null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

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
      .subscribe(status => setConnected(status === 'SUBSCRIBED'))
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
      const matchDate = (() => {
        if (!dateFrom && !dateTo) return true
        const d = new Date(o.created_at)
        if (dateFrom && d < new Date(dateFrom)) return false
        if (dateTo && d > new Date(dateTo + 'T23:59:59')) return false
        return true
      })()
      return matchSearch && matchStatus && matchDate
    })
  }, [orders, search, statusFilter, dateFrom, dateTo])

  async function handleUpdate(id, updates) {
    const { error } = await supabase.from('orders').update(updates).eq('id', id)
    if (error) {
      setError(error.message)
    } else {
      if (updates.status) {
        sendPushNotification(updates.status, editingOrder?.client_name, 'commande').catch(console.error)
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
      if (updates.status) {
        sendPushNotification(updates.status, editingTask?.client_name, editingTask?.type).catch(console.error)
      }
      setEditingTask(null)
    }
  }

  if (session === undefined) return null
  if (!session) return <LoginPage />

  return (
    <div className="min-h-screen bg-stone-100">
      <Header onNotifClick={() => setShowPushSetup(true)} onLogout={() => supabase.auth.signOut()} connected={connected} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-2">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1">
          {[
            { key: 'tout', label: 'Tout' },
            { key: 'urgent', label: 'Urgent' },
            { key: 'commandes', label: 'Commandes' },
            { key: 'taches', label: 'Tâches' },
            { key: 'notifications', label: 'Notifications' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition text-center ${
                activeTab === tab.key
                  ? 'bg-[#c5a059] text-white'
                  : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        <SearchFilters
          search={search}
          onSearch={setSearch}
          statusFilter={statusFilter}
          onStatusFilter={setStatusFilter}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFrom={setDateFrom}
          onDateTo={setDateTo}
        />

        {activeTab === 'tout' && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <AllFeedPanel
              onSelectOrder={setEditingOrder}
              onSelectTask={setEditingTask}
              search={search}
              statusFilter={statusFilter}
              dateFrom={dateFrom}
              dateTo={dateTo}
            />
          </div>
        )}

        {activeTab === 'commandes' && (
          <>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                ⚠️ Erreur : {error}
              </div>
            )}

            <OrderTable orders={filteredOrders} loading={loading} onEdit={setEditingOrder} />

            {!loading && (
              <p className="text-xs text-stone-500 text-right">
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
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <UrgentPanel
              onSelectOrder={order => { setEditingOrder(order); setActiveTab('commandes') }}
              onSelectTask={task => setEditingTask(task)}
              search={search}
              statusFilter={statusFilter}
              dateFrom={dateFrom}
              dateTo={dateTo}
            />
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <NotificationsPanel
              onSelectOrder={order => {
                setEditingOrder(order)
                setActiveTab('commandes')
              }}
              onDelete={async (id) => {
                await supabase.from('order_history').delete().eq('id', id)
              }}
              search={search}
              statusFilter={statusFilter}
              dateFrom={dateFrom}
              dateTo={dateTo}
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

      <VoiceInput />
    </div>
  )
}
