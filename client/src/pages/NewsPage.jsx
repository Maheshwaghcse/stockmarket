import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Search, BookOpen, RefreshCw, ExternalLink, Globe, Clock, Sparkles } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import api from '../lib/api'
import toast from 'react-hot-toast'

const CATEGORIES = ['all', 'news', 'analysis', 'education', 'guide', 'glossary']

export default function NewsPage() {
  const [category, setCategory] = useState('all')
  const [q, setQ] = useState('')
  const [syncing, setSyncing] = useState(false)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['news', category, q],
    queryFn: () => api.get(`/news?${category !== 'all' ? `category=${category}&` : ''}${q ? `q=${q}` : ''}`).then(r => r.data),
    staleTime: 60_000,
  })

  const articles = data?.data || []

  const handleSyncNews = async () => {
    setSyncing(true)
    const toastId = toast.loading('Fetching latest live finance headlines from NewsAPI...')
    try {
      const res = await api.post('/news/sync')
      toast.success(`Synced ${res.data.count || 0} fresh finance articles!`, { id: toastId })
      queryClient.invalidateQueries({ queryKey: ['news'] })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to sync news', { id: toastId })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="space-y-6 fade-in max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-2.5 text-white">
            <BookOpen size={28} className="text-blue-400" /> Market News & Analysis
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time financial headlines, macroeconomic updates, and educational guides powered by NewsAPI.
          </p>
        </div>

        {/* Sync NewsAPI Button */}
        <button
          onClick={handleSyncNews}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all disabled:opacity-50 shadow-sm w-fit"
        >
          <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
          <span>{syncing ? 'Syncing NewsAPI...' : 'Sync Finance News'}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search financial headlines, tickers, RBI, stocks…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs sm:text-sm outline-none bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 focus:border-blue-500 transition-colors"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                category === c
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="card text-center py-16 bg-slate-900/60 border border-slate-800 rounded-2xl">
          <BookOpen size={36} className="mx-auto mb-3 text-slate-600" />
          <p className="font-bold text-base text-slate-200">No articles found</p>
          <p className="text-xs text-slate-400 mt-1 mb-4">Click below to fetch the latest finance news from NewsAPI.</p>
          <button
            onClick={handleSyncNews}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 transition-all inline-flex items-center gap-1.5"
          >
            <RefreshCw size={13} />
            <span>Fetch News Now</span>
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {articles.map((a) => (
            <div
              key={a._id}
              className="bg-slate-900/80 border border-slate-800/90 hover:border-blue-500/40 rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/5 flex flex-col justify-between group"
            >
              <div>
                {/* Optional Cover Image */}
                {a.coverImage ? (
                  <div className="relative h-44 w-full overflow-hidden bg-slate-950">
                    <img
                      src={a.coverImage}
                      alt={a.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.style.display = 'none'
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />
                    {a.source && (
                      <span className="absolute bottom-2.5 left-3 text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-900/90 text-blue-400 border border-slate-700/60 backdrop-blur-sm">
                        {a.source}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="h-16 bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 border-b border-slate-800/60 p-3 flex items-center justify-between">
                    {a.source ? (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {a.source}
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        {a.category}
                      </span>
                    )}
                    {a.isFeatured && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                        <Sparkles size={10} /> Featured
                      </span>
                    )}
                  </div>
                )}

                {/* Content body */}
                <div className="p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {a.category}
                    </span>
                    {a.isFeatured && a.coverImage && (
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Featured
                      </span>
                    )}
                  </div>

                  <Link to={`/news/${a.slug}`}>
                    <h2 className="font-bold text-sm leading-snug line-clamp-2 text-slate-100 group-hover:text-blue-400 transition-colors">
                      {a.title}
                    </h2>
                  </Link>

                  <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                    {a.summary}
                  </p>
                </div>
              </div>

              {/* Footer row with reading link & timestamp */}
              <div className="px-4 pb-4 pt-2 border-t border-slate-800/70 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  {a.publishedAt ? formatDistanceToNow(new Date(a.publishedAt), { addSuffix: true }) : 'Just now'}
                </span>

                <div className="flex items-center gap-3">
                  {a.sourceUrl && (
                    <a
                      href={a.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Read original source"
                      className="text-slate-400 hover:text-blue-400 flex items-center gap-1 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Globe size={11} />
                      <ExternalLink size={10} />
                    </a>
                  )}
                  <Link
                    to={`/news/${a.slug}`}
                    className="text-blue-400 hover:text-blue-300 font-semibold"
                  >
                    Read &rarr;
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
