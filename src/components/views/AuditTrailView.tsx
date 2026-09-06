import React, { useState } from 'react';
import { Shield, Search, Filter } from 'lucide-react';
import { AuditLogEntry } from '../../types/client.ts';

interface AuditTrailViewProps {
  logs?: AuditLogEntry[];
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({ logs = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const safeLogs = logs || [];
  const filteredLogs = safeLogs.filter((l) => {
    if (actionFilter !== 'ALL' && l.action !== actionFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        l.action?.toLowerCase().includes(term) ||
        l.actor?.toLowerCase().includes(term) ||
        l.correlationId?.toLowerCase().includes(term) ||
        JSON.stringify(l.details || {}).toLowerCase().includes(term)
      );
    }
    return true;
  });

  const getActionColor = (action: string) => {
    if (action.includes('KILL_SWITCH') || action.includes('REJECTED')) {
      return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    }
    if (action.includes('FILLED') || action.includes('APPROVED')) {
      return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    }
    if (action.includes('BOT')) {
      return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
    }
    return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0d1322] border border-slate-800/90 rounded-2xl p-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            Immutable Audit Trail & Compliance Log
          </h2>
          <p className="text-xs text-slate-400">
            Append-only record of all trade orders, risk decisions, user actions, and emergency halts
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search audit logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#090d16] border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-mono w-56"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-[#090d16] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="ALL">All Actions</option>
            <option value="ORDER_CREATED">Order Created</option>
            <option value="ORDER_REJECTED">Order Rejected</option>
            <option value="ORDER_FILLED">Order Filled</option>
            <option value="KILL_SWITCH_ACTIVATED">Kill Switch Activated</option>
            <option value="RISK_LIMIT_CHANGED">Risk Limit Changed</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-[#0d1322] border border-slate-800/90 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#090d16] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3.5">Log ID</th>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Action Event</th>
                <th className="p-3.5">Actor</th>
                <th className="p-3.5">Message / Correlation</th>
                <th className="p-3.5">Details Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No compliance logs recorded.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3.5 text-slate-500">{log.id}</td>
                    <td className="p-3.5 text-slate-300">
                      {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-300 font-bold">{log.actor}</td>
                    <td className="p-3.5">
                      <div className="text-white font-sans">{log.message}</div>
                      <div className="text-[10px] text-slate-500">{log.correlationId}</div>
                    </td>
                    <td className="p-3.5">
                      <pre className="text-[10px] text-slate-400 max-w-xs truncate bg-[#090d16] p-1 rounded border border-slate-800">
                        {JSON.stringify(log.details)}
                      </pre>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
