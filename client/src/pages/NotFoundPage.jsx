import { Link } from 'react-router-dom'
import { TrendingUp, Home } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-96 text-center fade-in">
      <div className="text-8xl font-black muted mb-4">404</div>
      <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
      <p className="muted text-sm mb-8">The page you are looking for does not exist or has been moved.</p>
      <div className="flex gap-3">
        <Link to="/" className="btn-primary flex items-center gap-2">
          <Home size={16} /> Go Home
        </Link>
        <Link to="/indices" className="btn-ghost flex items-center gap-2">
          <TrendingUp size={16} /> View Indices
        </Link>
      </div>
    </div>
  )
}
