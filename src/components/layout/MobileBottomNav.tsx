import React from 'react';
import {
  LayoutDashboard,
  Layers,
  ArrowUpDown,
  BookOpen,
  LineChart,
  Plus,
} from 'lucide-react';
import { AppTab } from '../../types/client.ts';
import { cn } from '../../lib/utils.ts';

interface MobileBottomNavProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  onOpenTradeModal: () => void;
  positionsCount?: number;
  openOrdersCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenTradeModal,
  positionsCount = 0,
  openOrdersCount = 0,
}) => {
  const navItems = [
    { id: 'DASHBOARD' as AppTab, label: 'Overview', icon: LayoutDashboard },
    { id: 'POSITIONS' as AppTab, label: 'Positions', icon: Layers, count: positionsCount },
    { id: 'TRADE_ACTION' as const, label: 'Trade', icon: Plus, isAction: true },
    { id: 'ORDERS' as AppTab, label: 'Orders', icon: ArrowUpDown, count: openOrdersCount },
    { id: 'JOURNAL' as AppTab, label: 'Journal', icon: BookOpen },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#070a12]/95 border-t border-slate-800/90 backdrop-blur-xl z-40 px-2 flex items-center justify-around select-none">
      {navItems.map((item) => {
        if (item.isAction) {
          return (
            <button
              key="action-trade"
              onClick={onOpenTradeModal}
              className="flex flex-col items-center justify-center -mt-5 group cursor-pointer"
              aria-label="New Trade"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-cyan-950/60 border-2 border-[#070a12] active:scale-90 transition-transform">
                <Plus className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono font-bold text-cyan-400 mt-1">Trade</span>
            </button>
          );
        }

        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id as AppTab)}
            className={cn(
              'flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer relative min-h-[44px]',
              isActive ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <div className="relative">
              <Icon className={cn('w-5 h-5 transition-transform', isActive && 'scale-110')} />
              {item.count !== undefined && item.count > 0 && (
                <span className="absolute -top-1.5 -right-2 px-1 py-0.2 rounded-full bg-cyan-500 text-[8px] font-mono text-black font-bold">
                  {item.count}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-1">{item.label}</span>
            {isActive && (
              <span className="absolute bottom-0.5 w-6 h-0.5 rounded-full bg-cyan-400" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
