import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { useMarketStore } from '../store/marketStore'

let socket = null

export function useSocket() {
  const { setIndices, updateIndex, setMarketStatus, setConnected } = useMarketStore()
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true

    if (!socket) {
      socket = io('/', {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 10,
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
