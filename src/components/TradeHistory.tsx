import { Box, Table, Thead, Tbody, Tr, Th, Td, Text } from '@chakra-ui/react'
import { useMarketStore } from '../store/marketStore'

export default function TradeHistory() {
  const { trades, selectedMarket } = useMarketStore()

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg">
      <Text fontSize="lg" fontWeight="bold" mb={4}>Trade History - {selectedMarket}</Text>
      <Table size="sm">
        <Thead>
          <Tr>
            <Th>Time</Th>
            <Th>Price</Th>
            <Th>Amount</Th>
          </Tr>
        </Thead>
        <Tbody>
          {trades
            .sort((a, b) => b.timestamp - a.timestamp)
            .map(trade => (
              <Tr key={trade.id}>
                <Td>{new Date(trade.timestamp).toLocaleTimeString()}</Td>
                <Td>{trade.price.toString()}</Td>
                <Td>{trade.amount.toString()}</Td>
              </Tr>
            ))}
        </Tbody>
      </Table>
    </Box>
  )
}