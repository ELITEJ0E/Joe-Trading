import React, { useState } from 'react';
import {
  X,
  LayoutDashboard,
  Wallet,
  Layers,
  ArrowUpDown,
  BookOpen,
  BarChart3,
  Cpu,
  ShieldCheck,
  LineChart,
  FileText,
  Settings,
  HelpCircle,
  TrendingUp,
  Brain,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { AppTab, TradingAccount } from '../../types/client.ts';
import { formatCurrency } from '../../lib/formatters.ts';
import { cn } from '../../lib/utils.ts';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  accounts?: TradingAccount[];
  activeAccount?: TradingAccount | null;
  onSwitchAccount?: (accId: string) => void;
  positionsCount?: number;
  openOrdersCount?: number;
  runningBotsCount?: number;
}

export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  accounts = [],
  activeAccount,
  onSwitchAccount = (_accId: string) => {},
  positionsCount = 0,
  openOrdersCount = 0,
  runningBotsCount = 0,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const navItems = [
    { id: 'DASHBOARD' as AppTab, label: 'Overview Dashboard', icon: LayoutDashboard, category: 'Core' },
    { id: 'POSITIONS' as AppTab, label: 'Active Positions', icon: Layers, badge: positionsCount || undefined, category: 'Core' },
    { id: 'ORDERS' as AppTab, label: 'Orders & OMS History', icon: ArrowUpDown, badge: openOrdersCount || undefined, category: 'Core' },
    { id: 'PORTFOLIO' as AppTab, label: 'Portfolio & Liquidity', icon: Wallet, category: 'Core' },
    { id: 'MARKET' as AppTab, label: 'Pro Terminal & Charts', icon: LineChart, category: 'Core' },

    { id: 'JOURNAL' as AppTab, label: 'Trade Decision Journal', icon: BookOpen, category: 'Alpha & Review' },
    { id: 'ANALYTICS' as AppTab, label: 'Trading Analytics Suite', icon: BarChart3, category: 'Alpha & Review' },
    { id: 'STRATEGIES' as AppTab, label: 'Alpha Strategies', icon: TrendingUp, category: 'Alpha & Review' },
    { id: 'BEHAVIOR' as AppTab, label: 'Cognitive & Emotion Review', icon: Brain, category: 'Alpha & Review' },

    { id: 'BOTS' as AppTab, label: 'Algorithmic Bot Fleet', icon: Cpu, badge: runningBotsCount > 0 ? `${runningBotsCount} Live` : undefined, category: 'System' },
    { id: 'RISK_CENTER' as AppTab, label: 'Risk Engine & Kill Switch', icon: ShieldCheck, category: 'System' },
    { id: 'AUDIT' as AppTab, label: 'System Audit Trail', icon: FileText, category: 'System' },
    { id: 'SETTINGS' as AppTab, label: 'Settings & Risk Caps', icon: Settings, category: 'System' },
    { id: 'DOCS' as AppTab, label: 'Architecture Documentation', icon: HelpCircle, category: 'System' },
  ];

  const filteredItems = navItems.filter((i) =>
    i.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 md:hidden select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Body */}
      <div className="fixed inset-y-0 left-0 w-4/5 max-w-sm bg-[#070a12] border-r border-slate-800 p-4 flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-left duration-200">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-cyan-950/40">
                JT
              </div>
              <div>
                <span className="font-bold text-white text-sm">TradeCore OS</span>
                <span className="text-[10px] text-cyan-400 font-mono block">Mobile Intelligence</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search views & modules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#0c1220] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Navigation Links */}
          <div className="space-y-1 max-h-[55vh] overflow-y-auto pr-1 scrollbar-none">
            {filteredItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onClose();
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer min-h-[44px]',
                    isActive
                      ? 'bg-cyan-500/20 text-white font-bold border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn('w-4 h-4', isActive ? 'text-cyan-400' : 'text-slate-500')} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold border border-slate-700">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Account Summary */}
        {activeAccount && (
          <div className="pt-3 border-t border-slate-800">
            <div className="p-3 rounded-xl bg-[#0c1220] border border-slate-800 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span>{activeAccount.name}</span>
                <span className="text-emerald-400 font-bold">ACTIVE</span>
              </div>
              <div className="text-base font-bold text-white">
                {formatCurrency(activeAccount.equity)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
