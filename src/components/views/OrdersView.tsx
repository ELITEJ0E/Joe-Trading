import React, { useState } from 'react';
import {
  ArrowUpDown,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { Order, Execution, UnifiedTrade } from '../../types/client.ts';
import { formatCurrency, formatNumber } from '../../lib/formatters.ts';
import { StatusBadge } from '../common/StatusBadge.tsx';
import { TradeLifecycle } from '../trading/TradeLifecycle.tsx';
import { EmptyState } from '../common/EmptyState.tsx';
import { cn } from '../../lib/utils.ts';

interface OrdersViewProps {
  orders?: Order[];
  executions?: Execution[];
  unifiedTrades?: UnifiedTrade[];
  onCancelOrder?: (orderId: string) => void;
  onOpenOrderModal?: () => void;
  onSelectTrade?: (trade: UnifiedTrade) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders = [],
  executions = [],
  unifiedTrades = [],
  onCancelOrder = (_id: string) => {},
  onOpenOrderModal = () => {},
  onSelectTrade = (_t: UnifiedTrade) => {},
}) => {
  const [activeTab, setActiveTab] = useState<'OPEN' | 'HISTORY' | 'EXECUTIONS'>('OPEN');
  const [searchTerm, setSearchTerm] = useState('');

  const safeOrders = orders || [];
  const safeExecutions = executions || [];
  const safeTrades = unifiedTrades || [];

  const openOrders = safeOrders.filter((o) => ['OPEN', 'PENDING', 'SUBMITTED', 'PARTIAL'].includes(o.status));
  const orderHistory = safeOrders.filter((o) => ['FILLED', 'CANCELLED', 'REJECTED'].includes(o.status));

  const filteredList =
    activeTab === 'OPEN'
      ? openOrders.filter((o) => o.symbol.toLowerCase().includes(searchTerm.toLowerCase()))
      : activeTab === 'HISTORY'
      ? orderHistory.filter((o) => o.symbol.toLowerCase().includes(searchTerm.toLowerCase()))
      : safeExecutions.filter((e) => e.symbol.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-5">
      {/* 1. Header & Quick Trigger */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0c1220] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <ArrowUpDown className="w-5 h-5 text-cyan-400" />
            Order Management System (OMS) & Executions
          </h2>
          <p className="text-xs text-slate-400">
            Real-time FIX order lifecycle, working limit queue, execution microstructure, and latency metrics
          </p>
        </div>

        <button
          onClick={onOpenOrderModal}
          className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold font-mono transition-all shadow-md shadow-cyan-950/40 flex items-center gap-2 cursor-pointer self-stretch sm:self-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          + Place New Order
        </button>
      </div>

      {/* 2. Sub-tab Filter Bar & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-[#0c1220] rounded-xl border border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('OPEN')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer whitespace-nowrap',
              activeTab === 'OPEN'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            )}
          >
            Working Orders ({openOrders.length})
          </button>

          <button
            onClick={() => setActiveTab('HISTORY')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer whitespace-nowrap',
              activeTab === 'HISTORY'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            )}
          >
            Order History ({orderHistory.length})
          </button>

          <button
            onClick={() => setActiveTab('EXECUTIONS')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer whitespace-nowrap',
              activeTab === 'EXECUTIONS'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            )}
          >
            Fill Executions ({safeExecutions.length})
          </button>
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search symbol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#0c1220] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>
      </div>

      {/* 3. Main Data Container */}
      {filteredList.length === 0 ? (
        <EmptyState
          icon={ArrowUpDown}
          title={
            activeTab === 'OPEN'
              ? 'No Working Orders'
              : activeTab === 'HISTORY'
              ? 'No Past Orders'
              : 'No Executions Recorded'
          }
          description="Your orders and execution fills will appear here in real-time."
          actionLabel="+ Place New Order"
          onAction={onOpenOrderModal}
        />
      ) : activeTab === 'EXECUTIONS' ? (
        /* Executions Table */
        <div className="bg-[#0c1220] border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-[#080d19] text-slate-400 border-b border-slate-800 text-[10px] uppercase">
                  <th className="p-4 font-bold">Execution ID / Time</th>
                  <th className="p-4 font-bold">Symbol / Side</th>
                  <th className="p-4 font-bold">Fill Quantity</th>
                  <th className="p-4 font-bold">Fill Price</th>
                  <th className="p-4 font-bold">Total Value</th>
                  <th className="p-4 font-bold">Venue</th>
                  <th className="p-4 font-bold text-right">Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {(filteredList as Execution[]).map((exec) => (
                  <tr key={exec.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-white">{exec.id}</div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(exec.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{exec.symbol}</span>
                        <StatusBadge status={exec.side} size="sm" />
                      </div>
                    </td>
                    <td className="p-4 text-slate-200">{exec.quantity}</td>
                    <td className="p-4 text-white font-bold">{formatCurrency(exec.price)}</td>
                    <td className="p-4 text-slate-300">{formatCurrency(exec.quantity * exec.price)}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                        {(exec as any).venue || exec.brokerExecutionId || 'FIX Direct'}
                      </span>
                    </td>
                    <td className="p-4 text-right text-slate-400">
                      {formatCurrency(exec.fee || 1.25)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Orders Table & Mobile Cards */
        <div className="space-y-3">
          {/* Desktop Table */}
          <div className="hidden lg:block bg-[#0c1220] border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-[#080d19] text-slate-400 border-b border-slate-800 text-[10px] uppercase">
                    <th className="p-4 font-bold">Order ID / Time</th>
                    <th className="p-4 font-bold">Symbol / Side</th>
                    <th className="p-4 font-bold">Type</th>
                    <th className="p-4 font-bold">Size / Filled</th>
                    <th className="p-4 font-bold">Limit Price</th>
                    <th className="p-4 font-bold">Status</th>
                    <th className="p-4 font-bold">Lifecycle State</th>
                    <th className="p-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(filteredList as Order[]).map((order) => {
                    const matchingTrade = safeTrades.find((t) => t.orders.some((o) => o.id === order.id) || t.symbol === order.symbol);

                    return (
                      <tr
                        key={order.id}
                        className="hover:bg-slate-800/30 transition-colors group cursor-pointer"
                        onClick={() => matchingTrade && onSelectTrade(matchingTrade)}
                      >
                        <td className="p-4">
                          <div className="font-bold text-white">{order.id}</div>
                          <div className="text-[10px] text-slate-500">
                            {new Date(order.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{order.symbol}</span>
                            <StatusBadge status={order.side} size="sm" />
                          </div>
                        </td>
                        <td className="p-4 text-slate-300">{order.type}</td>
                        <td className="p-4">
                          <span className="text-white font-bold">{order.filledQuantity || 0}</span>
                          <span className="text-slate-500"> / {order.quantity}</span>
                        </td>
                        <td className="p-4 text-white font-bold">
                          {order.limitPrice ? formatCurrency(order.limitPrice) : 'MARKET'}
                        </td>
                        <td className="p-4">
                          <StatusBadge status={order.status} size="sm" />
                        </td>
                        <td className="p-4">
                          {matchingTrade ? (
                            <TradeLifecycle trade={matchingTrade} compact />
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {['OPEN', 'PENDING', 'SUBMITTED', 'PARTIAL'].includes(order.status) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onCancelOrder(order.id);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-xs font-mono border border-rose-800/50 transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:hidden">
            {(filteredList as Order[]).map((order) => {
              const matchingTrade = safeTrades.find((t) => t.orders.some((o) => o.id === order.id) || t.symbol === order.symbol);

              return (
                <div
                  key={order.id}
                  onClick={() => matchingTrade && onSelectTrade(matchingTrade)}
                  className="p-4 rounded-2xl bg-[#0c1220] border border-slate-800 hover:border-slate-700 transition-all space-y-3 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm font-mono">{order.symbol}</span>
                      <StatusBadge status={order.side} size="sm" />
                    </div>
                    <StatusBadge status={order.status} size="sm" />
                  </div>

                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-[#080d19] border border-slate-800/80 text-xs font-mono">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Type</span>
                      <span className="text-white font-bold">{order.type}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Quantity</span>
                      <span className="text-slate-300">
                        {order.filledQuantity || 0}/{order.quantity}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Price</span>
                      <span className="text-white font-bold">
                        {order.limitPrice ? formatCurrency(order.limitPrice) : 'MKT'}
                      </span>
                    </div>
                  </div>

                  {matchingTrade && (
                    <div className="pt-1">
                      <TradeLifecycle trade={matchingTrade} compact />
                    </div>
                  )}

                  {['OPEN', 'PENDING', 'SUBMITTED', 'PARTIAL'].includes(order.status) && (
                    <div className="pt-2 border-t border-slate-800/80 flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCancelOrder(order.id);
                        }}
                        className="px-3 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-xs font-mono border border-rose-800/50 transition-colors cursor-pointer"
                      >
                        Cancel Order
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
