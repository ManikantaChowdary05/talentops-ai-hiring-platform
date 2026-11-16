import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Percent,
  Clock,
  CheckCircle,
  AlertTriangle,
  Scale,
  RefreshCw,
  Info
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

export const AnalyticsModule: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const data = await api.getDashboard();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load analytics metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading && !metrics) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[500px]">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const kpis = metrics?.summary_kpis;

  const kpiDefinitions = [
    {
      title: 'Hiring Conversion Rate',
      value: `${kpis?.conversion_rate}%`,
      formula: '(Total Hired Candidates / Total Applications) × 100',
      description: 'Measures overall pipeline efficiency from initial application to final hire.'
    },
    {
      title: 'Application-to-Interview Rate',
      value: `${kpis?.app_to_interview_rate}%`,
      formula: '(Total Scheduled Interviews / Total Applications) × 100',
      description: 'Measures screening quality and top-of-funnel interview qualification.'
    },
    {
      title: 'Interview Completion Rate',
      value: `${kpis?.interview_completion_rate}%`,
      formula: '(Completed Interviews / Total Scheduled Interviews) × 100',
      description: 'Execution consistency across interview calendar and panels.'
    },
    {
      title: 'Scorecard Completion Rate',
      value: `${kpis?.scorecard_completion_rate}%`,
      formula: '(Submitted 5-Pillar Scorecards / Expected Panel Scorecards) × 100',
      description: 'Evaluator rigor and structured scorecard adherence.'
    },
    {
      title: 'Offer Acceptance Rate',
      value: `${kpis?.offer_acceptance_rate}%`,
      formula: '(Accepted Offers / Total Extended Offers) × 100',
      description: 'Competitiveness of compensation packages and employer brand.'
    },
    {
      title: 'Average Time to Hire',
      value: `${kpis?.avg_time_to_hire_days} days`,
      formula: 'Average of (Hired Date - Application Date) across hired cohort',
      description: 'Recruitment operational cycle velocity.'
    },
    {
      title: 'Time to Fill',
      value: `${kpis?.time_to_fill_days} days`,
      formula: 'Average of (Hired Date - Requisition Creation Date)',
      description: 'Total requisition fulfillment turnaround duration.'
    },
    {
      title: 'Scheduling Conflict Rate',
      value: `${kpis?.conflict_rate}%`,
      formula: '(Detected Conflicts / Total Interview Bookings) × 100',
      description: 'Anti-double booking enforcement efficacy (Rule R006).'
    },
    {
      title: 'Offer Band Exception Rate',
      value: `${kpis?.offer_exception_rate}%`,
      formula: '(Offers Exceeding Salary Band / Total Generated Offers) × 100',
      description: 'Compensation governance and Level 2 approval escalation frequency.'
    },
    {
      title: 'Exception Detection Precision',
      value: `${kpis?.exception_precision}%`,
      formula: 'True Positive Anomalies / (True Positives + False Positives)',
      description: 'Accuracy of automated continuous anomaly detection.'
    },
    {
      title: 'Exception Detection Recall',
      value: `${kpis?.exception_recall}%`,
      formula: 'True Positive Anomalies / (True Positives + False Negatives)',
      description: 'Coverage of injected ground-truth anomalies identified.'
    }
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Recruitment Analytics & Decision Intelligence</h2>
        <p className="text-xs text-slate-500">
          Transparent mathematical derivations, operational KPIs, and pipeline velocity from live database records
        </p>
      </div>

      {/* KPI Cards Grid with Formulas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiDefinitions.map((item, idx) => (
          <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-start justify-between">
              <span className="text-xs font-bold text-slate-700">{item.title}</span>
              <span className="text-xl font-extrabold text-blue-600">{item.value}</span>
            </div>
            <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-700">
              <span className="text-slate-400 block text-[9px] uppercase font-bold">Calculation Formula:</span>
              {item.formula}
            </div>
            <p className="text-xs text-slate-500">{item.description}</p>
          </div>
        ))}
      </div>

      {/* Requisition Status Distribution Chart */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Requisition Lifecycle Status Distribution</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metrics?.charts.status_distribution || []}>
              <XAxis dataKey="status" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Requisitions" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
