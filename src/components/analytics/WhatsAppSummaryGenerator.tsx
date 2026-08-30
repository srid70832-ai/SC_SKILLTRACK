import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Share2, Copy, Check, MessageSquare, Send, RefreshCw, FileText } from 'lucide-react';
import { MentorWhatsAppSummary } from '../../types';

export default function WhatsAppSummaryGenerator() {
  const [selectedMentor, setSelectedMentor] = useState<string>('All Mentors');
  const [summaryData, setSummaryData] = useState<MentorWhatsAppSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    fetchSummary(selectedMentor);
  }, [selectedMentor]);

  const fetchSummary = async (mentor: string) => {
    try {
      setLoading(true);
      const res = await fetch('/api/code-analytics/whatsapp-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentorName: mentor })
      });
      if (res.ok) {
        const data = await res.json();
        setSummaryData(data);
      }
    } catch (e) {
      console.error('Error fetching WhatsApp summary:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!summaryData?.formattedText) return;
    navigator.clipboard.writeText(summaryData.formattedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    if (!summaryData?.formattedText) return;
    const encoded = encodeURIComponent(summaryData.formattedText);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-blue-950 border border-emerald-500/30 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white font-display">
              Mentor Daily WhatsApp Report Generator
            </h3>
            <p className="text-xs text-slate-300">
              Generate beautifully formatted WhatsApp daily summaries for mentors and faculty
            </p>
          </div>
        </div>

        {/* Mentor Selector */}
        <select
          value={selectedMentor}
          onChange={(e) => setSelectedMentor(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-slate-800 border border-emerald-500/40 text-xs font-bold text-white focus:outline-none focus:border-emerald-400 cursor-pointer shadow-md"
        >
          <option value="All Mentors">All Mentors (Department Summary)</option>
          <option value="Mrs.V.Prema">Mrs. V. Prema (Section A1)</option>
          <option value="Mrs.B.Padmapriya">Mrs. B. Padmapriya (Section A2)</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 bg-slate-900/80 rounded-3xl border border-slate-800">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400 font-medium">Generating WhatsApp analytics report for {selectedMentor}...</p>
        </div>
      ) : summaryData ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Quick Metrics Column */}
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
              <div className="text-xs text-slate-400 font-medium">Monitored Students</div>
              <div className="text-2xl font-black text-white mt-1">{summaryData.totalStudents}</div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/90 border border-emerald-500/30">
              <div className="text-xs text-emerald-400 font-medium">Active Coders Today</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">{summaryData.activeCount}</div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/90 border border-rose-500/30">
              <div className="text-xs text-rose-400 font-medium">Inactive Students Today</div>
              <div className="text-2xl font-black text-rose-400 mt-1">{summaryData.inactiveCount}</div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/90 border border-amber-500/30">
              <div className="text-xs text-amber-400 font-medium">Problems Solved Today</div>
              <div className="text-2xl font-black text-amber-400 mt-1">{summaryData.todayProblemsSolved}</div>
            </div>
          </div>

          {/* Formatted Text Preview & Actions */}
          <div className="md:col-span-2 space-y-4">
            <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl relative">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <FileText className="w-4 h-4" /> Live Report Preview
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(summaryData.generatedAt).toLocaleTimeString()}
                </span>
              </div>

              <textarea
                readOnly
                value={summaryData.formattedText}
                rows={14}
                className="w-full p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs font-mono text-emerald-300 focus:outline-none leading-relaxed resize-none shadow-inner"
              />

              <div className="flex flex-wrap gap-3 mt-4 justify-end">
                <button
                  onClick={handleCopy}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white flex items-center gap-2 border border-slate-700 transition-all cursor-pointer shadow-md"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-300" />}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Text'}</span>
                </button>

                <button
                  onClick={handleOpenWhatsApp}
                  className="px-6 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Share via WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
