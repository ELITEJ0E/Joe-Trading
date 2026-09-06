import React from 'react';
import { PieChart, Shield, Activity, TrendingUp, DollarSign, Layers } from 'lucide-react';
import { TradingAccount, PortfolioMetrics } from '../../types/client.ts';
import { StatCard } from '../common/StatCard.tsx';
import { EquityCurveChart } from '../common/EquityCurveChart.tsx';
import { formatNumber, formatCurrency } from '../../lib/formatters.ts';

interface PortfolioViewProps {
  accounts?: TradingAccount[];
  activeAccount?: TradingAccount | null;
  metrics?: PortfolioMetrics | null;
  equityHistory?: any[];
  onSwitchAccount?: (accountId: string) => void;
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({
  accounts = [],
  activeAccount,
  metrics,
  equityHistory = [],
  onSwitchAccount = (_accountId?: string) => {},
}) => {
  const safeAccounts = accounts || [];
  const safeEquity = equityHistory || [];

  return (
    <div className="space-y-6">
      {/* 1. Portfolio Multi-Account Selector Grid */}
      <div className="bg-[#0d1322] border border-slate-800/90 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <PieChart className="w-5 h-5 text-cyan-400" />
              Institutional Portfolio & Capital Allocation
            </h2>
            <p className="text-xs text-slate-400">
              Cross-account liquidity, leverage limits, prop firm drawdowns, and real-time equity curve
            </p>
          </div>

          <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-800 text-slate-300">
            {safeAccounts.length} Connected Sub-Accounts
          </span>
        </div>

        {/* Account Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {safeAccounts.map((acc) => {
            const isActive = activeAccount?.id === acc.id;
            return (
              <div
                key={acc.id}
                onClick={() => onSwitchAccount(acc.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-cyan-950/20 border-cyan-500/80 shadow-md shadow-cyan-950/30'
                    : 'bg-[#090d16] border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-white truncate">{acc.name}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {acc.type}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-400">Equity:</span>
                    <span className="text-base font-bold font-mono text-white">
                      {formatCurrency(acc.equity)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-500">Unrealized:</span>
                    <span className={(acc.unrealizedPnL ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {formatCurrency(acc.unrealizedPnL, 2, true)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-500">Realized:</span>
                    <span className="text-slate-300 font-bold">
                      {formatCurrency(acc.realizedPnL)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>{acc.broker}</span>
                  <span className="text-cyan-400">{acc.leverage}x Lev</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Portfolio High-Level KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Consolidated Net Equity"
          value={formatCurrency(metrics?.totalEquity)}
          subtitle={`Cash: ${formatCurrency(metrics?.cashBalance)}`}
          icon={TrendingUp}
          variant="cyan"
        />
        <StatCard
          title="Sharpe Ratio"
          value={metrics ? metrics.sharpeRatio.toFixed(2) : '0.00'}
          subtitle={`Sortino: ${metrics ? metrics.sortinoRatio.toFixed(2) : '0.00'}`}
          icon={Shield}
          variant="positive"
        />
        <StatCard
          title="Maximum Drawdown"
          value={metrics ? `${metrics.maxDrawdownPercent}%` : '0%'}
          subtitle="High Water Mark Deficit"
          icon={Activity}
          variant="warning"
        />
        <StatCard
          title="Margin Utilization"
          value={
            metrics && (metrics.marginUsed != null || metrics.marginAvailable != null)
              ? `${(((metrics.marginUsed || 0) / ((metrics.marginUsed || 0) + (metrics.marginAvailable || 0) || 1)) * 100).toFixed(1)}%`
              : '0%'
          }
          subtitle={`Available: ${formatCurrency(metrics?.marginAvailable)}`}
          icon={DollarSign}
          variant="default"
        />
      </div>

      {/* 3. Equity Curve Multi-Period Visualizer */}
      <div className="bg-[#0d1322] border border-slate-800/90 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Equity Curve & Realized Drawdown Profile
            </h3>
            <p className="text-xs text-slate-400">
              High-water mark tracking with cumulative Cash Balance overlay
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2 py-1 rounded bg-slate-800 text-slate-300">
              30-Day Window
            </span>
            <span className="text-[11px] font-mono px-2 py-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              Mark-to-Market Real-time
            </span>
          </div>
        </div>

        <EquityCurveChart data={safeEquity} height={320} />
      </div>

      {/* 4. Solvency & Liquidity Buffer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-[#0d1322] border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Account Capital Allocation
          </span>
          <div className="space-y-2 font-mono text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Total Net Equity</span>
              <span className="text-white font-bold">{formatCurrency(metrics?.totalEquity)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Free Cash Balance</span>
              <span className="text-emerald-400">{formatCurrency(metrics?.cashBalance)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Committed Margin</span>
              <span className="text-slate-300">{formatCurrency(metrics?.marginUsed)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Available Maintenance Margin</span>
              <span className="text-cyan-400 font-bold">{formatCurrency(metrics?.marginAvailable)}</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0d1322] border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Trade Distribution & Expectancy Metrics
          </span>
          <div className="space-y-2 font-mono text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Total Executed Trades</span>
              <span className="text-white font-bold">{formatNumber(metrics?.totalTrades)} Trades</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Win Rate / Expectancy</span>
              <span className="text-emerald-400">
                {metrics ? `${metrics.winRate}% / ${metrics.expectancy}R` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Profit Factor</span>
              <span className="text-cyan-400 font-bold">{metrics?.profitFactor ?? 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Average Holding Duration</span>
              <span className="text-slate-300">{metrics?.averageHoldingMinutes ?? 0} mins</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
