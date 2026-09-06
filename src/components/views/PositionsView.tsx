import React, { useState } from 'react';
import { Layers, ShieldAlert, ArrowUpRight, ArrowDownRight, Target, StopCircle } from 'lucide-react';
import { Position } from '../../types/client.ts';
import { formatCurrency } from '../../lib/formatters.ts';

interface PositionsViewProps {
  positions?: Position[];
  onClosePosition?: (id: string) => void;
  onOpenOrderModal?: () => void;
}

export const PositionsView: React.FC<PositionsViewProps> = ({
  positions = [],
  onClosePosition = (_id?: string) => {},
  onOpenOrderModal = () => {},
}) => {
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'CLOSED'>('OPEN');

  const safePositions = positions || [];
  const openPositions = safePositions.filter((p) => p.isOpen);
  const closedPositions = safePositions.filter((p) => !p.isOpen);

  const displayedPositions =
    filter === 'OPEN' ? openPositions : filter === 'CLOSED' ? closedPositions : safePositions;

  const totalUnrealized = openPositions.reduce((s, p) => s + (p.unrealizedPnL || 0), 0);
  const totalGrossExposure = openPositions.reduce((s, p) => s + (p.currentPrice || 0) * (p.quantity || 0), 0);

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0d1322] border border-slate-800/90 rounded-2xl p-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            Position Management & Risk Exposure
          </h2>
          <p className="text-xs text-slate-400">Real-time mark-to-market valuations and liquidation tracking</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#090d16] px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
            <span className="text-slate-400">Gross Exposure: </span>
            <span className="text-white font-bold">{formatCurrency(totalGrossExposure, 0)}</span>
          </div>

          <div className="bg-[#090d16] px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
            <span className="text-slate-400">Total Unrealized: </span>
            <span className={`font-bold ${totalUnrealized >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totalUnrealized >= 0 ? '+' : ''}${totalUnrealized.toFixed(2)}
            </span>
          </div>

          <button
            onClick={onOpenOrderModal}
            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            + Open Position
          </button>
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="flex items-center gap-2">
        {(['OPEN', 'CLOSED', 'ALL'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              filter === f
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                : 'bg-[#0d1322] text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            {f === 'OPEN' ? `Open (${openPositions.length})` : f === 'CLOSED' ? `Closed (${closedPositions.length})` : `All (${safePositions.length})`}
          </button>
        ))}
      </div>

      {/* 3. Detailed Positions Table */}
      <div className="bg-[#0d1322] border border-slate-800/90 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#090d16] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3.5">Asset / Symbol</th>
                <th className="p-3.5">Side</th>
                <th className="p-3.5">Quantity</th>
                <th className="p-3.5">Entry Price</th>
                <th className="p-3.5">Current Price</th>
                <th className="p-3.5">Stop Loss</th>
                <th className="p-3.5">Take Profit</th>
                <th className="p-3.5 text-right">Unrealized P&L</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {displayedPositions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No positions found for the selected view.
                  </td>
                </tr>
              ) : (
                displayedPositions.map((pos) => {
                  const isProfit = pos.unrealizedPnL >= 0;
                  const notional = pos.currentPrice * pos.quantity;
                  return (
                    <tr key={pos.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-white text-xs">{pos.symbol}</div>
                        <div className="text-[10px] text-slate-500">{formatCurrency(notional, 0)} Notional</div>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            pos.side === 'LONG'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {pos.side}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-300 font-bold">{pos.quantity}</td>
                      <td className="p-3.5 text-slate-300">{formatCurrency(pos.entryPrice)}</td>
                      <td className="p-3.5 text-white font-bold">{formatCurrency(pos.currentPrice)}</td>
                      <td className="p-3.5">
                        {pos.stopLoss ? (
                          <span className="text-rose-400 font-medium">{formatCurrency(pos.stopLoss)}</span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        {pos.takeProfit ? (
                          <span className="text-emerald-400 font-medium">{formatCurrency(pos.takeProfit)}</span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className={`p-3.5 text-right font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                        <div>{isProfit ? '+' : ''}${pos.unrealizedPnL.toFixed(2)}</div>
                        <div className="text-[10px]">
                          ({isProfit ? '+' : ''}{pos.unrealizedPnLPercent.toFixed(2)}%)
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
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
