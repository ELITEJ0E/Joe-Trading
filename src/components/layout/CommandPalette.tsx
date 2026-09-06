import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  LayoutDashboard,
  PieChart,
  Layers,
  FileText,
  BookOpen,
  TrendingUp,
  Cpu,
  BarChart3,
  ShieldCheck,
  ShieldAlert,
  BarChart2,
  FileCode,
  DollarSign,
  Plus,
} from 'lucide-react';
import { AppTab, MarketQuote } from '../../types/client.ts';
import { formatCurrency } from '../../lib/formatters.ts';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: AppTab) => void;
  quotes: MarketQuote[];
  onSelectSymbol: (symbol: string) => void;
  onOpenTradeModal: (defaultSymbol?: string) => void;
  onOpenKillSwitchModal: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  quotes,
  onSelectSymbol,
  onOpenTradeModal,
  onOpenKillSwitchModal,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Trigger open via parent
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Build searchable items
  const navItems = [
    { type: 'NAV', id: 'DASHBOARD' as AppTab, title: 'Go to Dashboard', subtitle: 'Command Center & Executive KPIs', icon: LayoutDashboard },
    { type: 'NAV', id: 'PORTFOLIO' as AppTab, title: 'Go to Portfolio', subtitle: 'Capital Allocation & Sub-accounts', icon: PieChart },
    { type: 'NAV', id: 'POSITIONS' as AppTab, title: 'Go to Positions', subtitle: 'Active Risk Exposure & Live P&L', icon: Layers },
    { type: 'NAV', id: 'ORDERS' as AppTab, title: 'Go to Orders', subtitle: 'Order Management System (OMS)', icon: FileText },
    { type: 'NAV', id: 'JOURNAL' as AppTab, title: 'Go to Trade Journal', subtitle: 'Trade Thesis & Cognitive Review', icon: BookOpen },
    { type: 'NAV', id: 'STRATEGIES' as AppTab, title: 'Go to Strategies', subtitle: 'Strategy Performance & Alpha Rules', icon: TrendingUp },
    { type: 'NAV', id: 'BOTS' as AppTab, title: 'Go to Bots Gateway', subtitle: 'Automated Bot Agents & Telemetry', icon: Cpu },
    { type: 'NAV', id: 'ANALYTICS' as AppTab, title: 'Go to Trading Analytics', subtitle: 'Performance, Slippage & Psychological Bias', icon: BarChart3 },
    { type: 'NAV', id: 'RISK_CENTER' as AppTab, title: 'Go to Risk Center', subtitle: 'Safety Cockpit & Risk Thresholds', icon: ShieldCheck },
    { type: 'NAV', id: 'MARKET' as AppTab, title: 'Go to Market Terminal', subtitle: 'Live Candlestick Chart & Orderbook', icon: BarChart2 },
    { type: 'NAV', id: 'DOCS' as AppTab, title: 'Go to Documentation', subtitle: 'System Architecture & Event Model', icon: FileCode },
  ];

  const quickActions = [
    { type: 'ACTION', id: 'NEW_TRADE', title: 'Open New Trade Order', subtitle: 'Launch guided 6-step trade wizard', icon: Plus, action: () => onOpenTradeModal() },
    { type: 'ACTION', id: 'KILL_SWITCH', title: 'Emergency Kill Switch', subtitle: 'Immediate trading halt and cancellation', icon: ShieldAlert, action: () => onOpenKillSwitchModal() },
  ];

  const symbolItems = (quotes || []).map((q) => ({
    type: 'SYMBOL',
    id: q.symbol,
    title: `Trade ${q.symbol}`,
    subtitle: `Price: ${formatCurrency(q.price)} (${q.change24h >= 0 ? '+' : ''}${q.change24h.toFixed(2)}%)`,
    price: q.price,
    change: q.change24h,
    icon: DollarSign,
  }));

  const allItems = [...quickActions, ...symbolItems, ...navItems];

  const filteredItems = allItems.filter((item) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      (item.id && item.id.toLowerCase().includes(q))
    );
  });

  const handleSelect = (item: any) => {
    if (item.type === 'NAV') {
      onSelectTab(item.id);
    } else if (item.type === 'ACTION') {
      item.action();
    } else if (item.type === 'SYMBOL') {
      onSelectSymbol(item.id);
      onOpenTradeModal(item.id);
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleSelect(filteredItems[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 backdrop-blur-sm select-none">
      <div
        className="fixed inset-0"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-[#0a0f1d] border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 bg-[#0d1424]">
          <Search className="w-5 h-5 text-cyan-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, symbol (e.g. BTC, ETH), or view..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none font-mono"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-800/40">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 font-mono">
              No matching commands, symbols, or navigation targets found.
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = item.icon;

              return (
                <div
                  key={`${item.type}-${item.id}`}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-cyan-500/15 border border-cyan-500/40 text-white'
                      : 'hover:bg-slate-800/50 text-slate-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-lg ${
                        item.type === 'ACTION'
                          ? item.id === 'KILL_SWITCH'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-cyan-500/20 text-cyan-400'
                          : item.type === 'SYMBOL'
                          ? 'bg-emerald-500/10 text-emerald-400 font-mono'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="font-bold text-xs text-white truncate flex items-center gap-2">
                        {item.title}
                        {item.type === 'SYMBOL' && (
                          <span
                            className={`text-[10px] font-mono ${
                              (item as any).change >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {(item as any).change >= 0 ? '+' : ''}
                            {(item as any).change.toFixed(2)}%
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate font-mono">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] font-mono text-slate-400 shrink-0 ml-2">
                    {item.type === 'NAV' ? 'View' : item.type === 'SYMBOL' ? 'Trade' : 'Action'}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-slate-800 bg-[#060912] flex items-center justify-between text-[10px] font-mono text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700">↑</kbd>{' '}
              <kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700">↓</kbd> to
              navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">↵</kbd> to
              select
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">esc</kbd> to
              close
            </span>
          </div>
          <span className="text-cyan-400">TradeCore Universal Search</span>
        </div>
      </div>
    </div>
  );
};
