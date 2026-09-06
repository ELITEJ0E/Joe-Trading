import React, { useState, useEffect } from 'react';
import {
  Search,
  LayoutDashboard,
  Layers,
  ArrowUpDown,
  Wallet,
  BookOpen,
  BarChart3,
  Cpu,
  ShieldCheck,
  LineChart,
  Plus,
  ShieldAlert,
  X,
  FileText,
  Settings,
} from 'lucide-react';
import { AppTab } from '../../types/client.ts';
import { cn } from '../../lib/utils.ts';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: AppTab) => void;
  onOpenTradeModal: (symbol?: string) => void;
  onOpenKillSwitchModal: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onOpenTradeModal,
  onOpenKillSwitchModal,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const actions = [
    {
      id: 'trade',
      label: 'Place New Order (Trade Wizard)',
      category: 'Actions',
      icon: Plus,
      action: () => onOpenTradeModal(),
    },
    {
      id: 'trade-btc',
      label: 'Trade BTC/USDT',
      category: 'Actions',
      icon: LineChart,
      action: () => onOpenTradeModal('BTC/USDT'),
    },
    {
      id: 'trade-eth',
      label: 'Trade ETH/USDT',
      category: 'Actions',
      icon: LineChart,
      action: () => onOpenTradeModal('ETH/USDT'),
    },
    {
      id: 'kill-switch',
      label: 'Emergency Halt / Circuit Breaker',
      category: 'Risk',
      icon: ShieldAlert,
      action: () => onOpenKillSwitchModal(),
    },
    {
      id: 'dashboard',
      label: 'Go to Overview Dashboard',
      category: 'Navigation',
      icon: LayoutDashboard,
      action: () => onSelectTab('DASHBOARD'),
    },
    {
      id: 'positions',
      label: 'Go to Positions',
      category: 'Navigation',
      icon: Layers,
      action: () => onSelectTab('POSITIONS'),
    },
    {
      id: 'orders',
      label: 'Go to Orders & OMS',
      category: 'Navigation',
      icon: ArrowUpDown,
      action: () => onSelectTab('ORDERS'),
    },
    {
      id: 'portfolio',
      label: 'Go to Portfolio & Liquidity',
      category: 'Navigation',
      icon: Wallet,
      action: () => onSelectTab('PORTFOLIO'),
    },
    {
      id: 'terminal',
      label: 'Go to Pro Market Terminal',
      category: 'Navigation',
      icon: LineChart,
      action: () => onSelectTab('MARKET'),
    },
    {
      id: 'journal',
      label: 'Go to Decision Journal',
      category: 'Navigation',
      icon: BookOpen,
      action: () => onSelectTab('JOURNAL'),
    },
    {
      id: 'analytics',
      label: 'Go to Analytics Suite',
      category: 'Navigation',
      icon: BarChart3,
      action: () => onSelectTab('ANALYTICS'),
    },
    {
      id: 'bots',
      label: 'Go to Bot Fleet Gateway',
      category: 'Navigation',
      icon: Cpu,
      action: () => onSelectTab('BOTS'),
    },
    {
      id: 'risk',
      label: 'Go to Risk Center',
      category: 'Navigation',
      icon: ShieldCheck,
      action: () => onSelectTab('RISK_CENTER'),
    },
    {
      id: 'audit',
      label: 'Go to Audit Trail',
      category: 'Navigation',
      icon: FileText,
      action: () => onSelectTab('AUDIT'),
    },
    {
      id: 'settings',
      label: 'Go to Settings',
      category: 'Navigation',
      icon: Settings,
      action: () => onSelectTab('SETTINGS'),
    },
  ];

  const filteredActions = actions.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-black/80 backdrop-blur-md select-none animate-in fade-in duration-100">
      <div
        className="fixed inset-0"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-[#0c1220] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-100 font-mono text-xs">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 bg-[#080d19]">
          <Search className="w-4 h-4 text-slate-400 mr-3 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Type a command or search (e.g. BTC, positions, kill switch)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-white text-xs placeholder-slate-500 focus:outline-none"
          />
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 border border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-72 overflow-y-auto p-2 space-y-1 scrollbar-none">
          {filteredActions.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No matching commands found.
            </div>
          ) : (
            filteredActions.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left hover:bg-slate-800/80 transition-colors text-slate-300 hover:text-white group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                    <span>{item.label}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                    {item.category}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
