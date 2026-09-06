import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Settings,
  RefreshCw,
  Sliders,
  Lock,
} from 'lucide-react';
import { RiskRule, RiskDecision, KillSwitchState } from '../../types/client.ts';
import { api } from '../../lib/api.ts';
import { formatCurrency } from '../../lib/formatters.ts';
import { StatusBadge } from '../common/StatusBadge.tsx';

interface RiskCenterViewProps {
  rules?: RiskRule[];
  killSwitch?: KillSwitchState;
  recentDecisions?: RiskDecision[];
  onOpenKillSwitchModal?: () => void;
  onDeactivateKillSwitch?: () => void;
  onRefreshRules?: () => void;
}

export const RiskCenterView: React.FC<RiskCenterViewProps> = ({
  rules = [],
  killSwitch = { isActive: false, triggeredAt: null, triggeredBy: null, reason: null },
  recentDecisions = [],
  onOpenKillSwitchModal = () => {},
  onDeactivateKillSwitch = () => {},
  onRefreshRules = () => {},
}) => {
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [newThreshold, setNewThreshold] = useState<number>(0);

  const safeRules = rules || [];
  const safeDecisions = recentDecisions || [];

  const handleUpdateThreshold = async (ruleId: string) => {
    try {
      await api.updateRiskRule(ruleId, { threshold: newThreshold });
      setEditingRuleId(null);
      onRefreshRules();
    } catch (err) {
      console.error('Failed to update rule threshold:', err);
    }
  };

  const handleToggleRule = async (rule: RiskRule) => {
    try {
      await api.updateRiskRule(rule.id, { isEnabled: !rule.isEnabled });
      onRefreshRules();
    } catch (err) {
      console.error('Failed to toggle rule:', err);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Kill Switch Controller */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0b101d] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-rose-400" />
            Institutional Risk Engine & Circuit Breakers
          </h2>
          <p className="text-xs text-slate-400">
            Synchronous pre-trade validation, dynamic exposure ceilings, and platform kill switches
          </p>
        </div>

        <div>
          {killSwitch?.isActive ? (
            <button
              onClick={onDeactivateKillSwitch}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono transition-colors shadow-lg shadow-emerald-950/50 flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Deactivate Emergency Halt
            </button>
          ) : (
            <button
              onClick={onOpenKillSwitchModal}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold font-mono transition-colors shadow-lg shadow-rose-950/50 flex items-center gap-2 cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4" />
              Emergency Kill Switch
            </button>
          )}
        </div>
      </div>

      {/* Kill Switch Active Warning Banner */}
      {killSwitch?.isActive && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-rose-400 animate-pulse shrink-0" />
            <div>
              <span className="font-bold text-sm text-rose-300 block">
                KILL SWITCH ACTIVE — ALL TRADING REJECTED
              </span>
              <span className="text-xs text-rose-200/80 font-mono">
                Reason: {killSwitch.reason || 'Operator Intervention'} | Triggered At:{' '}
                {killSwitch.triggeredAt ? new Date(killSwitch.triggeredAt).toLocaleString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Rules Configuration & Real-Time Decision Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Risk Rules List */}
        <div className="bg-[#0b101d] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">
              Enforced Guardrails ({safeRules.length})
            </span>
            <span className="text-xs text-cyan-400 font-mono">Real-time Gating</span>
          </div>

          <div className="space-y-3">
            {safeRules.map((rule) => (
              <div
                key={rule.id}
                className="p-3.5 bg-[#060912] rounded-xl border border-slate-800/80 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white font-mono">{rule.name}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                        rule.isEnabled
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {rule.isEnabled ? 'ACTIVE' : 'DISABLED'}
                    </span>
                  </div>

                  <button
                    onClick={() => handleToggleRule(rule)}
                    className="text-[11px] font-mono text-slate-400 hover:text-white cursor-pointer"
                  >
                    {rule.isEnabled ? 'Disable' : 'Enable'}
                  </button>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">{rule.description}</p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs font-mono">
                  <span className="text-slate-500">
                    Threshold: {rule.threshold} {rule.type.includes('PERCENT') ? '%' : 'USD'}
                  </span>

                  {editingRuleId === rule.id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={newThreshold}
                        onChange={(e) => setNewThreshold(parseFloat(e.target.value) || 0)}
                        className="w-16 px-1.5 py-0.5 bg-black border border-cyan-500 rounded text-xs text-white"
                      />
                      <button
                        onClick={() => handleUpdateThreshold(rule.id)}
                        className="px-2 py-0.5 bg-cyan-600 rounded text-[10px] text-white font-bold cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingRuleId(null)}
                        className="text-[10px] text-slate-400 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingRuleId(rule.id);
                        setNewThreshold(rule.threshold);
                      }}
                      className="text-[10px] text-cyan-400 hover:underline cursor-pointer"
                    >
                      Edit Threshold
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Risk Decisions Audit Trail */}
        <div className="bg-[#0b101d] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">
              Recent Pre-Trade Validations
            </span>
            <span className="text-xs text-slate-400 font-mono">Audit Log</span>
          </div>

          {safeDecisions.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 font-mono">
              No recent order decisions in log.
            </div>
          ) : (
            <div className="space-y-2.5 font-mono text-xs">
              {safeDecisions.map((dec) => (
                <div
                  key={dec.id}
                  className="p-3 bg-[#060912] rounded-xl border border-slate-800/80 flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{dec.symbol}</span>
                      <StatusBadge status={dec.decision} size="sm" />
                      <span className="text-slate-500 text-[10px]">Order: {dec.orderId}</span>
                    </div>

                    <p className="text-xs text-slate-300 font-sans">{dec.reason}</p>
                  </div>

                  <span className="text-[10px] text-slate-500 shrink-0">
                    {new Date(dec.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
