import React from 'react';
import { Sparkles, Shield, UserCircle2, RefreshCw, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  activeRole: string;
  activeUser: string;
  onRoleChange: (role: string, username: string) => void;
  onOpenCopilot: () => void;
  onRunValidation: () => void;
  isValidating: boolean;
}

const ROLES = [
  { role: 'System Administrator', username: 'admin', label: 'Admin (Full Access)' },
  { role: 'HR Partner', username: 'hr_lead', label: 'HR Partner (Sarah Jenkins)' },
  { role: 'Hiring Manager', username: 'mgr_engineering', label: 'Hiring Manager (Elena Rostova)' },
  { role: 'Interviewer', username: 'interviewer_tech1', label: 'Interviewer (Alex Thorne)' },
  { role: 'IT / Operations Partner', username: 'ops_lead', label: 'IT/Ops Lead (Jordan Reed)' },
  { role: 'Employee / Candidate', username: 'cand_user', label: 'Candidate (Self-Service)' },
];

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  activeRole,
  activeUser,
  onRoleChange,
  onOpenCopilot,
  onRunValidation,
  isValidating,
}) => {
  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'overview': return 'Executive Recruitment Dashboard';
      case 'requisitions': return 'Requisition Management & Approvals';
      case 'candidates': return 'Candidate Profiles & AI Suitability';
      case 'applications': return 'Application Lifecycle Pipeline';
      case 'calendar': return 'Interview Calendar & Scheduling Conflicts';
      case 'evaluations': return 'Structured Scorecards & Reviewer Consensus';
      case 'offers': return 'Offer Generation & Compensation Bands';
      case 'approvals': return 'Multi-Level Approval Queue';
      case 'exceptions': return 'Operational Exception Monitoring Center';
      case 'analytics': return 'Recruitment Performance & Decision Intelligence';
      case 'audit': return 'Immutable Audit Trail & Traceability';
      case 'settings': return 'System Settings & Configurable Rules';
      default: return 'TalentFlow 360';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Title & Context */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">{getTabTitle(currentTab)}</h2>
        <p className="text-xs text-slate-500">Intelligent Recruitment Operations & Decision Intelligence Platform</p>
      </div>

      {/* Actions & Role Switcher */}
      <div className="flex items-center space-x-3">
        {/* Data Quality Check Button */}
        <button
          onClick={onRunValidation}
          disabled={isValidating}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          title="Run 12 automated data quality & rule validation checks"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isValidating ? 'animate-spin' : ''}`} />
          <span>{isValidating ? 'Validating...' : 'Validate Integrity'}</span>
        </button>

        {/* AI Copilot Trigger */}
        <button
          onClick={onOpenCopilot}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold shadow-sm hover:from-blue-700 hover:to-indigo-700 transition"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-200" />
          <span>AI Decision Copilot</span>
        </button>

        {/* Role Selector (Demo Persona Switcher) */}
        <div className="flex items-center space-x-2 pl-3 border-l border-slate-200">
          <Shield className="w-4 h-4 text-slate-400" />
          <div className="text-left">
            <label className="block text-[10px] uppercase font-bold text-slate-400">Persona Role</label>
            <select
              value={activeRole}
              onChange={(e) => {
                const found = ROLES.find((r) => r.role === e.target.value);
                if (found) {
                  onRoleChange(found.role, found.username);
                }
              }}
              className="text-xs font-semibold text-slate-800 bg-transparent border-none p-0 focus:ring-0 cursor-pointer"
            >
              {ROLES.map((r) => (
                <option key={r.role} value={r.role}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
