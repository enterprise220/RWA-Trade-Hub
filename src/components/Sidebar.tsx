import { VStack, Box, Text, Button } from '@chakra-ui/react'
import { useMarketStore } from '../store/marketStore'

export default function Sidebar() {
  const { selectedMarket, setSelectedMarket } = useMarketStore()

  const markets = [
    'BTC/USD',
    'ETH/USD',
    'GOLD/USD',
    'SILVER/USD'
  ]

  const tokens = [
    'tokenizedGOLD',
    'tokenizedSILVER'
  ]

  return (
    <VStack spacing={4} align="stretch" p={4}>
      <Box>
        <Text fontWeight="bold" mb={2}>Markets</Text>
        <VStack align="stretch">
          {markets.map(market => (
            <Button
              key={market}
              variant={selectedMarket === market ? "solid" : "ghost"}
              colorScheme={selectedMarket === market ? "blue" : "gray"}
              justifyContent="left"
              onClick={() => setSelectedMarket(market)}
            >
              {market}
            </Button>
          ))}
        </VStack>
      </Box>
      <Box>
        <Text fontWeight="bold" mb={2}>RWA Tokens</Text>
        <VStack align="stretch">
          {tokens.map(token => (
            <Button
              key={token}
              variant="ghost"
              justifyContent="left"
              onClick={() => setSelectedMarket(token)}
            >
              {token}
            </Button>
          ))}
        </VStack>
      </Box>
    </VStack>
  )
}