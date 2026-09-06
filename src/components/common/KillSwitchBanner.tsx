import React from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';
import { KillSwitchState } from '../../types/client.ts';

interface KillSwitchBannerProps {
  killSwitch: KillSwitchState;
  onDeactivate: () => void;
}

export const KillSwitchBanner: React.FC<KillSwitchBannerProps> = ({ killSwitch, onDeactivate }) => {
  if (!killSwitch.isActive) return null;

  return (
    <div
      id="kill-switch-banner"
      className="bg-rose-950/90 border-b border-rose-600/40 text-rose-200 px-4 py-3 shadow-lg backdrop-blur sticky top-0 z-50 animate-pulse"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-600/30 rounded-lg border border-rose-500/50">
            <AlertOctagon className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white uppercase tracking-wider text-xs bg-rose-600 px-2 py-0.5 rounded">
                EMERGENCY KILL SWITCH ACTIVE
              </span>
              <span className="text-xs text-rose-300">
                Triggered {killSwitch.triggeredAt ? new Date(killSwitch.triggeredAt).toLocaleTimeString() : 'Recently'}
              </span>
            </div>
            <p className="text-xs text-rose-200/90 mt-0.5">
              Reason: <span className="font-medium text-white">{killSwitch.reason || 'Trading halted by operator'}</span>. All new orders blocked & automated bots paused.
            </p>
          </div>
        </div>

        <button
          onClick={onDeactivate}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-800 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow transition-colors cursor-pointer border border-rose-400/40 whitespace-nowrap"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Deactivate & Resume Trading
        </button>
      </div>
    </div>
  );
};
