import React, { useState } from 'react';
import {
  Layers,
  TrendingUp,
  TrendingDown,
  XCircle,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Search,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { Position, UnifiedTrade } from '../../types/client.ts';
import { formatCurrency, formatNumber } from '../../lib/formatters.ts';
import { StatusBadge } from '../common/StatusBadge.tsx';
import { TradeLifecycle } from '../trading/TradeLifecycle.tsx';
import { EmptyState } from '../common/EmptyState.tsx';
import { cn } from '../../lib/utils.ts';

interface PositionsViewProps {
  positions?: Position[];
  unifiedTrades?: UnifiedTrade[];
  onClosePosition?: (posId: string) => void;
  onOpenOrderModal?: () => void;
  onSelectTrade?: (trade: UnifiedTrade) => void;
}

export const PositionsView: React.FC<PositionsViewProps> = ({
  positions = [],
  unifiedTrades = [],
  onClosePosition = (_id: string) => {},
  onOpenOrderModal = () => {},
  onSelectTrade = (_t: UnifiedTrade) => {},
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [closingPosId, setClosingPosId] = useState<string | null>(null);

  const safePositions = positions || [];
  const safeTrades = unifiedTrades || [];

  const filteredPositions = safePositions.filter((p) =>
    p.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalUnrealizedPnL = safePositions.reduce((acc, p) => acc + (p.unrealizedPnL || 0), 0);
  const totalNotional = safePositions.reduce((acc, p) => acc + (p.notional || (p.quantity * p.currentPrice) || 0), 0);

  const handleConfirmClose = async (posId: string) => {
    setClosingPosId(null);
    onClosePosition(posId);
  };

  return (
    <div className="space-y-5">
      {/* 1. Header & Aggregate Risk Metrics */}
      <div className="bg-[#0c1220] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              Active Positions & Exposure Engine
            </h2>
            <p className="text-xs text-slate-400">
              Live streaming portfolio exposure, real-time unrealized P&L, and 10-step lifecycle telemetry
            </p>
          </div>

          <button
            onClick={onOpenOrderModal}
            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold font-mono transition-all shadow-md shadow-cyan-950/40 flex items-center gap-2 cursor-pointer self-stretch sm:self-auto justify-center"
          >
            <Plus className="w-4 h-4" />
            + New Market Position
          </button>
        </div>

        {/* Aggregated Exposure Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-800/80 text-xs font-mono">
          <div className="p-2.5 bg-[#080d19] rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Open Positions</span>
            <span className="text-base font-bold text-white mt-0.5 block">{safePositions.length}</span>
          </div>

          <div className="p-2.5 bg-[#080d19] rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Notional Value</span>
            <span className="text-base font-bold text-cyan-300 mt-0.5 block">{formatCurrency(totalNotional)}</span>
          </div>

          <div className="p-2.5 bg-[#080d19] rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Floating P&L</span>
            <span
              className={cn(
                'text-base font-bold mt-0.5 block',
                totalUnrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
              )}
            >
              {totalUnrealizedPnL >= 0 ? '+' : ''}
              {formatCurrency(totalUnrealizedPnL, 2, true)}
            </span>
          </div>

          <div className="p-2.5 bg-[#080d19] rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Pre-Trade Risk State</span>
            <span className="text-base font-bold text-emerald-400 mt-0.5 block">STABLE (0 HALTS)</span>
          </div>
        </div>
      </div>

      {/* 2. Search & Filters */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Filter active positions by symbol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#0c1220] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>
      </div>

      {/* 3. Positions List (Table on Desktop, Cards on Mobile) */}
      {filteredPositions.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No Open Positions"
          description="You currently have zero active market exposure. Open a trade via the Trade Wizard."
          actionLabel="+ Create New Position"
          onAction={onOpenOrderModal}
        />
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden lg:block bg-[#0c1220] border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-[#080d19] text-slate-400 border-b border-slate-800 text-[10px] uppercase">
                    <th className="p-4 font-bold">Symbol / Direction</th>
                    <th className="p-4 font-bold">Size</th>
                    <th className="p-4 font-bold">Entry Price</th>
                    <th className="p-4 font-bold">Mark Price</th>
                    <th className="p-4 font-bold">Notional</th>
                    <th className="p-4 font-bold">Floating P&L</th>
                    <th className="p-4 font-bold">Lifecycle State</th>
                    <th className="p-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredPositions.map((pos) => {
                    const isProfit = (pos.unrealizedPnL || 0) >= 0;
                    const notional = pos.notional || pos.quantity * pos.currentPrice;
                    const matchingTrade = safeTrades.find((t) => t.position?.id === pos.id || t.symbol === pos.symbol);

                    return (
                      <tr
                        key={pos.id}
                        className="hover:bg-slate-800/30 transition-colors group cursor-pointer"
                        onClick={() => matchingTrade && onSelectTrade(matchingTrade)}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{pos.symbol}</span>
                            <StatusBadge status={pos.side} size="sm" />
                          </div>
                        </td>
                        <td className="p-4 text-slate-200">{pos.quantity}</td>
                        <td className="p-4 text-slate-300">{formatCurrency(pos.entryPrice)}</td>
                        <td className="p-4 text-white font-bold">{formatCurrency(pos.currentPrice)}</td>
                        <td className="p-4 text-slate-300">{formatCurrency(notional)}</td>
                        <td className="p-4">
                          <span
                            className={cn(
                              'font-bold inline-flex items-center gap-1 text-sm',
                              isProfit ? 'text-emerald-400' : 'text-rose-400'
                            )}
                          >
                            {isProfit ? '+' : ''}
                            {formatCurrency(pos.unrealizedPnL, 2, true)}
                            <span className="text-[10px] font-normal">
                              ({isProfit ? '+' : ''}
                              {pos.unrealizedPnLPercent?.toFixed(2)}%)
                            </span>
                          </span>
                        </td>
                        <td className="p-4">
                          {matchingTrade ? (
                            <TradeLifecycle trade={matchingTrade} compact />
                          ) : (
                            <StatusBadge status="ACTIVE" size="sm" />
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (matchingTrade) onSelectTrade(matchingTrade);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono border border-slate-700 transition-colors cursor-pointer"
                            >
                              Details
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setClosingPosId(pos.id);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-xs font-mono border border-rose-800/50 transition-colors cursor-pointer"
                            >
                              Close
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:hidden">
            {filteredPositions.map((pos) => {
              const isProfit = (pos.unrealizedPnL || 0) >= 0;
              const notional = pos.notional || pos.quantity * pos.currentPrice;
              const matchingTrade = safeTrades.find((t) => t.position?.id === pos.id || t.symbol === pos.symbol);

              return (
                <div
                  key={pos.id}
                  onClick={() => matchingTrade && onSelectTrade(matchingTrade)}
                  className="p-4 rounded-2xl bg-[#0c1220] border border-slate-800 hover:border-slate-700 transition-all space-y-3 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-base font-mono">{pos.symbol}</span>
                      <StatusBadge status={pos.side} size="sm" />
                    </div>
                    <span
                      className={cn(
                        'text-sm font-mono font-bold',
                        isProfit ? 'text-emerald-400' : 'text-rose-400'
                      )}
                    >
                      {isProfit ? '+' : ''}
                      {formatCurrency(pos.unrealizedPnL, 2, true)}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-[#080d19] border border-slate-800/80 text-xs font-mono">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Quantity</span>
                      <span className="text-white font-bold">{pos.quantity}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Entry Price</span>
                      <span className="text-slate-300">{formatCurrency(pos.entryPrice)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Mark Price</span>
                      <span className="text-white font-bold">{formatCurrency(pos.currentPrice)}</span>
                    </div>
                  </div>

                  {matchingTrade && (
                    <div className="pt-1">
                      <TradeLifecycle trade={matchingTrade} compact />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <span className="text-[11px] font-mono text-slate-400">
                      Notional: {formatCurrency(notional)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setClosingPosId(pos.id);
                      }}
                      className="px-3 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-xs font-mono border border-rose-800/50 transition-colors cursor-pointer"
                    >
                      Close Position
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Close Confirmation Modal */}
      {closingPosId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0c1220] border border-slate-700 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 font-mono text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Close Market Position?</h3>
                <p className="text-slate-400 text-[11px]">Immediate market order execution</p>
              </div>
            </div>

            <p className="text-slate-300 text-xs leading-relaxed">
              This will submit a market order to flatten your position instantly at the current best available bid/ask.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setClosingPosId(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmClose(closingPosId)}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer"
              >
                Confirm Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
