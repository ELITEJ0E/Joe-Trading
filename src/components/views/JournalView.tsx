import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Tag,
  Smile,
  Frown,
  Meh,
  AlertCircle,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { JournalEntry, EmotionState } from '../../types/client.ts';

interface JournalViewProps {
  entries?: JournalEntry[];
  onSelectEntry?: (entry: JournalEntry) => void;
  onOpenNewEntryModal?: () => void;
}

export const JournalView: React.FC<JournalViewProps> = ({
  entries = [],
  onSelectEntry = (_entry?: any) => {},
  onOpenNewEntryModal = () => {},
}) => {
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'POST_TRADE' | 'PRE_TRADE'>('ALL');
  const [emotionFilter, setEmotionFilter] = useState<string>('ALL');

  const safeEntries = entries || [];
  const filteredEntries = safeEntries.filter((e) => {
    if (filter !== 'ALL' && e.status !== filter) return false;
    if (emotionFilter !== 'ALL' && e.emotion !== emotionFilter) return false;
    return true;
  });

  const getEmotionBadge = (emotion: EmotionState) => {
    switch (emotion) {
      case EmotionState.DISCIPLINED:
      case EmotionState.PATIENT:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case EmotionState.CONFIDENT:
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case EmotionState.ANXIOUS:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case EmotionState.FOMO:
      case EmotionState.REVENGE:
      case EmotionState.GREEDY:
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with New Entry Trigger */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0d1322] border border-slate-800/90 rounded-2xl p-5 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            Structured Trade Journal & Cognitive Review
          </h2>
          <p className="text-xs text-slate-400">
            Systematic pre-trade planning, thesis invalidation, and post-trade AI psychological audits
          </p>
        </div>

        <button
          onClick={onOpenNewEntryModal}
          className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-950/40 flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Log Trade Thesis
        </button>
      </div>

      {/* 2. Filters & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {(['ALL', 'PRE_TRADE', 'ACTIVE', 'POST_TRADE'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                filter === f
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                  : 'bg-[#0d1322] text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              {f === 'ALL'
                ? `All (${safeEntries.length})`
                : f === 'PRE_TRADE'
                ? 'Pre-Trade Plans'
                : f === 'ACTIVE'
                ? 'Active Trades'
                : 'Reviewed'}
            </button>
          ))}
        </div>

        {/* Emotion Quick Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Emotion:</span>
          <select
            value={emotionFilter}
            onChange={(e) => setEmotionFilter(e.target.value)}
            className="bg-[#0d1322] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All States</option>
            {Object.values(EmotionState).map((em) => (
              <option key={em} value={em}>
                {em}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Journal Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEntries.length === 0 ? (
          <div className="col-span-full py-16 text-center text-xs text-slate-500 bg-[#0d1322] rounded-2xl border border-slate-800">
            No journal entries match the current filter.
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const hasAi = !!entry.aiAnalysis;
            return (
              <div
                key={entry.id}
                onClick={() => onSelectEntry(entry)}
                className="bg-[#0d1322] hover:bg-[#101728] border border-slate-800/90 hover:border-cyan-500/40 rounded-2xl p-5 shadow-sm cursor-pointer transition-all flex flex-col justify-between space-y-4 group"
              >
                <div>
                  {/* Top Bar: Symbol, Direction & Emotion */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white font-mono">{entry.symbol}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          entry.direction === 'LONG'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {entry.direction}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${getEmotionBadge(
                        entry.emotion
                      )}`}
                    >
                      {entry.emotion}
                    </span>
                  </div>

                  {/* Setup & Strategy */}
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                    <span className="font-semibold text-slate-300">{entry.strategy}</span>
                    <span>•</span>
                    <span className="text-cyan-400">{entry.setup}</span>
                  </div>

                  {/* Trading Thesis Snippet */}
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed bg-[#090d16] p-2.5 rounded-xl border border-slate-800/60 font-sans">
                    {entry.tradingThesis || 'No written thesis provided.'}
                  </p>

                  {/* Invalidation Highlight */}
                  {entry.invalidationCriteria && (
                    <div className="mt-2.5 flex items-start gap-1.5 text-[11px] text-rose-400/90 font-mono">
                      <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span className="line-clamp-1">Inv: {entry.invalidationCriteria}</span>
                    </div>
                  )}
                </div>

                {/* Bottom Meta & R:R */}
                <div className="pt-3 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500">Planned R:R:</span>
                    <span className="font-bold text-white">{entry.riskRewardRatio}R</span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500">Confidence:</span>
                    <span className="font-bold text-cyan-400">{entry.confidenceScore}/10</span>
                  </div>

                  {/* AI Badge & View Link */}
                  <div className="flex items-center justify-between pt-1">
                    {hasAi ? (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-purple-400 font-bold">
                        <Sparkles className="w-3 h-3" /> AI Reviewed ({entry.aiAnalysis?.disciplineScore}/100)
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-mono">Pending AI Audit</span>
                    )}

                    <span className="text-xs text-cyan-400 font-medium flex items-center group-hover:translate-x-0.5 transition-transform">
                      Review <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
