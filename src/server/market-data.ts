/**
 * Market Data Abstraction & Real-Time Price Simulation Engine
 */

import { MarketQuote, CandlestickBar } from './types.ts';
import { eventBus } from './event-bus.ts';

export interface MarketDataProvider {
  getQuote(symbol: string): MarketQuote | undefined;
  getAllQuotes(): MarketQuote[];
  getHistoricalBars(symbol: string, timeframe?: string, count?: number): CandlestickBar[];
  subscribe(symbol: string, callback: (quote: MarketQuote) => void): () => void;
}

export class NormalizedMarketDataService implements MarketDataProvider {
  private static instance: NormalizedMarketDataService;

  private quotes: Map<string, MarketQuote> = new Map();
  private historicalBars: Map<string, CandlestickBar[]> = new Map();
  private subscribers: Map<string, Set<(quote: MarketQuote) => void>> = new Map();
  private simulationInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeDefaultQuotes();
    this.generateHistoricalBars();
    this.startPriceSimulation();
  }

  public static getInstance(): NormalizedMarketDataService {
    if (!NormalizedMarketDataService.instance) {
      NormalizedMarketDataService.instance = new NormalizedMarketDataService();
    }
    return NormalizedMarketDataService.instance;
  }

  private initializeDefaultQuotes() {
    const defaultData: MarketQuote[] = [
      {
        symbol: 'BTC/USDT',
        name: 'Bitcoin',
        price: 68420.5,
        change24h: 1845.2,
        change24hPercent: 2.77,
        high24h: 69120.0,
        low24h: 66340.0,
        volume24h: 38240500000,
        bid: 68418.0,
        ask: 68422.0,
        spread: 4.0,
        lastUpdated: new Date().toISOString(),
      },
      {
        symbol: 'ETH/USDT',
        name: 'Ethereum',
        price: 3548.8,
        change24h: 112.4,
        change24hPercent: 3.27,
        high24h: 3590.0,
        low24h: 3415.0,
        volume24h: 18450000000,
        bid: 3548.2,
        ask: 3549.4,
        spread: 1.2,
        lastUpdated: new Date().toISOString(),
      },
      {
        symbol: 'SOL/USDT',
        name: 'Solana',
        price: 152.4,
        change24h: -3.8,
        change24hPercent: -2.43,
        high24h: 158.2,
        low24h: 149.0,
        volume24h: 4210000000,
        bid: 152.35,
        ask: 152.45,
        spread: 0.1,
        lastUpdated: new Date().toISOString(),
      },
      {
        symbol: 'NVDA',
        name: 'NVIDIA Corporation',
        price: 126.85,
        change24h: 4.25,
        change24hPercent: 3.47,
        high24h: 128.1,
        low24h: 122.4,
        volume24h: 6420000000,
        bid: 126.82,
        ask: 126.88,
        spread: 0.06,
        lastUpdated: new Date().toISOString(),
      },
      {
        symbol: 'SPY',
        name: 'SPDR S&P 500 ETF Trust',
        price: 558.4,
        change24h: 3.1,
        change24hPercent: 0.56,
        high24h: 559.8,
        low24h: 555.1,
        volume24h: 28400000000,
        bid: 558.38,
        ask: 558.42,
        spread: 0.04,
        lastUpdated: new Date().toISOString(),
      },
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        price: 226.15,
        change24h: -1.2,
        change24hPercent: -0.53,
        high24h: 228.4,
        low24h: 225.0,
        volume24h: 5120000000,
        bid: 226.12,
        ask: 226.18,
        spread: 0.06,
        lastUpdated: new Date().toISOString(),
      },
      {
        symbol: 'TSLA',
        name: 'Tesla Inc.',
        price: 219.75,
        change24h: 7.85,
        change24hPercent: 3.71,
        high24h: 222.0,
        low24h: 211.5,
        volume24h: 8900000000,
        bid: 219.7,
        ask: 219.8,
        spread: 0.1,
        lastUpdated: new Date().toISOString(),
      },
      {
        symbol: 'QQQ',
        name: 'Invesco QQQ Trust',
        price: 485.6,
        change24h: 4.8,
        change24hPercent: 1.0,
        high24h: 487.2,
        low24h: 480.1,
        volume24h: 14200000000,
        bid: 485.58,
        ask: 485.62,
        spread: 0.04,
        lastUpdated: new Date().toISOString(),
      },
    ];

    for (const q of defaultData) {
      this.quotes.set(q.symbol, q);
    }
  }

  private generateHistoricalBars() {
    for (const [symbol, quote] of this.quotes.entries()) {
      const bars: CandlestickBar[] = [];
      let currentClose = quote.price * 0.92; // 30 periods ago
      const now = Date.now();
      const intervalMs = 15 * 60 * 1000; // 15m bars

      for (let i = 40; i >= 0; i--) {
        const time = now - i * intervalMs;
        const volatility = quote.price * 0.008;
        const delta = (Math.random() - 0.48) * volatility;
        const open = currentClose;
        const close = Math.max(open + delta, quote.price * 0.5);
        const high = Math.max(open, close) + Math.random() * volatility * 0.7;
        const low = Math.min(open, close) - Math.random() * volatility * 0.7;
        const volume = Math.floor(Math.random() * 5000 + 1000) * (quote.price > 1000 ? 0.05 : 10);

        bars.push({
          timestamp: time,
          open: Number(open.toFixed(2)),
          high: Number(high.toFixed(2)),
          low: Number(low.toFixed(2)),
          close: Number(close.toFixed(2)),
          volume: Math.round(volume),
        });

        currentClose = close;
      }

      // Pin last bar close to actual quote price
      if (bars.length > 0) {
        bars[bars.length - 1].close = quote.price;
      }

      this.historicalBars.set(symbol, bars);
    }
  }

  private startPriceSimulation() {
    if (this.simulationInterval) return;

    this.simulationInterval = setInterval(() => {
      // Pick 1-3 symbols randomly to update slightly
      const symbols = Array.from(this.quotes.keys());
      const selected = symbols.sort(() => 0.5 - Math.random()).slice(0, 2);

      for (const sym of selected) {
        const current = this.quotes.get(sym);
        if (!current) continue;

        const maxPctShift = 0.0015; // 0.15% max tick
        const shiftPct = (Math.random() * 2 - 0.99) * maxPctShift;
        const newPrice = Number((current.price * (1 + shiftPct)).toFixed(current.price > 1000 ? 1 : 2));
        const spread = current.spread;

        const updatedQuote: MarketQuote = {
          ...current,
          price: newPrice,
          bid: Number((newPrice - spread / 2).toFixed(2)),
          ask: Number((newPrice + spread / 2).toFixed(2)),
          change24h: Number((current.change24h + (newPrice - current.price)).toFixed(2)),
          change24hPercent: Number(((current.change24h / (current.price || 1)) * 100).toFixed(2)),
          high24h: Math.max(current.high24h, newPrice),
          low24h: Math.min(current.low24h, newPrice),
          lastUpdated: new Date().toISOString(),
        };

        this.quotes.set(sym, updatedQuote);

        // Update latest bar
        const bars = this.historicalBars.get(sym);
        if (bars && bars.length > 0) {
          const lastBar = bars[bars.length - 1];
          lastBar.close = newPrice;
          lastBar.high = Math.max(lastBar.high, newPrice);
          lastBar.low = Math.min(lastBar.low, newPrice);
        }

        // Notify subscribers
        const cbs = this.subscribers.get(sym);
        if (cbs) {
          cbs.forEach((cb) => cb(updatedQuote));
        }

        // Publish to domain event bus
        eventBus.publish('market.price_tick', {
          symbol: sym,
          price: newPrice,
          bid: updatedQuote.bid,
          ask: updatedQuote.ask,
          change24hPercent: updatedQuote.change24hPercent,
        });
      }
    }, 2500);
  }

  public getQuote(symbol: string): MarketQuote | undefined {
    return this.quotes.get(symbol);
  }

  public getAllQuotes(): MarketQuote[] {
    return Array.from(this.quotes.values());
  }

  public getHistoricalBars(symbol: string, timeframe: string = '15m', count: number = 40): CandlestickBar[] {
    const bars = this.historicalBars.get(symbol) || [];
    return bars.slice(-count);
  }

  public subscribe(symbol: string, callback: (quote: MarketQuote) => void): () => void {
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, new Set());
    }
    this.subscribers.get(symbol)!.add(callback);

    return () => {
      this.subscribers.get(symbol)?.delete(callback);
    };
  }
}

export const marketDataService = NormalizedMarketDataService.getInstance();
