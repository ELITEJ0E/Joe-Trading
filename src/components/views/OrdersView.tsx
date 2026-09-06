import React, { useState } from 'react';
import {
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  RefreshCw,
  Zap,
  Ban,
  ArrowRight,
} from 'lucide-react';
import { Order, Execution, OrderStatus } from '../../types/client.ts';
import { formatCurrency } from '../../lib/formatters.ts';
import { StatusBadge } from '../common/StatusBadge.tsx';
import { EmptyState } from '../common/EmptyState.tsx';

interface OrdersViewProps {
  orders?: Order[];
  executions?: Execution[];
  onCancelOrder?: (id: string) => void;
  onOpenOrderModal?: () => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders = [],
  executions = [],
  onCancelOrder = (_id: string) => {},
  onOpenOrderModal = () => {},
}) => {
  const [tab, setTab] = useState<'ORDERS' | 'EXECUTIONS'>('ORDERS');
  const [orderFilter, setOrderFilter] = useState<'ALL' | 'OPEN' | 'FILLED' | 'INACTIVE'>('ALL');

  const safeOrders = orders || [];
  const safeExecutions = executions || [];

  const filteredOrders = safeOrders.filter((o) => {
    if (orderFilter === 'ALL') return true;
    if (orderFilter === 'OPEN') return o.status === 'SUBMITTED' || o.status === 'OPEN' || o.status === 'PENDING';
    if (orderFilter === 'FILLED') return o.status === 'FILLED' || o.status === 'PARTIAL';
    if (orderFilter === 'INACTIVE') return o.status === 'CANCELLED' || o.status === 'REJECTED';
    return true;
  });

  const stages = [
    { num: '1', label: 'IDEA', desc: 'Screening' },
    { num: '2', label: 'THESIS', desc: 'Invalidation' },
    { num: '3', label: 'PLANNED', desc: 'Risk Check' },
    { num: '4', label: 'SUBMITTED', desc: 'OMS Gateway' },
    { num: '5', label: 'FILLED', desc: 'Broker Route' },
    { num: '6', label: 'POSITION', desc: 'Live Exposure' },
    { num: '7', label: 'CLOSED', desc: 'Realized PnL' },
    { num: '8', label: 'REVIEWED', desc: 'Psych Audit' },
  ];

  return (
    <div className="space-y-5">
      {/* 1. Trade Lifecycle State Machine Visualizer */}
      <div className="bg-[#0b101d] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-cyan-400" />
              Order Management System & State Machine
            </h3>
            <p className="text-xs text-slate-400">
              Deterministic 8-stage trade progression pipeline with pre-trade risk gating
            </p>
          </div>
          <button
            onClick={onOpenOrderModal}
            className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold font-mono transition-all shadow-md shadow-cyan-950/40 flex items-center gap-1.5 cursor-pointer self-stretch sm:self-auto justify-center"
          >
            <Plus className="w-3.5 h-3.5" />
            New Order
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-1">
          {stages.map((st) => (
            <div
              key={st.label}
              className="p-2.5 bg-[#060912] border border-slate-800/80 rounded-xl relative overflow-hidden"
            >
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold flex items-center justify-center">
                  {st.num}
                </span>
                <span className="text-[11px] font-bold font-mono text-white">{st.label}</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1 truncate">{st.desc}</div>
              <div className="mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 rounded-full w-full opacity-60" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Sub-Tabs (Orders vs Executions) & Filter Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 p-1 bg-[#0b101d] rounded-xl border border-slate-800">
          <button
            onClick={() => setTab('ORDERS')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
              tab === 'ORDERS'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Orders History ({safeOrders.length})
          </button>
          <button
            onClick={() => setTab('EXECUTIONS')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
              tab === 'EXECUTIONS'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Execution Fills ({safeExecutions.length})
          </button>
        </div>

        {tab === 'ORDERS' && (
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {(['ALL', 'OPEN', 'FILLED', 'INACTIVE'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setOrderFilter(f)}
                className={`px-3 py-1 rounded-lg text-[11px] font-mono font-medium transition-colors cursor-pointer ${
                  orderFilter === f
                    ? 'bg-slate-800 text-cyan-300 border border-cyan-500/30 font-bold'
                    : 'bg-[#0b101d] text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. Orders Display (Desktop Table + Mobile Stacked Cards) */}
      {tab === 'ORDERS' && (
        <>
          {filteredOrders.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No Orders Found"
              description="There are currently no orders in the active filter selection."
              actionLabel="+ Place New Order"
              onAction={onOpenOrderModal}
            />
          ) : (
            <>
              {/* Mobile Card Stack */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {filteredOrders.map((ord) => {
                  const isOpen = ord.status === 'SUBMITTED' || ord.status === 'OPEN';
                  return (
                    <div
                      key={ord.id}
                      className="bg-[#0b101d] border border-slate-800 rounded-2xl p-4 space-y-2.5 font-mono text-xs shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{ord.symbol}</span>
                          <StatusBadge status={ord.side} size="sm" showIcon={false} />
                        </div>
                        <StatusBadge status={ord.status} size="sm" />
                      </div>

                      <div className="grid grid-cols-2 gap-2 p-2.5 bg-[#060912] rounded-xl border border-slate-800/80 text-[11px]">
                        <div>
                          <span className="text-slate-500 block text-[10px]">Type / Price</span>
                          <span className="font-bold text-white">
                            {ord.type} {ord.limitPrice ? `@ $${ord.limitPrice}` : '@ MKT'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Qty / Filled</span>
                          <span className="font-bold text-slate-300">
                            {ord.filledQuantity || 0} / {ord.quantity}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Origin</span>
                          <span className="text-slate-400">{ord.source || 'MANUAL'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Order ID</span>
                          <span className="text-slate-400 truncate block">{ord.id}</span>
                        </div>
                      </div>

                      {isOpen && (
                        <div className="flex justify-end pt-1">
                          <button
                            onClick={() => onCancelOrder(ord.id)}
                            className="px-3 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900 text-rose-300 border border-rose-800/50 text-xs font-bold cursor-pointer"
                          >
                            Cancel Order
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block bg-[#0b101d] border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#060912] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="p-3.5">Order ID</th>
                        <th className="p-3.5">Symbol</th>
                        <th className="p-3.5">Side</th>
                        <th className="p-3.5">Type</th>
                        <th className="p-3.5">Qty / Filled</th>
                        <th className="p-3.5">Limit / Price</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5">Source</th>
                        <th className="p-3.5 text-right">Submitted</th>
                        <th className="p-3.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredOrders.map((ord) => {
                        const isOpen = ord.status === 'SUBMITTED' || ord.status === 'OPEN';
                        return (
                          <tr key={ord.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="p-3.5 text-slate-400 font-bold">{ord.id}</td>
                            <td className="p-3.5 font-bold text-white">{ord.symbol}</td>
                            <td className="p-3.5">
                              <StatusBadge status={ord.side} size="sm" showIcon={false} />
                            </td>
                            <td className="p-3.5 text-slate-300">{ord.type}</td>
                            <td className="p-3.5 text-slate-300 font-bold">
                              {ord.filledQuantity || 0} / {ord.quantity}
                            </td>
                            <td className="p-3.5 text-slate-300">
                              {ord.limitPrice ? formatCurrency(ord.limitPrice) : 'MARKET'}
                            </td>
                            <td className="p-3.5">
                              <StatusBadge status={ord.status} size="sm" />
                            </td>
                            <td className="p-3.5 text-slate-400">{ord.source || 'MANUAL'}</td>
                            <td className="p-3.5 text-right text-slate-400">
                              {new Date(ord.createdAt).toLocaleTimeString()}
                            </td>
                            <td className="p-3.5 text-right">
                              {isOpen ? (
                                <button
                                  onClick={() => onCancelOrder(ord.id)}
                                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-rose-950/40 hover:bg-rose-900 text-rose-300 border border-rose-800/40 transition-colors cursor-pointer"
                                >
                                  Cancel
                                </button>
                              ) : (
                                <span className="text-slate-600 text-[10px]">Archived</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* 4. Execution Fills View */}
      {tab === 'EXECUTIONS' && (
        <>
          {safeExecutions.length === 0 ? (
            <EmptyState
              icon={Zap}
              title="No Executions Recorded"
              description="No trade executions have filled yet in the current simulation session."
            />
          ) : (
            <div className="bg-[#0b101d] border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#060912] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">Fill ID</th>
                      <th className="p-3.5">Order Ref</th>
                      <th className="p-3.5">Symbol</th>
                      <th className="p-3.5">Side</th>
                      <th className="p-3.5">Filled Qty</th>
                      <th className="p-3.5">Execution Price</th>
                      <th className="p-3.5">Slippage</th>
                      <th className="p-3.5">Fee Paid</th>
                      <th className="p-3.5 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {safeExecutions.map((ex) => (
                      <tr key={ex.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-3.5 text-cyan-400 font-bold">{ex.id}</td>
                        <td className="p-3.5 text-slate-400">{ex.orderId}</td>
                        <td className="p-3.5 font-bold text-white">{ex.symbol}</td>
                        <td className="p-3.5">
                          <StatusBadge status={ex.side} size="sm" showIcon={false} />
                        </td>
                        <td className="p-3.5 text-slate-200 font-bold">{ex.quantity}</td>
                        <td className="p-3.5 text-white font-bold">{formatCurrency(ex.price)}</td>
                        <td className="p-3.5 text-amber-400 font-medium">
                          {ex.slippageBps ? `${ex.slippageBps.toFixed(2)} bps` : '0.00 bps'}
                        </td>
                        <td className="p-3.5 text-slate-400">${ex.fee.toFixed(2)}</td>
                        <td className="p-3.5 text-right text-slate-400">
                          {new Date(ex.executedAt).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
