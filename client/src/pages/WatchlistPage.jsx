import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Plus, Trash2, Star, Search } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import { useMarketStore } from '../store/marketStore'

export default function WatchlistPage() {
  const { subscription } = useAuthStore()
  const { indices } = useMarketStore()
  const qc = useQueryClient()
  const [newListName, setNewListName] = useState('')
  const [addSymbol, setAddSymbol] = useState('')
  const [selectedList, setSelectedList] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['watchlists'],
    queryFn: () => api.get('/watchlist').then(r => r.data),
  })

  const lists = data?.data || []

  const createList = useMutation({
    mutationFn: (name) => api.post('/watchlist', { name }),
    onSuccess: () => { qc.invalidateQueries(['watchlists']); setNewListName(''); toast.success('Watchlist created') },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  })

  const deleteList = useMutation({
    mutationFn: (id) => api.delete(`/watchlist/${id}`),
    onSuccess: () => { qc.invalidateQueries(['watchlists']); toast.success('Deleted') },
  })

  const addItem = useMutation({
    mutationFn: ({ listId, symbol }) => api.post(`/watchlist/${listId}/items`, {
      symbol: symbol.toUpperCase(),
      name: symbol.toUpperCase(),
      type: 'index',
      exchange: 'NSE',
    }),
    onSuccess: () => { qc.invalidateQueries(['watchlists']); setAddSymbol(''); toast.success('Added to watchlist') },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  })

  const removeItem = useMutation({
    mutationFn: ({ listId, symbol }) => api.delete(`/watchlist/${listId}/items/${symbol}`),
    onSuccess: () => { qc.invalidateQueries(['watchlists']); toast.success('Removed') },
  })

  const activeList = lists.find((l) => l._id === selectedList) || lists[0]

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Star size={22} /> Watchlists</h1>
          <p className="text-sm muted mt-1">
            {lists.length}/{subscription?.features?.watchlistLimit || 5} watchlists used
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left: list of watchlists */}
        <div className="space-y-3">
          {/* Create new */}
          <form onSubmit={(e) => { e.preventDefault(); if (newListName) createList.mutate(newListName) }}
                className="flex gap-2">
            <input value={newListName} onChange={(e) => setNewListName(e.target.value)}
                   placeholder="New watchlist name…" maxLength={60}
                   className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                   style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
            <button type="submit" className="btn-primary px-3"><Plus size={16} /></button>
          </form>

          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-12 rounded-lg" />)
            : lists.map((list) => (
                <button key={list._id} onClick={() => setSelectedList(list._id)}
                        className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm transition-colors ${
                          activeList?._id === list._id ? 'bg-blue-500/10 border border-blue-500/30 text-blue-400' : 'card-sm hover:border-blue-500/20'
                        }`}>
                  <div className="text-left">
                    <p className="font-medium">{list.name}</p>
                    <p className="text-xs muted">{list.items.length} items</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); deleteList.mutate(list._id) }}
                          className="p-1 rounded hover:bg-white/10 transition-colors"
                          style={{ color: 'var(--color-loss)' }}>
                    <Trash2 size={13} />
                  </button>
                </button>
              ))
          }
        </div>

        {/* Right: items in active list */}
        <div className="md:col-span-2">
          {activeList ? (
            <div className="card space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">{activeList.name}</h2>
                <form onSubmit={(e) => { e.preventDefault(); if (addSymbol) addItem.mutate({ listId: activeList._id, symbol: addSymbol }) }}
                      className="flex gap-2">
                  <input value={addSymbol} onChange={(e) => setAddSymbol(e.target.value.toUpperCase())}
                         placeholder="Add symbol…" maxLength={20}
                         className="px-3 py-1.5 rounded-lg text-xs outline-none w-32"
                         style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
                  <button type="submit" className="btn-primary text-xs px-3 py-1.5">Add</button>
                </form>
              </div>

              {activeList.items.length === 0 ? (
                <div className="text-center py-12">
                  <Search size={32} className="mx-auto mb-3 muted" />
                  <p className="text-sm muted">No items yet. Add a symbol above.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeList.items.map((item) => {
                    const liveData = indices[item.symbol]
                    const isGain = (liveData?.changePct ?? 0) >= 0
                    return (
                      <div key={item.symbol} className="flex items-center justify-between py-2.5 border-b last:border-0"
                           style={{ borderColor: 'var(--color-border)' }}>
                        <div>
                          <p className="text-sm font-semibold">{item.symbol}</p>
                          <p className="text-xs muted">{item.exchange}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          {liveData ? (
                            <div className="text-right">
                              <p className="text-sm font-semibold mono">{liveData.value?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                              <p className={`text-xs font-bold ${isGain ? 'gain' : 'loss'}`}>
                                {isGain ? '+' : ''}{liveData.changePct?.toFixed(2)}%
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs muted">No live data</p>
                          )}
                          <button onClick={() => removeItem.mutate({ listId: activeList._id, symbol: item.symbol })}
                                  className="p-1.5 rounded hover:bg-white/10" style={{ color: 'var(--color-loss)' }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="card text-center py-16">
              <Star size={32} className="mx-auto mb-3 muted" />
              <p className="text-sm muted">Create a watchlist to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
