import React, { useState } from 'react';
import { DesktopSidebar } from './DesktopSidebar.tsx';
import { TopHeader } from './TopHeader.tsx';
import { MobileBottomNav } from './MobileBottomNav.tsx';
import { MobileNavDrawer } from './MobileNavDrawer.tsx';
import { CommandPalette } from './CommandPalette.tsx';
import { AppTab, TradingAccount, KillSwitchState, MarketQuote } from '../../types/client.ts';

interface AppShellProps {
  children: React.ReactNode;
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  accounts: TradingAccount[];
  activeAccount: TradingAccount | null;
  onSwitchAccount: (accId: string) => void;
  killSwitch: KillSwitchState;
  onOpenKillSwitchModal: () => void;
  onOpenTradeModal: (defaultSymbol?: string) => void;
  quotes: MarketQuote[];
  onSelectSymbol: (symbol: string) => void;
  openPositionsCount: number;
  activeBotsCount: number;
  isConnected: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  activeTab,
  onSelectTab,
  accounts,
  activeAccount,
  onSwitchAccount,
  killSwitch,
  onOpenKillSwitchModal,
  onOpenTradeModal,
  quotes,
  onSelectSymbol,
  openPositionsCount,
  activeBotsCount,
  isConnected,
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#070b14] text-[#e2e8f0] flex flex-col font-sans antialiased">
      {/* Desktop Persistent Sidebar */}
      <DesktopSidebar
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        openPositionsCount={openPositionsCount}
        activeBotsCount={activeBotsCount}
        killSwitch={killSwitch}
        activeAccount={activeAccount}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Workspace Frame */}
      <div
        className={`flex-1 flex flex-col transition-all duration-200 min-h-screen ${
          sidebarCollapsed ? 'md:pl-16' : 'md:pl-60'
        }`}
      >
        {/* Top Command Header */}
        <TopHeader
          accounts={accounts}
          activeAccount={activeAccount}
          onSwitchAccount={onSwitchAccount}
          killSwitch={killSwitch}
          onOpenKillSwitchModal={onOpenKillSwitchModal}
          onOpenTradeModal={() => onOpenTradeModal()}
          onOpenSearch={() => setCommandPaletteOpen(true)}
          onToggleMobileDrawer={() => setMobileDrawerOpen(true)}
          isConnected={isConnected}
        />

        {/* Dynamic View Canvas */}
        <main className="flex-1 p-3.5 sm:p-5 md:p-6 pb-20 md:pb-8 max-w-[1680px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Fixed Bottom Nav */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        onOpenTradeModal={() => onOpenTradeModal()}
        onToggleMobileDrawer={() => setMobileDrawerOpen(true)}
        openPositionsCount={openPositionsCount}
      />

      {/* Mobile Slide-Over Drawer */}
      <MobileNavDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        openPositionsCount={openPositionsCount}
        activeBotsCount={activeBotsCount}
        killSwitch={killSwitch}
        activeAccount={activeAccount}
        onOpenKillSwitchModal={onOpenKillSwitchModal}
        onOpenSearch={() => setCommandPaletteOpen(true)}
      />

      {/* Global ⌘K Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onSelectTab={onSelectTab}
        quotes={quotes}
        onSelectSymbol={onSelectSymbol}
        onOpenTradeModal={onOpenTradeModal}
        onOpenKillSwitchModal={onOpenKillSwitchModal}
      />
    </div>
  );
};
