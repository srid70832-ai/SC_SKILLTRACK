import React from 'react';
import { ResumeData } from '../../types/resume';
import { X, CheckCircle2, AlertTriangle, ArrowRight, BarChart2 } from 'lucide-react';

interface ResumeComparisonModalProps {
  resumes: ResumeData[];
  onClose: () => void;
  onSelectResume: (resume: ResumeData) => void;
}

export default function ResumeComparisonModal({ resumes, onClose, onSelectResume }: ResumeComparisonModalProps) {
  if (!resumes || resumes.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full p-6 space-y-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
          <div className="p-2.5 bg-blue-100 rounded-xl text-blue-600">
            <BarChart2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
              📊 Multi-Resume ATS Version Comparison
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Compare ATS Scores, keyword density, and role optimization across your saved resume versions.
            </p>
          </div>
        </div>

        {/* Resumes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resumes.map((r) => {
            const score = r.atsAnalysis?.atsScore || 0;
            const match = r.atsAnalysis?.jobMatchBreakdown?.overallMatch;

            return (
              <div 
                key={r.id} 
                className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col justify-between space-y-4 hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-extrabold text-blue-900 uppercase tracking-wider bg-blue-100 px-2 py-0.5 rounded">
                      {r.template || 'classic'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(r.updatedAt || r.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-sm mb-1">
                    {r.title || 'General Resume'}
                  </h3>

                  <div className="flex items-baseline gap-2 my-3">
                    <span className="text-3xl font-extrabold text-slate-900">
                      {score}
                    </span>
                    <span className="text-xs text-slate-500 font-bold">/ 100 ATS Score</span>
                  </div>

                  {match !== undefined && (
                    <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200 mb-2">
                      Job Match: {match}%
                    </div>
                  )}

                  <div className="space-y-1 text-xs text-slate-600">
                    <div><strong>Skills Listed:</strong> {[...(r.skills?.programmingLanguages || []), ...(r.skills?.frameworks || [])].length} items</div>
                    <div><strong>Projects:</strong> {r.projects?.length || 0} projects</div>
                    <div><strong>Certifications:</strong> {r.certifications?.length || 0} items</div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onSelectResume(r);
                    onClose();
                  }}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow"
                >
                  Load Version <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Explanation Note */}
        <div className="bg-slate-100 p-4 rounded-2xl text-xs text-slate-600 font-medium leading-relaxed">
          💡 <strong>Why do scores differ?</strong> ATS scores vary based on keyword alignment with targeted job descriptions, technical skill depth, presence of project metrics, and formatting hierarchy. Tailoring separate versions for AI/ML, Web Engineering, and Data Analysis helps maximize callback rates.
        </div>
      </div>
    </div>
  );
}
