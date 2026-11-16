import React from 'react';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  GitBranch,
  Calendar,
  Award,
  DollarSign,
  CheckSquare,
  AlertTriangle,
  BarChart3,
  FileText,
  Sliders,
  Sparkles,
  ShieldCheck,
  Database
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  exceptionCount: number;
}

const navItems = [
  { id: 'overview', label: 'Executive Overview', icon: LayoutDashboard },
  { id: 'requisitions', label: 'Requisitions', icon: Briefcase },
  { id: 'candidates', label: 'Candidates', icon: Users },
  { id: 'applications', label: 'Application Pipeline', icon: GitBranch },
  { id: 'calendar', label: 'Interview Calendar', icon: Calendar },
  { id: 'evaluations', label: 'Evaluations & Rubrics', icon: Award },
  { id: 'offers', label: 'Offer Management', icon: DollarSign },
  { id: 'approvals', label: 'Approval Queue', icon: CheckSquare },
  { id: 'exceptions', label: 'Exceptions Center', icon: AlertTriangle, hasBadge: true },
  { id: 'analytics', label: 'Decision Intelligence', icon: BarChart3 },
  { id: 'audit', label: 'Audit & Traceability', icon: FileText },
  { id: 'settings', label: 'Settings & Rules', icon: Sliders },
];

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange, exceptionCount }) => {
  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 h-screen border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-bold text-lg">
            TF
          </div>
          <div>
            <h1 className="font-bold text-base text-white tracking-tight flex items-center">
              TalentFlow <span className="text-blue-400 ml-1">360</span>
            </h1>
            <p className="text-xs text-slate-400">Decision Intelligence</p>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Recruitment Operations
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.hasBadge && exceptionCount > 0 && (
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs px-2 py-0.5 rounded-full font-bold">
                  {exceptionCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* System Status Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-xs space-y-2">
        <div className="flex items-center justify-between text-slate-400">
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Rules Engine (R001-R011)</span>
          </span>
          <span className="text-emerald-400 font-mono text-[11px]">ACTIVE</span>
        </div>
        <div className="flex items-center justify-between text-slate-400 text-[11px]">
          <span className="flex items-center space-x-1">
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span>Seed Determinism</span>
          </span>
          <span className="font-mono text-slate-300">20261022</span>
        </div>
      </div>
    </aside>
  );
};
