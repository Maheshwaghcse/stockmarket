import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../lib/api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      subscription: null,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const { data } = await api.post('/auth/login', { email, password })
          api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`
          set({ user: data.user, accessToken: data.accessToken, subscription: data.subscription, isLoading: false })
          return { success: true }
        } catch (err) {
          set({ isLoading: false })
          return { success: false, message: err.response?.data?.message || 'Login failed' }
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true })
        try {
          const { data } = await api.post('/auth/register', { name, email, password })
          api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`
          set({ user: data.user, accessToken: data.accessToken, subscription: data.subscription, isLoading: false })
          return { success: true }
        } catch (err) {
          set({ isLoading: false })
          return { success: false, message: err.response?.data?.message || 'Registration failed' }
        }
      },

      logout: async () => {
        try { await api.post('/auth/logout') } catch { /* ignore */ }
        delete api.defaults.headers.common['Authorization']
        set({ user: null, accessToken: null, subscription: null })
      },

      refreshAuth: async () => {
        try {
          const { data } = await api.post('/auth/refresh')
          api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`
          set({ accessToken: data.accessToken })
          // Re-fetch profile
          const { data: me } = await api.get('/auth/me')
          set({ user: me.user, subscription: me.subscription })
          return true
        } catch {
          set({ user: null, accessToken: null, subscription: null })
          return false
        }
      },

      updateProfile: (user) => set({ user }),
      updateSubscription: (subscription) => set({ subscription }),

      isAuthenticated: () => !!get().user,
      isAdmin: () => get().user?.role === 'admin',
      hasPlan: (plan) => {
        const h = { free: 0, basic: 1, premium: 2 }
        const sub = get().subscription
        return (h[sub?.plan] ?? 0) >= (h[plan] ?? 0)
      },
    }),
    {
      name: 'stocksense-auth',
      partialize: (s) => ({ user: s.user, accessToken: s.accessToken, subscription: s.subscription }),
    }
  )
)
