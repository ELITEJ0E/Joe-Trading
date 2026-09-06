import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, X } from 'lucide-react';

interface KillSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, cancelPendingOrders: boolean) => void;
}

export const KillSwitchModal: React.FC<KillSwitchModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [reason, setReason] = useState('Market anomaly & elevated systemic volatility');
  const [cancelOrders, setCancelOrders] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-[#0f172a] border border-rose-600/50 rounded-xl max-w-md w-full p-6 shadow-2xl relative text-slate-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Activate Emergency Kill Switch</h3>
            <p className="text-xs text-rose-400 font-medium">Circuit Breaker & Order Suppression</p>
          </div>
        </div>

        <div className="bg-rose-950/30 border border-rose-900/50 p-3 rounded-lg mb-4 text-xs text-rose-300 space-y-1">
          <p className="font-semibold text-rose-200 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Warning: This action will immediately:
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-rose-200/80 ml-1">
            <li>Block all incoming manual and automated order submissions</li>
            <li>Pause all active automated trading bots</li>
            <li>Log a priority event into the immutable audit trail</li>
          </ul>
        </div>

        <div className="space-y-3 mb-5">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Reason for Emergency Halt</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-[#090d16] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
              placeholder="Enter operational reason..."
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={cancelOrders}
              onChange={(e) => setCancelOrders(e.target.checked)}
              className="rounded border-slate-700 bg-slate-900 text-rose-500 focus:ring-rose-500 w-4 h-4"
            />
            <span>Also cancel all active pending / submitted open orders</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason, cancelOrders)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-rose-600/30 transition-colors flex items-center gap-1.5"
          >
            <ShieldAlert className="w-4 h-4" />
            Engage Kill Switch Now
          </button>
        </div>
      </div>
    </div>
  );
};
