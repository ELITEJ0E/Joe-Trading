import React from 'react';
import {
  TrendingUp,
  DollarSign,
  Layers,
  ArrowUpDown,
  Cpu,
  Brain,
  Zap,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  LineChart,
} from 'lucide-react';
import { StatCard } from '../common/StatCard.tsx';
import { EquityCurveChart } from '../common/EquityCurveChart.tsx';
import { StatusBadge } from '../common/StatusBadge.tsx';
import { TradeLifecycle } from '../trading/TradeLifecycle.tsx';
import {
  PortfolioMetrics,
  Position,
  TradingBot,
  MarketQuote,
  TradingAccount,
  AppTab,
  UnifiedTrade,
} from '../../types/client.ts';
import { formatCurrency, formatNumber } from '../../lib/formatters.ts';
import { cn } from '../../lib/utils.ts';

interface DashboardViewProps {
  metrics?: PortfolioMetrics | null;
  equityHistory?: any[];
  positions?: Position[];
  unifiedTrades?: UnifiedTrade[];
  bots?: TradingBot[];
  quotes?: MarketQuote[];
  activeAccount?: TradingAccount | null;
  onNavigate?: (tab: AppTab) => void;
  onOpenOrderModal?: (defaultSymbol?: string) => void;
  onSelectTrade?: (trade: UnifiedTrade) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  equityHistory = [],
  positions = [],
  unifiedTrades = [],
  bots = [],
  quotes = [],
  activeAccount,
  onNavigate = (_tab: AppTab) => {},
  onOpenOrderModal = (_sym?: string) => {},
  onSelectTrade = (_t: UnifiedTrade) => {},
}) => {
  const safePositions = positions || [];
  const safeBots = bots || [];
  const safeQuotes = quotes || [];
  const safeTrades = unifiedTrades || [];

  const runningBots = safeBots.filter((b) => b.status === 'RUNNING');
  const totalBotPnL = safeBots.reduce((acc, b) => acc + (b.totalPnL || 0), 0);
  const winRate = metrics?.winRate ?? 68.4;
  const profitFactor = metrics?.profitFactor ?? 2.14;
  const sharpeRatio = metrics?.sharpeRatio ?? 2.85;

  return (
    <div className="space-y-5">
      {/* 1. Executive Metric KPIs (Responsive Grid) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          id="stat-portfolio-equity"
          title="Portfolio Equity"
          value={formatCurrency(activeAccount?.equity || metrics?.totalEquity || 100000)}
          subtitle={`${safePositions.length} active positions open`}
          change={metrics?.dailyReturnPercent ?? 1.84}
          changeSuffix="%"
          variant="cyan"
          icon={DollarSign}
        />
        <StatCard
          id="stat-win-rate"
          title="Win Rate"
          value={`${winRate.toFixed(1)}%`}
          subtitle={`Profit Factor: ${profitFactor.toFixed(2)}`}
          change={metrics?.winRateChange ?? 2.4}
          changeSuffix="%"
          variant="positive"
          icon={TrendingUp}
        />
        <StatCard
          id="stat-sharpe-ratio"
          title="Sharpe Ratio"
          value={sharpeRatio.toFixed(2)}
          subtitle="Annualized risk efficiency"
          variant="purple"
          icon={Activity}
        />
        <StatCard
          id="stat-bot-fleet"
          title="Algorithmic Fleet"
          value={`${runningBots.length} Active`}
          subtitle={`Fleet P&L: ${formatCurrency(totalBotPnL, 2, true)}`}
          variant={runningBots.length > 0 ? 'positive' : 'default'}
          icon={Cpu}
          onClick={() => onNavigate('BOTS')}
        />
      </div>

      {/* 2. Primary Analytics Deck: Equity Curve & Market Ticker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main Equity Chart */}
        <div className="lg:col-span-2">
          <EquityCurveChart data={equityHistory} height={260} />
        </div>

        {/* Live Market Quick Tape */}
        <div className="bg-[#0c1220] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <LineChart className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold font-mono text-white tracking-wide uppercase">
                Market Radar
              </span>
            </div>
            <button
              onClick={() => onNavigate('MARKET')}
              className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 cursor-pointer"
            >
              Terminal <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2 flex-1">
            {safeQuotes.slice(0, 4).map((q) => {
              const isPositive = (q.change24h || 0) >= 0;
              return (
                <div
                  key={q.symbol}
                  className="p-2.5 rounded-xl bg-[#080d19] border border-slate-800/80 hover:border-slate-700 flex items-center justify-between transition-colors group cursor-pointer"
                  onClick={() => onOpenOrderModal(q.symbol)}
                >
                  <div>
                    <span className="font-mono font-bold text-xs text-white group-hover:text-cyan-300 transition-colors block">
                      {q.symbol}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      Vol: {q.volume24h ? `$${(q.volume24h / 1000000).toFixed(1)}M` : '—'}
                    </span>
                  </div>

                  <div className="text-right flex items-center gap-2.5">
                    <div>
                      <div className="font-mono font-bold text-xs text-white">
                        {formatCurrency(q.price)}
                      </div>
                      <div
                        className={cn(
                          'text-[10px] font-mono font-semibold flex items-center justify-end',
                          isPositive ? 'text-emerald-400' : 'text-rose-400'
                        )}
                      >
                        {isPositive ? '+' : ''}
                        {q.change24h?.toFixed(2) ?? '0.00'}%
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenOrderModal(q.symbol);
                      }}
                      className="p-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-black border border-cyan-500/20 transition-all cursor-pointer"
                      title="Quick Trade"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-2.5 rounded-xl bg-[#080d19] border border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              FIX Protocol 4.4 Feed
            </span>
            <span className="text-cyan-400">Zero Ingestion Lag</span>
          </div>
        </div>
      </div>

      {/* 3. Active Positions Section (Responsive Table on Desktop, Cards on Mobile) */}
      <div className="bg-[#0c1220] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Open Market Exposure & Trade Lifecycle
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Real-time mark-to-market positions linked to the 10-step institutional pipeline
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
            <button
              onClick={() => onNavigate('POSITIONS')}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
            >
              Manage Positions ({safePositions.length}) <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {safePositions.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 font-mono">
            No active positions open. Use the Trade Wizard or Pro Terminal to execute new orders.
          </div>
        ) : (
          <div className="space-y-3">
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800 text-[10px] uppercase">
                    <th className="pb-2.5 font-bold">Symbol / Side</th>
                    <th className="pb-2.5 font-bold">Size</th>
                    <th className="pb-2.5 font-bold">Entry Price</th>
                    <th className="pb-2.5 font-bold">Mark Price</th>
                    <th className="pb-2.5 font-bold">Unrealized P&L</th>
                    <th className="pb-2.5 font-bold">Lifecycle State</th>
                    <th className="pb-2.5 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {safePositions.map((pos) => {
                    const isProfit = (pos.unrealizedPnL || 0) >= 0;
                    const matchingTrade = safeTrades.find((t) => t.position?.id === pos.id || t.symbol === pos.symbol);

                    return (
                      <tr
                        key={pos.id}
                        className="hover:bg-slate-800/30 transition-colors group cursor-pointer"
                        onClick={() => matchingTrade && onSelectTrade(matchingTrade)}
                      >
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{pos.symbol}</span>
                            <StatusBadge status={pos.side} size="sm" />
                          </div>
                        </td>
                        <td className="py-3 text-slate-200">{pos.quantity}</td>
                        <td className="py-3 text-slate-300">{formatCurrency(pos.entryPrice)}</td>
                        <td className="py-3 text-white font-bold">{formatCurrency(pos.currentPrice)}</td>
                        <td className="py-3">
                          <span
                            className={cn(
                              'font-bold inline-flex items-center gap-1',
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
                        <td className="py-3">
                          {matchingTrade ? (
                            <TradeLifecycle trade={matchingTrade} compact />
                          ) : (
                            <StatusBadge status="ACTIVE" size="sm" />
                          )}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (matchingTrade) onSelectTrade(matchingTrade);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-mono border border-slate-700 transition-colors cursor-pointer"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:hidden">
              {safePositions.map((pos) => {
                const isProfit = (pos.unrealizedPnL || 0) >= 0;
                const matchingTrade = safeTrades.find((t) => t.position?.id === pos.id || t.symbol === pos.symbol);

                return (
                  <div
                    key={pos.id}
                    onClick={() => matchingTrade && onSelectTrade(matchingTrade)}
                    className="p-3.5 rounded-xl bg-[#080d19] border border-slate-800 hover:border-slate-700 transition-all space-y-2.5 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm font-mono">{pos.symbol}</span>
                        <StatusBadge status={pos.side} size="sm" />
                      </div>
                      <span
                        className={cn(
                          'text-xs font-mono font-bold',
                          isProfit ? 'text-emerald-400' : 'text-rose-400'
                        )}
                      >
                        {isProfit ? '+' : ''}
                        {formatCurrency(pos.unrealizedPnL, 2, true)}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1 p-2 rounded-lg bg-[#0c1220] border border-slate-800/80 text-[10px] font-mono">
                      <div>
                        <span className="text-slate-400 block">Size</span>
                        <span className="text-white font-bold">{pos.quantity}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Entry</span>
                        <span className="text-slate-300">{formatCurrency(pos.entryPrice)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Mark</span>
                        <span className="text-white font-bold">{formatCurrency(pos.currentPrice)}</span>
                      </div>
                    </div>

                    {matchingTrade && (
                      <div className="pt-1">
                        <TradeLifecycle trade={matchingTrade} compact />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 4. Cognitive Insight Banner */}
      <div className="p-4 rounded-2xl bg-[#120e24] border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md shadow-purple-950/20">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 shrink-0">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                Behavioral Alpha Invalidation Alert
              </span>
              <span className="px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-300 text-[9px] font-mono font-bold">
                HIGH DISCIPLINE
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              Your win rate increases by <strong className="text-emerald-400">18.5%</strong> when executing trades with a predefined Stop Loss registered before order submission.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('BEHAVIOR')}
          className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-bold transition-all shadow-md shadow-purple-950/40 cursor-pointer whitespace-nowrap self-stretch sm:self-auto text-center"
        >
          View Cognitive Breakdown
        </button>
      </div>
    </div>
  );
};
