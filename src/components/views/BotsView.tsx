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
  ShieldAlert,
} from 'lucide-react';
import { TradingBot, BotStatus } from '../../types/client.ts';
import { api } from '../../lib/api.ts';
import { formatCurrency } from '../../lib/formatters.ts';
import { StatusBadge } from '../common/StatusBadge.tsx';

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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0b101d] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Cpu className="w-5 h-5 text-purple-400" />
            Algorithmic Trading Gateway & Agent Fleet
          </h2>
          <p className="text-xs text-slate-400">
            Isolated execution gateway with heartbeats, automated risk caps, and event ingress
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#060912] border border-slate-800 text-xs font-mono">
          <Radio className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
          <span className="text-slate-400">Gateway:</span>
          <span className="text-purple-400 font-bold">ONLINE (/api/v1/bots)</span>
        </div>
      </div>

      {safeBots.length === 0 ? (
        <div className="py-16 text-center text-xs text-slate-500 bg-[#0b101d] rounded-2xl border border-slate-800">
          No algorithmic trading bots registered.
        </div>
      ) : (
        /* Bots Grid */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Bots List */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-400 uppercase font-mono tracking-wider px-1">
              Registered Bot Fleet ({safeBots.length})
            </div>

            {safeBots.map((bot) => {
              const isSelected = selectedBot?.id === bot.id;
              const isProfit = (bot.totalPnL || 0) >= 0;

              return (
                <div
                  key={bot.id}
                  onClick={() => setSelectedBotId(bot.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                    isSelected
                      ? 'bg-purple-950/20 border-purple-500 shadow-md shadow-purple-950/30'
                      : 'bg-[#0b101d] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-white font-mono">{bot.name}</div>
                      <div className="text-[11px] text-slate-400">{bot.strategyName}</div>
                    </div>
                    <StatusBadge status={bot.status} size="sm" />
                  </div>

                  <div className="grid grid-cols-3 gap-2 p-2 bg-[#060912] rounded-xl border border-slate-800/80 text-[11px] font-mono">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Realized P&L</span>
                      <span className={`font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatCurrency(bot.totalPnL, 2, true)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Win Rate</span>
                      <span className="font-bold text-white">{bot.winRate}%</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Trades</span>
                      <span className="font-bold text-slate-300">{bot.tradesCount}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1">
                    <span>Pairs: {bot.config?.pairs?.join(', ')}</span>
                    <span>Max Pos: {bot.config?.maxPositions}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bot Control Center & Inspection Panel */}
          {selectedBot && (
            <div className="lg:col-span-2 bg-[#0b101d] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white font-mono">{selectedBot.name}</h3>
                    <StatusBadge status={selectedBot.status} size="sm" />
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">ID: {selectedBot.id}</p>
                </div>

                {/* Control Action Buttons */}
                <div className="flex items-center gap-2">
                  {selectedBot.status !== 'RUNNING' && (
                    <button
                      onClick={() => handleStatusChange(selectedBot.id, BotStatus.RUNNING)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold font-mono transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Start Agent
                    </button>
                  )}

                  {selectedBot.status === 'RUNNING' && (
                    <button
                      onClick={() => handleStatusChange(selectedBot.id, BotStatus.PAUSED)}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold font-mono transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      Pause
                    </button>
                  )}

                  {selectedBot.status !== 'STOPPED' && (
                    <button
                      onClick={() => handleStatusChange(selectedBot.id, BotStatus.STOPPED)}
                      className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/40 rounded-xl text-xs font-bold font-mono transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Square className="w-3.5 h-3.5" />
                      Terminate
                    </button>
                  )}
                </div>
              </div>

              {/* Bot Parameters & Performance Specs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 bg-[#060912] rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Strategy Archetype</span>
                  <span className="font-bold text-white">{selectedBot.strategyName}</span>
                </div>
                <div className="p-3 bg-[#060912] rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Timeframe</span>
                  <span className="font-bold text-cyan-400">{selectedBot.config?.timeframe || '5m'}</span>
                </div>
                <div className="p-3 bg-[#060912] rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Max Drawdown Cap</span>
                  <span className="font-bold text-amber-400">
                    {selectedBot.config?.maxDrawdownPercent || 5}%
                  </span>
                </div>
                <div className="p-3 bg-[#060912] rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Last Heartbeat</span>
                  <span className="font-bold text-emerald-400">
                    {new Date(selectedBot.lastHeartbeat).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {/* Live Signal Ingress Sandbox */}
              <div className="p-4 bg-[#060912] rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-white font-mono">
                    <Zap className="w-4 h-4 text-purple-400" />
                    Gateway Signal Simulator & Risk Injection
                  </div>
                  <button
                    onClick={() => handleSimulateBotSignal(selectedBot)}
                    disabled={isSimulating || selectedBot.status !== 'RUNNING'}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold font-mono transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isSimulating ? 'Injecting...' : 'Emit Signal'}
                  </button>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Triggers an automated signal payload from this bot into the centralized Risk
                  Engine to verify pre-trade constraints and lifecycle execution.
                </p>

                {simulationLog && (
                  <div className="p-3 bg-black/80 rounded-xl border border-purple-500/30 font-mono text-xs text-purple-300">
                    {simulationLog}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
