import React from 'react';
import {
  LayoutDashboard,
  PieChart,
  Layers,
  FileText,
  BookOpen,
  TrendingUp,
  Cpu,
  ShieldCheck,
  Zap,
  Brain,
  BarChart2,
  FileCode,
  Shield,
  AlertTriangle,
} from 'lucide-react';
import { AppTab } from '../../types/client.ts';

interface NavigationProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  openPositionsCount: number;
  activeBotsCount: number;
  isKillSwitchActive?: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  openPositionsCount,
  activeBotsCount,
  isKillSwitchActive,
}) => {
  const navItems: { id: AppTab; label: string; icon: React.FC<any>; badge?: number }[] = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'PORTFOLIO', label: 'Portfolio', icon: PieChart },
    { id: 'POSITIONS', label: 'Positions', icon: Layers, badge: openPositionsCount },
    { id: 'ORDERS', label: 'Orders & OMS', icon: FileText },
    { id: 'JOURNAL', label: 'Trade Journal', icon: BookOpen },
    { id: 'STRATEGIES', label: 'Strategies', icon: TrendingUp },
    { id: 'BOTS', label: 'Bot Gateway', icon: Cpu, badge: activeBotsCount },
    { id: 'RISK_CENTER', label: 'Risk Center', icon: ShieldCheck },
    { id: 'BEHAVIOR', label: 'Behavioral Bias', icon: Brain },
    { id: 'EXECUTION', label: 'Execution Quality', icon: Zap },
    { id: 'MARKET', label: 'Market Terminal', icon: BarChart2 },
    { id: 'AUDIT', label: 'Audit Trail', icon: Shield },
    { id: 'DOCS', label: 'Architecture & Docs', icon: FileCode },
  ];

  return (
    <nav className="bg-[#080d1a] border-b border-slate-800/80 px-4 overflow-x-auto scrollbar-none sticky top-[61px] z-30 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center gap-1 py-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isRiskHalt = isKillSwitchActive && item.id === 'RISK_CENTER';

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/40 shadow-sm'
                  : isRiskHalt
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30 animate-pulse'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : isRiskHalt ? 'text-rose-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    isActive ? 'bg-cyan-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
