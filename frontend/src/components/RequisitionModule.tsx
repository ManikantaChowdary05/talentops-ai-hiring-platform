import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  DollarSign,
  MapPin,
  Calendar,
  X,
  FileCheck
} from 'lucide-react';
import { api } from '../api/client';
import { Requisition } from '../types';

export const RequisitionModule: React.FC = () => {
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewReq, setViewReq] = useState<Requisition | null>(null);

  // Form State
  const [jobTitle, setJobTitle] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [location, setLocation] = useState('San Francisco, CA');
  const [expMin, setExpMin] = useState(2);
  const [expMax, setExpMax] = useState(6);
  const [salMin, setSalMin] = useState(80000);
  const [salMax, setSalMax] = useState(130000);
  const [positions, setPositions] = useState(1);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRequisitions = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (selectedDept !== 'All') params.department = selectedDept;
      if (selectedStatus !== 'All') params.status = selectedStatus;
      if (search) params.search = search;
      const data = await api.getRequisitions(params);
      setRequisitions(data);
    } catch (err) {
      console.error('Failed to load requisitions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequisitions();
  }, [selectedDept, selectedStatus, search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (salMin > salMax) {
      setFormError('Salary Minimum cannot exceed Salary Maximum.');
      return;
    }
    if (expMin > expMax) {
      setFormError('Experience Minimum cannot exceed Experience Maximum.');
      return;
    }

    setSubmitting(true);
    try {
      await api.createRequisition({
        job_title: jobTitle,
        department,
        location,
        hiring_manager_id: 'MGR-000001',
        employment_type: 'Full-time',
        experience_min: Number(expMin),
        experience_max: Number(expMax),
        salary_min: Number(salMin),
        salary_max: Number(salMax),
        positions_available: Number(positions),
        skills: [
          { skill_name: 'Core Technology', is_mandatory: true, min_proficiency: 3, min_experience_years: expMin },
          { skill_name: 'Problem Solving', is_mandatory: true, min_proficiency: 3, min_experience_years: 1.0 },
        ]
      });
      setShowCreateModal(false);
      // Reset form
      setJobTitle('');
      fetchRequisitions();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create requisition');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (reqId: string) => {
    try {
      await api.approveRequisition(reqId);
      fetchRequisitions();
      if (viewReq && viewReq.requisition_id === reqId) {
        setViewReq({ ...viewReq, requisition_status: 'Approved' });
      }
    } catch (err: any) {
      alert(`Approval error: ${err.message}`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Open':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2.5 py-0.5 rounded-full font-bold">Open</span>;
      case 'Approved':
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2.5 py-0.5 rounded-full font-bold">Approved</span>;
      case 'Pending Approval':
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs px-2.5 py-0.5 rounded-full font-bold">Pending Approval</span>;
      case 'Draft':
        return <span className="bg-slate-100 text-slate-700 border border-slate-300 text-xs px-2.5 py-0.5 rounded-full font-medium">Draft</span>;
      default:
        return <span className="bg-slate-50 text-slate-600 text-xs px-2.5 py-0.5 rounded-full">{status}</span>;
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Job Requisitions</h2>
          <p className="text-xs text-slate-500">Manage hiring requisitions, compensation bands, and rule R001 approvals</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Requisition</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Job Title or REQ-2026-XXXXXX..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-medium text-slate-700 focus:outline-none"
          >
            <option value="All">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Data & AI">Data & AI</option>
            <option value="Product Management">Product Management</option>
            <option value="Design">Design</option>
            <option value="DevOps & Cloud">DevOps & Cloud</option>
            <option value="HR & Operations">HR & Operations</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-medium text-slate-700 focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Approved">Approved</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="Draft">Draft</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Requisition ID</th>
                <th className="px-5 py-3.5">Job Title & Department</th>
                <th className="px-5 py-3.5">Location</th>
                <th className="px-5 py-3.5">Experience</th>
                <th className="px-5 py-3.5">Salary Band</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">Loading requisitions...</td>
                </tr>
              ) : requisitions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">No requisitions matching filters.</td>
                </tr>
              ) : (
                requisitions.map((req) => (
                  <tr key={req.requisition_id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5 font-mono font-semibold text-slate-900">{req.requisition_id}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-900">{req.job_title}</p>
                      <p className="text-[11px] text-slate-400">{req.department} • {req.positions_available} pos</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{req.location}</td>
                    <td className="px-5 py-3.5 text-slate-600">{req.experience_min} - {req.experience_max} yrs</td>
                    <td className="px-5 py-3.5 font-semibold text-slate-900">
                      ${req.salary_min.toLocaleString()} - ${req.salary_max.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5">{getStatusBadge(req.requisition_status)}</td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => setViewReq(req)}
                        className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded font-semibold text-xs"
                      >
                        Inspect
                      </button>
                      {(req.requisition_status === 'Draft' || req.requisition_status === 'Pending Approval') && (
                        <button
                          onClick={() => handleApprove(req.requisition_id)}
                          className="px-2.5 py-1 text-white bg-blue-600 hover:bg-blue-700 rounded font-semibold text-xs"
                        >
                          Approve (R001)
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

      {/* Inspect Requisition Modal */}
      {viewReq && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="font-mono text-xs text-blue-600 font-bold">{viewReq.requisition_id}</span>
                <h3 className="text-lg font-bold text-slate-900">{viewReq.job_title}</h3>
              </div>
              <button onClick={() => setViewReq(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 font-semibold">Department:</span>
                <p className="font-bold text-slate-800">{viewReq.department}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-semibold">Location:</span>
                <p className="font-bold text-slate-800">{viewReq.location}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-semibold">Compensation Band:</span>
                <p className="font-bold text-slate-800">${viewReq.salary_min.toLocaleString()} - ${viewReq.salary_max.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-semibold">Status:</span>
                <div>{getStatusBadge(viewReq.requisition_status)}</div>
              </div>
            </div>

            {/* Required Skills */}
            <div className="space-y-2 pt-2 border-t">
              <h4 className="text-xs font-bold text-slate-800">Required Skills & Proficiencies:</h4>
              <div className="flex flex-wrap gap-2">
                {viewReq.skill_requirements && viewReq.skill_requirements.length > 0 ? (
                  viewReq.skill_requirements.map((sk, idx) => (
                    <span
                      key={idx}
                      className={`text-xs px-2.5 py-1 rounded-md font-semibold ${
                        sk.is_mandatory
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {sk.skill_name} ({sk.is_mandatory ? 'Mandatory' : 'Preferred'} • Min Lvl {sk.min_proficiency})
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">Standard competency profile</span>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t">
              {(viewReq.requisition_status === 'Draft' || viewReq.requisition_status === 'Pending Approval') && (
                <button
                  onClick={() => handleApprove(viewReq.requisition_id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
                >
                  Authorize Requisition (R001)
                </button>
              )}
              <button
                onClick={() => setViewReq(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Requisition Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreate} className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Create New Requisition</h3>
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
                {formError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Job Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Backend Engineer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Data & AI">Data & AI</option>
                    <option value="Product Management">Product Management</option>
                    <option value="Design">Design</option>
                    <option value="DevOps & Cloud">DevOps & Cloud</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Min Experience (Yrs)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={expMin}
                    onChange={(e) => setExpMin(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Max Experience (Yrs)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={expMax}
                    onChange={(e) => setExpMax(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Salary Min ($)</label>
                  <input
                    type="number"
                    min="1000"
                    step="5000"
                    value={salMin}
                    onChange={(e) => setSalMin(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Salary Max ($)</label>
                  <input
                    type="number"
                    min="1000"
                    step="5000"
                    value={salMax}
                    onChange={(e) => setSalMax(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                  />
                </div>
              </div>
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
                {submitting ? 'Creating...' : 'Create Requisition'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
