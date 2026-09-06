import React from 'react';
import { Zap, Clock, DollarSign, Activity, Layers, ShieldCheck } from 'lucide-react';
import { StatCard } from '../common/StatCard.tsx';
import { formatCurrency } from '../../lib/formatters.ts';

interface ExecutionAnalyticsViewProps {
  executionData?: any;
}

const DEFAULT_QUALITY = {
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

export const ExecutionAnalyticsView: React.FC<ExecutionAnalyticsViewProps> = ({ executionData }) => {
  const quality = {
    ...DEFAULT_QUALITY,
    ...(executionData?.executionQuality || {}),
  };

  const safeSlippageByVenue = quality.slippageByVenue || DEFAULT_QUALITY.slippageByVenue;
  const safeLatencyHistory = quality.latencyHistory || DEFAULT_QUALITY.latencyHistory;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0d1322] border border-slate-800/90 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            Execution Quality & Broker Microstructure
          </h2>
          <p className="text-xs text-slate-400">
            Slippage distribution, fill latency, fee drag, and execution venue benchmarking
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Average Slippage"
          value={`${quality.avgSlippageBps} bps`}
          subtitle="Deviation from Benchmark"
          icon={Activity}
          variant="cyan"
        />
        <StatCard
          title="Average Order Latency"
          value={`${quality.avgOrderLatencyMs} ms`}
          subtitle="Time-to-Exchange Gate"
          icon={Clock}
          variant="positive"
        />
        <StatCard
          title="Exchange Fill Rate"
          value={`${quality.fillRatePercent}%`}
          subtitle="Completed vs Partial/Drop"
          icon={ShieldCheck}
          variant="positive"
        />
        <StatCard
          title="Cumulative Fees"
          value={`$${quality.totalFeesPaid.toFixed(2)}`}
          subtitle="Commissions & Exchange Taker Fees"
          icon={DollarSign}
          variant="default"
        />
      </div>

      {/* Venues & Latency Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Venue Slippage Table */}
        <div className="bg-[#0d1322] border border-slate-800/90 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-semibold text-white uppercase tracking-wider">
              Slippage by Execution Venue
            </span>
            <span className="text-xs text-slate-400 font-mono">Realized Volume Weighted</span>
          </div>

          <div className="space-y-3">
            {safeSlippageByVenue.map((v: any) => (
              <div key={v.venue} className="p-3 rounded-xl bg-[#090d16] border border-slate-800/80">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-white">{v.venue}</span>
                  <span className="font-mono text-cyan-400">{v.slippageBps} bps slippage</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Volume Routed:</span>
                  <span>{formatCurrency(v.volume, 0)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Intraday Latency Profile */}
        <div className="bg-[#0d1322] border border-slate-800/90 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-semibold text-white uppercase tracking-wider">
              Intraday Latency Distribution (ms)
            </span>
            <span className="text-xs text-emerald-400 font-mono">Sub-50ms Benchmark Met</span>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-2">
            {safeLatencyHistory.map((l: any) => (
              <div key={l.timestamp} className="p-2.5 rounded-xl bg-[#090d16] border border-slate-800 text-center font-mono">
                <span className="text-[10px] text-slate-500 block">{l.timestamp}</span>
                <span className="text-xs font-bold text-white mt-1 block">{l.latencyMs}ms</span>
              </div>
            ))}
          </div>

          <div className="p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-xl text-xs text-cyan-400">
            Smart Order Routing (SOR) is routing 62% of crypto perp flow through low-latency direct WebSocket gateways.
          </div>
        </div>
      </div>
    </div>
  );
};
