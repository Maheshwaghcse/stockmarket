import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Search, BookOpen } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import api from '../lib/api'

const CATEGORIES = ['all', 'news', 'analysis', 'education', 'guide', 'glossary']

export default function NewsPage() {
  const [category, setCategory] = useState('all')
  const [q, setQ] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['news', category, q],
    queryFn: () => api.get(`/news?${category !== 'all' ? `category=${category}&` : ''}${q ? `q=${q}` : ''}`).then(r => r.data),
    staleTime: 60_000,
  })

  const articles = data?.data || []

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><BookOpen size={24} /> News & Analysis</h1>
        <p className="text-sm muted mt-1">Market news, educational articles, and guides</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search articles…"
                 className="w-full pl-9 pr-4 py-2 rounded-lg text-sm outline-none"
                 style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCategory(c)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                      category === c ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'btn-ghost'
                    }`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-48 rounded-xl" />)}
        </div>
      ) : articles.length === 0 ? (
        <div className="card text-center py-16">
          <BookOpen size={32} className="mx-auto mb-3 muted" />
          <p className="font-semibold">No articles found</p>
          <p className="text-sm muted mt-1">Check back later or try a different category.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.map((a) => (
            <Link key={a._id} to={`/news/${a.slug}`}
                  className="card hover:border-blue-500/30 transition-all hover:-translate-y-0.5 block group">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider capitalize px-2 py-0.5 rounded"
                      style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>{a.category}</span>
                {a.isFeatured && <span className="text-xs px-2 py-0.5 rounded font-bold"
                                        style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>Featured</span>}
              </div>
              <h2 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-blue-400 transition-colors">{a.title}</h2>
              <p className="text-xs muted mt-2 line-clamp-2">{a.summary}</p>
              <div className="flex items-center justify-between mt-3 text-xs muted">
                <span>{a.author?.name}</span>
                <span>{a.publishedAt ? formatDistanceToNow(new Date(a.publishedAt), { addSuffix: true }) : ''}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
