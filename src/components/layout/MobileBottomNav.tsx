import React from 'react';
import {
  LayoutDashboard,
  PieChart,
  Layers,
  BookOpen,
  Menu,
  PlusCircle,
} from 'lucide-react';
import { AppTab } from '../../types/client.ts';

interface MobileBottomNavProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  onOpenTradeModal: () => void;
  onToggleMobileDrawer: () => void;
  openPositionsCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenTradeModal,
  onToggleMobileDrawer,
  openPositionsCount,
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#080d19]/95 backdrop-blur-lg border-t border-slate-800/90 px-2 py-1 select-none">
      <div className="flex items-center justify-around">
        {/* 1. Home / Dashboard */}
        <button
          onClick={() => onSelectTab('DASHBOARD')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] rounded-xl transition-all cursor-pointer ${
            activeTab === 'DASHBOARD' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">Home</span>
        </button>

        {/* 2. Portfolio */}
        <button
          onClick={() => onSelectTab('PORTFOLIO')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] rounded-xl transition-all cursor-pointer ${
            activeTab === 'PORTFOLIO' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <PieChart className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">Portfolio</span>
        </button>

        {/* 3. Trade Center (Quick Order Button) */}
        <button
          onClick={onOpenTradeModal}
          className="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] rounded-xl text-cyan-400 hover:text-cyan-300 transition-all cursor-pointer group"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-950/60 group-active:scale-95 transition-transform">
            <PlusCircle className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold text-white mt-0.5">Trade</span>
        </button>

        {/* 4. Journal */}
        <button
          onClick={() => onSelectTab('JOURNAL')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] rounded-xl transition-all cursor-pointer ${
            activeTab === 'JOURNAL' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">Journal</span>
        </button>

        {/* 5. More (Opens Drawer) */}
        <button
          onClick={onToggleMobileDrawer}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] rounded-xl transition-all cursor-pointer ${
            activeTab !== 'DASHBOARD' &&
            activeTab !== 'PORTFOLIO' &&
            activeTab !== 'JOURNAL'
              ? 'text-cyan-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Menu className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">More</span>
        </button>
      </div>
    </nav>
  );
};
