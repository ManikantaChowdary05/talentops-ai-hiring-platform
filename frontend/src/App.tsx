import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { RequisitionModule } from './components/RequisitionModule';
import { CandidateModule } from './components/CandidateModule';
import { ApplicationPipeline } from './components/ApplicationPipeline';
import { InterviewCalendarModule } from './components/InterviewCalendarModule';
import { EvaluationsModule } from './components/EvaluationsModule';
import { OffersModule } from './components/OffersModule';
import { ApprovalsModule } from './components/ApprovalsModule';
import { ExceptionsModule } from './components/ExceptionsModule';
import { AnalyticsModule } from './components/AnalyticsModule';
import { AuditLogsModule } from './components/AuditLogsModule';
import { SettingsModule } from './components/SettingsModule';
import { AICopilotModal } from './components/AICopilotModal';
import { api } from './api/client';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState('overview');
  const [activeRole, setActiveRole] = useState('System Administrator');
  const [activeUser, setActiveUser] = useState('admin');
  const [exceptionCount, setExceptionCount] = useState(5);
  const [showCopilot, setShowCopilot] = useState(false);

  // Validation Report Modal
  const [isValidating, setIsValidating] = useState(false);
  const [validationModal, setValidationModal] = useState<any>(null);

  useEffect(() => {
    // Initial login as admin
    api.login('admin', 'DemoPassword123!').catch((e) => console.log('Auth note:', e));

    // Fetch exception count
    api.getExceptions({ resolution_status: 'Open' })
      .then((data) => setExceptionCount(data.length))
      .catch((e) => console.log('Exception count note:', e));
  }, []);

  const handleRoleChange = async (role: string, username: string) => {
    setActiveRole(role);
    setActiveUser(username);
    try {
      const res = await api.login(username, 'DemoPassword123!');
      api.setToken(res.access_token);
    } catch (e) {
      console.log('Role switch note:', e);
    }
  };

  const handleRunValidation = async () => {
    setIsValidating(true);
    try {
      const report = await api.getValidationReport();
      setValidationModal(report);
    } catch (err: any) {
      alert(`Validation error: ${err.message}`);
    } finally {
      setIsValidating(false);
    }
  };

  const renderActiveModule = () => {
    switch (currentTab) {
      case 'overview':
        return <ExecutiveDashboard />;
      case 'requisitions':
        return <RequisitionModule />;
      case 'candidates':
        return <CandidateModule />;
      case 'applications':
        return <ApplicationPipeline />;
      case 'calendar':
        return <InterviewCalendarModule />;
      case 'evaluations':
        return <EvaluationsModule />;
      case 'offers':
        return <OffersModule />;
      case 'approvals':
        return <ApprovalsModule />;
      case 'exceptions':
        return <ExceptionsModule />;
      case 'analytics':
        return <AnalyticsModule />;
      case 'audit':
        return <AuditLogsModule />;
      case 'settings':
        return <SettingsModule />;
      default:
        return <ExecutiveDashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        exceptionCount={exceptionCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          currentTab={currentTab}
          activeRole={activeRole}
          activeUser={activeUser}
          onRoleChange={handleRoleChange}
          onOpenCopilot={() => setShowCopilot(true)}
          onRunValidation={handleRunValidation}
          isValidating={isValidating}
        />

        {/* Scrollable View Content */}
        <main className="flex-1 overflow-y-auto">
          {renderActiveModule()}
        </main>
      </div>

      {/* AI Copilot Drawer */}
      <AICopilotModal
        isOpen={showCopilot}
        onClose={() => setShowCopilot(false)}
        onNavigateTab={(tab) => setCurrentTab(tab)}
      />

      {/* Automated 12-Point Validation Summary Dialog */}
      {validationModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>12-Check Automated Data Quality & Rules Integrity Report</span>
                </h3>
                <p className="text-xs text-slate-500">Live operational verification against relational schema and business constraints</p>
              </div>
              <button onClick={() => setValidationModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 font-semibold block">Overall Integrity Score</span>
                <span className="text-2xl font-black text-slate-900">{validationModal.overall_integrity_score}%</span>
              </div>
              <div className="text-right text-slate-600 space-y-0.5">
                <p>Total Checks: <strong>{validationModal.total_checks}</strong></p>
                <p className="text-emerald-700">Passed: <strong>{validationModal.passed_checks}</strong></p>
                <p className="text-amber-700">Labelled Anomalies Flagged: <strong>{validationModal.anomalies_flagged}</strong></p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <span className="font-bold text-slate-800 block">Check Details:</span>
              <div className="space-y-2">
                {validationModal.checks.map((c: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-lg border bg-white flex items-start justify-between gap-3">
                    <div>
                      <strong className="block font-bold text-slate-900">{c.check_name}</strong>
                      <p className="text-[11px] text-slate-500 mt-0.5">{c.details}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      c.status === 'PASS'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t">
              <button
                onClick={() => setValidationModal(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
