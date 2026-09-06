import React, { useState, useEffect } from 'react';
import {
  Menu,
  ChevronDown,
  Search,
  Clock,
  Plus,
  Radio,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';
import { TradingAccount, KillSwitchState } from '../../types/client.ts';
import { RiskIndicator } from '../common/RiskIndicator.tsx';
import { formatCurrency } from '../../lib/formatters.ts';

interface TopHeaderProps {
  accounts?: TradingAccount[];
  activeAccount?: TradingAccount | null;
  onSwitchAccount?: (accId: string) => void;
  killSwitch?: KillSwitchState;
  onOpenKillSwitchModal?: () => void;
  onOpenTradeModal?: (defaultSymbol?: string) => void;
  onOpenSearch?: () => void;
  onToggleMobileDrawer?: () => void;
  isConnected?: boolean;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  accounts = [],
  activeAccount,
  onSwitchAccount = (_accId: string) => {},
  killSwitch,
  onOpenKillSwitchModal = () => {},
  onOpenTradeModal = (_sym?: string) => {},
  onOpenSearch = () => {},
  onToggleMobileDrawer = () => {},
  isConnected = true,
}) => {
  const [utcTime, setUtcTime] = useState<string>('');
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().slice(17, 22) + ' UTC');
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const safeAccounts = accounts || [];

  return (
    <header className="h-14 bg-[#080d19] border-b border-slate-800/80 sticky top-0 z-30 px-3 sm:px-5 flex items-center justify-between gap-2 select-none backdrop-blur-md">
      {/* Left: Mobile Drawer Trigger + Environment Label */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onToggleMobileDrawer}
          className="md:hidden p-2 -ml-1 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile Brand (Shown when desktop sidebar is hidden) */}
        <div className="md:hidden flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-cyan-950/40">
            TC
          </div>
          <span className="font-bold text-white text-xs tracking-tight">TradeCore</span>
        </div>

        {/* Environment Status Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
            }`}
          />
          <span className="text-slate-300 font-semibold">SIMULATION</span>
          <span className="text-slate-400">•</span>
          <span className="text-cyan-400">SSE</span>
        </div>
      </div>

      {/* Center: Prominent Account Switcher */}
      <div className="relative">
        {activeAccount ? (
          <div className="relative">
            <button
              onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
              className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#0d1424] hover:bg-[#111a2f] border border-slate-700/80 hover:border-cyan-500/50 transition-all text-left cursor-pointer group"
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate max-w-[120px] sm:max-w-[180px]">
                    {activeAccount.name}
                  </span>
                  <span className="text-[9px] font-mono px-1 rounded bg-slate-800 text-slate-400 border border-slate-700 hidden sm:inline">
                    {activeAccount.type}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                  <span className="text-white font-semibold">
                    {formatCurrency(activeAccount.equity)}
                  </span>
                  <span className="text-slate-400 hidden sm:inline">|</span>
                  <span
                    className={`hidden sm:inline font-semibold ${
                      (activeAccount.unrealizedPnL ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {(activeAccount.unrealizedPnL ?? 0) >= 0 ? '+' : ''}
                    {formatCurrency(activeAccount.unrealizedPnL, 2, true)}
                  </span>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 transition-colors ml-1" />
            </button>

            {/* Account Switcher Dropdown */}
            {isAccountDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsAccountDropdownOpen(false)}
                />
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 w-72 sm:w-80 bg-[#0d1322] border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 text-xs">
                  <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold border-b border-slate-800">
                    Switch Trading Account
                  </div>
                  <div className="py-1 space-y-1 max-h-60 overflow-y-auto">
                    {safeAccounts.map((acc) => {
                      const isSelected = acc.id === activeAccount.id;
                      return (
                        <button
                          key={acc.id}
                          onClick={() => {
                            onSwitchAccount(acc.id);
                            setIsAccountDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-cyan-500/15 border border-cyan-500/40 text-white'
                              : 'hover:bg-slate-800/60 text-slate-300 border border-transparent'
                          }`}
                        >
                          <div>
                            <div className="font-bold text-xs text-white">{acc.name}</div>
                            <div className="text-[10px] text-slate-400">{acc.broker}</div>
                          </div>
                          <div className="text-right font-mono">
                            <div className="font-bold text-white">{formatCurrency(acc.equity)}</div>
                            <div
                              className={`text-[10px] ${
                                (acc.unrealizedPnL ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {(acc.unrealizedPnL ?? 0) >= 0 ? '+' : ''}
                              {formatCurrency(acc.unrealizedPnL, 2, true)}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        ) : null}
      </div>

      {/* Right: Actions, Risk Cockpit & New Trade */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Global Search / Command Palette Shortcut */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 transition-colors text-xs font-mono cursor-pointer"
          title="Search & Command Palette (Cmd + K)"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden lg:inline text-[11px]">Search</span>
          <kbd className="hidden sm:inline px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 text-[9px] border border-slate-700">
            ⌘K
          </kbd>
        </button>

        {/* UTC Clock (Hidden on small mobile) */}
        <div className="hidden xl:flex items-center gap-1 text-[11px] font-mono text-slate-400 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>{utcTime}</span>
        </div>

        {/* Risk Cockpit Status Pill */}
        <RiskIndicator
          killSwitch={killSwitch}
          onClick={onOpenKillSwitchModal}
          compact
        />

        {/* Primary Action Button: + New Trade */}
        <button
          onClick={onOpenTradeModal}
          className="flex items-center gap-1 px-3 sm:px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold font-mono transition-all shadow-md shadow-cyan-950/40 cursor-pointer active:scale-95 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden xs:inline sm:inline">New Trade</span>
        </button>
      </div>
    </header>
  );
};
