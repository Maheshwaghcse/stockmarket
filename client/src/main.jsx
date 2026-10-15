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

createRoot(document.getElementById('root')).render(
  <StrictMode>
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
  </StrictMode>,
)
