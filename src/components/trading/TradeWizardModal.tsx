import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Target,
  Sliders,
  DollarSign,
  Send,
  Sparkles,
  Info,
  BookOpen,
  Activity,
  Zap,
} from 'lucide-react';
import {
  MarketQuote,
  OrderSide,
  OrderType,
  Strategy,
  TradingAccount,
  KillSwitchState,
  EmotionState,
} from '../../types/client.ts';
import { api } from '../../lib/api.ts';
import { formatCurrency, formatNumber, formatPercent } from '../../lib/formatters.ts';

interface TradeWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotes: MarketQuote[];
  strategies: Strategy[];
  activeAccount?: TradingAccount | null;
  killSwitch?: KillSwitchState;
  defaultSymbol?: string;
  onOrderSuccess: (order: any) => void;
}

export const TradeWizardModal: React.FC<TradeWizardModalProps> = ({
  isOpen,
  onClose,
  quotes,
  strategies,
  activeAccount,
  killSwitch,
  defaultSymbol,
  onOrderSuccess,
}) => {
  const [step, setStep] = useState<number>(1);
  const [symbol, setSymbol] = useState(defaultSymbol || quotes[0]?.symbol || 'BTC/USDT');
  const [side, setSide] = useState<OrderSide>(OrderSide.BUY);
  const [type, setType] = useState<OrderType>(OrderType.MARKET);
  const [quantity, setQuantity] = useState<string>('0.25');
  const [limitPrice, setLimitPrice] = useState<string>('');
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [strategyId, setStrategyId] = useState<string>(strategies[0]?.id || 'strat_breakout');
  const [setup, setSetup] = useState<string>('Key Level Breakout');
  const [thesis, setThesis] = useState<string>('');
  const [invalidation, setInvalidation] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(8);
  const [emotion, setEmotion] = useState<EmotionState>(EmotionState.DISCIPLINED);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const selectedQuote = quotes.find((q) => q.symbol === symbol) || quotes[0];
  const currentPrice = selectedQuote ? selectedQuote.price : 100;
  const numQty = parseFloat(quantity) || 0;
  const entryPrice = type === OrderType.LIMIT && parseFloat(limitPrice) ? parseFloat(limitPrice) : currentPrice;
  const estimatedNotional = numQty * entryPrice;

  // Calculation of Risk/Reward and Distances
  const numStopLoss = parseFloat(stopLoss) || 0;
  const numTakeProfit = parseFloat(takeProfit) || 0;

  let riskPerUnit = 0;
  let rewardPerUnit = 0;
  let riskRewardRatio = 0;

  if (side === OrderSide.BUY) {
    if (numStopLoss > 0) riskPerUnit = Math.max(0, entryPrice - numStopLoss);
    if (numTakeProfit > 0) rewardPerUnit = Math.max(0, numTakeProfit - entryPrice);
  } else {
    if (numStopLoss > 0) riskPerUnit = Math.max(0, numStopLoss - entryPrice);
    if (numTakeProfit > 0) rewardPerUnit = Math.max(0, entryPrice - numTakeProfit);
  }

  const totalDollarRisk = riskPerUnit * numQty;
  const totalDollarReward = rewardPerUnit * numQty;
  if (riskPerUnit > 0 && rewardPerUnit > 0) {
    riskRewardRatio = Number((rewardPerUnit / riskPerUnit).toFixed(2));
  }

  // Pre-Trade Risk Engine Simulation Checks
  const maxNotionalLimit = 500000;
  const isNotionalExceeded = estimatedNotional > maxNotionalLimit;
  const isKillSwitchBlocked = killSwitch?.isActive;
  const accountEquity = activeAccount?.equity || 250000;
  const exposurePct = Number(((estimatedNotional / accountEquity) * 100).toFixed(1));
  const isExposureExceeded = exposurePct > 50; // Max single-trade exposure 50%
  const isStopLossMissing = numStopLoss <= 0;
  const isAccountEquitySufficient = accountEquity * 10 >= estimatedNotional; // 10x max leverage
  const isRiskPassed = !isNotionalExceeded && !isKillSwitchBlocked && isAccountEquitySufficient && numQty > 0;

  useEffect(() => {
    if (defaultSymbol) {
      setSymbol(defaultSymbol);
    }
  }, [defaultSymbol]);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setServerError(null);
      if (type === OrderType.LIMIT && (!limitPrice || limitPrice === '')) {
        setLimitPrice(currentPrice.toString());
      }
    }
  }, [isOpen, currentPrice]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setServerError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        symbol,
        side,
        type,
        quantity: numQty,
        limitPrice: type === OrderType.LIMIT ? parseFloat(limitPrice) : undefined,
        stopPrice: numStopLoss > 0 ? numStopLoss : undefined,
        strategyId,
      };

      const res = await api.submitOrder(payload);
      if (res.error || (res.code && res.code.includes('RISK'))) {
        setServerError(res.message || res.error || 'Risk Engine rejected order');
        setStep(4); // Bring user back to risk validation step
      } else {
        // Automatically create a linked journal entry in PRE_TRADE status so the trade is tracked
        try {
          const selectedStrat = strategies.find((s) => s.id === strategyId);
          await api.createJournalEntry({
            symbol,
            direction: side === OrderSide.BUY ? 'LONG' : 'SHORT',
            plannedEntry: entryPrice,
            stopLoss: numStopLoss > 0 ? numStopLoss : undefined,
            takeProfit: numTakeProfit > 0 ? numTakeProfit : undefined,
            positionSize: estimatedNotional,
            strategy: selectedStrat?.name || 'Discretionary',
            setup,
            marketConditions: 'Active Market Session',
            tradingThesis: thesis || `Pre-planned ${side} order placed via Guided Trade Wizard.`,
            invalidationCriteria: invalidation || (numStopLoss > 0 ? `Price closing beyond $${numStopLoss}` : 'Key support/resistance breach'),
            confidenceScore: confidence,
            riskRewardRatio: riskRewardRatio || 2.0,
            emotion,
            status: 'PRE_TRADE',
            tags: [side, type, 'WIZARD_ENTRY'],
          });
        } catch (e) {
          console.error('Journal entry background registration:', e);
        }

        onOrderSuccess(res.order);
        onClose();
      }
    } catch (err: any) {
      setServerError(err.message || 'Failed to submit order to broker');
      setStep(4);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepTitles = [
    '1. Trade Idea & Asset',
    '2. Thesis & Conviction',
    '3. Trade Plan & Target',
    '4. Risk Check & Safety',
    '5. Review & Confirm',
    '6. Execute & Route',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 select-none animate-in fade-in duration-150">
      <div className="bg-[#0b101b] border border-slate-700 rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl relative text-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header with Step Indicator */}
        <div className="pb-3 mb-3 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold">
                Step {step} of 6
              </span>
              <h3 className="text-base font-bold text-white tracking-tight">
                {stepTitles[step - 1]}
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Guided institutional trade workflow: Idea → Thesis → Plan → Risk Check → Confirm → Execute
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Stepper Bar */}
        <div className="grid grid-cols-6 gap-1 mb-3 shrink-0">
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                s < step
                  ? 'bg-emerald-400'
                  : s === step
                  ? 'bg-cyan-400'
                  : 'bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Server Rejection Alert */}
        {serverError && (
          <div className="mb-3 p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-start gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-400" />
            <div>
              <span className="font-bold">Risk Engine Rejection:</span> {serverError}
            </div>
          </div>
        )}

        {/* Modal Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs">
          {/* STEP 1: TRADE IDEA */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1.5 font-bold uppercase">
                  Select Instrument
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {quotes.map((q) => (
                    <button
                      key={q.symbol}
                      type="button"
                      onClick={() => setSymbol(q.symbol)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        symbol === q.symbol
                          ? 'bg-cyan-500/15 border-cyan-500 text-white shadow-sm'
                          : 'bg-[#0e1424] border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="font-bold text-xs font-mono">{q.symbol}</div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        {formatCurrency(q.price)}
                      </div>
                      <div
                        className={`text-[10px] font-mono font-medium ${
                          q.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {q.change24h >= 0 ? '+' : ''}
                        {q.change24h.toFixed(2)}%
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Direction Selector */}
              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1.5 font-bold uppercase">
                  Order Direction
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSide(OrderSide.BUY)}
                    className={`p-3 rounded-xl border font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      side === OrderSide.BUY
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-950/40'
                        : 'bg-[#0e1424] border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>BUY / LONG</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSide(OrderSide.SELL)}
                    className={`p-3 rounded-xl border font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      side === OrderSide.SELL
                        ? 'bg-rose-500/20 border-rose-500 text-rose-400 shadow-md shadow-rose-950/40'
                        : 'bg-[#0e1424] border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <TrendingDown className="w-4 h-4" />
                    <span>SELL / SHORT</span>
                  </button>
                </div>
              </div>

              {/* Live Market Quote Snapshot */}
              {selectedQuote && (
                <div className="p-3 bg-[#080d19] border border-slate-800 rounded-xl flex items-center justify-between font-mono">
                  <div>
                    <span className="text-slate-400">Mark Price:</span>{' '}
                    <span className="font-bold text-white text-sm">
                      {formatCurrency(selectedQuote.price)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Spread:</span>{' '}
                    <span className="text-cyan-400">${selectedQuote.spread.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">24h Volume:</span>{' '}
                    <span className="text-slate-300">${(selectedQuote.volume24h / 1e6).toFixed(1)}M</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: THESIS & CONVICTION */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1.5 font-bold uppercase">
                  Assigned Strategy
                </label>
                <select
                  value={strategyId}
                  onChange={(e) => setStrategyId(e.target.value)}
                  className="w-full bg-[#0e1424] border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                >
                  {strategies.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.type} • {s.winRate}% WR)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-mono text-[11px] mb-1.5 font-bold uppercase">
                    Setup Pattern
                  </label>
                  <input
                    type="text"
                    value={setup}
                    onChange={(e) => setSetup(e.target.value)}
                    placeholder="e.g. 15m VWAP Retest, Range Breakout"
                    className="w-full bg-[#0e1424] border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-mono text-[11px] mb-1.5 font-bold uppercase">
                    Emotional State
                  </label>
                  <select
                    value={emotion}
                    onChange={(e) => setEmotion(e.target.value as EmotionState)}
                    className="w-full bg-[#0e1424] border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                  >
                    {Object.values(EmotionState).map((em) => (
                      <option key={em} value={em}>
                        {em}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1.5 font-bold uppercase">
                  Trade Thesis (Why this trade?)
                </label>
                <textarea
                  value={thesis}
                  onChange={(e) => setThesis(e.target.value)}
                  placeholder="Explain why you are taking this trade. What market signals or catalysts confirm your bias?"
                  rows={3}
                  className="w-full bg-[#0e1424] border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1.5 font-bold uppercase">
                  Invalidation Criteria (When are you wrong?)
                </label>
                <input
                  type="text"
                  value={invalidation}
                  onChange={(e) => setInvalidation(e.target.value)}
                  placeholder="e.g. 5-minute candle close below $66,800 or order flow reversal"
                  className="w-full bg-[#0e1424] border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-400 font-mono text-[11px] font-bold uppercase">
                    Setup Conviction Score
                  </label>
                  <span className="font-mono font-bold text-cyan-400 text-xs">
                    {confidence} / 10
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={confidence}
                  onChange={(e) => setConfidence(parseInt(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* STEP 3: TRADE PLAN & TARGETS */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1.5 font-bold uppercase">
                  Order Type & Execution Route
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[OrderType.MARKET, OrderType.LIMIT, OrderType.STOP_MARKET].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`p-2.5 rounded-xl border font-bold font-mono transition-all cursor-pointer ${
                        type === t
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                          : 'bg-[#0e1424] border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {type === OrderType.LIMIT && (
                <div>
                  <label className="block text-slate-400 font-mono text-[11px] mb-1 font-bold uppercase">
                    Limit Entry Price ($)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(e.target.value)}
                    className="w-full bg-[#0e1424] border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-mono text-[11px] mb-1 font-bold uppercase">
                    Stop Loss Price ($)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 66500"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                    className="w-full bg-[#0e1424] border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-mono text-[11px] mb-1 font-bold uppercase">
                    Take Profit Target ($)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 69000"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(e.target.value)}
                    className="w-full bg-[#0e1424] border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Quantity / Sizing Input */}
              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1 font-bold uppercase">
                  Position Size (Units)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="any"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="flex-1 bg-[#0e1424] border border-slate-700 rounded-xl p-2.5 text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
                  />
                  <span className="px-3 py-2.5 bg-slate-800 rounded-xl font-mono font-bold text-slate-300">
                    {symbol.split('/')[0]}
                  </span>
                </div>
              </div>

              {/* R:R Ratio Preview Card */}
              {riskRewardRatio > 0 && (
                <div className="p-3 bg-cyan-950/20 border border-cyan-500/30 rounded-xl font-mono flex items-center justify-between">
                  <div>
                    <span className="text-slate-400">Risk/Reward:</span>{' '}
                    <span className="font-bold text-cyan-300 text-sm">
                      1 : {riskRewardRatio.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Risk:</span>{' '}
                    <span className="text-rose-400 font-bold">${totalDollarRisk.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Reward:</span>{' '}
                    <span className="text-emerald-400 font-bold">${totalDollarReward.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: RISK CHECK & SIMULATION */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="p-4 bg-[#080d19] border border-slate-800 rounded-xl space-y-3">
                <div className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  Live Pre-Trade Risk Engine Simulation
                </div>

                <div className="space-y-2.5 text-xs font-mono">
                  {/* 1. Kill Switch Check */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="flex items-center gap-2 text-slate-300">
                      {isKillSwitchBlocked ? (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      Emergency Kill Switch
                    </span>
                    <span className={isKillSwitchBlocked ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                      {isKillSwitchBlocked ? 'HALTED (VIOLATION)' : 'NORMAL (PASS)'}
                    </span>
                  </div>

                  {/* 2. Position Size Limit Check */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="flex items-center gap-2 text-slate-300">
                      {isNotionalExceeded ? (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      Max Notional Limit (${maxNotionalLimit.toLocaleString()})
                    </span>
                    <span className={isNotionalExceeded ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                      {formatCurrency(estimatedNotional)} ({isNotionalExceeded ? 'FAIL' : 'PASS'})
                    </span>
                  </div>

                  {/* 3. Single-Trade Portfolio Exposure */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="flex items-center gap-2 text-slate-300">
                      {isExposureExceeded ? (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      Portfolio Exposure Limit (Max 50%)
                    </span>
                    <span className={isExposureExceeded ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                      {exposurePct}% ({isExposureExceeded ? 'FAIL' : 'PASS'})
                    </span>
                  </div>

                  {/* 4. Stop Loss Discipline */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="flex items-center gap-2 text-slate-300">
                      {isStopLossMissing ? (
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      Stop Loss Discipline Policy
                    </span>
                    <span className={isStopLossMissing ? 'text-amber-400' : 'text-emerald-400'}>
                      {isStopLossMissing ? 'WARNING (UNDEFINED)' : 'DEFINED (PASS)'}
                    </span>
                  </div>
                </div>

                {/* Sizing suggestion if blocked */}
                {(!isRiskPassed || isExposureExceeded) && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs">
                    <div className="font-bold flex items-center gap-1.5 mb-1">
                      <Sliders className="w-3.5 h-3.5" /> Actionable Sizing Adjustment
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Reduce quantity to{' '}
                      <strong className="text-white font-mono">
                        {((numQty * 0.5) || 0.1).toFixed(3)}
                      </strong>{' '}
                      units to bring notional value within safety thresholds.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW & CONFIRM */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="p-4 bg-[#0d1424] border border-slate-700/80 rounded-xl space-y-3 font-mono text-xs">
                <div className="flex justify-between font-bold text-white text-sm pb-2 border-b border-slate-800">
                  <span className="flex items-center gap-2">
                    <span className={side === OrderSide.BUY ? 'text-emerald-400' : 'text-rose-400'}>
                      {side}
                    </span>
                    {quantity} {symbol}
                  </span>
                  <span>{type} @ {formatCurrency(entryPrice)}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-300 text-[11px]">
                  <div>
                    <span className="text-slate-400">Notional Value:</span> {formatCurrency(estimatedNotional)}
                  </div>
                  <div>
                    <span className="text-slate-400">Risk/Reward:</span> {riskRewardRatio > 0 ? `1 : ${riskRewardRatio}` : 'N/A'}
                  </div>
                  <div>
                    <span className="text-slate-400">Stop Loss:</span> {numStopLoss > 0 ? formatCurrency(numStopLoss) : 'None'}
                  </div>
                  <div>
                    <span className="text-slate-400">Take Profit:</span> {numTakeProfit > 0 ? formatCurrency(numTakeProfit) : 'None'}
                  </div>
                </div>

                {thesis && (
                  <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-300 font-sans italic bg-slate-950/40 p-2.5 rounded-lg">
                    "{thesis}"
                  </div>
                )}
              </div>

              <div className="p-3 bg-cyan-950/20 border border-cyan-500/30 rounded-xl text-xs text-cyan-200 flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0 text-cyan-400" />
                <span>
                  Submitting will transmit this order to the execution gateway and initialize a trade journal record.
                </span>
              </div>
            </div>
          )}

          {/* STEP 6: EXECUTE */}
          {step === 6 && (
            <div className="space-y-4 text-center py-6">
              <div className="w-16 h-16 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mx-auto animate-pulse">
                <Zap className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white font-mono">
                  Ready to Transmit {side} Order for {quantity} {symbol}
                </h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  All pre-trade risk checks passed. Click below to execute via the mock broker gateway.
                </p>
              </div>

              <div className="pt-4 max-w-sm mx-auto">
                <button
                  type="button"
                  disabled={!isRiskPassed || isSubmitting}
                  onClick={handleSubmit}
                  className={`w-full py-3.5 rounded-xl font-bold font-mono text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xl ${
                    side === OrderSide.BUY
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50'
                      : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Transmitting to Gateway...' : `Authorize & Execute ${side}`}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Controls */}
        <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between shrink-0">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 6 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-md shadow-cyan-950/40"
            >
              Next: {stepTitles[step].replace(/^\d+\.\s*/, '')}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};
