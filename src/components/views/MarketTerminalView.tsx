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
  onSelectSymbol = (_sym?: string) => {},
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
    <div className="space-y-6">
      {/* 1. Header with Symbol Ticker Bar */}
      <div className="bg-[#0d1322] border border-slate-800/90 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <BarChart2 className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white font-mono">{activeQuote?.symbol || selectedSymbol}</h2>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                SPOT / PERP
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

        <div className="flex items-center gap-2">
          <button
            onClick={handleFetchAiPulse}
            disabled={isLoadingPulse}
            className="px-3.5 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {isLoadingPulse ? 'Grounded AI Search...' : 'AI Market Pulse'}
          </button>

          <button
            onClick={onOpenOrderModal}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold font-mono transition-colors shadow-md shadow-cyan-950/40 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Trade Asset
          </button>
        </div>
      </div>

      {/* 2. Main Terminal Grid (Chart + Quotes List + Orderbook) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Watchlist Sidebar */}
        <div className="bg-[#0d1322] border border-slate-800/90 rounded-2xl p-4 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3">
            Market Quotes ({safeQuotes.length})
          </span>

          <div className="space-y-1.5">
            {safeQuotes.map((q) => {
              const isSelected = q.symbol === activeQuote?.symbol;
              return (
                <div
                  key={q.symbol}
                  onClick={() => onSelectSymbol(q.symbol)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#10192e] border-cyan-500/60 shadow-md ring-1 ring-cyan-500/30'
                      : 'bg-[#090d16] border-slate-800/60 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <span className="font-bold text-xs text-white font-mono block">{q.symbol}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Vol: ${(q.volume24h / 1000000).toFixed(1)}M
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-xs text-white block">
                      {formatCurrency(q.price)}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-medium ${
                        q.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {q.change24h >= 0 ? '+' : ''}
                      {q.change24h.toFixed(2)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart View */}
        <div className="lg:col-span-3 space-y-4">
          <CandlestickChart
            bars={bars}
            symbol={activeQuote?.symbol || selectedSymbol}
            height={360}
          />

          {/* AI Grounded Market Pulse Response Box */}
          {aiPulse && (
            <div className="bg-gradient-to-br from-[#0d1322] to-[#12192e] border border-purple-500/40 rounded-2xl p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="font-bold text-xs text-white uppercase tracking-wider">
                    Grounded AI Macro Pulse (Gemini 3.5 Flash)
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Sentiment: {aiPulse.sentiment}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans">{aiPulse.analysis}</p>

              {aiPulse.keyCatalysts?.length > 0 && (
                <div className="pt-2">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">Key Catalysts:</span>
                  <ul className="list-disc list-inside text-xs text-slate-300 space-y-1 pl-1">
                    {(aiPulse.keyCatalysts || []).map((c: string, i: number) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {aiPulse.sources?.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-[10px] text-slate-400 font-mono">
                  <span>Google Search Citations:</span>
                  {(aiPulse.sources || []).map((s: any, i: number) => (
                    <a
                      key={i}
                      href={s.uri}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 flex items-center gap-1"
                    >
                      {s.title} <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Level 2 Orderbook Depth Simulation Strip */}
          <div className="bg-[#0d1322] border border-slate-800/90 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-white uppercase tracking-wider">
                Level-2 Microstructure Depth
              </span>
              <span className="text-xs font-mono text-slate-400">
                Spread: ${activeQuote?.spread?.toFixed(2) || '0.50'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 font-mono text-xs">
              <div className="space-y-1">
                <div className="text-[10px] text-slate-500 flex justify-between border-b border-slate-800 pb-1">
                  <span>Bid Size</span>
                  <span>Bid Price</span>
                </div>
                <div className="flex justify-between text-emerald-400">
                  <span>14.50</span>
                  <span>${((activeQuote?.price || 100) - 0.2).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-400/80">
                  <span>32.80</span>
                  <span>${((activeQuote?.price || 100) - 0.5).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-400/60">
                  <span>68.20</span>
                  <span>${((activeQuote?.price || 100) - 1.0).toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-[10px] text-slate-500 flex justify-between border-b border-slate-800 pb-1">
                  <span>Ask Price</span>
                  <span>Ask Size</span>
                </div>
                <div className="flex justify-between text-rose-400">
                  <span>${((activeQuote?.price || 100) + 0.2).toFixed(2)}</span>
                  <span>18.20</span>
                </div>
                <div className="flex justify-between text-rose-400/80">
                  <span>${((activeQuote?.price || 100) + 0.5).toFixed(2)}</span>
                  <span>45.10</span>
                </div>
                <div className="flex justify-between text-rose-400/60">
                  <span>${((activeQuote?.price || 100) + 1.0).toFixed(2)}</span>
                  <span>92.40</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
