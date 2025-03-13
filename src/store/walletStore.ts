import { create } from 'zustand'
import { ethers } from 'ethers'
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js'
import { persist } from 'zustand/middleware'

interface WalletState {
  isConnected: boolean
  address: string | null
  chainId: number | null
  balance: string | null
  network: 'ethereum' | 'solana' | null
  solanaConnection: Connection | null
  connect: (network: 'ethereum' | 'solana') => Promise<void>
  disconnect: () => void
  updateBalance: () => Promise<void>
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      isConnected: false,
      address: null,
      chainId: null,
      balance: null,
      network: null,
      solanaConnection: null,

      connect: async (network) => {
        if (network === 'ethereum' && window.ethereum) {
          try {
            const provider = new ethers.BrowserProvider(window.ethereum)
            const signer = await provider.getSigner()
            const address = await signer.getAddress()
            const networkData = await provider.getNetwork()
            const balance = await provider.getBalance(address)

            set({
              isConnected: true,
              address,
              chainId: Number(networkData.chainId),
              balance: ethers.formatEther(balance),
              network: 'ethereum'
            })
          } catch (error) {
            console.error('Error connecting to Ethereum:', error)
          }
        } else if (network === 'solana') {
          try {
            const connection = new Connection(clusterApiUrl('devnet'))
            // In a real app, you would handle Solana wallet connection here
            // For now, we'll just set up the connection
            set({
              isConnected: true,
              network: 'solana',
              solanaConnection: connection
            })
          } catch (error) {
            console.error('Error connecting to Solana:', error)
          }
        }
      },

      disconnect: () => {
        set({
          isConnected: false,
          address: null,
          chainId: null,
          balance: null,
          network: null,
          solanaConnection: null
        })
      },

      updateBalance: async () => {
        const { address, network } = get()
        if (!address || !network) return

        if (network === 'ethereum' && window.ethereum) {
          const provider = new ethers.BrowserProvider(window.ethereum)
          const balance = await provider.getBalance(address)
          set({ balance: ethers.formatEther(balance) })
        }
        // Add Solana balance check when implementing Solana wallet
      }
    }),
    {
      name: 'wallet-storage',
      partialize: (state) => ({
        isConnected: state.isConnected,
        address: state.address,
        network: state.network
      })
    }
  )
)