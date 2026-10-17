import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

import React, { Component } from 'react'

class GlobalErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, errorInfo) {
    console.error('CRITICAL APP RENDER ERROR:', error, errorInfo)
    this.setState({ errorInfo })
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '32px', background: '#090d16', color: '#f87171', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h2 style={{ fontSize: '20px', color: '#ef4444', marginBottom: '16px' }}>⚠️ React Render Error Caught:</h2>
          <div style={{ background: '#1e293b', padding: '16px', borderRadius: '8px', color: '#fca5a5', marginBottom: '16px' }}>
            <strong>{this.state.error?.toString()}</strong>
          </div>
          <pre style={{ fontSize: '11px', whiteSpace: 'pre-wrap', color: '#94a3b8' }}>
            {this.state.error?.stack}
          </pre>
          <pre style={{ fontSize: '11px', whiteSpace: 'pre-wrap', color: '#64748b', marginTop: '16px' }}>
            {this.state.errorInfo?.componentStack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: '20px', padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            Reload Page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1e293b',
                color: '#f1f5f9',
                border: '1px solid #334155',
                borderRadius: '0.5rem',
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.875rem',
              },
              success: { iconTheme: { primary: '#22c55e', secondary: '#1e293b' } },
              error:   { iconTheme: { primary: '#ef4444', secondary: '#1e293b' } },
            }}
          />
        </QueryClientProvider>
      </BrowserRouter>
    </GlobalErrorBoundary>
  </StrictMode>,
)

