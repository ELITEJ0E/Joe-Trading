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
  CheckCircle2,
  Brain,
  Target,
} from 'lucide-react';
import { JournalEntry, EmotionState } from '../../types/client.ts';
import { formatCurrency } from '../../lib/formatters.ts';
import { EmptyState } from '../common/EmptyState.tsx';

interface JournalViewProps {
  entries?: JournalEntry[];
  onSelectEntry?: (entry: JournalEntry) => void;
  onOpenNewEntryModal?: () => void;
}

export const JournalView: React.FC<JournalViewProps> = ({
  entries = [],
  onSelectEntry = (_entry: JournalEntry) => {},
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
    <div className="space-y-5">
      {/* 1. Header with New Entry Trigger */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0b101d] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            Decision-First Trade Journal & Cognitive Review
          </h2>
          <p className="text-xs text-slate-400">
            Pre-trade thesis invalidation, confidence scoring, and post-trade psychological audits
          </p>
        </div>

        <button
          onClick={onOpenNewEntryModal}
          className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold font-mono transition-all shadow-md shadow-cyan-950/40 flex items-center gap-2 cursor-pointer self-stretch sm:self-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          Log Trade Thesis
        </button>
      </div>

      {/* 2. Filters & Emotion Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-[#0b101d] rounded-xl border border-slate-800">
          {(['ALL', 'PRE_TRADE', 'ACTIVE', 'POST_TRADE'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer whitespace-nowrap ${
                filter === f
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {f === 'ALL'
                ? `All (${safeEntries.length})`
                : f === 'PRE_TRADE'
                ? 'Pre-Trade Plans'
                : f === 'ACTIVE'
                ? 'Active Trades'
                : 'Reviewed Post-Trade'}
            </button>
          ))}
        </div>

        {/* Emotion Filter Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-mono">
          <span className="text-slate-500 text-[11px] hidden sm:inline">Emotion:</span>
          <select
            value={emotionFilter}
            onChange={(e) => setEmotionFilter(e.target.value)}
            className="bg-[#0b101d] border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="ALL">All Emotions</option>
            {Object.values(EmotionState).map((em) => (
              <option key={em} value={em}>
                {em}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Journal Cards List */}
      {filteredEntries.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No Journal Entries Found"
          description="Log your trade setups, thesis invalidation levels, and emotional state before and after market execution."
          actionLabel="+ Log First Trade Thesis"
          onAction={onOpenNewEntryModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEntries.map((entry) => {
            const isProfit = (entry.realizedPnL || 0) >= 0;
            return (
              <div
                key={entry.id}
                onClick={() => onSelectEntry(entry)}
                className="bg-[#0b101d] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm hover:border-slate-700 transition-all cursor-pointer space-y-3.5 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white font-mono">{entry.symbol}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          entry.tradeType === 'LONG'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {entry.tradeType}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${getEmotionBadge(
                          entry.emotion
                        )}`}
                      >
                        {entry.emotion}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        entry.status === 'POST_TRADE'
                          ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                          : entry.status === 'ACTIVE'
                          ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {entry.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mt-2.5 line-clamp-2 leading-relaxed font-sans">
                    {entry.setupDescription}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2 p-2.5 bg-[#060912] rounded-xl border border-slate-800/80 text-[11px] font-mono">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Planned Entry</span>
                      <span className="font-bold text-white">
                        {formatCurrency(entry.plannedEntry)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Invalidation (SL)</span>
                      <span className="font-bold text-rose-400">
                        {formatCurrency(entry.invalidationLevel)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Target (TP)</span>
                      <span className="font-bold text-emerald-400">
                        {formatCurrency(entry.plannedTarget)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs font-mono">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <span>Conviction:</span>
                      <span className="text-cyan-400 font-bold">{entry.confidenceScore}/10</span>
                    </div>

                    {entry.realizedPnL !== undefined ? (
                      <div className={`font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isProfit ? '+' : ''}${entry.realizedPnL.toFixed(2)} ({entry.rMultipleRealized}R)
                      </div>
                    ) : (
                      <div className="text-slate-500 text-[11px] group-hover:text-cyan-400 transition-colors flex items-center gap-1">
                        View Thesis <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
