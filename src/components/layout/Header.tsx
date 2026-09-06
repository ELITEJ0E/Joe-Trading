import React, { useState, useEffect } from 'react';
import {
  Activity,
  ShieldAlert,
  Plus,
  ChevronDown,
  Clock,
  Radio,
  Search,
} from 'lucide-react';
import { TradingAccount, KillSwitchState } from '../../types/client.ts';

interface HeaderProps {
  accounts?: TradingAccount[];
  activeAccount?: TradingAccount | null;
  onSelectAccount?: (accId: string) => void;
  onSwitchAccount?: (accId: string) => void;
  killSwitch?: KillSwitchState;
  onOpenKillSwitchModal?: () => void;
  onOpenOrderModal?: () => void;
  isConnected?: boolean;
  onOpenSearch?: () => void;
  lastSyncTime?: string;
}

export const Header: React.FC<HeaderProps> = ({
  accounts = [],
  activeAccount,
  onSelectAccount,
  onSwitchAccount,
  killSwitch = { isActive: false, triggeredAt: null, triggeredBy: null, reason: null },
  onOpenKillSwitchModal = () => {},
  onOpenOrderModal = () => {},
  isConnected = true,
  onOpenSearch,
  lastSyncTime,
}) => {
  const [utcTime, setUtcTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().slice(17, 25) + ' UTC');
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAccountChange = (id: string) => {
    if (onSelectAccount) onSelectAccount(id);
    if (onSwitchAccount) onSwitchAccount(id);
  };

  const safeAccounts = accounts || [];

  return (
    <header className="bg-[#080d1a] border-b border-slate-800/80 sticky top-0 z-40 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Brand Identity & Active Environment */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-cyan-900/30">
              TI
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-sm tracking-tight">Trading Intelligence</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  PROD
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                  {isConnected ? 'Real-Time SSE' : 'Disconnected'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-mono text-slate-400">
                  <Clock className="w-3 h-3 text-slate-500" />
                  {utcTime}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Account Switcher */}
        <div className="hidden md:flex items-center gap-2">
          <div className="relative">
            <select
              value={activeAccount?.id || ''}
              onChange={(e) => handleAccountChange(e.target.value)}
              aria-label="Trading Account Selector"
              className="bg-[#0f172a] border border-slate-700/80 hover:border-slate-600 rounded-xl px-3 py-1.5 text-xs text-white font-medium focus:outline-none focus:border-cyan-500 pr-8 appearance-none cursor-pointer"
            >
              {safeAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} (${acc.equity != null ? acc.equity.toLocaleString() : '0'})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {activeAccount && (
            <div className="hidden lg:flex items-center gap-2 text-xs font-mono bg-[#0d1322] px-2.5 py-1.5 rounded-xl border border-slate-800">
              <span className="text-slate-400">Eq:</span>
              <span className="text-white font-bold">${activeAccount.equity != null ? activeAccount.equity.toLocaleString() : '0'}</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400">Unrealized:</span>
              <span className={(activeAccount.unrealizedPnL ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {(activeAccount.unrealizedPnL ?? 0) >= 0 ? '+' : ''}${activeAccount.unrealizedPnL != null ? activeAccount.unrealizedPnL.toFixed(2) : '0.00'}
              </span>
            </div>
          )}
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-2">
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl border border-transparent hover:border-slate-700 transition-colors cursor-pointer"
              title="Search and Command Palette"
            >
              <Search className="w-4 h-4" />
            </button>
          )}

          {/* Kill Switch Trigger Button */}
          <button
            onClick={onOpenKillSwitchModal}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
              killSwitch?.isActive
                ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-950/60 ring-2 ring-rose-400'
                : 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{killSwitch?.isActive ? 'HALTED' : 'KILL SWITCH'}</span>
          </button>

          {/* New Order Trigger */}
          <button
            onClick={onOpenOrderModal}
            className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-950/50 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Order</span>
          </button>
        </div>
      </div>
    </header>
  );
};
