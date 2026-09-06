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
  Eye,
  Layers,
} from 'lucide-react';
import { JournalEntry, EmotionState, UnifiedTrade } from '../../types/client.ts';
import { formatCurrency } from '../../lib/formatters.ts';
import { EmptyState } from '../common/EmptyState.tsx';
import { TradeLifecycle } from '../trading/TradeLifecycle.tsx';
import { cn } from '../../lib/utils.ts';

interface JournalViewProps {
  entries?: JournalEntry[];
  unifiedTrades?: UnifiedTrade[];
  onSelectEntry?: (entry: JournalEntry) => void;
  onOpenNewEntryModal?: () => void;
  onSelectTrade?: (trade: UnifiedTrade) => void;
}

export const JournalView: React.FC<JournalViewProps> = ({
  entries = [],
  unifiedTrades = [],
  onSelectEntry = (_entry: JournalEntry) => {},
  onOpenNewEntryModal = () => {},
  onSelectTrade = (_trade: UnifiedTrade) => {},
}) => {
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'POST_TRADE' | 'PRE_TRADE'>('ALL');
  const [emotionFilter, setEmotionFilter] = useState<string>('ALL');

  const safeEntries = entries || [];
  const safeTrades = unifiedTrades || [];

  const filteredEntries = safeEntries.filter((e) => {
    if (filter !== 'ALL' && e.status !== filter) return false;
    if (emotionFilter !== 'ALL' && e.emotion !== emotionFilter) return false;
    return true;
  });

  const findUnifiedTradeForEntry = (entry: JournalEntry): UnifiedTrade | undefined => {
    return safeTrades.find((t) => t.journalEntry?.id === entry.id || t.symbol === entry.symbol);
  };

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0c1220] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            Decision-First Trade Journal & Cognitive Review
          </h2>
          <p className="text-xs text-slate-400">
            Pre-trade thesis invalidation, confidence calibration, lifecycle tracking, and post-trade psychological audits
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
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-[#0c1220] rounded-xl border border-slate-800">
          {(['ALL', 'PRE_TRADE', 'ACTIVE', 'POST_TRADE'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer whitespace-nowrap',
                filter === f
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              )}
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
          <span className="text-slate-400 text-[11px] hidden sm:inline">Emotion:</span>
          <select
            value={emotionFilter}
            onChange={(e) => setEmotionFilter(e.target.value)}
            className="bg-[#0c1220] border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-mono cursor-pointer"
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
            const direction = entry.direction || entry.tradeType || 'LONG';
            const setupText = entry.setupDescription || entry.tradingThesis || entry.setup || 'Discretionary market trade';
            const invLevel = entry.invalidationLevel || entry.stopLoss;
            const targetLevel = entry.plannedTarget || entry.takeProfit;
            const matchingTrade = findUnifiedTradeForEntry(entry);

            return (
              <div
                key={entry.id}
                className="bg-[#0c1220] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm hover:border-slate-700 transition-all space-y-3.5 flex flex-col justify-between group cursor-pointer"
                onClick={() => onSelectEntry(entry)}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-base text-white font-mono">{entry.symbol}</span>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-[10px] font-mono font-bold border',
                          direction === 'LONG'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        )}
                      >
                        {direction}
                      </span>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-[10px] font-mono font-medium border',
                          getEmotionBadge(entry.emotion)
                        )}
                      >
                        {entry.emotion}
                      </span>
                    </div>

                    <span
                      className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-mono font-bold border',
                        entry.status === 'POST_TRADE'
                          ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                          : entry.status === 'ACTIVE'
                          ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      )}
                    >
                      {entry.status}
                    </span>
                  </div>

                  {matchingTrade && (
                    <div className="pt-1">
                      <TradeLifecycle trade={matchingTrade} compact />
                    </div>
                  )}

                  {/* Thesis & Setup */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider block">
                      Thesis / Setup
                    </span>
                    <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed">
                      {setupText}
                    </p>
                  </div>

                  {/* Risk Parameters Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2.5 bg-[#080d19] rounded-xl border border-slate-800/80 text-[11px] font-mono">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Invalidation (SL)</span>
                      <span className="text-rose-400 font-bold">
                        {invLevel ? `$${invLevel.toLocaleString()}` : 'None'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Target (TP)</span>
                      <span className="text-emerald-400 font-bold">
                        {targetLevel ? `$${targetLevel.toLocaleString()}` : 'None'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Confidence</span>
                      <span className="text-cyan-400 font-bold">
                        {entry.confidenceScore ? `${entry.confidenceScore}/10` : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer with P&L or Post-Trade Review Trigger */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                  {entry.realizedPnL !== undefined ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 text-[11px]">Realized P&L:</span>
                      <span className={cn('font-bold', isProfit ? 'text-emerald-400' : 'text-rose-400')}>
                        {isProfit ? '+' : ''}
                        {formatCurrency(entry.realizedPnL, 2, true)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-400 text-[11px]">Pending Outcome</span>
                  )}

                  <span className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px]">
                    Inspect Thesis <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
