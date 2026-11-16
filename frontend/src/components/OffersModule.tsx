import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Plus,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldAlert,
  FileCheck,
  X
} from 'lucide-react';
import { api } from '../api/client';
import { Offer, Application } from '../types';

export const OffersModule: React.FC = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Offer Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [appId, setAppId] = useState('');
  const [salary, setSalary] = useState(115000);
  const [bonus, setBonus] = useState(10000);
  const [joiningDate, setJoiningDate] = useState('2026-07-01');
  const [createError, setCreateError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const data = await api.getOffers();
      setOffers(data);

      const apps = await api.getApplications();
      setApplications(apps);
      if (apps.length > 0 && !appId) {
        setAppId(apps[0].application_id);
      }
    } catch (err) {
      console.error('Failed to load offers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setSubmitting(true);

    try {
      await api.createOffer({
        application_id: appId,
        proposed_salary: Number(salary),
        bonus: Number(bonus),
        joining_date: new Date(joiningDate).toISOString(),
        currency: 'USD'
      });
      setShowCreateModal(false);
      fetchOffers();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create offer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (offerId: string, targetStatus: string) => {
    try {
      await api.updateOfferStatus(offerId, targetStatus);
      fetchOffers();
    } catch (err: any) {
      alert(`Action Blocked: ${err.message}`);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Offer Management & Compensation Bands</h2>
          <p className="text-xs text-slate-500">
            Automated salary band compliance (R009), exception routing, and hire approval verification (R011)
          </p>
        </div>
        <button
          onClick={() => {
            setShowCreateModal(true);
            setCreateError('');
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Generate New Offer</span>
        </button>
      </div>

      {/* Compliance Rule Note */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-start space-x-2.5">
          <div className="w-6 h-6 rounded bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
            ✓
          </div>
          <div>
            <strong className="block text-slate-900">Within Approved Band (Normal Workflow)</strong>
            <span>Proposed salary aligns with requisition range. Requires Level 1 Hiring Manager approval.</span>
          </div>
        </div>
        <div className="flex items-start space-x-2.5">
          <div className="w-6 h-6 rounded bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0">
            ⚠️
          </div>
          <div>
            <strong className="block text-slate-900">Exceeds Band Maximum (Rule R009 Exception)</strong>
            <span>Automatically routed to Level 2 Executive HR for compensation exception sign-off.</span>
          </div>
        </div>
      </div>

      {/* Offers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b">
              <tr>
                <th className="px-5 py-3.5">Offer ID</th>
                <th className="px-5 py-3.5">Candidate & Role</th>
                <th className="px-5 py-3.5">Approved Range</th>
                <th className="px-5 py-3.5">Proposed Compensation</th>
                <th className="px-5 py-3.5">Band Status</th>
                <th className="px-5 py-3.5">Offer Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">Loading offers...</td>
                </tr>
              ) : offers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">No offers found.</td>
                </tr>
              ) : (
                offers.map((off) => (
                  <tr key={off.offer_id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-900">{off.offer_id}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-900">{off.candidate_name || 'Candidate'}</p>
                      <p className="text-[11px] text-slate-500">{off.job_title || 'Role'}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {off.salary_min && off.salary_max
                        ? `$${off.salary_min.toLocaleString()} - $${off.salary_max.toLocaleString()}`
                        : 'Standard'}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      ${off.proposed_salary.toLocaleString()}
                      {off.bonus > 0 && <span className="text-[11px] text-slate-400 font-normal"> (+${off.bonus.toLocaleString()} bonus)</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        off.band_compliance_status === 'Within Band'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {off.band_compliance_status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        off.offer_status === 'Accepted'
                          ? 'bg-emerald-100 text-emerald-800'
                          : off.offer_status === 'Approved'
                          ? 'bg-blue-100 text-blue-800'
                          : off.offer_status === 'Rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {off.offer_status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1.5">
                      {off.offer_status === 'Approved' && (
                        <button
                          onClick={() => handleUpdateStatus(off.offer_id, 'Accepted')}
                          className="px-2.5 py-1 text-white bg-emerald-600 hover:bg-emerald-700 rounded font-semibold text-xs"
                          title="Execute final candidate hire (Rule R011)"
                        >
                          Accept & Hire (R011)
                        </button>
                      )}
                      {off.offer_status !== 'Rejected' && off.offer_status !== 'Accepted' && (
                        <button
                          onClick={() => handleUpdateStatus(off.offer_id, 'Rejected')}
                          className="px-2.5 py-1 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded font-semibold text-xs"
                        >
                          Reject
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

      {/* Generate Offer Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateOffer} className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Generate Formal Candidate Offer</h3>
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{createError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Application *</label>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Proposed Salary ($) *</label>
                  <input
                    type="number"
                    min="1000"
                    step="5000"
                    required
                    value={salary}
                    onChange={(e) => setSalary(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sign-on Bonus ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={bonus}
                    onChange={(e) => setBonus(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Joining Date</label>
                <input
                  type="date"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                />
              </div>

              <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border">
                Note: Offers exceeding approved salary band will automatically trigger Level 2 Executive Compensation Approval and generate an Anomaly 3 exception record.
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Issue Offer'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
