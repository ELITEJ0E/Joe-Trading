import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2, XCircle, Settings, RefreshCw } from 'lucide-react';
import { RiskRule, RiskDecision, KillSwitchState } from '../../types/client.ts';
import { api } from '../../lib/api.ts';
import { formatCurrency } from '../../lib/formatters.ts';

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
    <div className="space-y-6">
      {/* Header & Kill Switch Controller */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0d1322] border border-slate-800/90 rounded-2xl p-5 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-rose-400" />
            Risk Management Engine & Emergency Circuit Breakers
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
            <AlertTriangle className="w-6 h-6 text-rose-400 animate-pulse" />
            <div>
              <span className="font-bold text-sm text-rose-300 block">
                KILL SWITCH ACTIVE — ALL TRADING REJECTED
              </span>
              <span className="text-xs text-rose-200/80 font-mono">
                Reason: {killSwitch.reason || 'Operator Intervention'} | Triggered At: {killSwitch.triggeredAt}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Pre-Trade Rules Grid */}
      <div className="bg-[#0d1322] border border-slate-800/90 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold text-white uppercase tracking-wider">
              Enforced Pre-Trade Rule Set ({safeRules.length})
            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-400">Zero-Bypass Interceptor</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {safeRules.length === 0 ? (
            <div className="col-span-full py-12 text-center text-xs text-slate-500">
              No risk rules registered.
            </div>
          ) : (
            safeRules.map((rule) => {
              const isEditing = editingRuleId === rule.id;
              return (
                <div
                  key={rule.id}
                  className={`p-4 rounded-xl border space-y-3 transition-colors ${
                    rule.isEnabled
                      ? 'bg-[#090d16] border-slate-800/90'
                      : 'bg-[#090d16]/50 border-slate-900 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold text-xs text-white block">{rule.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{rule.type}</span>
                    </div>

                    <button
                      onClick={() => handleToggleRule(rule)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                        rule.isEnabled
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {rule.isEnabled ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">{rule.description}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 font-mono text-xs">
                    <span className="text-slate-500">Threshold:</span>
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={newThreshold}
                          onChange={(e) => setNewThreshold(Number(e.target.value))}
                          className="w-20 bg-slate-900 border border-cyan-500 text-white text-xs px-2 py-0.5 rounded"
                        />
                        <button
                          onClick={() => handleUpdateThreshold(rule.id)}
                          className="px-2 py-0.5 bg-cyan-600 text-white rounded text-[10px] font-bold cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold">
                          {rule.unit === 'USD' ? formatCurrency(rule.threshold) : (rule.threshold != null ? `${rule.threshold}${rule.unit}` : '0')}
                        </span>
                        <button
                          onClick={() => {
                            setEditingRuleId(rule.id);
                            setNewThreshold(rule.threshold);
                          }}
                          className="text-slate-500 hover:text-cyan-400 text-[10px] cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Recent Pre-Trade Risk Decisions Log */}
      <div className="bg-[#0d1322] border border-slate-800/90 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <span className="text-xs font-semibold text-white uppercase tracking-wider">
            Recent Pre-Trade Decision Audit Trail ({safeDecisions.length})
          </span>
          <span className="text-xs text-slate-400 font-mono">Synchronous Interceptor</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <th className="pb-2">Decision ID</th>
                <th className="pb-2">Outcome</th>
                <th className="pb-2">Rule Evaluated</th>
                <th className="pb-2">Reason / Breach Details</th>
                <th className="pb-2 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {safeDecisions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No risk evaluations recorded yet.
                  </td>
                </tr>
              ) : (
                safeDecisions.map((dec) => (
                  <tr key={dec.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 text-slate-400">{dec.id}</td>
                    <td className="py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          dec.decision === 'APPROVED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {dec.decision}
                      </span>
                    </td>
                    <td className="py-2.5 text-white font-semibold">{dec.ruleName || 'All Rules Passed'}</td>
                    <td className="py-2.5 text-slate-300">{dec.reason}</td>
                    <td className="py-2.5 text-right text-slate-500">
                      {new Date(dec.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
