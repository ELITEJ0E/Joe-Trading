import React, { useState } from 'react';
import { Layers, ShieldAlert, ArrowUpRight, ArrowDownRight, Target, StopCircle, Plus } from 'lucide-react';
import { Position } from '../../types/client.ts';
import { formatCurrency } from '../../lib/formatters.ts';
import { StatusBadge } from '../common/StatusBadge.tsx';
import { EmptyState } from '../common/EmptyState.tsx';

interface PositionsViewProps {
  positions?: Position[];
  onClosePosition?: (id: string) => void;
  onOpenOrderModal?: () => void;
}

export const PositionsView: React.FC<PositionsViewProps> = ({
  positions = [],
  onClosePosition = (_id: string) => {},
  onOpenOrderModal = () => {},
}) => {
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'CLOSED'>('OPEN');

  const safePositions = positions || [];
  const openPositions = safePositions.filter((p) => p.isOpen);
  const closedPositions = safePositions.filter((p) => !p.isOpen);

  const displayedPositions =
    filter === 'OPEN' ? openPositions : filter === 'CLOSED' ? closedPositions : safePositions;

  const totalUnrealized = openPositions.reduce((s, p) => s + (p.unrealizedPnL || 0), 0);
  const totalGrossExposure = openPositions.reduce(
    (s, p) => s + (p.currentPrice || 0) * (p.quantity || 0),
    0
  );

  return (
    <div className="space-y-5">
      {/* 1. Header & Summary Cockpit */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0b101d] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            Active Positions & Risk Exposure
          </h2>
          <p className="text-xs text-slate-400">
            Real-time mark-to-market valuations, stop-loss protection, and capital exposure
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <div className="bg-[#060912] px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
            <span className="text-slate-400">Gross Exposure: </span>
            <span className="text-white font-bold">{formatCurrency(totalGrossExposure, 0)}</span>
          </div>

          <div className="bg-[#060912] px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
            <span className="text-slate-400">Total Unrealized: </span>
            <span className={`font-bold ${totalUnrealized >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totalUnrealized >= 0 ? '+' : ''}${totalUnrealized.toFixed(2)}
            </span>
          </div>

          <button
            onClick={onOpenOrderModal}
            className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold font-mono transition-all shadow-md shadow-cyan-950/40 flex items-center gap-1.5 cursor-pointer ml-auto sm:ml-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Open Position</span>
          </button>
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="flex items-center gap-2">
        {(['OPEN', 'CLOSED', 'ALL'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-mono transition-colors cursor-pointer ${
              filter === f
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-[#0b101d] text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            {f === 'OPEN'
              ? `Open Positions (${openPositions.length})`
              : f === 'CLOSED'
              ? `Closed Positions (${closedPositions.length})`
              : `All Positions (${safePositions.length})`}
          </button>
        ))}
      </div>

      {/* 3. Responsive Data Display: Desktop Table + Mobile Cards */}
      {displayedPositions.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No Positions Found"
          description={
            filter === 'OPEN'
              ? 'You do not have any open market positions currently. Portfolio is 100% in cash.'
              : 'No position history records matching this filter.'
          }
          actionLabel="+ Place New Order"
          onAction={onOpenOrderModal}
        />
      ) : (
        <>
          {/* Mobile Stacked Card View (Hidden on md+) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {displayedPositions.map((pos) => {
              const isProfit = pos.unrealizedPnL >= 0;
              const notional = pos.currentPrice * pos.quantity;

              return (
                <div
                  key={pos.id}
                  className="bg-[#0b101d] border border-slate-800 rounded-2xl p-4 space-y-3 font-mono text-xs shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{pos.symbol}</span>
                      <StatusBadge status={pos.side} size="sm" showIcon={false} />
                    </div>
                    <div className={`font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isProfit ? '+' : ''}${pos.unrealizedPnL.toFixed(2)} ({isProfit ? '+' : ''}
                      {pos.unrealizedPnLPercent.toFixed(2)}%)
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 bg-[#060912] p-2.5 rounded-xl border border-slate-800/80">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Size / Qty</span>
                      <span className="font-bold">{pos.quantity}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Notional Value</span>
                      <span className="font-bold">{formatCurrency(notional)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Entry Price</span>
                      <span>{formatCurrency(pos.entryPrice)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Current Mark</span>
                      <span className="text-white font-bold">{formatCurrency(pos.currentPrice)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="text-[10px] text-slate-400">
                      <span>SL: {pos.stopLoss ? formatCurrency(pos.stopLoss) : 'None'}</span> •{' '}
                      <span>TP: {pos.takeProfit ? formatCurrency(pos.takeProfit) : 'None'}</span>
                    </div>

                    {pos.isOpen && (
                      <button
                        onClick={() => onClosePosition(pos.id)}
                        className="px-3 py-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900 text-rose-300 border border-rose-800/50 font-bold text-xs cursor-pointer min-h-[36px]"
                      >
                        Market Close
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (Hidden on mobile) */}
          <div className="hidden md:block bg-[#0b101d] border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#060912] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Asset / Symbol</th>
                    <th className="p-3.5">Side</th>
                    <th className="p-3.5">Quantity</th>
                    <th className="p-3.5">Entry Price</th>
                    <th className="p-3.5">Current Mark</th>
                    <th className="p-3.5">Stop Loss</th>
                    <th className="p-3.5">Take Profit</th>
                    <th className="p-3.5 text-right">Unrealized P&L</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {displayedPositions.map((pos) => {
                    const isProfit = pos.unrealizedPnL >= 0;
                    const notional = pos.currentPrice * pos.quantity;
                    return (
                      <tr key={pos.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-3.5">
                          <div className="font-bold text-white text-xs">{pos.symbol}</div>
                          <div className="text-[10px] text-slate-500">
                            {formatCurrency(notional, 0)} Notional
                          </div>
                        </td>
                        <td className="p-3.5">
                          <StatusBadge status={pos.side} size="sm" showIcon={false} />
                        </td>
                        <td className="p-3.5 text-slate-300 font-bold">{pos.quantity}</td>
                        <td className="p-3.5 text-slate-300">{formatCurrency(pos.entryPrice)}</td>
                        <td className="p-3.5 text-white font-bold">
                          {formatCurrency(pos.currentPrice)}
                        </td>
                        <td className="p-3.5">
                          {pos.stopLoss ? (
                            <span className="text-rose-400 font-medium">
                              {formatCurrency(pos.stopLoss)}
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          {pos.takeProfit ? (
                            <span className="text-emerald-400 font-medium">
                              {formatCurrency(pos.takeProfit)}
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                        <td
                          className={`p-3.5 text-right font-bold ${
                            isProfit ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          <div>
                            {isProfit ? '+' : ''}${pos.unrealizedPnL.toFixed(2)}
                          </div>
                          <div className="text-[10px]">
                            ({isProfit ? '+' : ''}
                            {pos.unrealizedPnLPercent.toFixed(2)}%)
                          </div>
                        </td>
                        <td className="p-3.5 text-right">
                          {pos.isOpen ? (
                            <button
                              onClick={() => onClosePosition(pos.id)}
                              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 transition-colors cursor-pointer"
                            >
                              Market Close
                            </button>
                          ) : (
                            <span className="text-slate-500 text-[10px]">Settled</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
