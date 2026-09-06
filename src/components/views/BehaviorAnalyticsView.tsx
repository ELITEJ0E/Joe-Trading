import React from 'react';
import { Brain, AlertTriangle, TrendingUp, CheckCircle, Award, Target, Sparkles } from 'lucide-react';
import { BehaviorInsight, EmotionState } from '../../types/client.ts';
import { formatCurrency } from '../../lib/formatters.ts';

interface BehaviorAnalyticsViewProps {
  behaviorData: any;
}

export const BehaviorAnalyticsView: React.FC<BehaviorAnalyticsViewProps> = ({ behaviorData }) => {
  const insights: BehaviorInsight[] = behaviorData?.insights || [];
  const emotionalDistribution: { emotion: EmotionState; count: number; winRate: number; avgPnL: number }[] =
    behaviorData?.emotionalDistribution || [];
  const calibration: { scoreRange: string; tradeCount: number; actualWinRate: number }[] =
    behaviorData?.confidenceCalibration || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0d1322] border border-slate-800/90 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              Behavioral Analytics & Cognitive Bias Detection
            </h2>
            <p className="text-xs text-slate-400">
              Statistical patterns extracted from journal logs, sizing variance, and psychological discipline
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono bg-[#090d16] px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-slate-400">Algorithm:</span>
            <span className="text-purple-400 font-bold">Empirical Variance Model</span>
          </div>
        </div>
      </div>

      {/* Primary Mathematical Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((ins) => (
          <div
            key={ins.id}
            className="bg-[#0d1322] border border-slate-800/90 rounded-2xl p-5 shadow-sm space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs text-white">{ins.title}</span>
                  <span className="block text-[10px] font-mono text-purple-400">
                    Sample: {ins.sampleSize} Trades | Confidence: {(ins.confidenceScore * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-800 text-slate-300">
                STATISTICAL BIAS
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{ins.description}</p>

            <div className="p-3 bg-[#090d16] rounded-xl border border-slate-800/80 space-y-1 text-xs">
              <span className="text-slate-400 font-semibold block text-[11px]">System Recommendation:</span>
              <p className="text-cyan-400 text-xs">{ins.recommendation}</p>
            </div>

            <div className="text-[11px] font-mono text-rose-400 pt-1 border-t border-slate-800/60">
              Impact: {ins.metricImpact}
            </div>
          </div>
        ))}
      </div>

      {/* Emotional State Correlation & Confidence Calibration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emotional Distribution & PnL Expectancy */}
        <div className="bg-[#0d1322] border border-slate-800/90 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-semibold text-white uppercase tracking-wider">
              Emotional State vs. Expectancy & Win Rate
            </span>
            <span className="text-xs text-slate-400 font-mono">Realized Metrics</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th className="pb-2">Psychological State</th>
                  <th className="pb-2">Sample Size</th>
                  <th className="pb-2">Win Rate</th>
                  <th className="pb-2 text-right">Avg P&L / Trade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {emotionalDistribution.map((em) => {
                  const isProfit = em.avgPnL >= 0;
                  return (
                    <tr key={em.emotion} className="hover:bg-slate-800/30">
                      <td className="py-2.5 font-bold text-white">{em.emotion}</td>
                      <td className="py-2.5 text-slate-400">{em.count} trades</td>
                      <td className="py-2.5">
                        <span className={em.winRate >= 60 ? 'text-emerald-400' : 'text-rose-400'}>
                          {em.winRate}%
                        </span>
                      </td>
                      <td className={`py-2.5 text-right font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatCurrency(em.avgPnL, 0, true)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Confidence Calibration */}
        <div className="bg-[#0d1322] border border-slate-800/90 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-semibold text-white uppercase tracking-wider">
              Self-Reported Confidence vs. Actual Win Rate
            </span>
            <span className="text-xs text-emerald-400 font-mono">High Calibration Accuracy</span>
          </div>

          <div className="space-y-3 pt-2">
            {calibration.map((cal) => (
              <div key={cal.scoreRange} className="p-3 bg-[#090d16] rounded-xl border border-slate-800/80">
                <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
                  <span className="font-bold text-white">{cal.scoreRange}</span>
                  <span className="text-cyan-400">{cal.actualWinRate}% Win Rate ({cal.tradeCount} trades)</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="bg-cyan-500 h-full rounded-full transition-all"
                    style={{ width: `${cal.actualWinRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-xl text-xs text-purple-300">
            High conviction setups (Score 9-10) correctly yield an 81.5% win rate. When feeling low confidence (1-3), statistical outcome drops to 33.3%, confirming you should abstain from executing low-conviction ideas.
          </div>
        </div>
      </div>
    </div>
  );
};
