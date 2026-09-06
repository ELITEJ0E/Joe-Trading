import React, { useState } from 'react';
import {
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
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { AppTab, TradingAccount, KillSwitchState } from '../../types/client.ts';
import { formatCurrency } from '../../lib/formatters.ts';

interface DesktopSidebarProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  openPositionsCount: number;
  activeBotsCount: number;
  killSwitch?: KillSwitchState;
  activeAccount?: TradingAccount | null;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavGroup {
  name: string;
  items: {
    id: AppTab;
    label: string;
    icon: React.FC<any>;
    badge?: number;
    badgeColor?: 'cyan' | 'purple' | 'amber' | 'emerald';
  }[];
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  activeTab,
  onSelectTab,
  openPositionsCount,
  activeBotsCount,
  killSwitch,
  activeAccount,
  collapsed,
  onToggleCollapse,
}) => {
  const groups: NavGroup[] = [
    {
      name: 'OVERVIEW',
      items: [
        { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      name: 'TRADING',
      items: [
        { id: 'PORTFOLIO', label: 'Portfolio', icon: PieChart },
        { id: 'POSITIONS', label: 'Positions', icon: Layers, badge: openPositionsCount, badgeColor: 'cyan' },
        { id: 'ORDERS', label: 'Orders', icon: FileText },
        { id: 'JOURNAL', label: 'Trade Journal', icon: BookOpen },
      ],
    },
    {
      name: 'AUTOMATION',
      items: [
        { id: 'STRATEGIES', label: 'Strategies', icon: TrendingUp },
        { id: 'BOTS', label: 'Bots', icon: Cpu, badge: activeBotsCount, badgeColor: 'purple' },
      ],
    },
    {
      name: 'INTELLIGENCE',
      items: [
        { id: 'ANALYTICS', label: 'Analytics', icon: BarChart3 },
      ],
    },
    {
      name: 'CONTROL',
      items: [
        { id: 'RISK_CENTER', label: 'Risk Center', icon: ShieldCheck },
        { id: 'AUDIT', label: 'Audit Trail', icon: Shield },
      ],
    },
    {
      name: 'MARKETS',
      items: [
        { id: 'MARKET', label: 'Market Terminal', icon: BarChart2 },
      ],
    },
    {
      name: 'SYSTEM',
      items: [
        { id: 'DOCS', label: 'Documentation', icon: FileCode },
      ],
    },
  ];

  const isCurrentActive = (id: AppTab) => {
    if (activeTab === id) return true;
    if (id === 'ANALYTICS' && (activeTab === 'BEHAVIOR' || activeTab === 'EXECUTION')) return true;
    return false;
  };

  return (
    <aside
      className={`hidden md:flex flex-col fixed top-0 left-0 bottom-0 z-40 bg-[#080d19] border-r border-slate-800/80 transition-all duration-200 select-none ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Brand Header */}
      <div className="h-14 flex items-center justify-between px-3.5 border-b border-slate-800/80 shrink-0">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-cyan-950/40 shrink-0">
            TC
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-white text-xs tracking-tight truncate flex items-center gap-1.5">
                TradeCore
                <span className="text-[9px] font-mono px-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  v2.4
                </span>
              </span>
              <span className="text-[10px] text-slate-500 truncate">Trading Intelligence</span>
            </div>
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer shrink-0"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links (Grouped) */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4 scrollbar-none">
        {groups.map((group) => (
          <div key={group.name} className="space-y-1">
            {!collapsed && (
              <div className="px-2 text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400">
                {group.name}
              </div>
            )}

            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isCurrentActive(item.id);
                const isRiskHalt = killSwitch?.isActive && item.id === 'RISK_CENTER';

                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer group relative ${
                      active
                        ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-sm'
                        : isRiskHalt
                        ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30 animate-pulse'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 border border-transparent'
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        active
                          ? 'text-cyan-400'
                          : isRiskHalt
                          ? 'text-rose-400'
                          : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    />

                    {!collapsed && (
                      <span className="truncate flex-1 text-left">{item.label}</span>
                    )}

                    {!collapsed && item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                          active
                            ? 'bg-cyan-400 text-slate-950'
                            : item.badgeColor === 'purple'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}

                    {collapsed && item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Account / System Context Footer */}
      {!collapsed && activeAccount && (
        <div className="p-3 border-t border-slate-800/80 bg-[#060912]/80 shrink-0">
          <div className="flex items-center justify-between mb-1 text-[10px] font-mono text-slate-400">
            <span>ACTIVE CONTEXT</span>
            <span className="text-emerald-400 font-bold">● LIVE</span>
          </div>
          <div className="text-xs font-bold text-white truncate">{activeAccount.name}</div>
          <div className="flex items-center justify-between mt-1 text-xs font-mono">
            <span className="text-slate-400">Equity:</span>
            <span className="text-white font-bold">{formatCurrency(activeAccount.equity)}</span>
          </div>
        </div>
      )}
    </aside>
  );
};
