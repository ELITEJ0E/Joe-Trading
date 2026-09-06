import React from 'react';
import {
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
  Shield,
  BarChart2,
  FileCode,
  ShieldAlert,
  Search,
} from 'lucide-react';
import { AppTab, TradingAccount, KillSwitchState } from '../../types/client.ts';
import { formatCurrency } from '../../lib/formatters.ts';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  openPositionsCount: number;
  activeBotsCount: number;
  killSwitch?: KillSwitchState;
  activeAccount?: TradingAccount | null;
  onOpenKillSwitchModal: () => void;
  onOpenSearch: () => void;
}

export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  openPositionsCount,
  activeBotsCount,
  killSwitch,
  activeAccount,
  onOpenKillSwitchModal,
  onOpenSearch,
}) => {
  if (!isOpen) return null;

  const handleNav = (tab: AppTab) => {
    onSelectTab(tab);
    onClose();
  };

  const navSections = [
    {
      title: 'OVERVIEW',
      items: [{ id: 'DASHBOARD' as AppTab, label: 'Dashboard', icon: LayoutDashboard }],
    },
    {
      title: 'TRADING',
      items: [
        { id: 'PORTFOLIO' as AppTab, label: 'Portfolio', icon: PieChart },
        { id: 'POSITIONS' as AppTab, label: 'Positions', icon: Layers, badge: openPositionsCount },
        { id: 'ORDERS' as AppTab, label: 'Orders & OMS', icon: FileText },
        { id: 'JOURNAL' as AppTab, label: 'Trade Journal', icon: BookOpen },
      ],
    },
    {
      title: 'AUTOMATION',
      items: [
        { id: 'STRATEGIES' as AppTab, label: 'Strategies', icon: TrendingUp },
        { id: 'BOTS' as AppTab, label: 'Bots Gateway', icon: Cpu, badge: activeBotsCount },
      ],
    },
    {
      title: 'INTELLIGENCE',
      items: [
        { id: 'ANALYTICS' as AppTab, label: 'Trading Analytics', icon: BarChart3 },
      ],
    },
    {
      title: 'CONTROL',
      items: [
        { id: 'RISK_CENTER' as AppTab, label: 'Risk Center', icon: ShieldCheck },
        { id: 'AUDIT' as AppTab, label: 'Audit Trail', icon: Shield },
      ],
    },
    {
      title: 'MARKETS',
      items: [
        { id: 'MARKET' as AppTab, label: 'Market Terminal', icon: BarChart2 },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { id: 'DOCS' as AppTab, label: 'Documentation', icon: FileCode },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-in Drawer */}
      <div className="relative w-4/5 max-w-sm bg-[#080d19] border-r border-slate-800 flex flex-col h-full z-10 shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
              TC
            </div>
            <div>
              <div className="font-bold text-white text-sm">TradeCore</div>
              <div className="text-[10px] text-slate-500 font-mono">Navigation Directory</div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Search & Emergency Bar */}
        <div className="p-3 border-b border-slate-800/80 space-y-2">
          <button
            onClick={() => {
              onClose();
              onOpenSearch();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-mono"
          >
            <span className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              Quick Command Search
            </span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">⌘K</kbd>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenKillSwitchModal();
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-mono text-xs font-bold transition-all ${
              killSwitch?.isActive
                ? 'bg-rose-500 text-white animate-pulse'
                : 'bg-rose-950/40 text-rose-300 border border-rose-800/50'
            }`}
          >
            <span className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              Emergency Kill Switch
            </span>
            <span>{killSwitch?.isActive ? 'HALTED' : 'READY'}</span>
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <div className="px-2 text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400">
                {section.title}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    activeTab === item.id ||
                    (item.id === 'ANALYTICS' && (activeTab === 'BEHAVIOR' || activeTab === 'EXECUTION'));

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNav(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>

                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-400 text-slate-950">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Account Status */}
        {activeAccount && (
          <div className="p-3 border-t border-slate-800 bg-[#060912]">
            <div className="text-[10px] font-mono text-slate-400">ACTIVE ACCOUNT</div>
            <div className="text-xs font-bold text-white truncate">{activeAccount.name}</div>
            <div className="flex items-center justify-between mt-1 text-xs font-mono">
              <span className="text-slate-400">Equity:</span>
              <span className="text-white font-bold">{formatCurrency(activeAccount.equity)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
