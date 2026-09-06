import React, { useState, useEffect } from 'react';
import {
  BarChart2,
  Sparkles,
  ExternalLink,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  RefreshCw,
} from 'lucide-react';
import { CandlestickChart } from '../common/CandlestickChart.tsx';
import { MarketQuote, CandlestickBar } from '../../types/client.ts';
import { api } from '../../lib/api.ts';
import { formatCurrency } from '../../lib/formatters.ts';

interface MarketTerminalViewProps {
  quotes?: MarketQuote[];
  selectedSymbol?: string;
  onSelectSymbol?: (symbol: string) => void;
  onOpenOrderModal?: () => void;
}

export const MarketTerminalView: React.FC<MarketTerminalViewProps> = ({
  quotes = [],
  selectedSymbol = 'BTC/USDT',
  onSelectSymbol = (_sym: string) => {},
  onOpenOrderModal = () => {},
}) => {
  const safeQuotes = quotes || [];
  const [bars, setBars] = useState<CandlestickBar[]>([]);
  const [aiPulse, setAiPulse] = useState<any>(null);
  const [isLoadingPulse, setIsLoadingPulse] = useState(false);

  const activeQuote = safeQuotes.find((q) => q.symbol === selectedSymbol) || safeQuotes[0];

  useEffect(() => {
    if (activeQuote) {
      api.getMarketBars(activeQuote.symbol).then((res) => {
        if (res.bars) {
          setBars(res.bars);
        }
      });
    }
  }, [activeQuote?.symbol]);

  const handleFetchAiPulse = async () => {
    if (!activeQuote) return;
    setIsLoadingPulse(true);
    try {
      const pulse = await api.getAiMarketPulse(activeQuote.symbol);
      setAiPulse(pulse);
    } catch (err) {
      console.error('Failed to fetch AI pulse:', err);
    } finally {
      setIsLoadingPulse(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Header with Symbol Ticker Bar */}
      <div className="bg-[#0b101d] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <BarChart2 className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white font-mono">{activeQuote?.symbol || selectedSymbol}</h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono font-bold">
                PRO TERMINAL
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono mt-0.5">
              <span className="text-white font-bold text-sm">
                {formatCurrency(activeQuote?.price)}
              </span>
              <span
                className={`font-semibold ${
                  (activeQuote?.change24h || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {(activeQuote?.change24h || 0) >= 0 ? '+' : ''}
                {activeQuote?.change24h?.toFixed(2) || '0.00'}%
              </span>
              <span className="text-slate-500">Spread: ${activeQuote?.spread?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleFetchAiPulse}
            disabled={isLoadingPulse}
            className="px-3.5 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {isLoadingPulse ? 'Analyzing Pulse...' : 'AI Pulse & Sentiment'}
          </button>

          <button
            onClick={onOpenOrderModal}
            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold font-mono transition-all shadow-md shadow-cyan-950/40 flex items-center gap-1.5 cursor-pointer ml-auto sm:ml-0"
          >
            <Plus className="w-4 h-4" />
            Trade Asset
          </button>
        </div>
      </div>

      {/* AI Market Pulse Drawer / Banner if fetched */}
      {aiPulse && (
        <div className="p-4 bg-purple-950/20 border border-purple-500/40 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-purple-300 font-mono">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Live Market Intelligence
            </span>
            <span className="text-[10px] text-slate-400">Confidence: {(aiPulse.confidence * 100).toFixed(0)}%</span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed font-sans">{aiPulse.summary}</p>
        </div>
      )}

      {/* 2. Primary Market Chart (8 cols) + Symbol Watchlist (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-[#0b101d] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-mono">
            <span className="font-bold text-white uppercase">OHLC Candlestick Engine</span>
            <span className="text-cyan-400">1m Real-Time Ticks</span>
          </div>
          <CandlestickChart bars={bars} height={380} />
        </div>

        {/* Watchlist & Order Book Depth */}
        <div className="bg-[#0b101d] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-bold text-white font-mono uppercase">
            <span>Market Watchlist</span>
            <span className="text-slate-500 font-normal">24h Vol</span>
          </div>

          <div className="space-y-2">
            {safeQuotes.map((q) => {
              const isSelected = q.symbol === (activeQuote?.symbol || selectedSymbol);
              return (
                <div
                  key={q.symbol}
                  onClick={() => onSelectSymbol(q.symbol)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer font-mono ${
                    isSelected
                      ? 'bg-cyan-950/20 border-cyan-500 text-white shadow-sm'
                      : 'bg-[#060912] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs text-white">{q.symbol}</div>
                    <div className="text-[10px] text-slate-500">Vol: ${((q.volume24h || 1000000) / 1e6).toFixed(1)}M</div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-xs text-white">{formatCurrency(q.price)}</div>
                    <div
                      className={`text-[10px] font-bold ${
                        q.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {q.change24h >= 0 ? '+' : ''}
                      {q.change24h.toFixed(2)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
