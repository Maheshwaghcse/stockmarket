import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'

// Lazy-loaded pages to lighten initial bundle and prevent memory/resource exhaustion
const IndicesPage = lazy(() => import('./pages/IndicesPage'))
const IndexDetailPage = lazy(() => import('./pages/IndexDetailPage'))
const StocksPage = lazy(() => import('./pages/StocksPage'))
const StockDetailPage = lazy(() => import('./pages/StockDetailPage'))
const NewsPage = lazy(() => import('./pages/NewsPage'))
const ArticlePage = lazy(() => import('./pages/ArticlePage'))
const EducationPage = lazy(() => import('./pages/EducationPage'))
const WatchlistPage = lazy(() => import('./pages/WatchlistPage'))
const PricingPage = lazy(() => import('./pages/PricingPage'))
const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'))
const TradingJournalPage = lazy(() => import('./pages/TradingJournalPage'))
const CalculatorPage = lazy(() => import('./pages/CalculatorPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const AdminPage = lazy(() => import('./pages/admin/AdminPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

import ProtectedRoute from './components/auth/ProtectedRoute'
import AdminRoute from './components/auth/AdminRoute'

function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-[50vh] text-slate-400">
      <div className="flex flex-col items-center gap-3">
        <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono">Loading…</span>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        {/* Auth pages (no nav) */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Main layout */}
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="indices" element={<IndicesPage />} />
          <Route path="indices/:symbol" element={<IndexDetailPage />} />
          <Route path="stocks" element={<StocksPage />} />
          <Route path="stocks/:symbol" element={<StockDetailPage />} />
          <Route path="news" element={<NewsPage />} />
          <Route path="news/:slug" element={<ArticlePage />} />
          <Route path="education" element={<EducationPage />} />
          <Route path="pricing" element={<PricingPage />} />
          <Route path="journal" element={<TradingJournalPage />} />
          <Route path="calculator" element={<CalculatorPage />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="watchlist" element={<WatchlistPage />} />
            <Route path="profile"   element={<ProfilePage />} />
          </Route>

          {/* Admin */}
          <Route element={<AdminRoute />}>
            <Route path="admin/*" element={<AdminPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

