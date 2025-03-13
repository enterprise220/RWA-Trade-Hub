import { Box, Grid, GridItem, Button, Input, HStack, VStack, Text, useToast, Select } from '@chakra-ui/react'
import { useEffect, useRef, useState } from 'react'
import { createChart, IChartApi } from 'lightweight-charts'
import { useWalletStore } from '../store/walletStore'
import { useMarketStore } from '../store/marketStore'
import Decimal from 'decimal.js'

export default function TradingView() {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const [chart, setChart] = useState<IChartApi | null>(null)
  const [amount, setAmount] = useState('')
  const [price, setPrice] = useState('')
  const [orderType, setOrderType] = useState<'market' | 'limit'>('limit')
  const { isConnected, address } = useWalletStore()
  const { addOrder, selectedMarket } = useMarketStore()
  const toast = useToast()

  useEffect(() => {
    if (chartContainerRef.current) {
      const newChart = createChart(chartContainerRef.current, {
        width: 800,
        height: 400,
        layout: {
          background: { color: '#ffffff' },
          textColor: '#333',
        },
        grid: {
          vertLines: { color: '#f0f0f0' },
          horzLines: { color: '#f0f0f0' },
        },
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
        },
      })

      const candlestickSeries = newChart.addCandlestickSeries()
      // Add sample data - in a real app, this would come from your market data feed
      candlestickSeries.setData([
        { time: '2024-01-01', open: 40000, high: 41000, low: 39000, close: 40500 },
        { time: '2024-01-02', open: 40500, high: 42000, low: 40000, close: 41500 },
        { time: '2024-01-03', open: 41500, high: 43000, low: 41000, close: 42500 },
      ])

      setChart(newChart)

      return () => {
        newChart.remove()
      }
    }
  }, [])

  const handleTrade = async (type: 'buy' | 'sell') => {
    if (!isConnected || !address) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet to trade',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    try {
      const order = {
        id: Math.random().toString(36).substr(2, 9),
        type,
        price: new Decimal(price),
        amount: new Decimal(amount),
        total: new Decimal(price).mul(new Decimal(amount)),
        timestamp: Date.now(),
        status: 'pending' as const,
        userAddress: address
      }

      addOrder(order)

      toast({
        title: 'Order submitted',
        description: `${type.toUpperCase()} order for ${amount} ${selectedMarket} at ${price}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })

      setAmount('')
      setPrice('')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit order',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg">
      <Grid templateRows="1fr auto" gap={4}>
        <GridItem ref={chartContainerRef} />
        <GridItem>
          <VStack spacing={4} align="stretch">
            <Select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value as 'market' | 'limit')}
            >
              <option value="limit">Limit Order</option>
              <option value="market">Market Order</option>
            </Select>
            <HStack spacing={4}>
              <Input
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
              />
              {orderType === 'limit' && (
                <Input
                  placeholder="Price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  type="number"
                />
              )}
            </HStack>
            <HStack spacing={4}>
              <Button
                colorScheme="green"
                flex={1}
                onClick={() => handleTrade('buy')}
                isDisabled={!isConnected || !amount || (orderType === 'limit' && !price)}
              >
                Buy {selectedMarket}
              </Button>
              <Button
                colorScheme="red"
                flex={1}
                onClick={() => handleTrade('sell')}
                isDisabled={!isConnected || !amount || (orderType === 'limit' && !price)}
              >
                Sell {selectedMarket}
              </Button>
            </HStack>
          </VStack>
        </GridItem>
      </Grid>
    </Box>
  )
}