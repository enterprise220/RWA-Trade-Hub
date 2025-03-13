import WebSocket from 'ws';
import ccxt from 'ccxt';
import { create } from 'zustand';

interface PriceState {
  prices: { [key: string]: number };
  setPrices: (prices: { [key: string]: number }) => void;
}

export const usePriceStore = create<PriceState>((set) => ({
  prices: {},
  setPrices: (prices) => set({ prices }),
}));

export class PriceService {
  private static instance: PriceService;
  private ws: WebSocket | null = null;
  private exchange: ccxt.Exchange;

  private constructor() {
    this.exchange = new ccxt.binance();
    this.initializeWebSocket();
  }

  public static getInstance(): PriceService {
    if (!PriceService.instance) {
      PriceService.instance = new PriceService();
    }
    return PriceService.instance;
  }

  private initializeWebSocket() {
    const wsUrl = 'wss://stream.binance.com:9443/ws';
    this.ws = new WebSocket(wsUrl);

    this.ws.on('open', () => {
      console.log('WebSocket connected');
      this.subscribe();
    });

    this.ws.on('message', (data: string) => {
      const message = JSON.parse(data);
      if (message.e === 'trade') {
        usePriceStore.getState().setPrices({
          ...usePriceStore.getState().prices,
          [message.s]: parseFloat(message.p),
        });
      }
    });

    this.ws.on('close', () => {
      console.log('WebSocket disconnected');
      setTimeout(() => this.initializeWebSocket(), 5000);
    });
  }

  private subscribe() {
    if (!this.ws) return;

    const symbols = ['btcusdt', 'ethusdt'];
    const subscriptions = symbols.map(symbol => ({
      method: 'SUBSCRIBE',
      params: [`${symbol}@trade`],
      id: Math.floor(Math.random() * 1000),
    }));

    subscriptions.forEach(sub => {
      this.ws?.send(JSON.stringify(sub));
    });
  }

  public async fetchHistoricalData(symbol: string, timeframe: string = '1d', limit: number = 100) {
    try {
      const ohlcv = await this.exchange.fetchOHLCV(symbol, timeframe, undefined, limit);
      return ohlcv.map(([timestamp, open, high, low, close]) => ({
        time: timestamp / 1000,
        open,
        high,
        low,
        close,
      }));
    } catch (error) {
      console.error('Error fetching historical data:', error);
      return [];
    }
  }
}