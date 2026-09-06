import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';
import { KillSwitchState } from '../../types/client.ts';

interface RiskIndicatorProps {
  killSwitch?: KillSwitchState;
  hasWarnings?: boolean;
  onClick?: () => void;
  compact?: boolean;
}

export const RiskIndicator: React.FC<RiskIndicatorProps> = ({
  killSwitch,
  hasWarnings = false,
  onClick,
  compact = false,
}) => {
  const isHalted = killSwitch?.isActive;

  if (isHalted) {
    return (
      <button
        onClick={onClick}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/50 hover:bg-rose-500/30 transition-all font-mono font-bold text-xs cursor-pointer animate-pulse ring-1 ring-rose-500/40`}
        title="Trading is halted by emergency kill switch"
      >
        <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
        <span>⛔ {compact ? 'Halted' : 'Trading Halted'}</span>
      </button>
    );
  }

  if (hasWarnings) {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/40 hover:bg-amber-500/25 transition-all font-mono font-medium text-xs cursor-pointer"
        title="Risk limits warning"
      >
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
        <span>⚠ {compact ? 'Attention' : 'Risk Attention'}</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all font-mono font-medium text-xs cursor-pointer"
      title="System risk checks pass: Normal trading"
    >
      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
      <span>● {compact ? 'Normal' : 'Trading Normal'}</span>
    </button>
  );
};
