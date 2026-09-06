import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number;
  changeSuffix?: string;
  prefix?: string;
  suffix?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'positive' | 'negative' | 'warning' | 'cyan';
  id?: string;
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
}) => {
  const isPositive = change !== undefined ? change >= 0 : undefined;

  const getBorderColor = () => {
    switch (variant) {
      case 'positive':
        return 'border-emerald-500/20 bg-emerald-500/[0.02]';
      case 'negative':
        return 'border-rose-500/20 bg-rose-500/[0.02]';
      case 'warning':
        return 'border-amber-500/20 bg-amber-500/[0.02]';
      case 'cyan':
        return 'border-cyan-500/20 bg-cyan-500/[0.02]';
      default:
        return 'border-slate-800 bg-[#0d1322]';
    }
  };

  return (
    <div
      id={id}
      className={`relative p-4 rounded-xl border ${getBorderColor()} shadow-sm transition-all hover:border-slate-700`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</span>
        {Icon && <Icon className="w-4 h-4 text-slate-500" />}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-xl md:text-2xl font-bold font-mono tracking-tight text-white">
          {prefix}
          {typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : (value ?? '—')}
          {suffix}
        </span>

        {change !== undefined && (
          <span
            className={`text-xs font-mono font-medium px-1.5 py-0.5 rounded ${
              isPositive
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}
          >
            {isPositive ? '+' : ''}
            {change.toFixed(2)}
            {changeSuffix}
          </span>
        )}
      </div>

      {subtitle && <p className="mt-1.5 text-xs text-slate-400 truncate">{subtitle}</p>}
    </div>
  );
};
