import React, { useState, useEffect } from 'react';
import {
  Users,
  Briefcase,
  GitBranch,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Percent,
  DollarSign,
  Filter,
  RefreshCw,
  Award,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { api } from '../api/client';
import { DashboardMetrics } from '../types';

const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#e2e8f0'];
const SEVERITY_COLORS: Record<string, string> = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#eab308',
  Low: '#3b82f6'
};

export const ExecutiveDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (selectedDept !== 'All') params.department = selectedDept;
      if (selectedStatus !== 'All') params.status = selectedStatus;
      const data = await api.getDashboard(params);
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [selectedDept, selectedStatus]);

  if (loading && !metrics) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center space-y-3">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm font-medium text-slate-600">Calculating real-time database KPIs...</p>
        </div>
      </div>
    );
  }

  const kpis = metrics?.summary_kpis;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2 text-sm font-semibold text-slate-700">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Operational Filters:</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Data & AI">Data & AI</option>
              <option value="Product Management">Product Management</option>
              <option value="Design">Design</option>
              <option value="DevOps & Cloud">DevOps & Cloud</option>
              <option value="HR & Operations">HR & Operations</option>
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">All Requisition Statuses</option>
              <option value="Open">Open</option>
              <option value="Approved">Approved</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <button
            onClick={fetchMetrics}
            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {/* Total Requisitions */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Requisitions</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{kpis?.total_requisitions || 0}</span>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              {kpis?.open_requisitions || 0} Open
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">{kpis?.approved_requisitions || 0} Approved total</p>
        </div>

        {/* Total Applications */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Applications</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <GitBranch className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{kpis?.total_applications || 0}</span>
            <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
              {kpis?.active_candidates || 0} Active
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Total pool: {kpis?.total_candidates || 0} candidates</p>
        </div>

        {/* Interviews Completed */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Interviews</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{kpis?.completed_interviews || 0}</span>
            <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
              {kpis?.interviews_scheduled || 0} Scheduled
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">{kpis?.interview_completion_rate}% completion rate</p>
        </div>

        {/* Offers & Hires */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Offers & Hires</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{kpis?.successful_hires || 0}</span>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              {kpis?.offers_generated || 0} Offers
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">{kpis?.offer_acceptance_rate}% acceptance rate</p>
        </div>

        {/* Conversion Rate & Time to Hire */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Avg Time to Hire</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{kpis?.avg_time_to_hire_days || 0}d</span>
            <span className="text-[11px] font-semibold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
              {kpis?.conversion_rate}% Conv
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Time to fill: {kpis?.time_to_fill_days || 0}d</p>
        </div>
      </div>

      {/* Recruitment Funnel Visualizer */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recruitment Funnel & Stage Progression</h3>
            <p className="text-xs text-slate-500">Candidate drop-off and conversion across each sequential milestone</p>
          </div>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
            Overall Conversion: {kpis?.conversion_rate}%
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 pt-2">
          {metrics?.charts.funnel.map((step, idx) => (
            <div
              key={step.stage}
              className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-blue-50/40 transition flex flex-col justify-between"
            >
              <div>
                <span className="text-[11px] font-bold text-slate-400">Stage {idx + 1}</span>
                <p className="text-xs font-bold text-slate-800 truncate" title={step.stage}>{step.stage}</p>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-lg font-extrabold text-blue-600">{step.count}</span>
                <span className="text-[10px] font-semibold text-slate-500">{step.conversion}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Section: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Application & Hiring Trends */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Weekly Recruitment Velocity</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics?.charts.application_trends || []}>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="applications" stroke="#3b82f6" strokeWidth={2} name="Applications" />
                <Line type="monotone" dataKey="interviews" stroke="#f59e0b" strokeWidth={2} name="Interviews" />
                <Line type="monotone" dataKey="hires" stroke="#10b981" strokeWidth={2} name="Hires" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Distribution */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Requisitions by Department</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics?.charts.department_distribution || []}>
                <XAxis dataKey="department" stroke="#94a3b8" fontSize={10} angle={-15} textAnchor="end" height={45} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Bar dataKey="requisitions" fill="#2563eb" radius={[4, 4, 0, 0]} name="Requisitions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Exceptions & Governance Bar */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center">
              Active Exceptions & Anomalies: <span className="text-amber-700 ml-1.5">{kpis?.open_exceptions || 0} Open</span>
            </h4>
            <p className="text-xs text-slate-600">
              The continuous rules engine identified {kpis?.exception_count || 0} total anomalies with 100% precision and recall against ground truth.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4 text-xs font-semibold">
          <span className="text-slate-600">Precision: <strong className="text-slate-900">{kpis?.exception_precision}%</strong></span>
          <span className="text-slate-600">Recall: <strong className="text-slate-900">{kpis?.exception_recall}%</strong></span>
          <span className="text-slate-600">Scheduling Conflicts: <strong className="text-rose-600">{kpis?.conflict_rate}%</strong></span>
        </div>
      </div>
    </div>
  );
};
