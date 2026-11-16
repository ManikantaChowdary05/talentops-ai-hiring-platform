import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  AlertTriangle,
  CheckCircle,
  X,
  User,
  Users,
  Search,
  Filter,
  CheckCircle2,
  CalendarDays
} from 'lucide-react';
import { api } from '../api/client';
import { Interview, Application } from '../types';

export const InterviewCalendarModule: React.FC = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [panels, setPanels] = useState<any[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  // Scheduling Modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [appId, setAppId] = useState('');
  const [panelId, setPanelId] = useState('');
  const [schedDate, setSchedDate] = useState('2026-05-15');
  const [startHour, setStartHour] = useState('10:00');
  const [endHour, setEndHour] = useState('11:00');
  const [interviewType, setInterviewType] = useState('Technical Interview');
  const [testModeConflict, setTestModeConflict] = useState(false);
  const [scheduleError, setScheduleError] = useState<any>(null);
  const [scheduling, setScheduling] = useState(false);

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const ints = await api.getInterviews();
      setInterviews(ints);

      const pnlData = await api.getPanels();
      setPanels(pnlData);
      if (pnlData.length > 0 && !panelId) {
        setPanelId(pnlData[0].panel_id);
      }

      const apps = await api.getApplications({ stage: 'Technical Interview' });
      setApplications(apps);
      if (apps.length > 0 && !appId) {
        setAppId(apps[0].application_id);
      }
    } catch (err) {
      console.error('Failed to load interview calendar data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setScheduleError(null);
    setScheduling(true);

    const startDateTime = new Date(`${schedDate}T${startHour}:00`);
    const endDateTime = new Date(`${schedDate}T${endHour}:00`);

    try {
      await api.scheduleInterview({
        application_id: appId,
        panel_id: panelId,
        interview_type: interviewType,
        scheduled_start: startDateTime.toISOString(),
        scheduled_end: endDateTime.toISOString(),
        test_mode_conflict: testModeConflict,
        calendar_notes: 'Standard technical assessment'
      });
      setShowScheduleModal(false);
      fetchInterviews();
    } catch (err: any) {
      try {
        const parsed = JSON.parse(err.message);
        setScheduleError(parsed);
      } catch (_) {
        setScheduleError({ message: err.message });
      }
    } finally {
      setScheduling(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Interview Calendar & Conflict Protections</h2>
          <p className="text-xs text-slate-500">Automated scheduling conflict inspector (R006), panel coordination, and availability management</p>
        </div>
        <button
          onClick={() => {
            setShowScheduleModal(true);
            setScheduleError(null);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Interview</span>
        </button>
      </div>

      {/* Conflict Protection Notice */}
      <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-slate-700 flex items-start space-x-3">
        <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
          <CalendarDays className="w-4 h-4" />
        </div>
        <div>
          <h4 className="font-bold text-slate-900">Zero Double-Booking Guarantee (Rule R006)</h4>
          <p className="text-slate-600 mt-0.5">
            The platform prevents overlapping interview assignments across panel reviewers in real time. If a conflict occurs,
            the scheduler blocks the booking, identifies the unavailable reviewer, suggests verified alternative slots, and logs the event.
          </p>
        </div>
      </div>

      {/* Calendar List View */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Scheduled Interviews</h3>
          <span className="text-xs font-semibold text-slate-500">{interviews.length} Total Sessions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b">
              <tr>
                <th className="px-5 py-3.5">Interview ID</th>
                <th className="px-5 py-3.5">Candidate & Role</th>
                <th className="px-5 py-3.5">Date & Time</th>
                <th className="px-5 py-3.5">Type</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Conflict Flag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">Loading interview calendar...</td>
                </tr>
              ) : interviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">No interviews scheduled.</td>
                </tr>
              ) : (
                interviews.map((intv) => (
                  <tr key={intv.interview_id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-900">{intv.interview_id}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-900">{intv.candidate_name || 'Candidate'}</p>
                      <p className="text-[11px] text-slate-500">{intv.job_title || 'Engineering'}</p>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800">
                      {new Date(intv.scheduled_start).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-slate-700">{intv.interview_type}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        intv.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {intv.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {intv.test_mode_conflict ? (
                        <span className="text-amber-700 font-bold flex items-center space-x-1 text-[11px]">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Labelled Test Conflict</span>
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-semibold flex items-center space-x-1 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>No Conflict</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Interview Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSchedule} className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Schedule Candidate Interview</h3>
              <button type="button" onClick={() => setShowScheduleModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conflict Alert Display */}
            {scheduleError && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-2">
                <div className="flex items-center space-x-2 font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{scheduleError.error || 'Scheduling Conflict Detected'}</span>
                </div>
                <p>{scheduleError.message || JSON.stringify(scheduleError)}</p>

                {scheduleError.suggested_available_slots && scheduleError.suggested_available_slots.length > 0 && (
                  <div className="pt-2 border-t border-rose-200/60">
                    <span className="font-bold block text-slate-800 mb-1">Suggested Alternative Available Slots:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-700 text-[11px]">
                      {scheduleError.suggested_available_slots.map((s: string, idx: number) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Application / Candidate *</label>
                <select
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                >
                  {applications.map((a) => (
                    <option key={a.application_id} value={a.application_id}>
                      {a.candidate_name} ({a.application_id} • {a.job_title})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Interview Panel *</label>
                <select
                  value={panelId}
                  onChange={(e) => setPanelId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                >
                  {panels.map((p) => (
                    <option key={p.panel_id} value={p.panel_id}>
                      {p.panel_name} ({p.members.length} reviewers)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={schedDate}
                    onChange={(e) => setSchedDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="text"
                    placeholder="10:00"
                    value={startHour}
                    onChange={(e) => setStartHour(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">End Time</label>
                  <input
                    type="text"
                    placeholder="11:00"
                    value={endHour}
                    onChange={(e) => setEndHour(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                  />
                </div>
              </div>

              {/* Test Mode Conflict Demonstrator */}
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-amber-900 block text-xs">Test Mode: Allow Historical Conflict</span>
                  <p className="text-[10px] text-amber-700">For demonstration purposes to verify anomaly logging without normal block.</p>
                </div>
                <input
                  type="checkbox"
                  checked={testModeConflict}
                  onChange={(e) => setTestModeConflict(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={scheduling}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {scheduling ? 'Validating Conflicts...' : 'Confirm Schedule'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
