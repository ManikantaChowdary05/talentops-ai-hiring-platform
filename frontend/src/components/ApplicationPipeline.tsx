import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  History,
  X,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { api } from '../api/client';
import { Application, StageHistory } from '../types';

const PIPELINE_STAGES = [
  'Applied',
  'Screening',
  'Technical Interview',
  'Manager Interview',
  'Offer',
  'Hired'
];

export const ApplicationPipeline: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStage, setSelectedStage] = useState('All');
  const [viewMode, setViewMode] = useState<'board' | 'table'>('board');

  // History Inspector
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [historyList, setHistoryList] = useState<StageHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Transition Modal
  const [transitioningApp, setTransitioningApp] = useState<Application | null>(null);
  const [targetStage, setTargetStage] = useState('Screening');
  const [transitionReason, setTransitionReason] = useState('');
  const [transitionError, setTransitionError] = useState('');

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (selectedStage !== 'All') params.stage = selectedStage;
      if (search) params.search = search;
      const data = await api.getApplications(params);
      setApplications(data);
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [selectedStage, search]);

  const handleInspectHistory = async (app: Application) => {
    setSelectedApp(app);
    setLoadingHistory(true);
    try {
      const data = await api.getStageHistory(app.application_id);
      setHistoryList(data);
    } catch (err) {
      console.error('Failed to load stage history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleOpenTransition = (app: Application) => {
    setTransitioningApp(app);
    setTransitionError('');
    // Suggest next stage in sequence
    const currentIdx = PIPELINE_STAGES.indexOf(app.current_stage);
    if (currentIdx >= 0 && currentIdx < PIPELINE_STAGES.length - 1) {
      setTargetStage(PIPELINE_STAGES[currentIdx + 1]);
    } else {
      setTargetStage('Offer');
    }
    setTransitionReason('Candidate satisfied stage review criteria.');
  };

  const handleExecuteTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transitioningApp) return;

    setTransitionError('');
    try {
      await api.transitionStage(transitioningApp.application_id, targetStage, transitionReason);
      setTransitioningApp(null);
      fetchApplications();
    } catch (err: any) {
      setTransitionError(err.message || 'Failed to transition stage');
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Recruitment Pipeline & Stage Tracking</h2>
          <p className="text-xs text-slate-500">Track candidate progression with strict sequential stage rules (R003) and immutable history</p>
        </div>
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('board')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
              viewMode === 'board' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            Kanban Board
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
              viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            Data Table
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2 flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by candidate name, role, or APP-CAND-REQ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-medium text-slate-700 focus:outline-none"
          >
            <option value="All">All Stages</option>
            {PIPELINE_STAGES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
            <option value="Rejected">Rejected</option>
            <option value="Withdrawn">Withdrawn</option>
          </select>
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'board' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 overflow-x-auto min-h-[500px]">
          {PIPELINE_STAGES.map((stageName) => {
            const stageApps = applications.filter((a) => a.current_stage === stageName);
            return (
              <div key={stageName} className="bg-slate-100/70 rounded-xl p-3 flex flex-col space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-slate-800 truncate" title={stageName}>
                    {stageName}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full shadow-2xs">
                    {stageApps.length}
                  </span>
                </div>

                <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[600px]">
                  {stageApps.length === 0 ? (
                    <div className="p-4 text-center text-[11px] text-slate-400 italic">No candidates</div>
                  ) : (
                    stageApps.map((app) => (
                      <div
                        key={app.application_id}
                        className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs hover:border-blue-400 transition space-y-2"
                      >
                        <div>
                          <span className="font-mono text-[9px] text-blue-600 font-bold block truncate">
                            {app.application_id}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 truncate">{app.candidate_name}</h4>
                          <p className="text-[11px] text-slate-500 truncate">{app.job_title}</p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px]">
                          <button
                            onClick={() => handleInspectHistory(app)}
                            className="text-slate-500 hover:text-slate-800 font-semibold flex items-center space-x-1"
                          >
                            <History className="w-3 h-3" />
                            <span>History</span>
                          </button>
                          {stageName !== 'Hired' && (
                            <button
                              onClick={() => handleOpenTransition(app)}
                              className="text-blue-600 hover:text-blue-800 font-bold flex items-center space-x-0.5"
                            >
                              <span>Advance</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b">
              <tr>
                <th className="px-5 py-3.5">Application ID</th>
                <th className="px-5 py-3.5">Candidate</th>
                <th className="px-5 py-3.5">Requisition</th>
                <th className="px-5 py-3.5">Department</th>
                <th className="px-5 py-3.5">Current Stage</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {applications.map((app) => (
                <tr key={app.application_id} className="hover:bg-slate-50/80 transition">
                  <td className="px-5 py-3.5 font-mono font-semibold text-slate-900">{app.application_id}</td>
                  <td className="px-5 py-3.5 font-bold text-slate-900">{app.candidate_name}</td>
                  <td className="px-5 py-3.5 text-slate-700">{app.job_title}</td>
                  <td className="px-5 py-3.5 text-slate-600">{app.department}</td>
                  <td className="px-5 py-3.5">
                    <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[11px] px-2 py-0.5 rounded-full font-bold">
                      {app.current_stage}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-slate-700">{app.application_status}</td>
                  <td className="px-5 py-3.5 text-right space-x-2">
                    <button
                      onClick={() => handleInspectHistory(app)}
                      className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded font-semibold text-xs"
                    >
                      History
                    </button>
                    {app.current_stage !== 'Hired' && (
                      <button
                        onClick={() => handleOpenTransition(app)}
                        className="px-2.5 py-1 text-white bg-blue-600 hover:bg-blue-700 rounded font-semibold text-xs"
                      >
                        Advance
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Stage History Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="font-mono text-xs text-blue-600 font-bold">{selectedApp.application_id}</span>
                <h3 className="text-base font-bold text-slate-900">
                  Audit History: {selectedApp.candidate_name}
                </h3>
              </div>
              <button onClick={() => setSelectedApp(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {loadingHistory ? (
                <p className="text-xs text-slate-400 text-center py-6">Loading immutable stage history...</p>
              ) : historyList.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No previous stage events found.</p>
              ) : (
                historyList.map((item, idx) => (
                  <div key={item.history_id} className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 flex items-center space-x-1.5">
                        <span>{item.previous_stage || 'Initial'}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="text-blue-600">{item.new_stage}</span>
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px]">{item.decision_reason}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span>Actor: <strong className="text-slate-700">{item.actor}</strong></span>
                      <span>Rule: <strong className="text-slate-700">{item.related_rule_id || 'N/A'}</strong></span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-3 border-t">
              <button
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transition Modal */}
      {transitioningApp && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleExecuteTransition} className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Advance Candidate Stage</h3>
                <p className="text-xs text-slate-500">{transitioningApp.candidate_name}</p>
              </div>
              <button type="button" onClick={() => setTransitioningApp(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {transitionError && (
              <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{transitionError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Stage (Rule R003)</label>
                <select
                  value={targetStage}
                  onChange={(e) => setTargetStage(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs font-semibold"
                >
                  {PIPELINE_STAGES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                  <option value="Rejected">Rejected</option>
                  <option value="Withdrawn">Withdrawn</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">Rule R003 forbids skipping intermediate reviews.</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Decision Reason *</label>
                <textarea
                  required
                  rows={3}
                  value={transitionReason}
                  onChange={(e) => setTransitionReason(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => setTransitioningApp(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
              >
                Confirm Transition
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
