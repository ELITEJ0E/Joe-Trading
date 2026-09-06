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
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { StatCard } from '../common/StatCard.tsx';
import { EquityCurveChart } from '../common/EquityCurveChart.tsx';
import { formatCurrency, formatNumber } from '../../lib/formatters.ts';
import {
  PortfolioMetrics,
  TradingAccount,
  Position,
  TradingBot,
  RiskDecision,
  MarketQuote,
  Order,
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
  onSelectSymbol?: (symbol: string) => void;
  onClosePosition?: (id: string) => void;
  onNavigateTab?: (tab: any) => void;
  onOpenOrderModal?: () => void;
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
  onSelectSymbol = (_sym?: string) => {},
  onClosePosition = (_id?: string) => {},
  onNavigateTab = (_tab?: any) => {},
  onOpenOrderModal = () => {},
  onSelectPosition = (_pos?: any) => {},
}) => {
  const safeQuotes = marketQuotes || quotes || [];
  const safePositions = positions || [];
  const safeBots = bots || [];
  const safeEquity = equityHistory || [];
  const openPositions = safePositions.filter((p) => p.isOpen);

  return (
    <div className="space-y-6">
      {/* 1. Metric Stat Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          title="Total Equity"
          value={formatCurrency(metrics?.totalEquity)}
          change={metrics?.todayPnLPercent}
          changeSuffix="%"
          subtitle={`Cash: ${formatCurrency(metrics?.cashBalance)}`}
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
          subtitle={`Peak Max DD: ${metrics?.maxDrawdownPercent || 0}%`}
          icon={AlertTriangle}
          variant={(metrics?.drawdownPercent || 0) > 4 ? 'negative' : 'warning'}
        />
      </div>

      {/* 2. Main Analytics & Interactive Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <EquityCurveChart data={safeEquity} height={280} />
        </div>

        {/* Live Market Ticker & Quick Watchlist */}
        <div className="bg-[#0d1322] border border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Institutional Market Feeds
              </span>
              <button
                onClick={() => onNavigateTab('market')}
                className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
              >
                Full Terminal →
              </button>
            </div>

            <div className="space-y-2">
              {safeQuotes.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500 font-mono">
                  Loading quotes feed...
                </div>
              ) : (
                safeQuotes.map((q) => (
                  <div
                    key={q.symbol}
                    onClick={() => onSelectSymbol(q.symbol)}
                    className="flex items-center justify-between p-2 rounded-xl bg-[#090d16] hover:bg-slate-800/60 border border-slate-800/60 hover:border-slate-700 cursor-pointer transition-all"
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
                ))
              )}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Aggregated Orderbook Feed</span>
            <span className="font-mono text-cyan-400 text-[11px]">Normalized Layer</span>
          </div>
        </div>
      </div>

      {/* 3. Open Positions & Active Trading Bots */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Open Positions Table */}
        <div className="lg:col-span-2 bg-[#0d1322] border border-slate-800/90 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold text-white uppercase tracking-wider">
                Active Open Positions ({openPositions.length})
              </span>
            </div>
            <button
              onClick={() => onNavigateTab('positions')}
              className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
            >
              Manage Positions →
            </button>
          </div>

          {openPositions.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No open market positions. Portfolio is currently 100% in cash.
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
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              pos.side === 'LONG'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {pos.side}
                          </span>
                        </td>
                        <td className="py-2.5 text-slate-300">{pos.quantity}</td>
                        <td className="py-2.5 text-slate-300">{formatCurrency(pos.entryPrice)}</td>
                        <td className="py-2.5 text-slate-300">{formatCurrency(pos.currentPrice)}</td>
                        <td className={`py-2.5 text-right font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
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

        {/* Automated Bot Gateway Snapshot */}
        <div className="bg-[#0d1322] border border-slate-800/90 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-semibold text-white uppercase tracking-wider">
                  Algorithmic Bots ({safeBots.length})
                </span>
              </div>
              <button
                onClick={() => onNavigateTab('bots')}
                className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
              >
                Gateway →
              </button>
            </div>

            <div className="space-y-3">
              {safeBots.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  No automated bots registered.
                </div>
              ) : (
                safeBots.map((bot) => (
                  <div key={bot.id} className="p-3 bg-[#090d16] border border-slate-800/80 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">{bot.name}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          bot.status === 'RUNNING'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {bot.status}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 truncate">{bot.strategyName}</p>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/60">
                      <span>PnL: {formatCurrency(bot.totalPnL, 2, true)}</span>
                      <span>Win Rate: {bot.winRate}%</span>
                      <span>{bot.tradesCount} Trades</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Risk Status:</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" /> Normal Execution
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
