import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  User,
  MessageSquare,
  FileCheck
} from 'lucide-react';
import { api } from '../api/client';
import { Approval } from '../types';

export const ApprovalsModule: React.FC = () => {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDecision, setSelectedDecision] = useState('All');

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (selectedDecision !== 'All') params.decision = selectedDecision;
      const data = await api.getApprovals(params);
      setApprovals(data);
    } catch (err) {
      console.error('Failed to load approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, [selectedDecision]);

  const handleAction = async (approvalId: string, decision: 'Approved' | 'Rejected') => {
    const comments = prompt(`Enter comments for ${decision}:`, decision === 'Approved' ? 'Approved within budget' : 'Requires compensation revision');
    if (comments === null) return;

    try {
      await api.submitApprovalAction(approvalId, decision, comments);
      fetchApprovals();
    } catch (err: any) {
      alert(`Approval Error: ${err.message}`);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Offer Approval Workflow Queue</h2>
          <p className="text-xs text-slate-500">
            Multi-level authorization chain for compensation packages and final hiring approvals (R011)
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={selectedDecision}
            onChange={(e) => setSelectedDecision(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-semibold text-slate-700"
          >
            <option value="All">All Decisions</option>
            <option value="Pending">Pending Sign-off</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Approvals Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b">
              <tr>
                <th className="px-5 py-3.5">Approval ID</th>
                <th className="px-5 py-3.5">Offer Reference</th>
                <th className="px-5 py-3.5">Designated Approver</th>
                <th className="px-5 py-3.5">Approval Level</th>
                <th className="px-5 py-3.5">Decision</th>
                <th className="px-5 py-3.5">Comments & Reason</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">Loading approval queue...</td>
                </tr>
              ) : approvals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">No approvals matching filter.</td>
                </tr>
              ) : (
                approvals.map((appr) => (
                  <tr key={appr.approval_id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-900">{appr.approval_id}</td>
                    <td className="px-5 py-3.5 font-mono font-semibold text-blue-600">{appr.offer_id}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">{appr.approver_name || appr.approver_id}</td>
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        Level {appr.approval_level} {appr.approval_level === 2 ? '(Executive)' : '(Manager)'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        appr.decision === 'Approved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : appr.decision === 'Rejected'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {appr.decision}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 italic truncate max-w-xs" title={appr.comments || ''}>
                      {appr.comments || 'Pending review'}
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1.5">
                      {appr.decision === 'Pending' ? (
                        <>
                          <button
                            onClick={() => handleAction(appr.approval_id, 'Approved')}
                            className="px-2.5 py-1 text-white bg-emerald-600 hover:bg-emerald-700 rounded font-semibold text-xs"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(appr.approval_id, 'Rejected')}
                            className="px-2.5 py-1 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded font-semibold text-xs"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">Logged & Locked</span>
                      )}
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
