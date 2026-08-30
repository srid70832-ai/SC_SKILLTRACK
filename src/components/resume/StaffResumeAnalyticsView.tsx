import React, { useState, useEffect } from 'react';
import { StaffResumeAnalytics } from '../../types/resume';
import { BarChart3, Users, Award, FileCheck, PieChart, ShieldAlert, RefreshCw } from 'lucide-react';

export default function StaffResumeAnalyticsView() {
  const [analytics, setAnalytics] = useState<StaffResumeAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const resp = await fetch('/api/resume/staff-analytics');
      if (resp.ok) {
        const data = await resp.json();
        setAnalytics(data.analytics);
      }
    } catch (err) {
      console.error("Failed to load staff resume analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center py-12">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
          Aggregating Cohort Resume Analytics...
        </p>
      </div>
    );
  }

  if (!analytics) return null;

  const coverageRate = analytics.totalStudents > 0 
    ? Math.round((analytics.studentsWithResumeCount / analytics.totalStudents) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Privacy Notice Banner */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/20 rounded-xl border border-blue-400/30 text-blue-400">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold font-display">
              📊 Institutional Resume & ATS Cohort Analytics
            </h2>
            <p className="text-xs text-slate-300">
              Aggregated placement readiness metrics. Student resume contents remain strictly private.
            </p>
          </div>
        </div>
        <button
          onClick={fetchAnalytics}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer shrink-0"
          title="Refresh Analytics"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Total Resumes Generated
          </span>
          <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            {analytics.totalResumesCreated}
          </span>
          <span className="text-xs text-slate-500 block mt-1 font-medium">
            Across active versions
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Average ATS Score
          </span>
          <span className="text-3xl sm:text-4xl font-extrabold text-blue-600">
            {analytics.averageAtsScore} / 100
          </span>
          <span className="text-xs text-slate-500 block mt-1 font-medium">
            Cohort readability average
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Student Adoption Rate
          </span>
          <span className="text-3xl sm:text-4xl font-extrabold text-emerald-600">
            {coverageRate}%
          </span>
          <span className="text-xs text-slate-500 block mt-1 font-medium">
            {analytics.studentsWithResumeCount} of {analytics.totalStudents} students
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Avg Job Match Estimate
          </span>
          <span className="text-3xl sm:text-4xl font-extrabold text-indigo-600">
            {analytics.averageJobMatchScore}%
          </span>
          <span className="text-xs text-slate-500 block mt-1 font-medium">
            Against posted JDs
          </span>
        </div>
      </div>

      {/* Cohort Adoption & Version Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Adoption Progress */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Departmental Placement Resume Readiness
          </h3>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Students With ATS Resume ({analytics.studentsWithResumeCount})</span>
                <span className="text-emerald-600">{coverageRate}%</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${coverageRate}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Students Pending Resume ({analytics.studentsWithoutResumeCount})</span>
                <span className="text-amber-600">{100 - coverageRate}%</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-400 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${100 - coverageRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Version Distribution */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-indigo-600" />
            Resume Role Focus Breakdown
          </h3>

          <div className="space-y-2">
            {Object.keys(analytics.versionDistribution || {}).length > 0 ? (
              Object.entries(analytics.versionDistribution).map(([version, count]) => (
                <div key={version} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold">
                  <span className="text-slate-900">{version}</span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold">
                    {count} resumes
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic">No resume versions created yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
