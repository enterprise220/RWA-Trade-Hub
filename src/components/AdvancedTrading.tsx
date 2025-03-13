import { Box, VStack, HStack, Input, Button, Select, Text, useToast } from '@chakra-ui/react';
import { useState } from 'react';
import { useContract } from '../hooks/useContract';
import { useWalletStore } from '../store/walletStore';
import { usePriceStore } from '../services/PriceService';

export default function AdvancedTrading() {
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop'>('limit');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [stopPrice, setStopPrice] = useState('');
  
  const { createOrder } = useContract();
  const { isConnected, address } = useWalletStore();
  const prices = usePriceStore((state) => state.prices);
  const toast = useToast();

  const handleSubmit = async () => {
    if (!isConnected || !address) {
      toast({
        title: 'Wallet not connected',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      let orderPrice = price;
      if (orderType === 'market') {
        orderPrice = prices['BTCUSDT'].toString();
      }

      const hash = await createOrder(
        side === 'buy',
        amount,
        orderPrice,
        '0x...' // Token address
      );

      toast({
        title: 'Order created',
        description: `Transaction hash: ${hash}`,
        status: 'success',
        duration: 5000,
      });
    } catch (error) {
      toast({
        title: 'Error creating order',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
      });
    }
  };

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg">
      <VStack spacing={4}>
        <Select value={orderType} onChange={(e) => setOrderType(e.target.value as any)}>
          <option value="market">Market</option>
          <option value="limit">Limit</option>
          <option value="stop">Stop</option>
        </Select>

        <Select value={side} onChange={(e) => setSide(e.target.value as 'buy' | 'sell')}>
          <option value="buy">Buy</option>
          <option value="sell">Sell</option>
        </Select>

        <Input
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          type="number"
        />

        {orderType !== 'market' && (
          <Input
            placeholder="Price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            type="number"
          />
        )}

        {orderType === 'stop' && (
          <Input
            placeholder="Stop Price"
            value={stopPrice}
            onChange={(e) => setStopPrice(e.target.value)}
            type="number"
          />
        )}

        <Button
          colorScheme={side === 'buy' ? 'green' : 'red'}
          width="full"
          onClick={handleSubmit}
          isDisabled={!isConnected || !amount || (orderType !== 'market' && !price)}
        >
          {side === 'buy' ? 'Buy' : 'Sell'}
        </Button>
      </VStack>
    </Box>
  );
}