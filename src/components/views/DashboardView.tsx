import React from 'react';
import {
  DollarSign,
  TrendingUp,
  Percent,
  Activity,
  AlertTriangle,
  Cpu,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Plus,
  BookOpen,
  Brain,
  Clock,
  Sparkles,
} from 'lucide-react';
import { StatCard } from '../common/StatCard.tsx';
import { EquityCurveChart } from '../common/EquityCurveChart.tsx';
import { StatusBadge } from '../common/StatusBadge.tsx';
import { formatCurrency, formatNumber } from '../../lib/formatters.ts';
import {
  PortfolioMetrics,
  TradingAccount,
  Position,
  TradingBot,
  RiskDecision,
  MarketQuote,
  Order,
  KillSwitchState,
  BehaviorInsight,
} from '../../types/client.ts';

interface DashboardViewProps {
  metrics?: PortfolioMetrics | null;
  activeAccount?: TradingAccount | null;
  account?: TradingAccount | null;
  equityHistory?: any[];
  positions?: Position[];
  bots?: TradingBot[];
  recentRiskDecisions?: RiskDecision[];
  marketQuotes?: MarketQuote[];
  quotes?: MarketQuote[];
  orders?: Order[];
  killSwitch?: KillSwitchState;
  behaviorData?: any;
  onSelectSymbol?: (symbol: string) => void;
  onClosePosition?: (id: string) => void;
  onNavigateTab?: (tab: any) => void;
  onOpenOrderModal?: (symbol?: string) => void;
  onSelectPosition?: (pos: Position) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  activeAccount,
  account,
  equityHistory = [],
  positions = [],
  bots = [],
  recentRiskDecisions = [],
  marketQuotes,
  quotes,
  orders = [],
  killSwitch,
  behaviorData,
  onSelectSymbol = (_sym: string) => {},
  onClosePosition = (_id: string) => {},
  onNavigateTab = (_tab: any) => {},
  onOpenOrderModal = (_sym?: string) => {},
  onSelectPosition = (_pos: Position) => {},
}) => {
  const safeQuotes = marketQuotes || quotes || [];
  const safePositions = positions || [];
  const safeBots = bots || [];
  const safeEquity = equityHistory || [];
  const openPositions = safePositions.filter((p) => p.isOpen);
  const openOrders = (orders || []).filter((o) => o.status === 'OPEN' || o.status === 'PENDING');
  const runningBots = safeBots.filter((b) => b.status === 'RUNNING');
  const topInsight: BehaviorInsight | undefined = behaviorData?.insights?.[0];

  const effectiveAccount = activeAccount || account;
  const isHalted = killSwitch?.isActive;
  const isDrawdownHigh = (metrics?.drawdownPercent || 0) > 4;

  return (
    <div className="space-y-5">
      {/* 1. URGENT ATTENTION / RISK BANNER (Answers: "What should I pay attention to?") */}
      {isHalted ? (
        <div className="p-4 bg-rose-500/15 border border-rose-500/50 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-rose-950/30 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/20 text-rose-300 rounded-xl">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-white font-mono">
                EMERGENCY TRADING HALT ACTIVE
              </div>
              <div className="text-xs text-rose-300">
                All order submissions and algorithmic bots are locked down.
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('RISK_CENTER')}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold font-mono transition-colors cursor-pointer"
          >
            Review Risk Center →
          </button>
        </div>
      ) : isDrawdownHigh ? (
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Drawdown Warning:</strong> Portfolio is currently at {metrics?.drawdownPercent}% drawdown (threshold: 5.0%). Position sizing discipline required.
            </span>
          </div>
          <button
            onClick={() => onNavigateTab('RISK_CENTER')}
            className="text-xs font-bold text-amber-400 hover:underline shrink-0 cursor-pointer"
          >
            View Limits →
          </button>
        </div>
      ) : null}

      {/* 2. EXECUTIVE KPI MATRIX (Answers: "How is my portfolio doing?") */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          title="Total Net Equity"
          value={formatCurrency(metrics?.totalEquity || effectiveAccount?.equity)}
          change={metrics?.todayPnLPercent}
          changeSuffix="%"
          subtitle={`Cash: ${formatCurrency(metrics?.cashBalance || effectiveAccount?.cashBalance)}`}
          icon={DollarSign}
          variant="cyan"
        />
        <StatCard
          title="Today P&L"
          value={formatCurrency(metrics?.todayPnL, 2, true)}
          change={metrics?.todayPnLPercent}
          subtitle="Realized + Mark-to-Market"
          icon={TrendingUp}
          variant={(metrics?.todayPnL || 0) >= 0 ? 'positive' : 'negative'}
        />
        <StatCard
          title="Win Rate"
          value={metrics ? `${metrics.winRate}%` : '0%'}
          subtitle={`${metrics?.winningTrades || 0}W / ${metrics?.losingTrades || 0}L`}
          icon={Percent}
          variant="default"
        />
        <StatCard
          title="Profit Factor"
          value={metrics?.profitFactor || 0}
          subtitle={`Expectancy: ${metrics?.expectancy || 0}R`}
          icon={Activity}
          variant="positive"
        />
        <StatCard
          title="Sharpe Ratio"
          value={metrics?.sharpeRatio || 0}
          subtitle={`Sortino: ${metrics?.sortinoRatio || 0}`}
          icon={ShieldCheck}
          variant="default"
        />
        <StatCard
          title="Drawdown"
          value={metrics ? `${metrics.drawdownPercent}%` : '0%'}
          subtitle={`Peak Max: ${metrics?.maxDrawdownPercent || 0}%`}
          icon={AlertTriangle}
          variant={(metrics?.drawdownPercent || 0) > 4 ? 'negative' : 'warning'}
        />
      </div>

      {/* 3. PRIMARY OPERATIONAL GRID: Interactive Equity Chart (8 cols) + Market Watchlist (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-[#0b101d] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                Mark-to-Market Equity Evolution
              </h3>
              <p className="text-[11px] text-slate-400">Continuous sub-account equity trajectory</p>
            </div>
            <button
              onClick={() => onNavigateTab('PORTFOLIO')}
              className="text-[11px] font-mono text-cyan-400 hover:underline cursor-pointer"
            >
              Portfolio Details →
            </button>
          </div>
          <EquityCurveChart data={safeEquity} height={250} />
        </div>

        {/* Live Market Ticker & Order Routing */}
        <div className="bg-[#0b101d] border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                Market Feeds & Terminal
              </span>
              <button
                onClick={() => onNavigateTab('MARKET')}
                className="text-[11px] text-cyan-400 hover:underline cursor-pointer font-mono"
              >
                Terminal →
              </button>
            </div>

            <div className="space-y-2">
              {safeQuotes.slice(0, 5).map((q) => (
                <div
                  key={q.symbol}
                  onClick={() => onSelectSymbol(q.symbol)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#060912] hover:bg-slate-800/60 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-all"
                >
                  <div>
                    <span className="font-bold text-xs text-white font-mono">{q.symbol}</span>
                    <span className="block text-[10px] text-slate-500 font-mono">
                      Spread: ${q.spread.toFixed(2)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-xs text-white">
                      {formatCurrency(q.price)}
                    </span>
                    <span
                      className={`block text-[10px] font-mono font-medium ${
                        q.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {q.change24h >= 0 ? '+' : ''}
                      {q.change24h.toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Execution Protocol:</span>
            <span className="text-cyan-400 font-semibold">Normalized FIX Layer</span>
          </div>
        </div>
      </div>

      {/* 4. ACTIVE EXECUTION DESK: Open Positions (8 cols) + Monitored Bots (4 cols) (Answers: "What is active?") */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Open Positions Table */}
        <div className="lg:col-span-2 bg-[#0b101d] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                Active Open Positions ({openPositions.length})
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onOpenOrderModal()}
                className="text-[11px] font-mono font-bold text-cyan-400 hover:text-cyan-300 cursor-pointer"
              >
                + New Order
              </button>
              <button
                onClick={() => onNavigateTab('POSITIONS')}
                className="text-[11px] font-mono text-slate-400 hover:text-white cursor-pointer"
              >
                Manage Positions →
              </button>
            </div>
          </div>

          {openPositions.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 font-mono">
              No open market positions. Portfolio is currently in 100% cash preservation.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-mono text-[10px]">
                    <th className="pb-2">Asset</th>
                    <th className="pb-2">Side</th>
                    <th className="pb-2">Size</th>
                    <th className="pb-2">Entry</th>
                    <th className="pb-2">Current</th>
                    <th className="pb-2 text-right">Unrealized P&L</th>
                    <th className="pb-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {openPositions.map((pos) => {
                    const isProfit = pos.unrealizedPnL >= 0;
                    return (
                      <tr key={pos.id} className="hover:bg-slate-800/30">
                        <td className="py-2.5 font-bold text-white">{pos.symbol}</td>
                        <td className="py-2.5">
                          <StatusBadge status={pos.side} size="sm" showIcon={false} />
                        </td>
                        <td className="py-2.5 text-slate-300">{pos.quantity}</td>
                        <td className="py-2.5 text-slate-300">{formatCurrency(pos.entryPrice)}</td>
                        <td className="py-2.5 text-slate-300">{formatCurrency(pos.currentPrice)}</td>
                        <td
                          className={`py-2.5 text-right font-bold ${
                            isProfit ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isProfit ? '+' : ''}${pos.unrealizedPnL.toFixed(2)} ({isProfit ? '+' : ''}
                          {pos.unrealizedPnLPercent.toFixed(2)}%)
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={() => onClosePosition(pos.id)}
                            className="px-2 py-1 text-[10px] font-bold rounded bg-rose-950/50 hover:bg-rose-900 text-rose-300 border border-rose-800/40 transition-colors cursor-pointer"
                          >
                            Close
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Monitored Bot Agents (Answers: "How are bots performing?") */}
        <div className="bg-[#0b101d] border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                  Monitored Bots ({runningBots.length}/{safeBots.length} Running)
                </span>
              </div>
              <button
                onClick={() => onNavigateTab('BOTS')}
                className="text-[11px] text-cyan-400 hover:underline cursor-pointer font-mono"
              >
                Gateway →
              </button>
            </div>

            <div className="space-y-2.5">
              {safeBots.slice(0, 3).map((bot) => (
                <div
                  key={bot.id}
                  className="p-3 bg-[#060912] border border-slate-800/80 rounded-xl space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white font-mono">{bot.name}</span>
                    <StatusBadge status={bot.status} size="sm" />
                  </div>

                  <p className="text-[11px] text-slate-400 truncate">{bot.strategyName}</p>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/60">
                    <span className={(bot.totalPnL || 0) >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      PnL: {formatCurrency(bot.totalPnL, 2, true)}
                    </span>
                    <span>WR: {bot.winRate}%</span>
                    <span>{bot.tradesCount} Trades</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Algorithmic Gate:</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[11px] font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" /> Heartbeats Active
            </span>
          </div>
        </div>
      </div>

      {/* 5. COGNITIVE STRIP & BEHAVIORAL LEARNING (Answers: "What can I learn from my behavior?") */}
      {topInsight && (
        <div className="p-4 bg-gradient-to-r from-purple-950/20 via-[#0b101d] to-[#0b101d] border border-purple-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 shrink-0">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white font-mono">{topInsight.title}</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  Cognitive Insight
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                {topInsight.description}
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('ANALYTICS')}
            className="px-3.5 py-2 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 rounded-xl text-xs font-bold font-mono transition-colors cursor-pointer shrink-0"
          >
            Explore Behavioral Intelligence →
          </button>
        </div>
      )}
    </div>
  );
};
