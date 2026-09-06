import React, { useState, useEffect } from 'react';
import { AppTab, TradingAccount, KillSwitchState } from '../../types/client.ts';
import { TopHeader } from './TopHeader.tsx';
import { DesktopSidebar } from './DesktopSidebar.tsx';
import { MobileBottomNav } from './MobileBottomNav.tsx';
import { MobileNavDrawer } from './MobileNavDrawer.tsx';
import { CommandPaletteModal } from '../common/CommandPaletteModal.tsx';

interface AppShellProps {
  children: React.ReactNode;
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  accounts?: TradingAccount[];
  activeAccount?: TradingAccount | null;
  onSwitchAccount?: (accId: string) => void;
  killSwitch?: KillSwitchState;
  onOpenKillSwitchModal?: () => void;
  onOpenTradeModal?: (defaultSymbol?: string) => void;
  positionsCount?: number;
  openOrdersCount?: number;
  runningBotsCount?: number;
  isConnected?: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  activeTab,
  onSelectTab,
  accounts = [],
  activeAccount,
  onSwitchAccount = () => {},
  killSwitch,
  onOpenKillSwitchModal = () => {},
  onOpenTradeModal = () => {},
  positionsCount = 0,
  openOrdersCount = 0,
  runningBotsCount = 0,
  isConnected = true,
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Global Keyboard Shortcuts (Cmd+K, Ctrl+K, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-200 flex flex-col md:flex-row antialiased font-sans">
      {/* 1. Desktop Sidebar */}
      <DesktopSidebar
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        positionsCount={positionsCount}
        openOrdersCount={openOrdersCount}
        runningBotsCount={runningBotsCount}
      />

      {/* 2. Mobile Drawer Navigation */}
      <MobileNavDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        accounts={accounts}
        activeAccount={activeAccount}
        onSwitchAccount={onSwitchAccount}
        positionsCount={positionsCount}
        openOrdersCount={openOrdersCount}
        runningBotsCount={runningBotsCount}
      />

      {/* 3. Main Stage */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-6 overflow-x-hidden">
        {/* Top Header */}
        <TopHeader
          accounts={accounts}
          activeAccount={activeAccount}
          onSwitchAccount={onSwitchAccount}
          killSwitch={killSwitch}
          onOpenKillSwitchModal={onOpenKillSwitchModal}
          onOpenTradeModal={onOpenTradeModal}
          onOpenSearch={() => setIsCommandPaletteOpen(true)}
          onToggleMobileDrawer={() => setIsMobileDrawerOpen(true)}
          isConnected={isConnected}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 px-3 sm:px-6 py-4 sm:py-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* 4. Mobile Ergonomic Touch Nav */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        onOpenTradeModal={() => onOpenTradeModal()}
        positionsCount={positionsCount}
        openOrdersCount={openOrdersCount}
      />

      {/* 5. Global Command Palette */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectTab={onSelectTab}
        onOpenTradeModal={onOpenTradeModal}
        onOpenKillSwitchModal={onOpenKillSwitchModal}
      />
    </div>
  );
};
