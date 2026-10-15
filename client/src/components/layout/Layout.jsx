import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import MarketTicker from '../market/MarketTicker'
import { useSocket } from '../../hooks/useSocket'

export default function Layout() {
  useSocket() // initialize WebSocket connection app-wide

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg)' }}>
      <Navbar />
      <MarketTicker />
      <main className="flex-1 max-w-screen-2xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
