import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Clock, Eye } from 'lucide-react'
import { format } from 'date-fns'
import api from '../lib/api'

export default function ArticlePage() {
  const { slug } = useParams()
  const { data, isLoading, error } = useQuery({
    queryKey: ['article', slug],
    queryFn: () => api.get(`/news/${slug}`).then(r => r.data),
  })

  const article = data?.data

  return (
    <div className="max-w-3xl mx-auto fade-in">
      <Link to="/news" className="flex items-center gap-1 text-sm muted hover:text-slate-200 mb-6 transition-colors">
        <ArrowLeft size={14} /> Back to News
      </Link>

      {isLoading && (
        <div className="space-y-4">
          <div className="skeleton h-8 rounded w-3/4" />
          <div className="skeleton h-4 rounded w-1/2" />
          <div className="skeleton h-96 rounded-xl" />
        </div>
      )}

      {error && <p className="text-sm" style={{ color: 'var(--color-loss)' }}>Article not found.</p>}

      {article && (
        <article>
          <div className="mb-6">
            <span className="text-xs font-bold uppercase tracking-wider capitalize px-2 py-0.5 rounded"
                  style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>{article.category}</span>
            <h1 className="text-3xl font-bold mt-3 mb-2 leading-tight">{article.title}</h1>
            <p className="text-base muted">{article.summary}</p>

            <div className="flex flex-wrap items-center gap-4 mt-4 text-xs muted">
              <span>By <strong className="text-slate-300">{article.author?.name}</strong></span>
              {article.publishedAt && (
                <span className="flex items-center gap-1">
                  <Clock size={11} /> {format(new Date(article.publishedAt), 'PPP')}
                </span>
              )}
              <span className="flex items-center gap-1"><Eye size={11} /> {article.views} views</span>
              <span>~{article.readingTimeMinutes} min read</span>
            </div>
          </div>

          <div className="card prose prose-invert prose-sm max-w-none"
               style={{ lineHeight: 1.8, color: 'var(--color-text)' }}>
            {article.content.split('\n').map((p, i) => p ? <p key={i}>{p}</p> : <br key={i} />)}
          </div>

          {article.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {article.tags.map((tag) => (
                <span key={tag} className="text-xs px-2 py-1 rounded capitalize"
                      style={{ background: 'var(--color-surface2)', color: 'var(--color-muted)' }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {article.source && (
            <p className="text-xs muted mt-4">
              Source: {article.sourceUrl ? (
                <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                  {article.source}
                </a>
              ) : article.source}
            </p>
          )}
        </article>
      )}
    </div>
  )
}
