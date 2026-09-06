import React from 'react';
import {
  Wallet,
  DollarSign,
  TrendingUp,
  PieChart as PieIcon,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { StatCard } from '../common/StatCard.tsx';
import { TradingAccount, Position } from '../../types/client.ts';
import { formatCurrency } from '../../lib/formatters.ts';
import { cn } from '../../lib/utils.ts';

interface PortfolioViewProps {
  accounts?: TradingAccount[];
  activeAccount?: TradingAccount | null;
  positions?: Position[];
  onSwitchAccount?: (accId: string) => void;
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({
  accounts = [],
  activeAccount,
  positions = [],
  onSwitchAccount = (_accId: string) => {},
}) => {
  const safeAccounts = accounts || [];
  const safePositions = positions || [];

  const totalEquity = safeAccounts.reduce((acc, a) => acc + (a.equity || 0), 0);
  const totalCash = safeAccounts.reduce((acc, a) => acc + (a.cash || 0), 0);
  const totalUnrealizedPnL = safeAccounts.reduce((acc, a) => acc + (a.unrealizedPnL || 0), 0);
  const totalMarginUsed = safeAccounts.reduce((acc, a) => acc + (a.marginUsed || 0), 0);

  const leverageRatio = totalEquity > 0 ? (totalMarginUsed / totalEquity).toFixed(2) : '0.00';

  return (
    <div className="space-y-5">
      {/* 1. Header */}
      <div className="bg-[#0c1220] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Wallet className="w-5 h-5 text-cyan-400" />
              Consolidated Portfolio & Multi-Account Liquidity
            </h2>
            <p className="text-xs text-slate-400">
              Cross-broker margin management, purchasing power allocation, and leverage risk ceilings
            </p>
          </div>
        </div>
      </div>

      {/* 2. Portfolio KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Consolidated Net Worth"
          value={formatCurrency(totalEquity)}
          subtitle={`${safeAccounts.length} Connected Accounts`}
          variant="cyan"
          icon={DollarSign}
        />
        <StatCard
          title="Unallocated Free Cash"
          value={formatCurrency(totalCash)}
          subtitle={`${((totalCash / (totalEquity || 1)) * 100).toFixed(1)}% Liquidity Reserve`}
          variant="positive"
          icon={TrendingUp}
        />
        <StatCard
          title="Total Margin Locked"
          value={formatCurrency(totalMarginUsed)}
          subtitle={`Effective Leverage: ${leverageRatio}x`}
          variant="warning"
          icon={ShieldCheck}
        />
        <StatCard
          title="Combined Open P&L"
          value={formatCurrency(totalUnrealizedPnL, 2, true)}
          subtitle="Mark-to-market floating"
          variant={totalUnrealizedPnL >= 0 ? 'positive' : 'negative'}
          icon={TrendingUp}
        />
      </div>

      {/* 3. Multi-Account Grid */}
      <div className="bg-[#0c1220] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
            Connected Sub-Accounts & Venues
          </h3>
          <span className="text-xs font-mono text-cyan-400 font-bold">
            {safeAccounts.length} Accounts Synchronized
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {safeAccounts.map((acc) => {
            const isSelected = activeAccount?.id === acc.id;
            const isProfit = (acc.unrealizedPnL || 0) >= 0;

            return (
              <div
                key={acc.id}
                onClick={() => onSwitchAccount(acc.id)}
                className={cn(
                  'p-4 rounded-2xl border transition-all cursor-pointer space-y-3',
                  isSelected
                    ? 'bg-cyan-950/20 border-cyan-500 shadow-md shadow-cyan-950/30'
                    : 'bg-[#080d19] border-slate-800 hover:border-slate-700'
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-sm text-white font-mono block">{acc.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {acc.broker} • {acc.type}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      ACTIVE
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 pt-1 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Net Equity:</span>
                    <span className="text-white font-bold">{formatCurrency(acc.equity)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Free Cash:</span>
                    <span className="text-slate-300">{formatCurrency(acc.cash)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Floating P&L:</span>
                    <span className={cn('font-bold', isProfit ? 'text-emerald-400' : 'text-rose-400')}>
                      {isProfit ? '+' : ''}
                      {formatCurrency(acc.unrealizedPnL, 2, true)}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>Margin: {formatCurrency(acc.marginUsed || 0)}</span>
                  <span>Currency: {acc.currency || 'USD'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
