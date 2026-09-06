import React from 'react';
import { TrendingUp, BarChart2, CheckCircle2, ShieldAlert, Clock, ArrowUpRight } from 'lucide-react';
import { Strategy } from '../../types/client.ts';
import { StatCard } from '../common/StatCard.tsx';
import { formatCurrency } from '../../lib/formatters.ts';

interface StrategiesViewProps {
  strategies?: Strategy[];
}

export const StrategiesView: React.FC<StrategiesViewProps> = ({ strategies = [] }) => {
  const safeStrategies = strategies || [];
  const activeStrategies = safeStrategies.filter((s) => s.isActive);
  const totalPnL = safeStrategies.reduce((sum, s) => sum + (s.netPnL || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-[#0d1322] border border-slate-800/90 rounded-2xl p-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            Strategy Management & Alpha Attribution
          </h2>
          <p className="text-xs text-slate-400">
            Performance comparison, edge decay monitoring, and systematic attribution
          </p>
        </div>

        <div className="bg-[#090d16] px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
          <span className="text-slate-400">Cumulative Strategy Alpha: </span>
          <span className="font-bold text-emerald-400">{formatCurrency(totalPnL, 0, true)}</span>
        </div>
      </div>

      {/* Strategies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {safeStrategies.length === 0 ? (
          <div className="col-span-full py-16 text-center text-xs text-slate-500 bg-[#0d1322] rounded-2xl border border-slate-800">
            No strategies registered.
          </div>
        ) : (
          safeStrategies.map((strat) => (
            <div
              key={strat.id}
              className="bg-[#0d1322] border border-slate-800/90 rounded-2xl p-5 shadow-sm space-y-4 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-white">{strat.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      {strat.version}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{strat.description}</p>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    strat.isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {strat.isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-3 gap-2 bg-[#090d16] p-3 rounded-xl border border-slate-800/80 font-mono text-center">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Win Rate</span>
                  <span className="text-sm font-bold text-white">{strat.winRate}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Net P&L</span>
                  <span className="text-sm font-bold text-emerald-400">
                    {formatCurrency(strat.netPnL, 0, true)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Sharpe</span>
                  <span className="text-sm font-bold text-cyan-400">{strat.sharpeRatio}</span>
                </div>
              </div>

              {/* Rules & Invalidation */}
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block mb-1">Execution Rules:</span>
                  <ul className="list-disc list-inside text-slate-400 space-y-0.5 pl-1">
                    {(strat.rules || []).map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t border-slate-800/80 text-[11px] font-mono text-rose-400">
                  <span className="text-slate-500">Invalidation: </span>
                  {strat.invalidationModel}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>Category: {strat.category}</span>
                <span>{strat.totalTrades} Executions</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
