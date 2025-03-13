import { ethers } from 'ethers';
import { useCallback, useEffect, useState } from 'react';
import ExchangeABI from '../contracts/Exchange.json';
import { useWalletStore } from '../store/walletStore';

const EXCHANGE_ADDRESS = '0x...'; // Replace with deployed contract address

export function useContract() {
  const { address, network } = useWalletStore();
  const [contract, setContract] = useState<ethers.Contract | null>(null);

  useEffect(() => {
    if (!window.ethereum || !address || network !== 'ethereum') return;

    const provider = new ethers.BrowserProvider(window.ethereum);
    provider.getSigner().then(signer => {
      const exchangeContract = new ethers.Contract(
        EXCHANGE_ADDRESS,
        ExchangeABI,
        signer
      );
      setContract(exchangeContract);
    });
  }, [address, network]);

  const createOrder = useCallback(async (
    isBuyOrder: boolean,
    amount: string,
    price: string,
    token: string
  ) => {
    if (!contract) throw new Error('Contract not initialized');

    try {
      const tx = await contract.createOrder(
        isBuyOrder,
        ethers.parseEther(amount),
        ethers.parseEther(price),
        token
      );
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }, [contract]);

  const cancelOrder = useCallback(async (orderId: string) => {
    if (!contract) throw new Error('Contract not initialized');

    try {
      const tx = await contract.cancelOrder(orderId);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
  }, [contract]);

  const deposit = useCallback(async (amount: string) => {
    if (!contract) throw new Error('Contract not initialized');

    try {
      const tx = await contract.deposit({
        value: ethers.parseEther(amount)
      });
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error depositing:', error);
      throw error;
    }
  }, [contract]);

  const withdraw = useCallback(async (amount: string) => {
    if (!contract) throw new Error('Contract not initialized');

    try {
      const tx = await contract.withdraw(ethers.parseEther(amount));
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error withdrawing:', error);
      throw error;
    }
  }, [contract]);

  return {
    contract,
    createOrder,
    cancelOrder,
    deposit,
    withdraw,
  };
}