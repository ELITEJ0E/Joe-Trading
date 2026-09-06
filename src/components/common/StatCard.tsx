import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '../../lib/utils.ts';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number;
  changeSuffix?: string;
  prefix?: string;
  suffix?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'positive' | 'negative' | 'warning' | 'cyan' | 'purple';
  id?: string;
  trend?: number[];
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  change,
  changeSuffix = '%',
  prefix = '',
  suffix = '',
  icon: Icon,
  variant = 'default',
  id,
  trend,
  onClick,
}) => {
  const isPositive = change !== undefined ? change >= 0 : undefined;

  const getVariantStyles = () => {
    switch (variant) {
      case 'positive':
        return 'border-emerald-500/20 bg-[#0a141e]/90 hover:border-emerald-500/40';
      case 'negative':
        return 'border-rose-500/20 bg-[#170e17]/90 hover:border-rose-500/40';
      case 'warning':
        return 'border-amber-500/20 bg-[#17120e]/90 hover:border-amber-500/40';
      case 'cyan':
        return 'border-cyan-500/20 bg-[#091522]/90 hover:border-cyan-500/40';
      case 'purple':
        return 'border-purple-500/20 bg-[#130f24]/90 hover:border-purple-500/40';
      default:
        return 'border-slate-800/80 bg-[#0a0f1d]/90 hover:border-slate-700';
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'positive':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'negative':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'warning':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'cyan':
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
      case 'purple':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      default:
        return 'text-slate-400 bg-slate-800/60 border-slate-700/60';
    }
  };

  return (
    <div
      id={id}
      onClick={onClick}
      className={cn(
        'relative p-3.5 sm:p-4 rounded-2xl border backdrop-blur-md transition-all duration-200 shadow-sm flex flex-col justify-between group select-none',
        getVariantStyles(),
        onClick && 'cursor-pointer hover:-translate-y-0.5'
      )}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[10px] sm:text-[11px] font-bold font-mono text-slate-400 uppercase tracking-wider truncate">
            {title}
          </span>
          {Icon && (
            <div className={cn('p-1.5 rounded-xl border shrink-0', getIconColor())}>
              <Icon className="w-3.5 h-3.5" />
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-lg sm:text-2xl font-bold font-mono tracking-tight text-white">
            {prefix}
            {typeof value === 'number'
              ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
              : (value ?? '—')}
            {suffix}
          </span>

          {change !== undefined && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md border whitespace-nowrap',
                isPositive
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              )}
            >
              {isPositive ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
              {isPositive ? '+' : ''}
              {change.toFixed(2)}
              {changeSuffix}
            </span>
          )}
        </div>
      </div>

      {subtitle && (
        <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 font-mono">
          <span className="truncate">{subtitle}</span>
          {trend && trend.length > 1 && (
            <span className="text-[9px] text-slate-500 font-bold shrink-0 ml-1">TREND</span>
          )}
        </div>
      )}
    </div>
  );
};
