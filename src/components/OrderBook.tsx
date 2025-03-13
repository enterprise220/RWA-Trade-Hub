import { Box, Table, Thead, Tbody, Tr, Th, Td, Text } from '@chakra-ui/react'
import { useMarketStore } from '../store/marketStore'
import { useMemo } from 'react'

export default function OrderBook() {
  const { orders, selectedMarket } = useMarketStore()

  const { buyOrders, sellOrders } = useMemo(() => {
    const activeOrders = orders.filter(order => order.status === 'pending')
    return {
      buyOrders: activeOrders
        .filter(order => order.type === 'buy')
        .sort((a, b) => b.price.minus(a.price).toNumber()),
      sellOrders: activeOrders
        .filter(order => order.type === 'sell')
        .sort((a, b) => a.price.minus(b.price).toNumber())
    }
  }, [orders])

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" mb={4}>
      <Text fontSize="lg" fontWeight="bold" mb={4}>Order Book - {selectedMarket}</Text>
      <Table size="sm">
        <Thead>
          <Tr>
            <Th>Price</Th>
            <Th>Amount</Th>
            <Th>Total</Th>
          </Tr>
        </Thead>
        <Tbody>
          {sellOrders.map(order => (
            <Tr key={order.id}>
              <Td color="red.500">{order.price.toString()}</Td>
              <Td>{order.amount.toString()}</Td>
              <Td>{order.total.toString()}</Td>
            </Tr>
          ))}
          <Tr>
            <Td colSpan={3} textAlign="center" py={2}>
              <Text fontSize="sm" color="gray.500">Spread</Text>
            </Td>
          </Tr>
          {buyOrders.map(order => (
            <Tr key={order.id}>
              <Td color="green.500">{order.price.toString()}</Td>
              <Td>{order.amount.toString()}</Td>
              <Td>{order.total.toString()}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  )
}