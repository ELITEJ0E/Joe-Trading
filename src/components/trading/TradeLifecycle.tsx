import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  XCircle,
  Minus,
  Sparkles,
  Info,
  ChevronRight,
} from 'lucide-react';
import { UnifiedTrade, LifecycleStep, LifecycleStepStatus } from '../../types/client.ts';
import { getTradeLifecycleSteps } from '../../lib/trade-lifecycle.ts';
import { cn } from '../../lib/utils.ts';

interface TradeLifecycleProps {
  trade?: UnifiedTrade | null;
  steps?: LifecycleStep[];
  layout?: 'horizontal' | 'vertical' | 'compact';
  compact?: boolean;
  onSelectStep?: (step: LifecycleStep) => void;
  className?: string;
  showDetails?: boolean;
}

export const TradeLifecycle: React.FC<TradeLifecycleProps> = ({
  trade,
  steps: stepsProp,
  layout = 'horizontal',
  compact = false,
  onSelectStep,
  className = '',
  showDetails = false,
}) => {
  const steps: LifecycleStep[] =
    stepsProp || (trade ? getTradeLifecycleSteps(trade) : []);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  const effectiveLayout = compact ? 'compact' : layout;

  if (!steps || steps.length === 0) {
    return (
      <div className="text-[10px] text-slate-500 font-mono italic">
        Lifecycle not initialized
      </div>
    );
  }

  const getStatusIcon = (status: LifecycleStepStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'active':
        return (
          <span className="relative flex h-3.5 w-3.5 shrink-0 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
          </span>
        );
      case 'failed':
        return <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
      case 'skipped':
        return <Minus className="w-3.5 h-3.5 text-slate-600 shrink-0" />;
      case 'pending':
      default:
        return <Circle className="w-3.5 h-3.5 text-slate-700 shrink-0" />;
    }
  };

  const getStatusBorder = (status: LifecycleStepStatus) => {
    switch (status) {
      case 'completed':
        return 'border-emerald-500/40 bg-emerald-950/25 text-emerald-300';
      case 'active':
        return 'border-cyan-400 bg-cyan-950/40 text-cyan-200 shadow-sm shadow-cyan-950/50';
      case 'failed':
        return 'border-rose-500/50 bg-rose-950/30 text-rose-300';
      case 'skipped':
        return 'border-slate-800 bg-slate-900/30 text-slate-500';
      case 'pending':
      default:
        return 'border-slate-800/80 bg-slate-900/20 text-slate-600';
    }
  };

  // Compact Pill Trail (for tables, list items, mobile rows)
  if (effectiveLayout === 'compact') {
    return (
      <div className={cn('flex items-center gap-1 overflow-x-auto py-0.5 scrollbar-none select-none', className)}>
        {steps.map((step, idx) => {
          const isSelected = selectedStepId === step.id;
          return (
            <React.Fragment key={step.id}>
              <button
                type="button"
                onClick={() => {
                  setSelectedStepId(step.id);
                  onSelectStep?.(step);
                }}
                className={cn(
                  'flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-mono whitespace-nowrap transition-all border cursor-pointer',
                  getStatusBorder(step.status),
                  isSelected && 'ring-1 ring-cyan-400'
                )}
                title={`${step.name}: ${step.description}`}
              >
                {getStatusIcon(step.status)}
                <span className="font-semibold">{step.shortLabel}</span>
              </button>
              {idx < steps.length - 1 && (
                <span className="text-slate-700 text-[9px] shrink-0">→</span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  // Horizontal Stepper Bar (Default for overview cards and modals)
  if (effectiveLayout === 'horizontal') {
    return (
      <div className={cn('space-y-3 select-none', className)}>
        <div className="relative overflow-x-auto pb-2 scrollbar-none">
          <div className="flex items-center min-w-[680px] justify-between relative px-2">
            {/* Connecting line */}
            <div className="absolute left-6 right-6 top-4 h-0.5 bg-slate-800 -z-0" />

            {steps.map((step) => {
              const isSelected = selectedStepId === step.id;

              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center group">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStepId(step.id === selectedStepId ? null : step.id);
                      onSelectStep?.(step);
                    }}
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center border transition-all cursor-pointer',
                      getStatusBorder(step.status),
                      isSelected
                        ? 'ring-2 ring-cyan-400 scale-110'
                        : 'group-hover:border-slate-500 group-hover:scale-105'
                    )}
                  >
                    {getStatusIcon(step.status)}
                  </button>

                  <span className="mt-1.5 text-[10px] sm:text-[11px] font-medium text-slate-300 group-hover:text-white transition-colors text-center whitespace-nowrap">
                    {step.shortLabel}
                  </span>

                  <span
                    className={cn(
                      'text-[9px] font-mono uppercase tracking-wider',
                      step.status === 'completed'
                        ? 'text-emerald-400'
                        : step.status === 'active'
                        ? 'text-cyan-400 font-bold'
                        : step.status === 'failed'
                        ? 'text-rose-400'
                        : 'text-slate-600'
                    )}
                  >
                    {step.summary || step.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Expanded detail box */}
        {selectedStepId && (
          <div className="p-3 rounded-xl bg-[#080d19] border border-cyan-500/30 text-xs shadow-lg animate-in fade-in duration-150">
            {(() => {
              const active = steps.find((s) => s.id === selectedStepId);
              if (!active) return null;
              return (
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs sm:text-sm">{active.name}</span>
                      <span
                        className={cn(
                          'px-1.5 py-0.5 rounded text-[9px] font-mono uppercase font-bold border',
                          getStatusBorder(active.status)
                        )}
                      >
                        {active.status}
                      </span>
                    </div>
                    <p className="text-slate-300 text-xs leading-relaxed">{active.description}</p>
                  </div>
                  <button
                    onClick={() => setSelectedStepId(null)}
                    className="text-slate-500 hover:text-white text-[11px] px-2 py-0.5 rounded bg-slate-800 shrink-0"
                  >
                    Close
                  </button>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    );
  }

  // Vertical Detailed Timeline
  return (
    <div className={cn('space-y-4 select-none', className)}>
      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
        {steps.map((step) => {
          const isSelected = selectedStepId === step.id;

          return (
            <div key={step.id} className="relative group">
              <div
                className={cn(
                  'absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center border bg-[#080d19] transition-all',
                  getStatusBorder(step.status)
                )}
              >
                {getStatusIcon(step.status)}
              </div>

              <div
                onClick={() => {
                  setSelectedStepId(step.id === selectedStepId ? null : step.id);
                  onSelectStep?.(step);
                }}
                className={cn(
                  'p-3 rounded-xl border transition-all cursor-pointer',
                  step.status === 'active'
                    ? 'bg-cyan-950/20 border-cyan-500/40 shadow-sm shadow-cyan-950/50'
                    : step.status === 'completed'
                    ? 'bg-[#080d19]/80 border-slate-800/80 hover:border-slate-700'
                    : step.status === 'failed'
                    ? 'bg-rose-950/20 border-rose-500/40'
                    : 'bg-[#080d19]/40 border-slate-800/40 opacity-70'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{step.name}</span>
                    <span
                      className={cn(
                        'text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase',
                        getStatusBorder(step.status)
                      )}
                    >
                      {step.summary || step.status}
                    </span>
                  </div>
                  {step.timestamp && (
                    <span className="text-[10px] font-mono text-slate-500">
                      {new Date(step.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>

                <p className="mt-1 text-xs text-slate-400 leading-relaxed">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
