import React, { useState } from 'react';
import { X, BookOpen, Send, AlertCircle } from 'lucide-react';
import { EmotionState, MarketQuote, Strategy } from '../../types/client.ts';
import { api } from '../../lib/api.ts';

interface NewJournalEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotes: MarketQuote[];
  strategies: Strategy[];
  onSuccess: (newEntry: any) => void;
}

export const NewJournalEntryModal: React.FC<NewJournalEntryModalProps> = ({
  isOpen,
  onClose,
  quotes,
  strategies,
  onSuccess,
}) => {
  const [symbol, setSymbol] = useState(quotes[0]?.symbol || 'BTC/USDT');
  const [direction, setDirection] = useState<'LONG' | 'SHORT'>('LONG');
  const [plannedEntry, setPlannedEntry] = useState<string>('68400');
  const [stopLoss, setStopLoss] = useState<string>('67200');
  const [takeProfit, setTakeProfit] = useState<string>('71200');
  const [positionSize, setPositionSize] = useState<string>('25000');
  const [strategy, setStrategy] = useState<string>(strategies[0]?.name || 'Liquidity Sweep Breakout');
  const [setup, setSetup] = useState<string>('Asian High Sweep + 15m Fair Value Gap');
  const [marketConditions, setMarketConditions] = useState<string>('Bullish macro trend, positive funding rates');
  const [tradingThesis, setTradingThesis] = useState<string>('');
  const [invalidationCriteria, setInvalidationCriteria] = useState<string>('');
  const [confidenceScore, setConfidenceScore] = useState<number>(8);
  const [emotion, setEmotion] = useState<EmotionState>(EmotionState.DISCIPLINED);
  const [tags, setTags] = useState<string>('BREAKOUT, FVG, CRYPTO');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const entryNum = parseFloat(plannedEntry) || 0;
  const stopNum = parseFloat(stopLoss) || 0;
  const tpNum = parseFloat(takeProfit) || 0;

  const risk = Math.abs(entryNum - stopNum);
  const reward = Math.abs(tpNum - entryNum);
  const rrRatio = risk > 0 ? Number((reward / risk).toFixed(2)) : 1.0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        symbol,
        direction,
        plannedEntry: entryNum,
        stopLoss: stopNum,
        takeProfit: tpNum,
        positionSize: parseFloat(positionSize) || 1000,
        strategy,
        setup,
        marketConditions,
        tradingThesis,
        invalidationCriteria,
        confidenceScore,
        riskRewardRatio: rrRatio,
        emotion,
        tags: tags.split(',').map((t) => t.trim().toUpperCase()).filter(Boolean),
        status: 'PRE_TRADE',
      };

      const res = await api.createJournalEntry(payload);
      if (res.success) {
        onSuccess(res.entry);
        onClose();
      } else {
        setError(res.error || 'Failed to record entry');
      }
    } catch (err: any) {
      setError(err.message || 'Submission error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#0b101b] border border-slate-700/80 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative text-slate-200 my-8">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              Document Trade Thesis & Invalidation Plan
            </h3>
            <p className="text-xs text-slate-400">Structured discipline protocol prior to execution</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Symbol & Direction */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Asset Symbol</label>
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                {quotes.map((q) => (
                  <option key={q.symbol} value={q.symbol}>
                    {q.symbol}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Direction</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDirection('LONG')}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    direction === 'LONG'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                      : 'bg-[#0f172a] border-slate-800 text-slate-400'
                  }`}
                >
                  LONG
                </button>
                <button
                  type="button"
                  onClick={() => setDirection('SHORT')}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    direction === 'SHORT'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                      : 'bg-[#0f172a] border-slate-800 text-slate-400'
                  }`}
                >
                  SHORT
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Price Targets & RR */}
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Entry ($)</label>
              <input
                type="number"
                step="any"
                required
                value={plannedEntry}
                onChange={(e) => setPlannedEntry(e.target.value)}
                className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-rose-400 mb-1">Stop Loss ($)</label>
              <input
                type="number"
                step="any"
                required
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-rose-300 font-mono focus:border-rose-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-emerald-400 mb-1">Take Profit ($)</label>
              <input
                type="number"
                step="any"
                required
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-emerald-300 font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-cyan-400 mb-1">R:R Ratio</label>
              <div className="bg-[#0f172a] border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-cyan-400 flex items-center justify-center">
                {rrRatio}:1
              </div>
            </div>
          </div>

          {/* Row 3: Strategy & Setup */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Strategy</label>
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                {strategies.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Pattern Setup</label>
              <input
                type="text"
                required
                value={setup}
                onChange={(e) => setSetup(e.target.value)}
                placeholder="e.g. 15m Liquidity Sweep + Order Block"
                className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Row 4: Thesis & Invalidation */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Trading Thesis (Why this trade?)
            </label>
            <textarea
              rows={2}
              required
              value={tradingThesis}
              onChange={(e) => setTradingThesis(e.target.value)}
              placeholder="What structural or catalyst edge justifies risking capital here?"
              className="w-full bg-[#0f172a] border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500 leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-rose-400 mb-1">
              Explicit Invalidation Criteria (What proves me wrong?)
            </label>
            <input
              type="text"
              required
              value={invalidationCriteria}
              onChange={(e) => setInvalidationCriteria(e.target.value)}
              placeholder="e.g. 15m candle close below $67,200 swing pivot low"
              className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Row 5: Psychology & Confidence */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Emotional / Psychological State
              </label>
              <select
                value={emotion}
                onChange={(e) => setEmotion(e.target.value as EmotionState)}
                className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                {Object.values(EmotionState).map((em) => (
                  <option key={em} value={em}>
                    {em}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Confidence Rating: <span className="text-cyan-400 font-bold">{confidenceScore}/10</span>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={confidenceScore}
                onChange={(e) => setConfidenceScore(Number(e.target.value))}
                className="w-full accent-cyan-500 h-2 bg-slate-800 rounded-lg cursor-pointer mt-2"
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-cyan-600/30 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {isSubmitting ? 'Recording Thesis...' : 'Log Structured Thesis'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
