import axios from 'axios'

// Resolve API base URL:
// In production on Vercel: set VITE_API_URL to your Render backend (e.g. https://stocksense-backend.onrender.com)
// In local development: defaults to '/api' which Vite proxies to localhost:5000
const rawApiUrl = import.meta.env.VITE_API_URL
const baseURL = rawApiUrl ? `${rawApiUrl.replace(/\/+$/, '')}/api` : '/api'

const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 15000,
})

// Attach token from localStorage on every request
api.interceptors.request.use((config) => {
  try {
    const stored = JSON.parse(localStorage.getItem('stocksense-auth') || '{}')
    const token = stored?.state?.accessToken
    if (token) config.headers['Authorization'] = `Bearer ${token}`
  } catch {}
  return config
})

/**
 * Safely invalidate session when tokens expire or are rejected.
 * Resets local persistence, triggers store reset event, and redirects cleanly.
 */
let isRedirecting = false
export const clearAuthSession = (options = { redirect: true }) => {
  try {
    localStorage.removeItem('stocksense-auth')
  } catch {}
  delete api.defaults.headers.common['Authorization']

  if (typeof window !== 'undefined') {
    // Notify Zustand store and components
    window.dispatchEvent(new CustomEvent('stocksense:auth-expired', { detail: options }))

    if (options.redirect && !isRedirecting) {
      const currentPath = window.location.pathname
      if (currentPath !== '/login' && currentPath !== '/register') {
        isRedirecting = true
        // Redirect cleanly to login with expired query param
        window.location.href = `/login?expired=true&redirect=${encodeURIComponent(currentPath + window.location.search)}`
      }
    }
  }
}

// Auto-refresh on 401
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)))
  failedQueue = []
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config
    if (!original) return Promise.reject(err)

    const url = original.url || ''
    const isAuthRoute =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/refresh') ||
      url.includes('/auth/logout')

    const status = err.response?.status

    // 401 Unauthorized handling
    if (status === 401 && !original._retry && !isAuthRoute) {
      // Check if we have stored auth credentials
      let refreshToken = null
      try {
        const stored = JSON.parse(localStorage.getItem('stocksense-auth') || '{}')
        refreshToken = stored?.state?.refreshToken
      } catch {}

      // If no refreshToken exists at all, this session cannot be refreshed
      if (!refreshToken) {
        clearAuthSession({ redirect: false })
        return Promise.reject(err)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => failedQueue.push({ resolve, reject }))
          .then((token) => {
            original.headers['Authorization'] = `Bearer ${token}`
            return api(original)
          })
          .catch((e) => Promise.reject(e))
      }

      original._retry = true
      isRefreshing = true

      try {
        // Use bare axios call to avoid recursion in response interceptor
        const { data } = await axios.post(
          `${baseURL}/auth/refresh`,
          { refreshToken },
          { withCredentials: true, timeout: 12000 }
        )

        const newToken = data.accessToken
        const newRefreshToken = data.refreshToken || refreshToken

        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`

        try {
          const raw = localStorage.getItem('stocksense-auth')
          if (raw) {
            const parsed = JSON.parse(raw)
            if (parsed && parsed.state) {
              parsed.state.accessToken = newToken
              if (newRefreshToken) parsed.state.refreshToken = newRefreshToken
              localStorage.setItem('stocksense-auth', JSON.stringify(parsed))
            }
          }
        } catch {}

        processQueue(null, newToken)
        original.headers['Authorization'] = `Bearer ${newToken}`
        return api(original)
      } catch (refreshErr) {
        processQueue(refreshErr, null)
        // Refresh token failed (expired or invalid) -> session is officially dead
        clearAuthSession({ redirect: true })
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    // If /auth/refresh itself returned 401, invalidate session
    if (status === 401 && url.includes('/auth/refresh')) {
      clearAuthSession({ redirect: true })
    }

    return Promise.reject(err)
  }
)

export default api
