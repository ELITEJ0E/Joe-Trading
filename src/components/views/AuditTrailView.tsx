import React, { useState } from 'react';
import { Shield, Search, Filter } from 'lucide-react';
import { AuditLogEntry } from '../../types/client.ts';
import { EmptyState } from '../common/EmptyState.tsx';

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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0b101d] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            Immutable Audit Trail & Compliance Log
          </h2>
          <p className="text-xs text-slate-400">
            Append-only record of all trade orders, risk decisions, user actions, and emergency halts
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <input
              type="text"
              placeholder="Search audit logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#060912] border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-mono w-full sm:w-56"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-[#060912] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
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
      {filteredLogs.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="No Compliance Logs Found"
          description="There are currently no audit records matching your search criteria."
        />
      ) : (
        <div className="bg-[#0b101d] border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#060912] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
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
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3.5 text-slate-500 font-bold">{log.id}</td>
                    <td className="p-3.5 text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getActionColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3.5 text-white font-bold">{log.actor}</td>
                    <td className="p-3.5 text-slate-300">
                      <div>{log.message}</div>
                      {log.correlationId && (
                        <div className="text-[10px] text-slate-500">
                          Corr: {log.correlationId}
                        </div>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-400 max-w-xs truncate">
                      {JSON.stringify(log.details || {})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
