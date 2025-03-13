import { ChakraProvider, Box, Grid, Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import TradingView from './components/TradingView'
import OrderBook from './components/OrderBook'
import TradeHistory from './components/TradeHistory'
import AdvancedTrading from './components/AdvancedTrading'
import MarginTrading from './components/MarginTrading'
import Portfolio from './components/Portfolio'

function App() {
  return (
    <ChakraProvider>
      <Router>
        <Box minH="100vh">
          <Navbar />
          <Grid
            templateColumns="250px 1fr 300px"
            gap={4}
            p={4}
          >
            <Sidebar />
            <Box>
              <Tabs>
                <TabList>
                  <Tab>Spot Trading</Tab>
                  <Tab>Margin Trading</Tab>
                  <Tab>Portfolio</Tab>
                </TabList>
                <TabPanels>
                  <TabPanel>
                    <TradingView />
                    <AdvancedTrading />
                  </TabPanel>
                  <TabPanel>
                    <MarginTrading />
                  </TabPanel>
                  <TabPanel>
                    <Portfolio />
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </Box>
            <Box>
              <OrderBook />
              <TradeHistory />
            </Box>
          </Grid>
        </Box>
      </Router>
    </ChakraProvider>
  )
}

export default App