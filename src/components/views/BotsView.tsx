import React, { useState } from 'react';
import {
  Cpu,
  Play,
  Pause,
  Square,
  Activity,
  CheckCircle2,
  Clock,
  Radio,
  Send,
  Zap,
} from 'lucide-react';
import { TradingBot, BotStatus } from '../../types/client.ts';
import { api } from '../../lib/api.ts';
import { formatCurrency } from '../../lib/formatters.ts';

interface BotsViewProps {
  bots?: TradingBot[];
  onRefreshBots?: () => void;
}

export const BotsView: React.FC<BotsViewProps> = ({ bots = [], onRefreshBots = () => {} }) => {
  const safeBots = bots || [];
  const [selectedBotId, setSelectedBotId] = useState<string>(safeBots[0]?.id || '');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationLog, setSimulationLog] = useState<string | null>(null);

  const selectedBot = safeBots.find((b) => b.id === selectedBotId) || safeBots[0];

  const handleStatusChange = async (botId: string, status: BotStatus) => {
    try {
      await api.updateBotStatus(botId, status);
      onRefreshBots();
    } catch (err) {
      console.error('Failed to update bot status:', err);
    }
  };

  const handleSimulateBotSignal = async (bot: TradingBot) => {
    setIsSimulating(true);
    setSimulationLog(`Bot ${bot.name} generating signal: Requesting BUY order via Gateway...`);

    try {
      const pair = bot.config?.pairs?.[0] || 'BTC/USDT';
      const res = await api.postBotEvent(bot.id, 'ORDER_REQUESTED', {
        symbol: pair,
        side: 'BUY',
        quantity: pair.includes('BTC') ? 0.25 : 25,
        type: 'MARKET',
      });

      if (res.action === 'ORDER_CREATED') {
        setSimulationLog(
          `[GATEWAY SUCCESS] Order ${res.orderId} approved by Risk Engine and submitted to broker!`
        );
      } else if (res.action === 'REJECTED') {
        setSimulationLog(`[GATEWAY REJECTED] Risk Engine blocked order: ${res.reason}`);
      } else {
        setSimulationLog(`[GATEWAY RESULT] Event processed: ${JSON.stringify(res)}`);
      }
      onRefreshBots();
    } catch (err: any) {
      setSimulationLog(`[ERROR] Failed to post bot event: ${err.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0d1322] border border-slate-800/90 rounded-2xl p-5 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Cpu className="w-5 h-5 text-purple-400" />
            Algorithmic & Robotic Trading Gateway
          </h2>
          <p className="text-xs text-slate-400">
            Isolated execution gateway with heartbeats, automated risk caps, and event ingress
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#090d16] border border-slate-800 text-xs font-mono">
            <Radio className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span className="text-slate-400">Gateway Status:</span>
            <span className="text-purple-400 font-bold">ONLINE (v1/bots)</span>
          </div>
        </div>
      </div>

      {safeBots.length === 0 ? (
        <div className="py-16 text-center text-xs text-slate-500 bg-[#0d1322] rounded-2xl border border-slate-800">
          No algorithmic trading bots registered.
        </div>
      ) : (
        /* Bots Grid */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bots List */}
          <div className="lg:col-span-2 space-y-4">
            {safeBots.map((bot) => {
              const isSelected = selectedBot?.id === bot.id;
              return (
                <div
                  key={bot.id}
                  onClick={() => setSelectedBotId(bot.id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#10172a] border-purple-500/80 shadow-lg shadow-purple-950/30'
                      : 'bg-[#0d1322] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{bot.name}</span>
                        <span className="text-xs text-slate-400 font-mono">({bot.strategyName})</span>
                      </div>
                      <span className="text-[11px] font-mono text-purple-400">
                        Pairs: {bot.config?.pairs?.join(', ') || 'N/A'} | Interval: {bot.config?.timeframe || '1m'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          bot.status === BotStatus.RUNNING
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : bot.status === BotStatus.PAUSED
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {bot.status}
                      </span>
                    </div>
                  </div>

                  {/* Performance Strip */}
                  <div className="grid grid-cols-3 gap-2 bg-[#090d16] p-3 rounded-xl border border-slate-800/80 font-mono text-center mb-3">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Total P&L</span>
                      <span className="text-xs font-bold text-emerald-400">
                        {formatCurrency(bot.totalPnL, 0, true)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Win Rate</span>
                      <span className="text-xs font-bold text-white">{bot.winRate}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Trades Count</span>
                      <span className="text-xs font-bold text-cyan-400">{bot.tradesCount}</span>
                    </div>
                  </div>

                  {/* Action Controls */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Heartbeat: {new Date(bot.lastHeartbeat).toLocaleTimeString()}</span>
                    </div>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {bot.status === BotStatus.RUNNING ? (
                        <button
                          onClick={() => handleStatusChange(bot.id, BotStatus.PAUSED)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 font-mono text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Pause className="w-3 h-3" /> Pause
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(bot.id, BotStatus.RUNNING)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 font-mono text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Play className="w-3 h-3" /> Resume
                        </button>
                      )}

                      <button
                        onClick={() => handleSimulateBotSignal(bot)}
                        disabled={isSimulating}
                        className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <Zap className="w-3 h-3" /> Trigger Signal
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bot Diagnostics & Simulation Log Panel */}
          <div className="bg-[#0d1322] border border-slate-800/90 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
                <span className="text-xs font-semibold text-white uppercase tracking-wider">
                  Gateway Telemetry & Logs
                </span>
                <span className="text-[10px] font-mono text-cyan-400">Webhook Listener</span>
              </div>

              {selectedBot ? (
                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3 bg-[#090d16] rounded-xl border border-slate-800 space-y-1">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Selected Bot</span>
                    <span className="text-white font-bold text-sm block">{selectedBot.name}</span>
                    <span className="text-slate-500 text-[10px]">ID: {selectedBot.id}</span>
                  </div>

                  <div className="p-3 bg-[#090d16] rounded-xl border border-slate-800 space-y-1 text-[11px]">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Parameters</span>
                    <div className="flex justify-between text-slate-300">
                      <span>Max Order Size:</span>
                      <span className="text-white font-bold">{formatCurrency(selectedBot.config?.maxOrderSize ?? 10000)}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Trailing Stop:</span>
                      <span className="text-emerald-400 font-bold">{selectedBot.config?.trailingStopPercent || 1.2}%</span>
                    </div>
                  </div>

                  {simulationLog && (
                    <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-800/40 text-purple-300 text-[11px] leading-relaxed">
                      {simulationLog}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-xs text-slate-500 py-8">Select a bot to view details</div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Risk Interceptor Enforced:</span>
              <span className="text-emerald-400 font-semibold font-mono">100% Pre-Trade Gate</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
