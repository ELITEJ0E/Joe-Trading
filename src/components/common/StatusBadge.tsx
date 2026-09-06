import React from 'react';
import { CheckCircle2, Clock, XCircle, AlertTriangle, AlertCircle, Ban } from 'lucide-react';

export type StatusType = 
  | 'OPEN' 
  | 'FILLED' 
  | 'PARTIAL' 
  | 'CANCELLED' 
  | 'REJECTED' 
  | 'PENDING'
  | 'RUNNING' 
  | 'PAUSED' 
  | 'STOPPED' 
  | 'ERROR'
  | 'LONG'
  | 'SHORT'
  | 'APPROVED'
  | 'WARNING'
  | 'BLOCKED';

interface StatusBadgeProps {
  status: string | StatusType;
  label?: string;
  size?: 'sm' | 'md';
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

  let colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';
  let IconComponent: React.FC<any> | null = null;

  switch (normStatus) {
    case 'FILLED':
    case 'RUNNING':
    case 'APPROVED':
    case 'LONG':
      colorClasses = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      IconComponent = CheckCircle2;
      break;

    case 'OPEN':
    case 'PENDING':
    case 'SUBMITTED':
      colorClasses = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      IconComponent = Clock;
      break;

    case 'PARTIAL':
    case 'PAUSED':
    case 'WARNING':
      colorClasses = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      IconComponent = AlertTriangle;
      break;

    case 'SHORT':
    case 'REJECTED':
    case 'STOPPED':
    case 'BLOCKED':
    case 'ERROR':
      colorClasses = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      IconComponent = normStatus === 'SHORT' ? null : AlertCircle;
      break;

    case 'CANCELLED':
      colorClasses = 'bg-slate-800 text-slate-400 border-slate-700';
      IconComponent = Ban;
      break;

    default:
      colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';
      break;
  }

  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-[10px]' 
    : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border font-mono font-medium ${sizeClasses} ${colorClasses} ${className}`}
    >
      {showIcon && IconComponent && <IconComponent className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} />}
      <span>{displayLabel}</span>
    </span>
  );
};
