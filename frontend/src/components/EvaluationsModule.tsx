import React, { useState, useEffect } from 'react';
import {
  Award,
  Plus,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  User,
  X,
  FileCheck,
  Scale
} from 'lucide-react';
import { api } from '../api/client';
import { Scorecard, Interview } from '../types';

export const EvaluationsModule: React.FC = () => {
  const [scorecards, setScorecards] = useState<Scorecard[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  // New Scorecard Modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedInterviewId, setSelectedInterviewId] = useState('');
  const [techScore, setTechScore] = useState(4);
  const [probScore, setProbScore] = useState(4);
  const [commScore, setCommScore] = useState(4);
  const [roleScore, setRoleScore] = useState(4);
  const [collabScore, setCollabScore] = useState(4);
  const [comments, setComments] = useState('');
  const [includeIrrelevant, setIncludeIrrelevant] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // AI Consensus Modal
  const [showConsensusModal, setShowConsensusModal] = useState(false);
  const [consensusData, setConsensusData] = useState<any>(null);
  const [loadingConsensus, setLoadingConsensus] = useState(false);

  const fetchScorecards = async () => {
    setLoading(true);
    try {
      const data = await api.getScorecards();
      setScorecards(data);

      const intData = await api.getInterviews();
      setInterviews(intData);
      if (intData.length > 0 && !selectedInterviewId) {
        setSelectedInterviewId(intData[0].interview_id);
      }
    } catch (err) {
      console.error('Failed to load scorecards:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScorecards();
  }, []);

  // Live Weighted Calculation
  // SUM(score * weight)/5 * 100
  const liveWeightedScore = (
    (techScore * 0.30 + probScore * 0.25 + commScore * 0.15 + roleScore * 0.20 + collabScore * 0.10) / 5.0
  ) * 100;

  const liveRecommendation =
    liveWeightedScore >= 80.0
      ? 'Strong Recommendation'
      : liveWeightedScore >= 65.0
      ? 'Further Review'
      : 'Does Not Meet Evaluation Threshold';

  const handleSubmitScorecard = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitting(true);

    try {
      const payload: any = {
        interview_id: selectedInterviewId,
        reviewer_id: 'USR-000007', // Interviewer Alex Thorne
        technical_knowledge: Number(techScore),
        problem_solving: Number(probScore),
        communication: Number(commScore),
        role_specific_skills: Number(roleScore),
        collaboration: Number(collabScore),
        feedback_comments: comments || 'Standard evaluation notes'
      };

      if (includeIrrelevant) {
        // Trigger Rule R008 violation for testing
        payload.extra_criteria = {
          candidate_social_background: 'Extraneous criteria outside standard rubric'
        };
      }

      await api.submitScorecard(payload);
      setShowSubmitModal(false);
      setComments('');
      setIncludeIrrelevant(false);
      fetchScorecards();
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit scorecard');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenConsensus = async (intId: string) => {
    setShowConsensusModal(true);
    setLoadingConsensus(true);
    try {
      const summary = await api.getScorecardSummary(intId);
      setConsensusData(summary);
    } catch (err) {
      console.error('Failed to load evaluation summary:', err);
    } finally {
      setLoadingConsensus(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Structured Evaluations & Scorecards</h2>
          <p className="text-xs text-slate-500">
            5-pillar weighted evaluation rubric, reviewer disagreement detection, and AI committee consensus
          </p>
        </div>
        <button
          onClick={() => {
            setShowSubmitModal(true);
            setSubmitError('');
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Submit Scorecard</span>
        </button>
      </div>

      {/* Rubric Weights Info Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
        <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-100">
          <span className="font-bold text-blue-900 block">Technical Knowledge</span>
          <span className="text-blue-700 font-extrabold text-sm">30% Weight</span>
        </div>
        <div className="p-2.5 rounded-lg bg-indigo-50/60 border border-indigo-100">
          <span className="font-bold text-indigo-900 block">Problem Solving</span>
          <span className="text-indigo-700 font-extrabold text-sm">25% Weight</span>
        </div>
        <div className="p-2.5 rounded-lg bg-purple-50/60 border border-purple-100">
          <span className="font-bold text-purple-900 block">Role-Specific Skills</span>
          <span className="text-purple-700 font-extrabold text-sm">20% Weight</span>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
          <span className="font-bold text-slate-800 block">Communication</span>
          <span className="text-slate-700 font-extrabold text-sm">15% Weight</span>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
          <span className="font-bold text-slate-800 block">Collaboration</span>
          <span className="text-slate-700 font-extrabold text-sm">10% Weight</span>
        </div>
      </div>

      {/* Scorecards Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b">
              <tr>
                <th className="px-5 py-3.5">Scorecard ID</th>
                <th className="px-5 py-3.5">Interview Session</th>
                <th className="px-5 py-3.5">Reviewer</th>
                <th className="px-5 py-3.5">5-Pillar Breakdown</th>
                <th className="px-5 py-3.5">Weighted Score</th>
                <th className="px-5 py-3.5">Recommendation</th>
                <th className="px-5 py-3.5 text-right">Consensus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">Loading evaluation scorecards...</td>
                </tr>
              ) : scorecards.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">No scorecards found.</td>
                </tr>
              ) : (
                scorecards.map((sc) => (
                  <tr key={sc.scorecard_id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-900">{sc.scorecard_id}</td>
                    <td className="px-5 py-3.5 font-mono font-semibold text-blue-600">{sc.interview_id}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">{sc.reviewer_name || sc.reviewer_id}</td>
                    <td className="px-5 py-3.5 text-[11px] text-slate-600 space-x-1.5 font-mono">
                      <span>T:{sc.technical_knowledge}</span>
                      <span>P:{sc.problem_solving}</span>
                      <span>C:{sc.communication}</span>
                      <span>R:{sc.role_specific_skills}</span>
                      <span>Co:{sc.collaboration}</span>
                    </td>
                    <td className="px-5 py-3.5 font-extrabold text-slate-900 text-sm">
                      {sc.weighted_score.toFixed(1)}%
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        sc.recommendation === 'Strong Recommendation'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : sc.recommendation === 'Further Review'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {sc.recommendation}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleOpenConsensus(sc.interview_id)}
                        className="flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded ml-auto transition"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>AI Synthesis</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Consensus Synthesis Modal */}
      {showConsensusModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">AI Committee Consensus & Synthesis</h3>
              </div>
              <button onClick={() => setShowConsensusModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingConsensus ? (
              <p className="text-xs text-slate-400 text-center py-8">Synthesizing multi-reviewer scorecards...</p>
            ) : consensusData ? (
              <div className="space-y-4 text-xs">
                <div className="p-3 rounded-lg bg-indigo-50/70 border border-indigo-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-indigo-800">Consensus Recommendation</span>
                    <h4 className="text-sm font-extrabold text-indigo-950">{consensusData.consensus_recommendation}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 font-semibold block">Average Score</span>
                    <span className="text-xl font-black text-indigo-700">{consensusData.average_score}%</span>
                  </div>
                </div>

                {consensusData.disagreement_detected && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 flex items-start space-x-2 text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                    <div>
                      <strong className="block font-bold">Reviewer Disagreement Flagged:</strong>
                      <span>A score divergence of {consensusData.variance} points was detected across panel reviewers.</span>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <h5 className="font-bold text-slate-900">Executive Summary:</h5>
                  <p className="p-3 rounded-lg bg-slate-50 border text-slate-700 leading-relaxed text-xs">
                    {consensusData.summary}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <h5 className="font-bold text-slate-900">Key Panel Takeaways:</h5>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
                    {consensusData.key_takeaways.map((t: string, idx: number) => (
                      <li key={idx}>{t}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}

            <div className="flex justify-end pt-3 border-t">
              <button
                onClick={() => setShowConsensusModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Scorecard Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSubmitScorecard} className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Submit Structured Scorecard</h3>
              <button type="button" onClick={() => setShowSubmitModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitError && (
              <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Interview Session *</label>
                <select
                  value={selectedInterviewId}
                  onChange={(e) => setSelectedInterviewId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono font-semibold"
                >
                  {interviews.map((it) => (
                    <option key={it.interview_id} value={it.interview_id}>
                      {it.interview_id} — {it.candidate_name || 'Candidate'} ({it.job_title})
                    </option>
                  ))}
                </select>
              </div>

              {/* 5-Pillar Score Sliders (1 to 5) */}
              <div className="space-y-3 bg-slate-50 p-3 rounded-lg border">
                <span className="font-bold text-slate-800 block text-xs">Criterion Ratings (1 to 5 scale):</span>

                <div>
                  <div className="flex justify-between font-semibold">
                    <span>Technical Knowledge (30%):</span>
                    <span className="text-blue-600 font-bold">{techScore}/5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.5"
                    value={techScore}
                    onChange={(e) => setTechScore(Number(e.target.value))}
                    className="w-full cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-semibold">
                    <span>Problem Solving (25%):</span>
                    <span className="text-indigo-600 font-bold">{probScore}/5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.5"
                    value={probScore}
                    onChange={(e) => setProbScore(Number(e.target.value))}
                    className="w-full cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-semibold">
                    <span>Role-Specific Skills (20%):</span>
                    <span className="text-purple-600 font-bold">{roleScore}/5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.5"
                    value={roleScore}
                    onChange={(e) => setRoleScore(Number(e.target.value))}
                    className="w-full cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-semibold">
                    <span>Communication (15%):</span>
                    <span className="text-slate-800 font-bold">{commScore}/5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.5"
                    value={commScore}
                    onChange={(e) => setCommScore(Number(e.target.value))}
                    className="w-full cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-semibold">
                    <span>Collaboration (10%):</span>
                    <span className="text-slate-800 font-bold">{collabScore}/5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.5"
                    value={collabScore}
                    onChange={(e) => setCollabScore(Number(e.target.value))}
                    className="w-full cursor-pointer"
                  />
                </div>
              </div>

              {/* Real-time Weighted Score Preview */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                <div>
                  <span className="font-bold text-blue-900 block">Weighted Result (SUM / 5 * 100):</span>
                  <span className="text-xs text-blue-700 font-medium">{liveRecommendation}</span>
                </div>
                <span className="text-2xl font-black text-blue-800">{liveWeightedScore.toFixed(1)}%</span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Qualitative Feedback *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Detailed observations on technical depth, problem decomposition, and role competency..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                />
              </div>

              {/* R008 Irrelevant Criteria Injection for Testing */}
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-amber-900 block text-xs">Test Mode: Inject Irrelevant Criteria</span>
                  <p className="text-[10px] text-amber-700">Tests Rule R008 anti-bias validation blocking.</p>
                </div>
                <input
                  type="checkbox"
                  checked={includeIrrelevant}
                  onChange={(e) => setIncludeIrrelevant(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Evaluation'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
