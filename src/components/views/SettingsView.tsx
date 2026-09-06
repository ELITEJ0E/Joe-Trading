import React, { useState } from 'react';
import {
  Sliders,
  Shield,
  Bell,
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Database,
  Lock,
  Globe,
  SlidersHorizontal,
} from 'lucide-react';
import { TradingAccount, RiskRule } from '../../types/client.ts';
import { formatCurrency } from '../../lib/formatters.ts';

interface SettingsViewProps {
  accounts?: TradingAccount[];
  activeAccount?: TradingAccount | null;
  onSwitchAccount?: (accId: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  accounts = [],
  activeAccount,
  onSwitchAccount = (_accId: string) => {},
}) => {
  const [maxDrawdownThreshold, setMaxDrawdownThreshold] = useState('5.0');
  const [maxPositionNotional, setMaxPositionNotional] = useState('500000');
  const [requireStopLoss, setRequireStopLoss] = useState(true);
  const [enforceRMultiple, setEnforceRMultiple] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [sseHeartbeat, setSseHeartbeat] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="bg-[#0b101d] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <Sliders className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-white tracking-tight">
            Platform Settings & Risk Governance
          </h2>
        </div>
        <p className="text-xs text-slate-400">
          Configure safety parameters, simulation environments, execution gateway controls, and behavioral audit policies
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Platform preferences and risk gating policies successfully updated.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        {/* Risk Governance Parameters */}
        <div className="bg-[#0b101d] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Shield className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
              Risk Engine Governance
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 text-xs font-mono mb-1">
                Emergency Drawdown Halt Trigger (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={maxDrawdownThreshold}
                onChange={(e) => setMaxDrawdownThreshold(e.target.value)}
                className="w-full bg-[#060912] border border-slate-800 rounded-xl p-2.5 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Automatically trips the Global Kill Switch if current equity drawdown reaches this level.
              </span>
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-mono mb-1">
                Max Single-Order Notional Limit ($)
              </label>
              <input
                type="number"
                step="1000"
                value={maxPositionNotional}
                onChange={(e) => setMaxPositionNotional(e.target.value)}
                className="w-full bg-[#060912] border border-slate-800 rounded-xl p-2.5 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Hard ceiling for any single market, limit, or bot-generated order.
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={requireStopLoss}
                onChange={(e) => setRequireStopLoss(e.target.checked)}
                className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
              />
              <div>
                <span className="text-xs font-bold text-slate-200">Mandate Pre-Trade Stop Loss</span>
                <span className="text-[10px] text-slate-500 block">
                  Rejects orders that lack defined stop-loss invalidation levels during entry.
                </span>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={enforceRMultiple}
                onChange={(e) => setEnforceRMultiple(e.target.checked)}
                className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
              />
              <div>
                <span className="text-xs font-bold text-slate-200">Minimum 1.5R Risk/Reward Gating</span>
                <span className="text-[10px] text-slate-500 block">
                  Warns or halts executions with asymmetric negative risk-reward payoff structures.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Account & Gateway Config */}
        <div className="bg-[#0b101d] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Cpu className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
              Account & Gateway Connectivity
            </h3>
          </div>

          <div>
            <label className="block text-slate-400 text-xs font-mono mb-1">
              Active Trading Sub-Account
            </label>
            <select
              value={activeAccount?.id || ''}
              onChange={(e) => onSwitchAccount(e.target.value)}
              className="w-full bg-[#060912] border border-slate-800 rounded-xl p-2.5 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.accountNumber}) — {formatCurrency(acc.equity)} Equity
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3 pt-1">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={sseHeartbeat}
                onChange={(e) => setSseHeartbeat(e.target.checked)}
                className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
              />
              <div>
                <span className="text-xs font-bold text-slate-200">Server-Sent Events (SSE) Live Feed</span>
                <span className="text-[10px] text-slate-500 block">
                  Continuous low-latency streaming updates for live mark prices and order book ticks.
                </span>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={soundAlerts}
                onChange={(e) => setSoundAlerts(e.target.checked)}
                className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
              />
              <div>
                <span className="text-xs font-bold text-slate-200">Auditory Risk Alerts</span>
                <span className="text-[10px] text-slate-500 block">
                  Audio chime notifications on order fills and risk limit breaches.
                </span>
              </div>
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold font-mono transition-all shadow-md shadow-cyan-950/40 cursor-pointer"
          >
            Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
};
