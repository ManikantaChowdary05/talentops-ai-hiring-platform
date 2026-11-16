import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Database,
  RefreshCw,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Save,
  Download,
  ShieldAlert
} from 'lucide-react';
import { api } from '../api/client';

export const SettingsModule: React.FC = () => {
  const [config, setConfig] = useState<any>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genSummary, setGenSummary] = useState<any>(null);

  // Form thresholds
  const [strongRecMin, setStrongRecMin] = useState(80.0);
  const [furtherReviewMin, setFurtherReviewMin] = useState(65.0);
  const [savingConfig, setSavingConfig] = useState(false);

  const fetchConfig = async () => {
    setLoadingConfig(true);
    try {
      const data = await api.getRulesConfig();
      setConfig(data);
      if (data.EVAL_STRONG_RECOMMENDATION_MIN) setStrongRecMin(data.EVAL_STRONG_RECOMMENDATION_MIN);
      if (data.EVAL_FURTHER_REVIEW_MIN) setFurtherReviewMin(data.EVAL_FURTHER_REVIEW_MIN);
    } catch (err) {
      console.error('Failed to load rules configuration:', err);
    } finally {
      setLoadingConfig(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSaveThresholds = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      await api.updateRulesConfig({
        EVAL_STRONG_RECOMMENDATION_MIN: Number(strongRecMin),
        EVAL_FURTHER_REVIEW_MIN: Number(furtherReviewMin)
      });
      alert('Thresholds updated successfully in live rules engine!');
      fetchConfig();
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    } finally {
      setSavingConfig(false);
    }
  };

  const handleGenerateData = async (mode: 'starter' | 'demo' | 'full') => {
    if (!confirm(`Generate deterministic dataset in ${mode.toUpperCase()} mode? This will reseed database with seed 20261022.`)) {
      return;
    }

    setGenerating(true);
    setGenSummary(null);
    try {
      const data = await api.generateSynthetic(mode);
      setGenSummary(data);
      alert(`Successfully generated ${mode.toUpperCase()} dataset! Integrity Score: ${data.validation_score}%`);
    } catch (err: any) {
      alert(`Generation error: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">System Settings & Rules Configuration</h2>
        <p className="text-xs text-slate-500">
          Configure rules engine thresholds without code changes, trigger deterministic synthetic data generation, and inspect reports
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Rules Engine Configuration Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center space-x-2 border-b pb-3">
            <Sliders className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">Configurable Evaluation Thresholds</h3>
          </div>

          <form onSubmit={handleSaveThresholds} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Strong Recommendation Minimum Score (Currently {strongRecMin}%)
              </label>
              <input
                type="number"
                min="50"
                max="95"
                step="1"
                value={strongRecMin}
                onChange={(e) => setStrongRecMin(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-lg p-2 font-bold text-xs"
              />
              <p className="text-[11px] text-slate-400 mt-1">Scorecards ≥ this threshold yield Strong Recommendation.</p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Further Review Minimum Score (Currently {furtherReviewMin}%)
              </label>
              <input
                type="number"
                min="40"
                max="85"
                step="1"
                value={furtherReviewMin}
                onChange={(e) => setFurtherReviewMin(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-lg p-2 font-bold text-xs"
              />
              <p className="text-[11px] text-slate-400 mt-1">Scorecards below this threshold yield Does Not Meet.</p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingConfig}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs transition"
              >
                <Save className="w-4 h-4" />
                <span>{savingConfig ? 'Saving...' : 'Apply Threshold Updates'}</span>
              </button>
            </div>
          </form>

          {/* Active 5-Pillar Rubric Weights */}
          <div className="pt-4 border-t space-y-2 text-xs">
            <span className="font-bold text-slate-800">Current Standard Rubric Weights:</span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 bg-slate-50 rounded border">Technical Knowledge: <strong>30%</strong></div>
              <div className="p-2 bg-slate-50 rounded border">Problem Solving: <strong>25%</strong></div>
              <div className="p-2 bg-slate-50 rounded border">Role-Specific Skills: <strong>20%</strong></div>
              <div className="p-2 bg-slate-50 rounded border">Communication: <strong>15%</strong></div>
              <div className="p-2 bg-slate-50 rounded border col-span-2">Collaboration: <strong>10%</strong></div>
            </div>
          </div>
        </div>

        {/* Synthetic Data Generator & Determinism Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center space-x-2 border-b pb-3">
            <Database className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">Synthetic Data Generator</h3>
          </div>

          <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-lg text-xs space-y-1">
            <div className="flex justify-between items-center font-bold text-indigo-900">
              <span>Deterministic Random Seed:</span>
              <span className="font-mono bg-white px-2 py-0.5 rounded border border-indigo-200">20261022</span>
            </div>
            <p className="text-[11px] text-indigo-700">
              Generates reproducible baseline records and injects the 5 labelled anomalies for compliance testing.
            </p>
          </div>

          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-800 block">Select Generation Target:</span>

            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleGenerateData('starter')}
                disabled={generating}
                className="p-3 rounded-lg border border-slate-300 hover:border-blue-500 text-center text-xs space-y-1 hover:bg-blue-50 transition"
              >
                <strong className="block font-bold text-slate-900">Starter</strong>
                <span className="text-[10px] text-slate-500 block">10 Reqs • 250 Cand</span>
              </button>

              <button
                onClick={() => handleGenerateData('demo')}
                disabled={generating}
                className="p-3 rounded-lg border-2 border-blue-600 bg-blue-50/50 text-center text-xs space-y-1 shadow-xs"
              >
                <strong className="block font-bold text-blue-900">Demo (Target)</strong>
                <span className="text-[10px] text-blue-700 block">50 Reqs • 1,250 Cand</span>
              </button>

              <button
                onClick={() => handleGenerateData('full')}
                disabled={generating}
                className="p-3 rounded-lg border border-slate-300 hover:border-blue-500 text-center text-xs space-y-1 hover:bg-blue-50 transition"
              >
                <strong className="block font-bold text-slate-900">Full</strong>
                <span className="text-[10px] text-slate-500 block">200 Reqs • 5,000 Cand</span>
              </button>
            </div>

            {generating && (
              <div className="p-4 bg-slate-50 rounded-lg border flex items-center justify-center space-x-2 text-xs text-slate-600">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                <span>Executing synthetic generator and automated validation...</span>
              </div>
            )}

            {genSummary && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs space-y-2 text-emerald-900">
                <div className="flex items-center space-x-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Generation & 12-Check Validation Complete!</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[11px] text-emerald-800">
                  <span>Requisitions: <strong>{genSummary.counts.requisitions}</strong></span>
                  <span>Candidates: <strong>{genSummary.counts.candidates}</strong></span>
                  <span>Applications: <strong>{genSummary.counts.applications}</strong></span>
                  <span>Interviews: <strong>{genSummary.counts.interviews}</strong></span>
                  <span>Integrity Score: <strong>{genSummary.validation_score}%</strong></span>
                  <span>Ground Truth Records: <strong>{genSummary.counts.ground_truth_records}</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* Validation Reports & Ground Truth */}
          <div className="pt-4 border-t space-y-2 text-xs">
            <span className="font-bold text-slate-800 block">Exported Artifacts in `/validation`:</span>
            <div className="space-y-1 text-[11px] text-slate-600 font-mono">
              <p>• validation/ground_truth.csv (Labelled ground truth)</p>
              <p>• validation/ground_truth.json (Machine readable)</p>
              <p>• validation/validation_summary.json (12 automated checks)</p>
              <p>• validation/validation_report.md (Executive audit report)</p>
              <p>• validation/data_quality_report.csv (Tabular metrics)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
