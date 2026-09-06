import React, { useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Tag,
  DollarSign,
  TrendingUp,
  Target,
  StopCircle,
  CheckCircle,
} from 'lucide-react';
import { JournalEntry, EmotionState } from '../../types/client.ts';
import { api } from '../../lib/api.ts';
import { formatCurrency } from '../../lib/formatters.ts';

interface JournalDetailViewProps {
  entry: JournalEntry;
  onBack: () => void;
  onUpdateEntry: (updated: JournalEntry) => void;
}

export const JournalDetailView: React.FC<JournalDetailViewProps> = ({
  entry,
  onBack,
  onUpdateEntry,
}) => {
  const [aiReview, setAiReview] = useState<{
    critique: string;
    disciplineScore: number;
    keyTakeaway: string;
    actionableRules: string[];
  } | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [postTradeNotes, setPostTradeNotes] = useState(entry.postTradeReview || '');

  const handleRunAiPostMortem = async () => {
    setIsLoadingAi(true);
    try {
      const review = await api.getAiTradeReview({
        symbol: entry.symbol,
        direction: entry.direction,
        entry: entry.actualEntry || entry.plannedEntry,
        exit: entry.actualExit,
        pnl: entry.realizedPnL || entry.unrealizedPnL,
        rMultiple: entry.rMultiple,
        thesis: entry.tradingThesis,
        invalidation: entry.invalidationCriteria,
        emotion: entry.emotion,
        confidence: entry.confidenceScore,
        mistakes: entry.mistakes,
      });
      setAiReview(review);
    } catch (err) {
      console.error('AI Review Error:', err);
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleSaveNotes = async () => {
    try {
      const res = await api.updateJournalEntry(entry.id, {
        postTradeReview: postTradeNotes,
      });
      if (res.success) {
        onUpdateEntry(res.entry);
      }
    } catch (err) {
      console.error('Failed to save notes:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back Button & Title Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Journal Index
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-mono">Entry ID: {entry.id}</span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            {entry.status}
          </span>
        </div>
      </div>

      {/* Main Trade Identity Card */}
      <div className="bg-[#0d1322] border border-slate-800/90 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold font-mono text-white">{entry.symbol}</span>
              <span
                className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                  entry.direction === 'LONG'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                {entry.direction}
              </span>
              <span className="text-xs font-semibold text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                {entry.strategy}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">{entry.setup}</p>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-500 block">Realized / Mark P&L</span>
            <span
              className={`text-xl font-bold font-mono ${
                (entry.realizedPnL || entry.unrealizedPnL || 0) >= 0
                  ? 'text-emerald-400'
                  : 'text-rose-400'
              }`}
            >
              {(entry.realizedPnL || entry.unrealizedPnL || 0) >= 0 ? '+' : ''}$
              {(entry.realizedPnL || entry.unrealizedPnL || 0).toFixed(2)}
            </span>
            {entry.rMultiple && (
              <span className="block text-xs font-mono text-slate-400">
                Multiple: +{entry.rMultiple}R
              </span>
            )}
          </div>
        </div>

        {/* Structured Quantitative Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-b border-slate-800 font-mono text-xs">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Planned Entry</span>
            <span className="text-white font-bold">{formatCurrency(entry.plannedEntry)}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Stop Loss</span>
            <span className="text-rose-400 font-bold">{formatCurrency(entry.stopLoss)}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Take Profit Target</span>
            <span className="text-emerald-400 font-bold">{formatCurrency(entry.takeProfit)}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Position Size Notional</span>
            <span className="text-white font-bold">{formatCurrency(entry.positionSize)}</span>
          </div>
        </div>

        {/* Execution & Slippage Quality */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-b border-slate-800 font-mono text-xs">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Actual Fill Entry</span>
            <span className="text-cyan-300 font-bold">{entry.actualEntry != null ? formatCurrency(entry.actualEntry) : 'N/A'}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Execution Slippage</span>
            <span className="text-slate-200">{entry.slippageBps !== undefined ? `${entry.slippageBps} bps` : '0 bps'}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Exchange Fees</span>
            <span className="text-slate-200">${entry.totalFees?.toFixed(2) || '0.00'}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Holding Duration</span>
            <span className="text-slate-200">{entry.holdingPeriodMinutes ? `${entry.holdingPeriodMinutes} mins` : 'Active'}</span>
          </div>
        </div>

        {/* Thesis & Invalidation Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Trading Thesis & Market Rationale
            </h4>
            <div className="p-3.5 rounded-xl bg-[#090d16] border border-slate-800 text-xs text-slate-300 leading-relaxed">
              {entry.tradingThesis || 'No thesis statement recorded.'}
            </div>

            <div className="text-xs text-slate-500 mt-2">
              <span className="font-semibold text-slate-400">Market Context:</span>{' '}
              {entry.marketConditions || 'Standard volatility conditions.'}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400">
              Structural Invalidation Rule
            </h4>
            <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-900/40 text-xs text-rose-200 leading-relaxed">
              {entry.invalidationCriteria || 'No explicit invalidation specified.'}
            </div>

            <div className="flex items-center gap-4 text-xs font-mono pt-2 text-slate-400">
              <div>
                Psychological State: <span className="text-white font-bold">{entry.emotion}</span>
              </div>
              <div>
                Confidence: <span className="text-cyan-400 font-bold">{entry.confidenceScore}/10</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Post-Mortem & Coaching Critique */}
      <div className="bg-[#0d1322] border border-purple-900/40 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                AI Quantitative Post-Mortem & Risk Audit
              </h3>
              <p className="text-xs text-purple-300/80">
                Powered by server-side Gemini 3.8 Flash operating on verified trade parameters
              </p>
            </div>
          </div>

          <button
            onClick={handleRunAiPostMortem}
            disabled={isLoadingAi}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-900/40 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isLoadingAi ? 'Auditing Execution...' : 'Generate AI Review'}
          </button>
        </div>

        {aiReview ? (
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-xl bg-[#090d16] border border-purple-900/50 space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-purple-950 pb-2">
                <span className="font-semibold text-purple-300">Chief Risk Officer Assessment:</span>
                <span className="font-mono font-bold text-emerald-400">
                  Discipline Score: {aiReview.disciplineScore}/100
                </span>
              </div>
              <p className="text-slate-200 leading-relaxed text-sm">{aiReview.critique}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-[#090d16] border border-slate-800 text-xs">
                <span className="font-bold text-slate-300 block mb-1">Key Takeaway</span>
                <p className="text-slate-400">{aiReview.keyTakeaway}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#090d16] border border-slate-800 text-xs">
                <span className="font-bold text-slate-300 block mb-1">Actionable Rules for Future Setups</span>
                <ul className="space-y-1 text-slate-400">
                  {aiReview.actionableRules.map((r, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-500 bg-[#090d16] rounded-xl border border-slate-800/80">
            Click "Generate AI Review" to run an automated post-trade risk and emotional discipline audit.
          </div>
        )}
      </div>

      {/* Manual Post-Trade Review & Lessons Learned */}
      <div className="bg-[#0d1322] border border-slate-800/90 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Trader Post-Trade Review Notes
          </h4>
          <button
            onClick={handleSaveNotes}
            className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-colors"
          >
            Save Notes
          </button>
        </div>

        <textarea
          rows={4}
          value={postTradeNotes}
          onChange={(e) => setPostTradeNotes(e.target.value)}
          placeholder="Document what went well, emotional deviations, execution latency, or lessons learned..."
          className="w-full bg-[#090d16] border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono leading-relaxed"
        />
      </div>
    </div>
  );
};
