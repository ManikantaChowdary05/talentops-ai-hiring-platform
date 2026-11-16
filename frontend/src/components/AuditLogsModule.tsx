import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  Clock,
  Shield,
  ArrowRight,
  User,
  History
} from 'lucide-react';
import { api } from '../api/client';
import { AuditLogItem } from '../types';

export const AuditLogsModule: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState('All');
  const [selectedAction, setSelectedAction] = useState('All');
  const [entityIdSearch, setEntityIdSearch] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (selectedEntity !== 'All') params.entity = selectedEntity;
      if (selectedAction !== 'All') params.action = selectedAction;
      if (entityIdSearch) params.entity_id = entityIdSearch;
      const data = await api.getAuditLogs(params);
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedEntity, selectedAction, entityIdSearch]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-2 py-0.5 rounded font-bold">CREATE</span>;
      case 'APPROVE':
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] px-2 py-0.5 rounded font-bold">APPROVE</span>;
      case 'REJECT':
        return <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] px-2 py-0.5 rounded font-bold">REJECT</span>;
      case 'TRANSITION':
        return <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[10px] px-2 py-0.5 rounded font-bold">TRANSITION</span>;
      case 'SCHEDULE':
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] px-2 py-0.5 rounded font-bold">SCHEDULE</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded font-bold">{action}</span>;
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Immutable Audit Trail & Traceability</h2>
        <p className="text-xs text-slate-500">
          Append-only ledger documenting state mutations, user decisions, authorization approvals, and transitions
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2 flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Entity ID (e.g. REQ-2026-..., OFF-2026-..., APP-...)..."
            value={entityIdSearch}
            onChange={(e) => setEntityIdSearch(e.target.value)}
            className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-medium text-slate-700 focus:outline-none"
          >
            <option value="All">All Entities</option>
            <option value="Requisition">Requisition</option>
            <option value="Application">Application</option>
            <option value="Interview">Interview</option>
            <option value="Scorecard">Scorecard</option>
            <option value="Offer">Offer</option>
            <option value="Approval">Approval</option>
            <option value="ExceptionLog">ExceptionLog</option>
          </select>

          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-medium text-slate-700 focus:outline-none"
          >
            <option value="All">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="TRANSITION">TRANSITION</option>
            <option value="APPROVE">APPROVE</option>
            <option value="REJECT">REJECT</option>
            <option value="SCHEDULE">SCHEDULE</option>
            <option value="EXCEPTION_RESOLVED">EXCEPTION_RESOLVED</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b">
              <tr>
                <th className="px-5 py-3.5">Log ID & Timestamp</th>
                <th className="px-5 py-3.5">Actor</th>
                <th className="px-5 py-3.5">Action</th>
                <th className="px-5 py-3.5">Entity & ID</th>
                <th className="px-5 py-3.5">Previous Value</th>
                <th className="px-5 py-3.5">New Value</th>
                <th className="px-5 py-3.5">Reason / Justification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">Loading immutable audit logs...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">No audit events found.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.log_id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5 font-mono text-slate-700">
                      <span className="font-bold text-slate-900 block">#{log.log_id}</span>
                      <span className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-900">
                      {log.user_name || log.user_id || 'System Engine'}
                    </td>
                    <td className="px-5 py-3.5">{getActionBadge(log.action)}</td>
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-slate-800">{log.entity}</span>
                      <p className="font-mono text-[10px] text-blue-600 truncate max-w-xs">{log.entity_id}</p>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[10px] text-slate-500 max-w-[140px] truncate" title={log.previous_value || 'None'}>
                      {log.previous_value || '—'}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[10px] text-slate-900 font-semibold max-w-[160px] truncate" title={log.new_value || 'None'}>
                      {log.new_value || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 text-xs italic max-w-xs truncate" title={log.reason || ''}>
                      {log.reason || 'Process execution'}
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
