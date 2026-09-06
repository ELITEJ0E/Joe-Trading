import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Brain,
  Zap,
  DollarSign,
  Activity,
  ShieldCheck,
  Percent,
  Clock,
  AlertTriangle,
  Award,
  Layers,
  Sparkles,
} from 'lucide-react';
import { StatCard } from '../common/StatCard.tsx';
import { EquityCurveChart } from '../common/EquityCurveChart.tsx';
import {
  PortfolioMetrics,
  Strategy,
  BehaviorInsight,
  EmotionState,
} from '../../types/client.ts';
import { formatCurrency, formatNumber } from '../../lib/formatters.ts';

interface AnalyticsViewProps {
  metrics?: PortfolioMetrics | null;
  equityHistory?: any[];
  strategies?: Strategy[];
  behaviorData?: any;
  executionData?: any;
  initialTab?: 'PERFORMANCE' | 'STRATEGIES' | 'EXECUTION' | 'BEHAVIOR';
}

const DEFAULT_EXECUTION_QUALITY = {
  avgSlippageBps: 0.85,
  totalFeesPaid: 342.8,
  avgOrderLatencyMs: 32.4,
  avgFillDurationMs: 48.2,
  fillRatePercent: 99.2,
  rejectionRatePercent: 2.1,
  slippageByVenue: [
    { venue: 'Rithmic (Apex)', slippageBps: 0.6, volume: 1450000 },
    { venue: 'Binance VIP', slippageBps: 0.9, volume: 890000 },
    { venue: 'IBKR Pro Smart', slippageBps: 1.1, volume: 620000 },
  ],
  latencyHistory: [
    { timestamp: '09:30', latencyMs: 28 },
    { timestamp: '10:00', latencyMs: 34 },
    { timestamp: '11:00', latencyMs: 25 },
    { timestamp: '12:00', latencyMs: 22 },
    { timestamp: '13:00', latencyMs: 31 },
    { timestamp: '14:00', latencyMs: 42 },
    { timestamp: '15:00', latencyMs: 36 },
    { timestamp: '16:00', latencyMs: 29 },
  ],
};

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  metrics,
  equityHistory = [],
  strategies = [],
  behaviorData,
  executionData,
  initialTab = 'PERFORMANCE',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'PERFORMANCE' | 'STRATEGIES' | 'EXECUTION' | 'BEHAVIOR'
  >(initialTab);

  const insights: BehaviorInsight[] = behaviorData?.insights || [];
  const emotionalDistribution: {
    emotion: EmotionState;
    count: number;
    winRate: number;
    avgPnL: number;
  }[] = behaviorData?.emotionalDistribution || [];
  const calibration: { scoreRange: string; tradeCount: number; actualWinRate: number }[] =
    behaviorData?.confidenceCalibration || [];

  const quality = {
    ...DEFAULT_EXECUTION_QUALITY,
    ...(executionData?.executionQuality || {}),
  };

  return (
    <div className="space-y-5">
      {/* Header & Section Navigation */}
      <div className="bg-[#0b101d] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              Trading Intelligence & Analytics Suite
            </h2>
            <p className="text-xs text-slate-400">
              Cross-strategy alpha, execution microstructure, and cognitive decision modeling
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-[#060912] rounded-xl border border-slate-800 self-stretch sm:self-auto overflow-x-auto">
            <button
              onClick={() => setActiveSubTab('PERFORMANCE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeSubTab === 'PERFORMANCE'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Performance
            </button>

            <button
              onClick={() => setActiveSubTab('STRATEGIES')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeSubTab === 'STRATEGIES'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Strategies
            </button>

            <button
              onClick={() => setActiveSubTab('EXECUTION')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeSubTab === 'EXECUTION'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              Execution
            </button>

            <button
              onClick={() => setActiveSubTab('BEHAVIOR')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeSubTab === 'BEHAVIOR'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              Behavior
            </button>
          </div>
        </div>
      </div>

      {/* 1. PERFORMANCE SUB-TAB */}
      {activeSubTab === 'PERFORMANCE' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard
              title="Total Net Equity"
              value={formatCurrency(metrics?.totalEquity)}
              change={metrics?.todayPnLPercent}
              changeSuffix="%"
              subtitle="Cash + Open Value"
              icon={DollarSign}
              variant="cyan"
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
              subtitle="Risk-Adjusted Alpha"
              icon={ShieldCheck}
              variant="default"
            />
            <StatCard
              title="Sortino Ratio"
              value={metrics?.sortinoRatio || 0}
              subtitle="Downside Deviation Ratio"
              icon={TrendingUp}
              variant="default"
            />
            <StatCard
              title="Max Drawdown"
              value={metrics ? `${metrics.maxDrawdownPercent}%` : '0%'}
              subtitle={`Current DD: ${metrics?.drawdownPercent || 0}%`}
              icon={AlertTriangle}
              variant="warning"
            />
          </div>

          <div className="bg-[#0b101d] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Portfolio Equity Curve & Mark-to-Market Evolution
                </h3>
                <p className="text-xs text-slate-400">Cumulative performance timeline</p>
              </div>
            </div>
            <EquityCurveChart data={equityHistory} height={320} />
          </div>
        </div>
      )}

      {/* 2. STRATEGIES SUB-TAB */}
      {activeSubTab === 'STRATEGIES' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {strategies.map((strat) => (
              <div
                key={strat.id}
                className="bg-[#0b101d] border border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm hover:border-slate-700 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white">{strat.name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    {strat.type}
                  </span>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2">{strat.description}</p>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Win Rate</span>
                    <span className="font-bold text-emerald-400">{strat.winRate}%</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Profit Factor</span>
                    <span className="font-bold text-white">{strat.profitFactor}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Expectancy</span>
                    <span className="font-bold text-cyan-300">{strat.expectancy}R</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Trades Sample</span>
                    <span className="font-bold text-slate-300">{strat.sampleSize}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. EXECUTION SUB-TAB */}
      {activeSubTab === 'EXECUTION' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              title="Average Slippage"
              value={`${quality.avgSlippageBps} bps`}
              subtitle="Benchmark Deviation"
              icon={Activity}
              variant="cyan"
            />
            <StatCard
              title="Order Latency"
              value={`${quality.avgOrderLatencyMs} ms`}
              subtitle="Exchange Gate Transit"
              icon={Clock}
              variant="positive"
            />
            <StatCard
              title="Fill Rate"
              value={`${quality.fillRatePercent}%`}
              subtitle="Full Fills Completed"
              icon={ShieldCheck}
              variant="positive"
            />
            <StatCard
              title="Cumulative Fees"
              value={`$${quality.totalFeesPaid.toFixed(2)}`}
              subtitle="Commission & Taker Drag"
              icon={DollarSign}
              variant="default"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-[#0b101d] border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                <span className="font-bold text-white uppercase tracking-wider">
                  Venue Slippage Breakdown
                </span>
                <span className="text-slate-400 font-mono">Volume-Weighted</span>
              </div>
              <div className="space-y-2 font-mono text-xs">
                {quality.slippageByVenue.map((v: any) => (
                  <div
                    key={v.venue}
                    className="p-3 bg-[#060912] rounded-xl border border-slate-800/80 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-white">{v.venue}</div>
                      <div className="text-[10px] text-slate-500">
                        Vol: ${(v.volume / 1e6).toFixed(2)}M
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-amber-400 font-bold">{v.slippageBps} bps</span>
                      <span className="block text-[10px] text-emerald-400">High Liquidity</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#0b101d] border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                <span className="font-bold text-white uppercase tracking-wider">
                  Gateway Latency Timeline
                </span>
                <span className="text-cyan-400 font-mono">Real-time Ping</span>
              </div>
              <div className="grid grid-cols-4 gap-2 font-mono text-xs">
                {quality.latencyHistory.map((l: any) => (
                  <div
                    key={l.timestamp}
                    className="p-2.5 bg-[#060912] rounded-xl border border-slate-800 text-center"
                  >
                    <span className="text-[10px] text-slate-500 block">{l.timestamp}</span>
                    <span className="font-bold text-white">{l.latencyMs}ms</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. BEHAVIOR & COGNITIVE SUB-TAB */}
      {activeSubTab === 'BEHAVIOR' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((ins) => (
              <div
                key={ins.id}
                className="bg-[#0b101d] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-white">{ins.title}</span>
                      <span className="block text-[10px] font-mono text-purple-400">
                        Sample: {ins.sampleSize} Trades | Confidence:{' '}
                        {(ins.confidenceScore * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-800 text-slate-300">
                    BIAS AUDIT
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{ins.description}</p>

                <div className="p-3 bg-[#060912] rounded-xl border border-slate-800 space-y-1 text-xs">
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                    System Intervention:
                  </span>
                  <p className="text-cyan-400 text-xs">{ins.recommendation}</p>
                </div>

                <div className="text-[11px] font-mono text-rose-400 pt-1 border-t border-slate-800">
                  Impact: {ins.metricImpact}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-[#0b101d] border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-bold text-white">
                <span>EMOTIONAL STATE VS. REALIZED WIN RATE</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[10px]">
                      <th className="pb-2">State</th>
                      <th className="pb-2">Trades</th>
                      <th className="pb-2">Win Rate</th>
                      <th className="pb-2 text-right">Avg P&L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {emotionalDistribution.map((em) => (
                      <tr key={em.emotion} className="hover:bg-slate-800/30">
                        <td className="py-2 text-white font-bold">{em.emotion}</td>
                        <td className="py-2 text-slate-400">{em.count}</td>
                        <td className="py-2 font-bold text-emerald-400">{em.winRate}%</td>
                        <td
                          className={`py-2 text-right font-bold ${
                            em.avgPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {formatCurrency(em.avgPnL, 2, true)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-[#0b101d] border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-bold text-white">
                <span>CONFIDENCE SCORE CALIBRATION</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[10px]">
                      <th className="pb-2">Confidence Range</th>
                      <th className="pb-2">Trade Count</th>
                      <th className="pb-2 text-right">Actual Realized Win Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {calibration.map((c) => (
                      <tr key={c.scoreRange} className="hover:bg-slate-800/30">
                        <td className="py-2 text-white font-bold">{c.scoreRange}</td>
                        <td className="py-2 text-slate-400">{c.tradeCount} trades</td>
                        <td className="py-2 text-right font-bold text-cyan-400">
                          {c.actualWinRate}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
