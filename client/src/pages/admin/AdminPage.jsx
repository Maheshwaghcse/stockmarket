import { useQuery } from '@tanstack/react-query'
import { Routes, Route, NavLink } from 'react-router-dom'
import api from '../../lib/api'
import { Users, FileText, Activity, LayoutDashboard } from 'lucide-react'

function Dashboard() {
  const { data } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/admin/dashboard').then(r => r.data),
    refetchInterval: 30_000,
  })

  const stats = data?.stats || {}

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Admin Dashboard</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users',       value: stats.totalUsers,            icon: Users },
          { label: 'Active Subs',       value: stats.activeSubscriptions,   icon: Activity },
          { label: 'Revenue (₹)',       value: (stats.totalRevenuePaise / 100).toFixed(0), icon: LayoutDashboard },
          { label: 'Active (30d)',      value: stats.activeUsersLast30d,    icon: Users },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="card">
            <p className="text-xs muted mb-1">{label}</p>
            <p className="text-2xl font-bold mono">{value ?? '—'}</p>
          </div>
        ))}
      </div>
      <div className="card">
        <p className="text-sm muted">
          Market status: <strong>{stats.marketStatus || '—'}</strong> ·
          Tracked indices: <strong>{stats.indexCount || 0}</strong>
        </p>
      </div>
    </div>
  )
}

function UsersList() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/admin/users').then(r => r.data),
  })

  const users = data?.data || []
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Users</h2>
      <div className="card overflow-x-auto touch-scroll">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs muted border-b" style={{ borderColor: 'var(--color-border)' }}>
              {['Name', 'Email', 'Role', 'Joined', 'Status'].map(h => (
                <th key={h} className="pb-3 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => <tr key={i}><td colSpan={5}><div className="skeleton h-5 my-2 rounded" /></td></tr>)
              : users.map(u => (
                  <tr key={u._id} className="border-b hover:bg-white/2" style={{ borderColor: 'rgba(51,65,85,0.4)' }}>
                    <td className="py-2.5 font-medium">{u.name}</td>
                    <td className="py-2.5 text-xs muted">{u.email}</td>
                    <td className="py-2.5">
                      <span className={`text-xs font-bold capitalize ${u.role === 'admin' ? '' : 'muted'}`}
                            style={{ color: u.role === 'admin' ? '#fbbf24' : undefined }}>{u.role}</span>
                    </td>
                    <td className="py-2.5 text-xs muted">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="py-2.5">
                      <span className={`text-xs font-bold ${u.isActive ? 'gain' : 'loss'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}

const ADMIN_NAV = [
  { to: '/admin',       label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users',     icon: Users },
  { to: '/admin/articles', label: 'Articles', icon: FileText },
]

export default function AdminPage() {
  return (
    <div className="flex flex-col md:flex-row gap-6 fade-in">
      {/* Sidebar */}
      <aside className="w-full md:w-48 shrink-0">
        <div className="card flex md:flex-col overflow-x-auto touch-scroll gap-1 p-2 md:p-3">
          {ADMIN_NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive ? 'bg-blue-500/10 text-blue-400' : 'muted hover:text-slate-200 hover:bg-white/5'
                }`
              }>
              <Icon size={15} /> {label}
            </NavLink>
          ))}
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="users" element={<UsersList />} />
          <Route path="articles" element={<div className="card"><p className="muted text-sm">Article CMS — coming soon.</p></div>} />
        </Routes>
      </div>
    </div>
  )
}
