import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { useMarketStore } from '../store/marketStore'
import api from '../lib/api'

let socket = null

export function useSocket() {
  const { setIndices, updateIndex, setMarketStatus, setConnected } = useMarketStore()
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true

    // Immediate initial data fetch
    api.get('/market/indices')
      .then(({ data }) => {
        if (!mountedRef.current || !data?.data) return
        const map = {}
        data.data.forEach((idx) => { map[idx.symbol] = idx })
        setIndices(map)
        if (data.data[0]?.marketStatus) setMarketStatus(data.data[0].marketStatus)
      })
      .catch((err) => console.warn('Initial indices fetch warning:', err))

    if (!socket) {
      const rawSocketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL
      const socketUrl = rawSocketUrl ? rawSocketUrl.replace(/\/+$/, '') : '/'

      socket = io(socketUrl, {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 15,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
      })
    }

    socket.on('connect', () => {
      if (!mountedRef.current) return
      setConnected(true)
      // Subscribe to all indices
      socket.emit('subscribe:indices', [
        'NIFTY50','SENSEX','BANKNIFTY','FINNIFTY','NIFTYNEXT50',
        'NIFTYIT','NIFTYPHARMA','NIFTYAUTO','NIFTYMIDCAP','NIFTYSMALL',
      ])
    })

    socket.on('disconnect', () => {
      if (mountedRef.current) setConnected(false)
    })

    socket.on('market:tick', (allIndices) => {
      if (!mountedRef.current) return
      setIndices(allIndices)
      // Infer market status from first index
      const first = Object.values(allIndices)[0]
      if (first?.marketStatus) setMarketStatus(first.marketStatus)
    })

    socket.on('index:update', (quote) => {
      if (mountedRef.current) updateIndex(quote.symbol, quote)
    })

    return () => {
      mountedRef.current = false
    }
  }, [])

  return socket
}
