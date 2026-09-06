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
} from 'lucide-react';
import {
  MarketQuote,
  OrderSide,
  OrderType,
  Strategy,
  TradingAccount,
  KillSwitchState,
} from '../../types/client.ts';
import { api } from '../../lib/api.ts';
import { formatCurrency, formatNumber } from '../../lib/formatters.ts';

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
  const [thesis, setThesis] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(8);
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
    riskRewardRatio = rewardPerUnit / riskPerUnit;
  }

  // Pre-Trade Risk Engine Simulation Checks
  const maxNotionalLimit = 500000;
  const isNotionalExceeded = estimatedNotional > maxNotionalLimit;
  const isKillSwitchBlocked = killSwitch?.isActive;
  const isAccountEquitySufficient = (activeAccount?.equity || 0) * 10 >= estimatedNotional; // 10x max leverage
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
      if (res.error || res.message) {
        setServerError(res.message || res.error);
        setStep(5); // Bring user back to risk validation step
      } else {
        // If thesis was entered, log a journal entry seamlessly
        if (thesis.trim()) {
          try {
            await api.createJournalEntry({
              symbol,
              tradeType: side === OrderSide.BUY ? 'LONG' : 'SHORT',
              strategyId,
              setupDescription: thesis,
              invalidationLevel: numStopLoss || entryPrice * 0.98,
              confidenceScore: confidence,
              emotion: 'DISCIPLINED',
              plannedEntry: entryPrice,
              plannedStop: numStopLoss || entryPrice * 0.98,
              plannedTarget: numTakeProfit || entryPrice * 1.05,
              positionSize: numQty,
              tags: ['Execution', 'TradeWizard'],
            });
          } catch (e) {
            console.error('Journal entry creation background note:', e);
          }
        }

        onOrderSuccess(res.order);
        onClose();
      }
    } catch (err: any) {
      setServerError(err.message || 'Failed to submit order to broker');
      setStep(5);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 select-none">
      <div className="bg-[#0b101b] border border-slate-700 rounded-2xl max-w-xl w-full p-4 sm:p-6 shadow-2xl relative text-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header with Step Indicator */}
        <div className="pb-3 mb-3 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                Step {step} of 5
              </span>
              <h3 className="text-base font-bold text-white tracking-tight">
                {step === 1 && '1. Instrument & Market Context'}
                {step === 2 && '2. Trade Thesis & Strategy'}
                {step === 3 && '3. Execution & Risk Parameters'}
                {step === 4 && '4. Sizing & Exposure Sizing'}
                {step === 5 && '5. Pre-Trade Compliance & Submit'}
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Disciplined order execution with mandatory pre-trade risk validation
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
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
          {/* STEP 1: Instrument & Direction */}
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

              {/* Quote Snapshot Card */}
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

          {/* STEP 2: Thesis & Strategy */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1.5 font-bold uppercase">
                  Attributed Trading Strategy
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

              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1.5 font-bold uppercase">
                  Trade Thesis & Setup Invalidation
                </label>
                <textarea
                  value={thesis}
                  onChange={(e) => setThesis(e.target.value)}
                  placeholder="Why are you taking this trade? What market condition invalidates your thesis?"
                  rows={4}
                  className="w-full bg-[#0e1424] border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-400 font-mono text-[11px] font-bold uppercase">
                    Setup Confidence Score
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
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                  <span>1 (Low Conviction)</span>
                  <span>5 (Standard Setup)</span>
                  <span>10 (A+ Playbook Setup)</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Execution & Price Parameters */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1.5 font-bold uppercase">
                  Order Type
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
                    placeholder="e.g. 102500"
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
                    placeholder="e.g. 108000"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(e.target.value)}
                    className="w-full bg-[#0e1424] border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
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

          {/* STEP 4: Sizing & Leverage */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1.5 font-bold uppercase">
                  Order Quantity / Position Size
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

              {/* Quick Size Preset Buttons */}
              <div>
                <label className="block text-slate-400 font-mono text-[10px] mb-1">
                  Preset Sizing (% of Account Equity)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['10%', '25%', '50%', '100%'].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => {
                        const factor = parseInt(pct) / 100;
                        const targetNotional = (activeAccount?.equity || 100000) * factor;
                        const calcQty = (targetNotional / entryPrice).toFixed(3);
                        setQuantity(calcQty);
                      }}
                      className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 font-mono text-xs cursor-pointer"
                    >
                      {pct}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notional & Capital Exposure Matrix */}
              <div className="p-3 bg-[#080d19] border border-slate-800 rounded-xl space-y-2 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Estimated Notional Value:</span>
                  <span className="font-bold text-white">{formatCurrency(estimatedNotional)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Available Account Cash:</span>
                  <span className="text-slate-300">{formatCurrency(activeAccount?.cashBalance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Account Equity:</span>
                  <span className="text-slate-300">{formatCurrency(activeAccount?.equity)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-800">
                  <span className="text-slate-400">Portfolio Leverage:</span>
                  <span className="text-cyan-400 font-bold">
                    {(estimatedNotional / (activeAccount?.equity || 1)).toFixed(2)}x
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Pre-Trade Compliance & Submit */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="p-3.5 bg-[#080d19] border border-slate-800 rounded-xl space-y-2.5">
                <div className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  Pre-Trade Compliance Verifications
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-300">
                      {isKillSwitchBlocked ? (
                        <XCircle className="w-4 h-4 text-rose-400" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                      Emergency Kill Switch Status
                    </span>
                    <span className={isKillSwitchBlocked ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                      {isKillSwitchBlocked ? 'HALTED' : 'READY (PASS)'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-300">
                      {isNotionalExceeded ? (
                        <XCircle className="w-4 h-4 text-rose-400" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                      Max Notional Limit (${maxNotionalLimit.toLocaleString()})
                    </span>
                    <span className={isNotionalExceeded ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                      {formatCurrency(estimatedNotional)} ({isNotionalExceeded ? 'FAIL' : 'PASS'})
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-300">
                      {isAccountEquitySufficient ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400" />
                      )}
                      Account Margin & Leverage Buffer
                    </span>
                    <span className={isAccountEquitySufficient ? 'text-emerald-400' : 'text-rose-400 font-bold'}>
                      {isAccountEquitySufficient ? 'SUFFICIENT (PASS)' : 'EXCEEDED (FAIL)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Final Summary */}
              <div className="p-3 bg-[#0d1424] border border-slate-700/80 rounded-xl space-y-1.5 font-mono text-xs">
                <div className="flex justify-between font-bold text-white text-sm">
                  <span>
                    {side} {quantity} {symbol}
                  </span>
                  <span>{type} @ {formatCurrency(entryPrice)}</span>
                </div>
                {numStopLoss > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Stop Loss: {formatCurrency(numStopLoss)}</span>
                    <span>Target: {numTakeProfit > 0 ? formatCurrency(numTakeProfit) : 'None'}</span>
                  </div>
                )}
                {thesis && (
                  <div className="pt-2 mt-1 border-t border-slate-800 text-[11px] text-slate-400 font-sans italic">
                    "{thesis}"
                  </div>
                )}
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

          {step < 5 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-md shadow-cyan-950/40"
            >
              Next Step
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={!isRiskPassed || isSubmitting}
              onClick={handleSubmit}
              className={`px-5 py-2.5 rounded-xl font-bold font-mono text-xs flex items-center gap-2 cursor-pointer transition-all shadow-lg ${
                isRiskPassed && !isSubmitting
                  ? side === OrderSide.BUY
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50'
                    : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Transmitting to Broker...' : `Transmit ${side} Order`}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
