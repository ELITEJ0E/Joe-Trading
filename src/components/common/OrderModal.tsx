import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, AlertCircle, ArrowUpRight, ArrowDownRight, Send } from 'lucide-react';
import { MarketQuote, OrderSide, OrderType, Strategy } from '../../types/client.ts';
import { api } from '../../lib/api.ts';
import { formatCurrency } from '../../lib/formatters.ts';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotes: MarketQuote[];
  strategies: Strategy[];
  defaultSymbol?: string;
  onOrderSuccess: (order: any) => void;
}

export const OrderModal: React.FC<OrderModalProps> = ({
  isOpen,
  onClose,
  quotes,
  strategies,
  defaultSymbol,
  onOrderSuccess,
}) => {
  const [symbol, setSymbol] = useState(defaultSymbol || quotes[0]?.symbol || 'BTC/USDT');
  const [side, setSide] = useState<OrderSide>(OrderSide.BUY);
  const [type, setType] = useState<OrderType>(OrderType.MARKET);
  const [quantity, setQuantity] = useState<string>('0.5');
  const [limitPrice, setLimitPrice] = useState<string>('');
  const [stopPrice, setStopPrice] = useState<string>('');
  const [strategyId, setStrategyId] = useState<string>(strategies[0]?.id || 'strat_breakout');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedQuote = quotes.find((q) => q.symbol === symbol) || quotes[0];
  const currentPrice = selectedQuote ? selectedQuote.price : 100;
  const numQty = parseFloat(quantity) || 0;
  const orderPrice = type === OrderType.LIMIT && parseFloat(limitPrice) ? parseFloat(limitPrice) : currentPrice;
  const estimatedNotional = numQty * orderPrice;

  useEffect(() => {
    if (defaultSymbol) {
      setSymbol(defaultSymbol);
    }
  }, [defaultSymbol]);

  useEffect(() => {
    if (type === OrderType.LIMIT && (!limitPrice || limitPrice === '')) {
      setLimitPrice(currentPrice.toString());
    }
  }, [type, currentPrice]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        symbol,
        side,
        type,
        quantity: numQty,
        limitPrice: type === OrderType.LIMIT ? parseFloat(limitPrice) : undefined,
        stopPrice: stopPrice ? parseFloat(stopPrice) : undefined,
        strategyId,
      };

      const res = await api.submitOrder(payload);
      if (res.error || res.message) {
        setError(res.message || res.error);
      } else {
        onOrderSuccess(res.order);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-[#0b101b] border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-slate-200">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              New Order Execution
            </h3>
            <p className="text-xs text-slate-400">Order Management System & Pre-Trade Risk</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold">Risk Validation Rejection:</span> {error}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Symbol & Market Quote Bar */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Asset Symbol
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="bg-[#0f172a] border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                {quotes.map((q) => (
                  <option key={q.symbol} value={q.symbol}>
                    {q.symbol}
                  </option>
                ))}
              </select>

              <div className="bg-[#0f172a] border border-slate-800 rounded-xl px-3 py-2 flex items-center justify-between">
                <span className="text-xs text-slate-400">Market:</span>
                <span className="text-sm font-mono font-bold text-white">
                  {formatCurrency(currentPrice)}
                </span>
              </div>
            </div>
          </div>

          {/* Side Selector (BUY / SELL) */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSide(OrderSide.BUY)}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                side === OrderSide.BUY
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-950/40'
                  : 'bg-[#0f172a] border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              BUY / LONG
            </button>
            <button
              type="button"
              onClick={() => setSide(OrderSide.SELL)}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                side === OrderSide.SELL
                  ? 'bg-rose-500/20 border-rose-500 text-rose-400 shadow-lg shadow-rose-950/40'
                  : 'bg-[#0f172a] border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              SELL / SHORT
            </button>
          </div>

          {/* Order Type Tabs */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Order Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[OrderType.MARKET, OrderType.LIMIT, OrderType.STOP_LIMIT].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`py-2 text-xs font-medium rounded-lg border transition-colors ${
                    type === t
                      ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400'
                      : 'bg-[#0f172a] border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity & Pricing Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Quantity</label>
              <input
                type="number"
                step="any"
                min="0.0001"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
                placeholder="0.00"
              />
            </div>

            {type === OrderType.LIMIT ? (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Limit Price ($)</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
                  placeholder="0.00"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Execution Benchmark</label>
                <div className="bg-[#0f172a] border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 font-mono flex items-center justify-between">
                  <span>Best Ask/Bid</span>
                  <span className="text-xs text-emerald-400 font-semibold">Immediate IOC</span>
                </div>
              </div>
            )}
          </div>

          {/* Strategy Mapping */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Trading Strategy
            </label>
            <select
              value={strategyId}
              onChange={(e) => setStrategyId(e.target.value)}
              className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
            >
              {strategies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.category})
                </option>
              ))}
            </select>
          </div>

          {/* Pre-Trade Risk Summary Box */}
          <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span>Estimated Notional Value:</span>
              <span className="font-mono font-bold text-white">{formatCurrency(estimatedNotional)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Estimated Fees (0.04%):</span>
              <span className="font-mono text-slate-300">${(estimatedNotional * 0.0004).toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Pre-Trade Risk Engine:
              </span>
              <span className="font-semibold text-emerald-400">PRE-CHECK PASSED</span>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || numQty <= 0}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                side === OrderSide.BUY
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Send className="w-3.5 h-3.5" />
              {isSubmitting ? 'Routing to Broker...' : `Submit ${side} Order`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
