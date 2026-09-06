import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  Ban,
  Activity,
  PauseCircle,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '../../lib/utils.ts';

export type StatusType =
  | 'OPEN'
  | 'FILLED'
  | 'PARTIAL'
  | 'CANCELLED'
  | 'REJECTED'
  | 'PENDING'
  | 'SUBMITTED'
  | 'RUNNING'
  | 'PAUSED'
  | 'STOPPED'
  | 'ERROR'
  | 'LONG'
  | 'SHORT'
  | 'APPROVED'
  | 'WARNING'
  | 'BLOCKED'
  | 'ACTIVE'
  | 'CLOSED'
  | 'PRE_TRADE'
  | 'POST_TRADE';

interface StatusBadgeProps {
  status: string | StatusType;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'sm',
  showIcon = true,
  className = '',
}) => {
  const normStatus = (status || '').toUpperCase();
  const displayLabel = label || normStatus;

  let colorClasses = 'bg-slate-800/80 text-slate-300 border-slate-700/80';
  let IconComponent: React.FC<any> | null = null;
  let pulseDot = false;

  switch (normStatus) {
    case 'FILLED':
    case 'RUNNING':
    case 'APPROVED':
    case 'LONG':
    case 'ACTIVE':
      colorClasses = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      IconComponent = CheckCircle2;
      break;

    case 'OPEN':
    case 'PENDING':
    case 'SUBMITTED':
    case 'PRE_TRADE':
      colorClasses = 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';
      IconComponent = Clock;
      pulseDot = normStatus === 'OPEN' || normStatus === 'SUBMITTED';
      break;

    case 'PARTIAL':
    case 'PAUSED':
    case 'WARNING':
      colorClasses = 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      IconComponent = AlertTriangle;
      break;

    case 'SHORT':
    case 'REJECTED':
    case 'STOPPED':
    case 'BLOCKED':
    case 'ERROR':
      colorClasses = 'bg-rose-500/10 text-rose-300 border-rose-500/30';
      IconComponent = normStatus === 'SHORT' ? null : AlertCircle;
      break;

    case 'POST_TRADE':
      colorClasses = 'bg-purple-500/10 text-purple-300 border-purple-500/30';
      IconComponent = ShieldCheck;
      break;

    case 'CANCELLED':
    case 'CLOSED':
      colorClasses = 'bg-slate-800/80 text-slate-400 border-slate-700/60';
      IconComponent = Ban;
      break;

    default:
      colorClasses = 'bg-slate-800/80 text-slate-300 border-slate-700/80';
      break;
  }

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[10px]'
      : size === 'md'
      ? 'px-2.5 py-1 text-xs'
      : 'px-3 py-1.5 text-xs font-bold';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border font-mono font-medium whitespace-nowrap select-none',
        sizeClasses,
        colorClasses,
        className
      )}
    >
      {pulseDot ? (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
        </span>
      ) : showIcon && IconComponent ? (
        <IconComponent className={size === 'sm' ? 'w-2.5 h-2.5 shrink-0' : 'w-3.5 h-3.5 shrink-0'} />
      ) : null}
      <span>{displayLabel}</span>
    </span>
  );
};
