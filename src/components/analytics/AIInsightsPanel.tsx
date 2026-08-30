import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, RefreshCw, Bot, BrainCircuit, Lightbulb, Target } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function AIInsightsPanel() {
  const [insights, setInsights] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchAIInsights();
  }, []);

  const fetchAIInsights = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/code-analytics/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (res.ok) {
        const data = await res.json();
        setInsights(data.summary);
      }
    } catch (e) {
      console.error('Error fetching AI Insights:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border border-blue-500/30 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <BrainCircuit className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white font-display flex items-center gap-2">
              Gemini AI Class Coding Evaluator
              <Sparkles className="w-4 h-4 text-amber-400" />
            </h3>
            <p className="text-xs text-slate-300">
              Automated artificial intelligence analysis of student coding strength, weak DSA topics, and mentorship recommendations
            </p>
          </div>
        </div>

        <button
          onClick={fetchAIInsights}
          disabled={loading}
          className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center gap-2 shadow-lg hover:from-blue-500 hover:to-indigo-500 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Analyzing Data...' : 'Re-Evaluate Class Data'}</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 bg-slate-900/80 rounded-3xl border border-slate-800">
          <Bot className="w-10 h-10 text-blue-400 animate-bounce mx-auto mb-3" />
          <h4 className="text-sm font-bold text-white">Gemini AI is evaluating student submission logs...</h4>
          <p className="text-xs text-slate-400 mt-1">Analyzing problem acceptance rates, contest rankings, and difficulty distributions.</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl text-slate-200 leading-relaxed space-y-4 font-sans text-sm"
        >
          <div className="markdown-body prose prose-invert max-w-none text-slate-300 text-sm">
            <ReactMarkdown>{insights}</ReactMarkdown>
          </div>
        </motion.div>
      )}
    </div>
  );
}
