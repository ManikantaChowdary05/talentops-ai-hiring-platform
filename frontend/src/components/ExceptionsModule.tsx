import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  X,
  FileCheck,
  RefreshCw
} from 'lucide-react';
import { api } from '../api/client';
import { ExceptionItem } from '../types';

export const ExceptionsModule: React.FC = () => {
  const [exceptions, setExceptions] = useState<ExceptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeverity, setSelectedSeverity] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // AI Diagnosis Modal
  const [showAiModal, setShowAiModal] = useState(false);
  const [diagnosing, setDiagnosing] = useState(false);
  const [diagnosisData, setDiagnosisData] = useState<any>(null);

  // Resolve Modal
  const [resolvingItem, setResolvingItem] = useState<ExceptionItem | null>(null);
  const [resolutionStatus, setResolutionStatus] = useState('Resolved');
  const [resolutionComment, setResolutionComment] = useState('');

  const fetchExceptions = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (selectedSeverity !== 'All') params.severity = selectedSeverity;
      if (selectedStatus !== 'All') params.resolution_status = selectedStatus;
      const data = await api.getExceptions(params);
      setExceptions(data);
    } catch (err) {
      console.error('Failed to load exceptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExceptions();
  }, [selectedSeverity, selectedStatus]);

  const handleOpenAiDiagnosis = async (exc: ExceptionItem) => {
    setShowAiModal(true);
    setDiagnosing(true);
    try {
      const data = await api.getAiExceptionDiagnosis(exc.exception_id);
      setDiagnosisData(data);
    } catch (err) {
      console.error('Failed to load AI diagnosis:', err);
    } finally {
      setDiagnosing(false);
    }
  };

  const handleExecuteResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingItem) return;

    try {
      await api.resolveException(resolvingItem.exception_id, resolutionStatus, resolutionComment);
      setResolvingItem(null);
      setResolutionComment('');
      fetchExceptions();
    } catch (err: any) {
      alert(`Resolution Error: ${err.message}`);
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'Critical':
        return <span className="bg-rose-50 text-rose-700 border border-rose-200 text-xs px-2.5 py-0.5 rounded-full font-bold">Critical</span>;
      case 'High':
        return <span className="bg-orange-50 text-orange-700 border border-orange-200 text-xs px-2.5 py-0.5 rounded-full font-bold">High</span>;
      case 'Medium':
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs px-2.5 py-0.5 rounded-full font-bold">Medium</span>;
      default:
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2.5 py-0.5 rounded-full font-bold">Low</span>;
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Operational Exceptions & Anomaly Center</h2>
          <p className="text-xs text-slate-500">
            Real-time detection and explainable remediation for the 5 mandatory recruitment anomalies
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-semibold text-slate-700"
          >
            <option value="All">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-semibold text-slate-700"
          >
            <option value="All">All Resolution States</option>
            <option value="Open">Open</option>
            <option value="Resolved">Resolved</option>
            <option value="Dismissed">Dismissed</option>
          </select>
        </div>
      </div>

      {/* Mandatory Anomalies Guide Banner */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 text-xs space-y-2">
        <h4 className="font-bold text-slate-900 flex items-center space-x-1.5">
          <ShieldAlert className="w-4 h-4 text-amber-600" />
          <span>The 5 Mandatory Platform Anomalies Monitored:</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-[11px] text-slate-700">
          <div className="p-2 bg-white/70 rounded border border-amber-200">
            <strong>1. Stage Skipping (R003)</strong>
            <p className="text-slate-500">Candidate advanced without required reviews</p>
          </div>
          <div className="p-2 bg-white/70 rounded border border-amber-200">
            <strong>2. Double Booking (R006)</strong>
            <p className="text-slate-500">Interviewer booked concurrently</p>
          </div>
          <div className="p-2 bg-white/70 rounded border border-amber-200">
            <strong>3. Salary Overrun (R009)</strong>
            <p className="text-slate-500">Offer exceeds approved requisition band</p>
          </div>
          <div className="p-2 bg-white/70 rounded border border-amber-200">
            <strong>4. Ghost Scheduled (R004)</strong>
            <p className="text-slate-500">Withdrawn candidate remaining on calendar</p>
          </div>
          <div className="p-2 bg-white/70 rounded border border-amber-200">
            <strong>5. Biased Criteria (R008)</strong>
            <p className="text-slate-500">Evaluation includes unauthorized criteria</p>
          </div>
        </div>
      </div>

      {/* Exceptions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b">
              <tr>
                <th className="px-5 py-3.5">Exception ID</th>
                <th className="px-5 py-3.5">Rule & Severity</th>
                <th className="px-5 py-3.5">Issue Type & Entity</th>
                <th className="px-5 py-3.5">Detected Decision</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Explanation & Context</th>
                <th className="px-5 py-3.5 text-right">Remediation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">Scanning for operational exceptions...</td>
                </tr>
              ) : exceptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">No active exceptions matching filter.</td>
                </tr>
              ) : (
                exceptions.map((exc) => (
                  <tr key={exc.exception_id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-900">{exc.exception_id}</td>
                    <td className="px-5 py-3.5 space-y-1">
                      <div>{getSeverityBadge(exc.severity)}</div>
                      <span className="font-mono text-[10px] text-blue-600 font-bold block">{exc.detected_rule_id}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-900">{exc.issue_type}</p>
                      <p className="font-mono text-[11px] text-slate-400">{exc.entity_type}: {exc.entity_id}</p>
                    </td>
                    <td className="px-5 py-3.5 text-[11px]">
                      <span className="text-rose-600 font-bold">{exc.actual_decision}</span>
                      <span className="text-slate-400 font-normal"> (Expected: {exc.expected_decision})</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        exc.resolution_status === 'Open'
                          ? 'bg-amber-100 text-amber-800'
                          : exc.resolution_status === 'Resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {exc.resolution_status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 truncate max-w-xs" title={exc.comments || ''}>
                      {exc.comments || 'Anomaly flagged by rules engine'}
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1.5">
                      <button
                        onClick={() => handleOpenAiDiagnosis(exc)}
                        className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded inline-flex items-center space-x-1"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>AI Diagnosis</span>
                      </button>
                      {exc.resolution_status === 'Open' && (
                        <button
                          onClick={() => {
                            setResolvingItem(exc);
                            setResolutionComment('');
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded"
                        >
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Exception Diagnosis Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">AI Root Cause & Remediation Guide</h3>
              </div>
              <button onClick={() => setShowAiModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {diagnosing ? (
              <p className="text-xs text-slate-400 text-center py-8">Analyzing anomaly root cause and risks...</p>
            ) : diagnosisData ? (
              <div className="space-y-4 text-xs">
                <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200">
                  <span className="font-bold text-indigo-900 block text-xs">{diagnosisData.issue_type}</span>
                  <span className="font-mono text-[10px] text-indigo-600">Rule: {diagnosisData.rule_id}</span>
                </div>

                <div>
                  <h5 className="font-bold text-slate-900">Root Cause Analysis:</h5>
                  <p className="mt-1 p-2.5 rounded bg-slate-50 border text-slate-700 leading-relaxed text-xs">
                    {diagnosisData.root_cause}
                  </p>
                </div>

                <div>
                  <h5 className="font-bold text-rose-800">Business & Compliance Risk:</h5>
                  <p className="mt-1 p-2.5 rounded bg-rose-50/60 border border-rose-200 text-rose-900 text-xs">
                    {diagnosisData.business_risk}
                  </p>
                </div>

                <div>
                  <h5 className="font-bold text-slate-900">Step-by-Step Remediation Plan:</h5>
                  <ol className="mt-1 space-y-1 list-decimal list-inside text-slate-700 text-xs">
                    {diagnosisData.remediation_steps.map((s: string, idx: number) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ol>
                </div>
              </div>
            ) : null}

            <div className="flex justify-end pt-3 border-t">
              <button
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Exception Modal */}
      {resolvingItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleExecuteResolution} className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Resolve Operational Exception</h3>
                <p className="text-xs text-slate-500">{resolvingItem.exception_id} • {resolvingItem.issue_type}</p>
              </div>
              <button type="button" onClick={() => setResolvingItem(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Resolution Decision</label>
                <select
                  value={resolutionStatus}
                  onChange={(e) => setResolutionStatus(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs font-semibold"
                >
                  <option value="Resolved">Resolved (Remediation Executed)</option>
                  <option value="Dismissed">Dismissed (With Business Justification)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Documentation & Reason *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Document specific remediation steps taken or reason for dismissal..."
                  value={resolutionComment}
                  onChange={(e) => setResolutionComment(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                />
                <p className="text-[10px] text-slate-400 mt-1">Changes are immutably logged into the Audit Log.</p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => setResolvingItem(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
              >
                Confirm Resolution
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
