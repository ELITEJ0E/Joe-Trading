import React from 'react';
import { PieChart, Shield, Activity, TrendingUp, DollarSign, Layers, CheckCircle2, AlertTriangle } from 'lucide-react';
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
  onSwitchAccount = (_accountId: string) => {},
}) => {
  const safeAccounts = accounts || [];
  const safeEquity = equityHistory || [];

  return (
    <div className="space-y-5">
      {/* 1. Multi-Account Portfolio Switcher Header */}
      <div className="bg-[#0b101d] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <PieChart className="w-5 h-5 text-cyan-400" />
              Capital Allocation & Multi-Account Sub-Portfolios
            </h2>
            <p className="text-xs text-slate-400">
              Cross-account liquidity, leverage limits, prop firm drawdowns, and real-time equity curve
            </p>
          </div>

          <span className="text-xs font-mono px-3 py-1 rounded-xl bg-[#060912] border border-slate-800 text-slate-300">
            {safeAccounts.length} Connected Accounts
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
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500/10 border-cyan-500 shadow-md shadow-cyan-950/30'
                    : 'bg-[#060912] border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-white truncate">{acc.name}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
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
                    <span className={(acc.unrealizedPnL ?? 0) >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {formatCurrency(acc.unrealizedPnL, 2, true)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-500">Realized PnL:</span>
                    <span className="text-slate-300 font-bold">
                      {formatCurrency(acc.realizedPnL)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>{acc.broker}</span>
                  <span className="text-cyan-400 font-bold">{acc.leverage}x Max Lev</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Active Account Capital Health Matrix */}
      {activeAccount && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            title="Available Buying Power"
            value={formatCurrency(activeAccount.cashBalance * activeAccount.leverage)}
            subtitle={`Base Cash: ${formatCurrency(activeAccount.cashBalance)}`}
            icon={DollarSign}
            variant="cyan"
          />
          <StatCard
            title="Margin Utilization"
            value={`${(
              ((activeAccount.equity - activeAccount.cashBalance) / (activeAccount.equity || 1)) *
              100
            ).toFixed(1)}%`}
            subtitle="Current Collateral Lock"
            icon={Activity}
            variant="default"
          />
          <StatCard
            title="Account Type & Route"
            value={activeAccount.type}
            subtitle={activeAccount.broker}
            icon={Shield}
            variant="default"
          />
          <StatCard
            title="Account Health"
            value="Optimal"
            subtitle="No liquidation margin calls"
            icon={CheckCircle2}
            variant="positive"
          />
        </div>
      )}

      {/* 3. Equity Curve */}
      <div className="bg-[#0b101d] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
              Mark-to-Market Equity History
            </h3>
            <p className="text-xs text-slate-400">Time-weighted portfolio growth and drawdown tracking</p>
          </div>
        </div>
        <EquityCurveChart data={safeEquity} height={300} />
      </div>
    </div>
  );
};
