import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import Decimal from 'decimal.js'

export interface Order {
  id: string
  type: 'buy' | 'sell'
  price: Decimal
  amount: Decimal
  total: Decimal
  timestamp: number
  status: 'pending' | 'filled' | 'cancelled'
  userAddress: string
}

export interface Trade {
  id: string
  price: Decimal
  amount: Decimal
  timestamp: number
  maker: string
  taker: string
}

interface MarketState {
  selectedMarket: string
  orders: Order[]
  trades: Trade[]
  setSelectedMarket: (market: string) => void
  addOrder: (order: Order) => void
  addTrade: (trade: Trade) => void
  cancelOrder: (orderId: string) => void
}

export const useMarketStore = create<MarketState>()(
  persist(
    (set, get) => ({
      selectedMarket: 'BTC/USD',
      orders: [],
      trades: [],

      setSelectedMarket: (market) => set({ selectedMarket: market }),

      addOrder: (order) => {
        set((state) => ({
          orders: [...state.orders, order]
        }))
      },

      addTrade: (trade) => {
        set((state) => ({
          trades: [...state.trades, trade]
        }))
      },

      cancelOrder: (orderId) => {
        set((state) => ({
          orders: state.orders.map(order =>
            order.id === orderId
              ? { ...order, status: 'cancelled' }
              : order
          )
        }))
      }
    }),
    {
      name: 'market-storage',
      partialize: (state) => ({
        selectedMarket: state.selectedMarket
      })
    }
  )
)