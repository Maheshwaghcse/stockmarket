import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import IndicesPage from './pages/IndicesPage'
import IndexDetailPage from './pages/IndexDetailPage'
import StocksPage from './pages/StocksPage'
import StockDetailPage from './pages/StockDetailPage'
import NewsPage from './pages/NewsPage'
import ArticlePage from './pages/ArticlePage'
import EducationPage from './pages/EducationPage'
import WatchlistPage from './pages/WatchlistPage'
import PricingPage from './pages/PricingPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import TradingJournalPage from './pages/TradingJournalPage'
import CalculatorPage from './pages/CalculatorPage'
import ProfilePage from './pages/ProfilePage'
import AdminPage from './pages/admin/AdminPage'
import NotFoundPage from './pages/NotFoundPage'
import ProtectedRoute from './components/auth/ProtectedRoute'
import AdminRoute from './components/auth/AdminRoute'

export default function App() {
  return (
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
  )
}
