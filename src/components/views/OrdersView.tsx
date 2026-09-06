import React, { useState } from 'react';
import { FileText, CheckCircle2, Clock, XCircle, ArrowUpRight, ArrowDownRight, Plus, RefreshCw } from 'lucide-react';
import { Order, Execution, OrderStatus, TradeLifecycleStage } from '../../types/client.ts';
import { formatCurrency } from '../../lib/formatters.ts';

interface OrdersViewProps {
  orders?: Order[];
  executions?: Execution[];
  onCancelOrder?: (id: string) => void;
  onOpenOrderModal?: () => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders = [],
  executions = [],
  onCancelOrder = (_id?: string) => {},
  onOpenOrderModal = () => {},
}) => {
  const [tab, setTab] = useState<'ORDERS' | 'EXECUTIONS'>('ORDERS');

  const safeOrders = orders || [];
  const safeExecutions = executions || [];
  const activeOrders = safeOrders.filter((o) => o.status === OrderStatus.SUBMITTED);

  const stages = [
    { label: '1. IDEA', desc: 'Screening & Observation' },
    { label: '2. THESIS', desc: 'Invalidation & Structure' },
    { label: '3. PLANNED', desc: 'Risk Check & Sizing' },
    { label: '4. SUBMITTED', desc: 'OMS & Broker Route' },
    { label: '5. FILLED', desc: 'Execution & Slippage' },
    { label: '6. POSITION', desc: 'Dynamic Management' },
    { label: '7. CLOSED', desc: 'PnL Realization' },
    { label: '8. REVIEWED', desc: 'Behavioral Audit' },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Trade Lifecycle State Machine Visualizer */}
      <div className="bg-[#0d1322] border border-slate-800/90 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-cyan-400" />
              Trade Lifecycle State Machine
            </h3>
            <p className="text-xs text-slate-400">Strict architectural progression enforced on all trades</p>
          </div>
          <button
            onClick={onOpenOrderModal}
            className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            New Order
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {stages.map((st, i) => (
            <div
              key={st.label}
              className="p-3 bg-[#090d16] border border-slate-800/80 rounded-xl relative overflow-hidden"
            >
              <div className="text-[11px] font-bold font-mono text-cyan-400">{st.label}</div>
              <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">{st.desc}</div>
              <div className="mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 rounded-full w-full opacity-60" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Sub-Tabs (Orders vs Executions) */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setTab('ORDERS')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            tab === 'ORDERS'
              ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
              : 'bg-[#0d1322] text-slate-400 border border-slate-800 hover:text-white'
          }`}
        >
          Working & Historical Orders ({safeOrders.length})
        </button>
        <button
          onClick={() => setTab('EXECUTIONS')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            tab === 'EXECUTIONS'
              ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
              : 'bg-[#0d1322] text-slate-400 border border-slate-800 hover:text-white'
          }`}
        >
          Execution Fills & Microstructure ({safeExecutions.length})
        </button>
      </div>

      {/* 3. Orders Table */}
      {tab === 'ORDERS' && (
        <div className="bg-[#0d1322] border border-slate-800/90 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#090d16] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Order ID</th>
                  <th className="p-3.5">Symbol</th>
                  <th className="p-3.5">Side</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Qty / Filled</th>
                  <th className="p-3.5">Price</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Source</th>
                  <th className="p-3.5 text-right">Time</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {safeOrders.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-500">
                      No order records in memory.
                    </td>
                  </tr>
                ) : (
                  safeOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5 text-slate-400 font-bold">{ord.id}</td>
                      <td className="p-3.5 text-white font-bold">{ord.symbol}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ord.side === 'BUY'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {ord.side}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-300">{ord.type}</td>
                      <td className="p-3.5 text-slate-300">
                        {ord.filledQuantity} / {ord.quantity}
                      </td>
                      <td className="p-3.5 text-slate-300">
                        {ord.limitPrice ? formatCurrency(ord.limitPrice) : 'MARKET (IOC)'}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ord.status === OrderStatus.FILLED
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : ord.status === OrderStatus.SUBMITTED
                              ? 'bg-cyan-500/10 text-cyan-400 animate-pulse'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300">
                          {ord.source}
                        </span>
                      </td>
                      <td className="p-3.5 text-right text-slate-500 text-[11px]">
                        {new Date(ord.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="p-3.5 text-right">
                        {ord.status === OrderStatus.SUBMITTED ? (
                          <button
                            onClick={() => onCancelOrder(ord.id)}
                            className="px-2 py-1 text-[10px] font-bold rounded bg-rose-950/40 text-rose-300 hover:bg-rose-900 border border-rose-800/40 cursor-pointer"
                          >
                            Cancel
                          </button>
                        ) : (
                          <span className="text-slate-600 text-[10px]">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Executions Table */}
      {tab === 'EXECUTIONS' && (
        <div className="bg-[#0d1322] border border-slate-800/90 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#090d16] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Exec ID</th>
                  <th className="p-3.5">Order Ref</th>
                  <th className="p-3.5">Symbol</th>
                  <th className="p-3.5">Fill Price</th>
                  <th className="p-3.5">Filled Qty</th>
                  <th className="p-3.5">Venue / Broker</th>
                  <th className="p-3.5">Fee</th>
                  <th className="p-3.5">Slippage</th>
                  <th className="p-3.5 text-right">Execution Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {safeExecutions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      No executions recorded yet.
                    </td>
                  </tr>
                ) : (
                  safeExecutions.map((ex) => (
                    <tr key={ex.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5 text-cyan-400 font-bold">{ex.id}</td>
                      <td className="p-3.5 text-slate-400">{ex.orderId}</td>
                      <td className="p-3.5 text-white font-bold">{ex.symbol}</td>
                      <td className="p-3.5 text-emerald-400 font-bold">{formatCurrency(ex.price)}</td>
                      <td className="p-3.5 text-slate-300">{ex.quantity}</td>
                      <td className="p-3.5 text-slate-300">{ex.venue}</td>
                      <td className="p-3.5 text-slate-400">${ex.fee.toFixed(2)}</td>
                      <td className="p-3.5 font-bold text-amber-400">
                        {ex.slippageBps ? `+${ex.slippageBps} bps` : '0.0 bps'}
                      </td>
                      <td className="p-3.5 text-right text-slate-500 text-[11px]">
                        {new Date(ex.executedAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
