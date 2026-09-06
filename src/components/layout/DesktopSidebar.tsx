import React from 'react';
import {
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
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Brain,
  Zap,
} from 'lucide-react';
import { AppTab } from '../../types/client.ts';
import { cn } from '../../lib/utils.ts';

interface DesktopSidebarProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  positionsCount?: number;
  openOrdersCount?: number;
  runningBotsCount?: number;
}

interface NavItem {
  id: AppTab;
  label: string;
  icon: React.FC<any>;
  badge?: number | string;
  badgeColor?: string;
  section: 'CORE' | 'DECISION' | 'SYSTEM';
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  positionsCount = 0,
  openOrdersCount = 0,
  runningBotsCount = 0,
}) => {
  const navItems: NavItem[] = [
    // Core Execution Group
    { id: 'DASHBOARD', label: 'Overview', icon: LayoutDashboard, section: 'CORE' },
    { id: 'POSITIONS', label: 'Positions', icon: Layers, badge: positionsCount || undefined, badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', section: 'CORE' },
    { id: 'ORDERS', label: 'Orders & OMS', icon: ArrowUpDown, badge: openOrdersCount || undefined, badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', section: 'CORE' },
    { id: 'PORTFOLIO', label: 'Portfolio & Risk', icon: Wallet, section: 'CORE' },
    { id: 'MARKET', label: 'Pro Terminal', icon: LineChart, section: 'CORE' },

    // Decision & Intelligence Group
    { id: 'JOURNAL', label: 'Decision Journal', icon: BookOpen, section: 'DECISION' },
    { id: 'ANALYTICS', label: 'Analytics Suite', icon: BarChart3, section: 'DECISION' },
    { id: 'STRATEGIES', label: 'Alpha Strategies', icon: TrendingUp, section: 'DECISION' },
    { id: 'BEHAVIOR', label: 'Cognitive Review', icon: Brain, section: 'DECISION' },

    // Automation & System Governance
    { id: 'BOTS', label: 'Bot Fleet', icon: Cpu, badge: runningBotsCount > 0 ? `${runningBotsCount} LIVE` : undefined, badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30', section: 'SYSTEM' },
    { id: 'RISK_CENTER', label: 'Risk Engine', icon: ShieldCheck, section: 'SYSTEM' },
    { id: 'AUDIT', label: 'Audit Trail', icon: FileText, section: 'SYSTEM' },
    { id: 'SETTINGS', label: 'Settings', icon: Settings, section: 'SYSTEM' },
    { id: 'DOCS', label: 'Architecture', icon: HelpCircle, section: 'SYSTEM' },
  ];

  const sections = [
    { key: 'CORE', label: 'Execution & Markets' },
    { key: 'DECISION', label: 'Cognitive Alpha' },
    { key: 'SYSTEM', label: 'System & Governance' },
  ];

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col bg-[#070a12] border-r border-slate-800/80 transition-all duration-200 select-none z-20 shrink-0 relative',
        isCollapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Brand Header */}
      <div className="h-14 flex items-center justify-between px-3.5 border-b border-slate-800/80">
        {!isCollapsed ? (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-cyan-950/50 shrink-0">
              JT
            </div>
            <div className="truncate">
              <span className="font-bold text-white text-sm tracking-tight block">
                TradeCore OS
              </span>
              <span className="text-[10px] text-cyan-400 font-mono block -mt-1">
                Institutional v2.4
              </span>
            </div>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-cyan-950/50">
              JT
            </div>
          </div>
        )}

        {/* Collapse Sidebar Toggle */}
        <button
          onClick={onToggleCollapse}
          className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer hidden md:flex items-center justify-center"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links Grouped by Section */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4 scrollbar-none">
        {sections.map((sec) => {
          const items = navItems.filter((i) => i.section === sec.key);
          return (
            <div key={sec.key} className="space-y-1">
              {!isCollapsed && (
                <div className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  {sec.label}
                </div>
              )}

              {items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer group relative',
                      isActive
                        ? 'bg-cyan-500/15 text-white font-semibold border border-cyan-500/30 shadow-sm shadow-cyan-950/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon
                      className={cn(
                        'w-4 h-4 shrink-0 transition-colors',
                        isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-300'
                      )}
                    />

                    {!isCollapsed && (
                      <span className="truncate flex-1 text-left">{item.label}</span>
                    )}

                    {!isCollapsed && item.badge !== undefined && (
                      <span
                        className={cn(
                          'text-[9px] font-mono px-1.5 py-0.5 rounded-md border font-bold',
                          item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                        )}
                      >
                        {item.badge}
                      </span>
                    )}

                    {/* Active Pip when collapsed */}
                    {isCollapsed && isActive && (
                      <span className="absolute right-1 w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Footer System Health */}
      <div className="p-2 border-t border-slate-800/80">
        {!isCollapsed ? (
          <div className="p-2.5 rounded-xl bg-[#0c1220] border border-slate-800 flex items-center justify-between text-[11px] font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300 font-bold">CORE ONLINE</span>
            </div>
            <span className="text-slate-400">12ms</span>
          </div>
        ) : (
          <div className="flex justify-center p-1" title="Core Engine Online (12ms)">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        )}
      </div>
    </aside>
  );
};
