import { Box, VStack, HStack, Input, Button, Select, Text, Slider, SliderTrack, SliderFilledTrack, SliderThumb, useToast } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useContract } from '../hooks/useContract';
import { useWalletStore } from '../store/walletStore';
import { usePriceStore } from '../services/PriceService';
import { ethers } from 'ethers';

export default function MarginTrading() {
  const [positionType, setPositionType] = useState<'long' | 'short'>('long');
  const [size, setSize] = useState('');
  const [leverage, setLeverage] = useState(2);
  const [collateral, setCollateral] = useState('');
  const [estimatedLiquidationPrice, setEstimatedLiquidationPrice] = useState('0');
  
  const { contract } = useContract();
  const { isConnected, address } = useWalletStore();
  const prices = usePriceStore((state) => state.prices);
  const toast = useToast();

  useEffect(() => {
    calculateLiquidationPrice();
  }, [size, leverage, positionType, prices]);

  const calculateLiquidationPrice = () => {
    if (!size || !prices['BTCUSDT']) return;

    const currentPrice = prices['BTCUSDT'];
    const maintenanceMargin = 0.05; // 5%
    
    let liquidationPrice;
    if (positionType === 'long') {
      liquidationPrice = currentPrice * (1 - ((1 - maintenanceMargin) / leverage));
    } else {
      liquidationPrice = currentPrice * (1 + ((1 - maintenanceMargin) / leverage));
    }

    setEstimatedLiquidationPrice(liquidationPrice.toFixed(2));
  };

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
      const tx = await contract.openPosition(
        positionType === 'long',
        ethers.parseEther(size),
        leverage,
        ethers.parseEther(prices['BTCUSDT'].toString())
      );

      await tx.wait();

      toast({
        title: 'Position opened',
        description: `Transaction hash: ${tx.hash}`,
        status: 'success',
        duration: 5000,
      });

      setSize('');
      setCollateral('');
    } catch (error) {
      toast({
        title: 'Error opening position',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
      });
    }
  };

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg">
      <VStack spacing={4}>
        <Text fontSize="xl" fontWeight="bold">Margin Trading</Text>

        <Select
          value={positionType}
          onChange={(e) => setPositionType(e.target.value as 'long' | 'short')}
        >
          <option value="long">Long</option>
          <option value="short">Short</option>
        </Select>

        <Input
          placeholder="Position Size (BTC)"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          type="number"
        />

        <Box width="100%">
          <Text mb={2}>Leverage: {leverage}x</Text>
          <Slider
            value={leverage}
            min={1}
            max={10}
            step={1}
            onChange={(value) => setLeverage(value)}
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb />
          </Slider>
        </Box>

        <Input
          placeholder="Required Collateral (ETH)"
          value={collateral}
          onChange={(e) => setCollateral(e.target.value)}
          type="number"
        />

        <VStack spacing={2} align="stretch" width="100%">
          <HStack justify="space-between">
            <Text>Entry Price:</Text>
            <Text>${prices['BTCUSDT']?.toFixed(2) || '0'}</Text>
          </HStack>
          <HStack justify="space-between">
            <Text>Liquidation Price:</Text>
            <Text>${estimatedLiquidationPrice}</Text>
          </HStack>
        </VStack>

        <Button
          colorScheme={positionType === 'long' ? 'green' : 'red'}
          width="full"
          onClick={handleSubmit}
          isDisabled={!isConnected || !size || !collateral}
        >
          Open {positionType.toUpperCase()} Position
        </Button>
      </VStack>
    </Box>
  );
}