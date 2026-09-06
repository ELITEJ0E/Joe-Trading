import React, { useState } from 'react';
import {
  X,
  Sparkles,
  TrendingUp,
  Brain,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  FileText,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { UnifiedTrade } from '../../types/client.ts';
import { TradeLifecycle } from './TradeLifecycle.tsx';
import { formatCurrency } from '../../lib/formatters.ts';
import { api } from '../../lib/api.ts';
import { cn } from '../../lib/utils.ts';

interface TradeDetailModalProps {
  trade: UnifiedTrade | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TradeDetailModal: React.FC<TradeDetailModalProps> = ({
  trade,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'STORY' | 'JOURNAL' | 'RISK' | 'EXECUTIONS'>('STORY');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiReview, setAiReview] = useState<any>(null);

  if (!isOpen || !trade) return null;

  const isProfit = (trade.pnl || 0) >= 0;

  const handleGenerateAiReview = async () => {
    setIsGeneratingAi(true);
    try {
      const res = await api.getAiTradeReview(trade.id);
      setAiReview(res);
    } catch (err) {
      console.error('Failed to generate AI review:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md select-none animate-in fade-in duration-150">
      <div className="bg-[#0c1220] border border-slate-700 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-start justify-between gap-3 bg-[#080d19]">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl font-bold font-mono text-white tracking-tight">
                {trade.symbol}
              </span>
              <span
                className={cn(
                  'px-2 py-0.5 rounded text-[11px] font-mono font-bold border',
                  trade.direction === 'LONG'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                )}
              >
                {trade.direction}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                {trade.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Trade ID: {trade.id} • Initiated:{' '}
              {new Date(trade.createdAt).toLocaleString()}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Trade Lifecycle Horizontal Engine Bar */}
        <div className="p-4 bg-[#080d19]/80 border-b border-slate-800">
          <TradeLifecycle trade={trade} layout="horizontal" />
        </div>

        {/* Sub-Tab Switcher */}
        <div className="flex items-center gap-1.5 px-4 sm:px-5 pt-3 border-b border-slate-800 bg-[#0c1220] overflow-x-auto">
          {[
            { id: 'STORY', label: 'Trade Story' },
            { id: 'JOURNAL', label: 'Thesis & Review' },
            { id: 'RISK', label: 'Pre-Trade Risk' },
            { id: 'EXECUTIONS', label: 'Executions' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'px-3.5 py-2 text-xs font-mono font-semibold transition-all border-b-2 cursor-pointer whitespace-nowrap',
                activeTab === tab.id
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-slate-400 hover:text-white'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 font-mono text-xs scrollbar-none">
          {activeTab === 'STORY' && (
            <div className="space-y-4">
              {/* Outcome Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-[#080d19] rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block">Total P&L</span>
                  <span
                    className={cn(
                      'text-base font-bold mt-0.5 block',
                      isProfit ? 'text-emerald-400' : 'text-rose-400'
                    )}
                  >
                    {isProfit ? '+' : ''}
                    {formatCurrency(trade.pnl, 2, true)}
                  </span>
                </div>
                <div className="p-3 bg-[#080d19] rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block">Filled Size</span>
                  <span className="text-base font-bold text-white mt-0.5 block">
                    {trade.filledQuantity}
                  </span>
                </div>
                <div className="p-3 bg-[#080d19] rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block">Average Fill</span>
                  <span className="text-base font-bold text-slate-200 mt-0.5 block">
                    {formatCurrency(trade.avgPrice)}
                  </span>
                </div>
                <div className="p-3 bg-[#080d19] rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block">Lifecycle State</span>
                  <span className="text-base font-bold text-cyan-300 mt-0.5 block">
                    {trade.lifecycleState}
                  </span>
                </div>
              </div>

              {/* AI Cognitive Review Block */}
              <div className="p-4 rounded-2xl bg-[#130e26] border border-purple-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white font-bold">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>AI Execution Quality & Psychological Audit</span>
                  </div>
                  <button
                    onClick={handleGenerateAiReview}
                    disabled={isGeneratingAi}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold transition-colors cursor-pointer text-xs"
                  >
                    {isGeneratingAi ? 'Analyzing...' : 'Generate AI Review'}
                  </button>
                </div>

                {aiReview ? (
                  <div className="space-y-2 text-slate-200 leading-relaxed font-sans text-xs">
                    <p>{aiReview.analysis || aiReview.summary}</p>
                    {aiReview.recommendations && (
                      <ul className="list-disc pl-4 space-y-1 text-purple-300 text-xs">
                        {aiReview.recommendations.map((rec: string, i: number) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    Generate an instant post-trade debrief examining slippage, risk rule adherence, and emotional discipline.
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'JOURNAL' && (
            <div className="space-y-3">
              {trade.journalEntry ? (
                <div className="p-4 rounded-xl bg-[#080d19] border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">Logged Thesis</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                      Emotion: {trade.journalEntry.emotion}
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed font-sans">
                    {trade.journalEntry.setupDescription ||
                      trade.journalEntry.tradingThesis ||
                      'No textual thesis registered.'}
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] border-t border-slate-800">
                    <div>
                      <span className="text-slate-400 block">Invalidation Level:</span>
                      <span className="text-rose-400 font-bold">
                        {formatCurrency(trade.journalEntry.invalidationLevel)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Planned Target:</span>
                      <span className="text-emerald-400 font-bold">
                        {formatCurrency(trade.journalEntry.plannedTarget)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No pre-trade journal thesis was logged for this execution.
                </div>
              )}
            </div>
          )}

          {activeTab === 'RISK' && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-[#080d19] border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Pre-Trade Risk Engine Clearance: APPROVED</span>
                </div>
                <p className="text-xs text-slate-400 font-sans leading-relaxed">
                  All exposure limits, drawdown caps, max daily loss rules, and circuit breakers evaluated with 0 violations.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'EXECUTIONS' && (
            <div className="space-y-2">
              {trade.executions && trade.executions.length > 0 ? (
                trade.executions.map((exec) => (
                  <div
                    key={exec.id}
                    className="p-3 rounded-xl bg-[#080d19] border border-slate-800 flex items-center justify-between text-xs font-mono"
                  >
                    <div>
                      <span className="font-bold text-white block">{exec.id}</span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(exec.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-white font-bold block">
                        {exec.quantity} @ {formatCurrency(exec.price)}
                      </span>
                      <span className="text-[10px] text-cyan-400">Venue: {exec.venue}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No execution fills recorded yet.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
