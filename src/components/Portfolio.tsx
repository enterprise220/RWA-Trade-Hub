import { Box, VStack, HStack, Text, Table, Thead, Tbody, Tr, Th, Td, Button, useToast } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useContract } from '../hooks/useContract';
import { useWalletStore } from '../store/walletStore';
import { usePriceStore } from '../services/PriceService';
import { ethers } from 'ethers';

interface Position {
  id: string;
  type: 'spot' | 'margin';
  asset: string;
  amount: string;
  entryPrice: string;
  currentPrice: string;
  pnl: string;
  leverage?: string;
  liquidationPrice?: string;
}

export default function Portfolio() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [totalValue, setTotalValue] = useState('0');
  const { contract } = useContract();
  const { address } = useWalletStore();
  const prices = usePriceStore((state) => state.prices);
  const toast = useToast();

  useEffect(() => {
    if (address && contract) {
      fetchPositions();
    }
  }, [address, contract, prices]);

  const fetchPositions = async () => {
    try {
      // Fetch both spot and margin positions
      const spotPositions = await contract.getPositions(address);
      const marginPositions = await contract.getMarginPositions(address);

      const formattedPositions = [
        ...spotPositions.map((pos: any) => ({
          id: pos.id,
          type: 'spot',
          asset: pos.asset,
          amount: ethers.formatEther(pos.amount),
          entryPrice: ethers.formatEther(pos.entryPrice),
          currentPrice: prices[pos.asset]?.toString() || '0',
          pnl: calculatePnL(pos.amount, pos.entryPrice, prices[pos.asset] || 0)
        })),
        ...marginPositions.map((pos: any) => ({
          id: pos.id,
          type: 'margin',
          asset: pos.asset,
          amount: ethers.formatEther(pos.size),
          entryPrice: ethers.formatEther(pos.entryPrice),
          currentPrice: prices[pos.asset]?.toString() || '0',
          pnl: calculatePnL(pos.size, pos.entryPrice, prices[pos.asset] || 0),
          leverage: pos.leverage.toString(),
          liquidationPrice: ethers.formatEther(pos.liquidationPrice)
        }))
      ];

      setPositions(formattedPositions);
      calculateTotalValue(formattedPositions);
    } catch (error) {
      console.error('Error fetching positions:', error);
    }
  };

  const calculatePnL = (amount: string, entryPrice: string, currentPrice: number): string => {
    const amountNum = parseFloat(amount);
    const entryPriceNum = parseFloat(entryPrice);
    const pnl = amountNum * (currentPrice - entryPriceNum);
    return pnl.toFixed(2);
  };

  const calculateTotalValue = (positions: Position[]) => {
    const total = positions.reduce((acc, pos) => {
      const positionValue = parseFloat(pos.amount) * parseFloat(pos.currentPrice);
      return acc + positionValue;
    }, 0);
    setTotalValue(total.toFixed(2));
  };

  const closePosition = async (position: Position) => {
    try {
      const tx = position.type === 'spot' 
        ? await contract.closeSpotPosition(position.id)
        : await contract.closeMarginPosition(position.id);
      
      await tx.wait();
      
      toast({
        title: 'Position closed',
        status: 'success',
        duration: 3000,
      });
      
      fetchPositions();
    } catch (error) {
      toast({
        title: 'Error closing position',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
      });
    }
  };

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg">
      <VStack spacing={4} align="stretch">
        <HStack justify="space-between">
          <Text fontSize="xl" fontWeight="bold">Portfolio Overview</Text>
          <Text fontSize="xl">Total Value: ${totalValue}</Text>
        </HStack>

        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Type</Th>
              <Th>Asset</Th>
              <Th>Amount</Th>
              <Th>Entry Price</Th>
              <Th>Current Price</Th>
              <Th>PnL</Th>
              <Th>Leverage</Th>
              <Th>Liquidation Price</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {positions.map((position) => (
              <Tr key={position.id}>
                <Td>{position.type}</Td>
                <Td>{position.asset}</Td>
                <Td>{position.amount}</Td>
                <Td>${position.entryPrice}</Td>
                <Td>${position.currentPrice}</Td>
                <Td color={parseFloat(position.pnl) >= 0 ? 'green.500' : 'red.500'}>
                  ${position.pnl}
                </Td>
                <Td>{position.leverage || '-'}</Td>
                <Td>{position.liquidationPrice || '-'}</Td>
                <Td>
                  <Button
                    size="sm"
                    colorScheme="red"
                    onClick={() => closePosition(position)}
                  >
                    Close
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </VStack>
    </Box>
  );
}