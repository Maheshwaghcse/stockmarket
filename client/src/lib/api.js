import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 10000,
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
    if (err.response?.status === 401 && err.response?.data?.code === 'TOKEN_EXPIRED' && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => failedQueue.push({ resolve, reject }))
          .then((token) => { original.headers['Authorization'] = `Bearer ${token}`; return api(original) })
          .catch((e) => Promise.reject(e))
      }

      original._retry = true
      isRefreshing = true

      try {
        const { data } = await api.post('/auth/refresh')
        const newToken = data.accessToken
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
        try {
          const raw = localStorage.getItem('stocksense-auth')
          if (raw) {
            const parsed = JSON.parse(raw)
            if (parsed && parsed.state) {
              parsed.state.accessToken = newToken
              localStorage.setItem('stocksense-auth', JSON.stringify(parsed))
            }
          }
        } catch {}
        processQueue(null, newToken)
        original.headers['Authorization'] = `Bearer ${newToken}`
        return api(original)
      } catch (refreshErr) {
        processQueue(refreshErr, null)
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(err)
  }
)

export default api
