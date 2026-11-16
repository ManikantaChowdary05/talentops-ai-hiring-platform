import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Sparkles,
  Award,
  GraduationCap,
  Briefcase,
  MapPin,
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus
} from 'lucide-react';
import { api } from '../api/client';
import { Candidate, Requisition } from '../types';

export const CandidateModule: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [minExp, setMinExp] = useState<number | undefined>(undefined);

  // Profile View
  const [selectedCand, setSelectedCand] = useState<Candidate | null>(null);

  // AI Fit Modal
  const [showAiFitModal, setShowAiFitModal] = useState(false);
  const [fitTargetCand, setFitTargetCand] = useState<Candidate | null>(null);
  const [fitTargetReqId, setFitTargetReqId] = useState<string>('');
  const [aiFitResult, setAiFitResult] = useState<any>(null);
  const [analyzingFit, setAnalyzingFit] = useState(false);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (minExp !== undefined) params.min_experience = String(minExp);
      const data = await api.getCandidates(params);
      setCandidates(data);

      const reqs = await api.getRequisitions({ status: 'Open' });
      setRequisitions(reqs);
      if (reqs.length > 0 && !fitTargetReqId) {
        setFitTargetReqId(reqs[0].requisition_id);
      }
    } catch (err) {
      console.error('Failed to load candidates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [search, minExp]);

  const handleOpenAiFit = async (cand: Candidate) => {
    setFitTargetCand(cand);
    setShowAiFitModal(true);
    setAiFitResult(null);

    if (requisitions.length > 0) {
      const reqId = fitTargetReqId || requisitions[0].requisition_id;
      setAnalyzingFit(true);
      try {
        const result = await api.getAiCandidateFit(cand.candidate_id, reqId);
        setAiFitResult(result);
      } catch (err) {
        console.error('AI Fit calculation error:', err);
      } finally {
        setAnalyzingFit(false);
      }
    }
  };

  const handleReqChangeForFit = async (newReqId: string) => {
    setFitTargetReqId(newReqId);
    if (fitTargetCand) {
      setAnalyzingFit(true);
      try {
        const result = await api.getAiCandidateFit(fitTargetCand.candidate_id, newReqId);
        setAiFitResult(result);
      } catch (err) {
        console.error('AI Fit recalculation error:', err);
      } finally {
        setAnalyzingFit(false);
      }
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Candidate Management & AI Suitability</h2>
        <p className="text-xs text-slate-500">Search synthetic candidate profiles, evaluate skill evidence, and generate explainable fit scores</p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2 flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by candidate name, skill, email, or CAND-XXXXXX..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={minExp === undefined ? 'All' : String(minExp)}
            onChange={(e) => setMinExp(e.target.value === 'All' ? undefined : Number(e.target.value))}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-medium text-slate-700 focus:outline-none"
          >
            <option value="All">All Experience Levels</option>
            <option value="2">2+ Years Experience</option>
            <option value="5">5+ Years Experience</option>
            <option value="8">8+ Years Experience</option>
          </select>
        </div>
      </div>

      {/* Candidates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-slate-400 text-xs">Loading candidate profiles...</div>
        ) : candidates.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-slate-400 text-xs">No candidates matching search criteria.</div>
        ) : (
          candidates.map((cand) => (
            <div
              key={cand.candidate_id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[10px] text-blue-600 font-bold">{cand.candidate_id}</span>
                    <h3 className="text-sm font-bold text-slate-900">{cand.full_name}</h3>
                    <p className="text-xs text-slate-500">{cand.current_role || 'Software Specialist'}</p>
                  </div>
                  <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    {cand.experience_years} yrs
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center space-x-1.5 text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{cand.location}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-[11px] truncate">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{cand.education}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-[11px]">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                    <span>Expected: ${cand.expected_salary.toLocaleString()}</span>
                  </div>
                </div>

                {/* Skills Preview */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {cand.candidate_skills && cand.candidate_skills.length > 0 ? (
                    cand.candidate_skills.slice(0, 4).map((s, idx) => (
                      <span key={idx} className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded font-medium">
                        {s.skill_name} (Lvl {s.proficiency_level})
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-400">Technical competency profile</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setSelectedCand(cand)}
                  className="text-xs text-slate-700 hover:text-slate-900 font-semibold"
                >
                  View Details
                </button>
                <button
                  onClick={() => handleOpenAiFit(cand)}
                  className="flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-xs font-semibold shadow-sm hover:from-blue-700 hover:to-indigo-700 transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Fit Match</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Candidate Details Drawer / Modal */}
      {selectedCand && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="font-mono text-xs text-blue-600 font-bold">{selectedCand.candidate_id}</span>
                <h3 className="text-lg font-bold text-slate-900">{selectedCand.full_name}</h3>
              </div>
              <button onClick={() => setSelectedCand(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-semibold">Email:</span>
                <p className="font-bold text-slate-800">{selectedCand.email}</p>
              </div>
              <div>
                <span className="text-slate-400 font-semibold">Phone:</span>
                <p className="font-bold text-slate-800">{selectedCand.phone || 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-400 font-semibold">Current Role & Company:</span>
                <p className="font-bold text-slate-800">{selectedCand.current_role} at {selectedCand.current_company}</p>
              </div>
              <div>
                <span className="text-slate-400 font-semibold">Expected Salary:</span>
                <p className="font-bold text-slate-800">${selectedCand.expected_salary.toLocaleString()}</p>
              </div>
            </div>

            {/* Complete Skills Table */}
            <div className="space-y-2 pt-2 border-t">
              <h4 className="text-xs font-bold text-slate-800">Verified Technical Skills:</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {selectedCand.candidate_skills.map((s, idx) => (
                  <div key={idx} className="p-2 rounded bg-slate-50 border border-slate-200 flex justify-between items-center">
                    <span className="font-bold text-slate-800">{s.skill_name}</span>
                    <span className="text-[11px] text-blue-600 font-semibold">
                      Lvl {s.proficiency_level}/5 • {s.experience_years}y
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t">
              <button
                onClick={() => setSelectedCand(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Fit Match Modal */}
      {showAiFitModal && fitTargetCand && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">AI Candidate-Job Suitability Analysis</h3>
                  <p className="text-xs text-slate-500">Explainable Decision Intelligence for {fitTargetCand.full_name}</p>
                </div>
              </div>
              <button onClick={() => setShowAiFitModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Requisition Selector */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs">
              <span className="font-bold text-slate-700 shrink-0">Target Requisition:</span>
              <select
                value={fitTargetReqId}
                onChange={(e) => handleReqChangeForFit(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-1.5 font-semibold text-slate-800"
              >
                {requisitions.map((r) => (
                  <option key={r.requisition_id} value={r.requisition_id}>
                    {r.requisition_id} — {r.job_title} ({r.department})
                  </option>
                ))}
              </select>
            </div>

            {analyzingFit ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-7 h-7 text-blue-600 animate-spin" />
                <p className="text-xs font-semibold text-slate-600">Analyzing skill proficiencies and experience fit...</p>
              </div>
            ) : aiFitResult ? (
              <div className="space-y-4">
                {/* Score & Tier Header */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">AI Suitability Score</span>
                    <div className="flex items-baseline space-x-2 mt-1">
                      <span className="text-3xl font-extrabold text-slate-900">{aiFitResult.fit_score}%</span>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        aiFitResult.fit_score >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {aiFitResult.fit_tier}
                      </span>
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-slate-500">
                    Engine: <strong className="text-slate-800">{aiFitResult.model_engine}</strong>
                  </div>
                </div>

                {/* Evidence: Matched Skills vs Missing Skills */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/50 space-y-2">
                    <span className="font-bold text-emerald-800 flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Matched Competencies ({aiFitResult.matched_skills.length})</span>
                    </span>
                    <ul className="space-y-1 text-[11px] text-slate-700">
                      {aiFitResult.matched_skills.map((m: any, idx: number) => (
                        <li key={idx} className="flex justify-between">
                          <span>{m.skill}</span>
                          <span className="font-semibold text-emerald-700">Lvl {m.candidate_level}/{m.required_level}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 space-y-2">
                    <span className="font-bold text-amber-800 flex items-center space-x-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Skill Gaps ({aiFitResult.missing_skills.length})</span>
                    </span>
                    <ul className="space-y-1 text-[11px] text-slate-700">
                      {aiFitResult.missing_skills.length === 0 ? (
                        <li className="text-slate-400 italic">No missing mandatory skills!</li>
                      ) : (
                        aiFitResult.missing_skills.map((m: any, idx: number) => (
                          <li key={idx} className="flex justify-between">
                            <span>{m.skill}</span>
                            <span className="font-semibold text-amber-700">{m.status}</span>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                </div>

                {/* Strengths & Recommendation */}
                <div className="space-y-2 text-xs">
                  <h4 className="font-bold text-slate-900">Explainable Evaluation:</h4>
                  <ul className="space-y-1 list-disc list-inside text-slate-600 text-[11px]">
                    {aiFitResult.strengths.map((s: string, idx: number) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                  <p className="p-2.5 rounded-lg bg-slate-50 border text-slate-700 text-xs font-medium">
                    {aiFitResult.recommendation}
                  </p>
                </div>

                {/* Suggested Interview Questions */}
                <div className="space-y-2 text-xs pt-2 border-t">
                  <h4 className="font-bold text-slate-900 flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>AI-Generated Targeted Interview Questions:</span>
                  </h4>
                  <div className="space-y-1.5">
                    {aiFitResult.suggested_interview_questions.map((q: string, idx: number) => (
                      <div key={idx} className="p-2 rounded-lg bg-blue-50/40 border border-blue-100 text-[11px] text-slate-800">
                        <strong>Q{idx + 1}:</strong> {q}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="flex justify-end pt-3 border-t">
              <button
                onClick={() => setShowAiFitModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
