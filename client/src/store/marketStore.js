import { create } from 'zustand'

export const useMarketStore = create((set) => ({
  indices: {},
  marketStatus: 'CLOSED',
  isConnected: false,
  lastUpdate: null,

  setIndices: (indices) => set({ indices, lastUpdate: new Date().toISOString() }),
  updateIndex: (symbol, data) =>
    set((state) => ({
      indices: { ...state.indices, [symbol]: data },
      lastUpdate: new Date().toISOString(),
    })),
  setMarketStatus: (status) => set({ marketStatus: status }),
  setConnected: (connected) => set({ isConnected: connected }),
}))
