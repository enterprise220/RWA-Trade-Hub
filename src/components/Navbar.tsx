import { Box, Flex, Button, Text, useColorMode, Menu, MenuButton, MenuList, MenuItem } from '@chakra-ui/react'
import { FaMoon, FaSun, FaWallet } from 'react-icons/fa'
import { useWalletStore } from '../store/walletStore'

export default function Navbar() {
  const { colorMode, toggleColorMode } = useColorMode()
  const { isConnected, address, balance, connect, disconnect } = useWalletStore()

  return (
    <Box px={4} py={2} borderBottom="1px" borderColor="gray.200">
      <Flex alignItems="center" justifyContent="space-between">
        <Text fontSize="xl" fontWeight="bold">DeFi Commodities Exchange</Text>
        <Flex gap={4}>
          {isConnected ? (
            <Menu>
              <MenuButton as={Button} leftIcon={<FaWallet />}>
                {`${address?.slice(0, 6)}...${address?.slice(-4)}`}
              </MenuButton>
              <MenuList>
                <MenuItem>{`Balance: ${balance?.slice(0, 8)} ETH`}</MenuItem>
                <MenuItem onClick={disconnect}>Disconnect</MenuItem>
              </MenuList>
            </Menu>
          ) : (
            <Button onClick={connect} leftIcon={<FaWallet />}>
              Connect Wallet
            </Button>
          )}
          <Button onClick={toggleColorMode}>
            {colorMode === 'light' ? <FaMoon /> : <FaSun />}
          </Button>
        </Flex>
      </Flex>
    </Box>
  )
}