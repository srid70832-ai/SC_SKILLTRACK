import React, { useState, useEffect } from 'react';
import { 
  FileText, Download, Sparkles, RefreshCw, BarChart2, CheckSquare, 
  Users, AlertCircle, FileSpreadsheet, Printer, Send, FileCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import ReminderModal from './ReminderModal';
import { 
  downloadFullPollReportPDF, 
  downloadExecutiveSummaryPDF, 
  downloadNonRespondersPDF 
} from '../services/pdfReportService';

interface Poll {
  id: string;
  title: string;
  question: string;
  options: string[];
  deadline: string;
  targetDepartment: string;
  targetYear: string;
  targetSection: string;
  status: 'Active' | 'Closed';
  createdAt: string;
}

interface TrackingData {
  poll: Poll;
  stats: {
    totalStudents: number;
    respondedCount: number;
    pendingCount: number;
    participationRate: number;
  };
  respondedStudents: any[];
  pendingStudents: any[];
  optionsStats: Record<string, number>;
}

export default function ReportsTab() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPollId, setSelectedPollId] = useState<string>('');
  const [reportData, setReportData] = useState<TrackingData | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [smartSummary, setSmartSummary] = useState<string>('');
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Print Preview Dialog States
  const [printType, setPrintType] = useState<'summary' | 'non-responders' | null>(null);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);

  useEffect(() => {
    fetchPolls(true);
    const pollInterval = setInterval(() => {
      fetchPolls(false);
    }, 5000);
    return () => clearInterval(pollInterval);
  }, []);

  const fetchPolls = async (showInitialLoading = false) => {
    try {
      if (showInitialLoading) setLoading(true);
      const res = await fetch('/api/polls');
      if (res.ok) {
        const data = await res.json();
        setPolls(data);
        if (data.length > 0 && !selectedPollId) {
          setSelectedPollId(data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (showInitialLoading) setLoading(false);
    }
  };

  // Fetch report details on selection and set up 3s polling for real-time reporting
  useEffect(() => {
    if (!selectedPollId) return;

    fetchReportDetails(selectedPollId, true);

    const interval = setInterval(() => {
      fetchReportDetails(selectedPollId, false);
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedPollId]);

  const fetchReportDetails = async (pollId: string, showLoadingSpinner = false) => {
    try {
      if (showLoadingSpinner) setReportLoading(true);
      const res = await fetch(`/api/tracking/${pollId}`);
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (showLoadingSpinner) setReportLoading(false);
    }
  };

  const generateSmartSummary = async () => {
    if (!selectedPollId) return;
    try {
      setSummaryLoading(true);
      const res = await fetch('/api/ai/smart-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pollId: selectedPollId })
      });
      const data = await res.json();
      if (res.ok) {
        setSmartSummary(data.summary);
      } else {
        setSmartSummary("Failed to generate AI summary. Try again later.");
      }
    } catch (e) {
      setSmartSummary("Error communicating with AI service.");
    } finally {
      setSummaryLoading(false);
    }
  };

  // Export beautiful three-sheet Excel workbook!
  const handleExportExcel = () => {
    if (!reportData) return;

    const workbook = XLSX.utils.book_new();

    // Sheet 1: Poll Results
    const resultsRows = reportData.respondedStudents.map((s, idx) => {
      const respObj = (reportData as any).responses?.find((r: any) => r.studentRollNumber === s.rollNumber);
      return {
        "S.No": idx + 1,
        "Roll Number": s.rollNumber,
        "Register Number": s.registerNumber,
        "Student Name": s.studentName,
        "Mentor Name": s.mentorName || "-",
        "Department": s.department,
        "Year": s.year,
        "Section": s.section,
        "Response": respObj ? respObj.selectedOptions.join(", ") : "Recorded",
        "Date Responded": respObj ? new Date(respObj.respondedAt).toLocaleString() : "-"
      };
    });

    const resultsSheet = XLSX.utils.json_to_sheet(resultsRows);
    XLSX.utils.book_append_sheet(workbook, resultsSheet, "Poll Results");

    // Sheet 2: Non Responders
    const pendingRows = reportData.pendingStudents.map((s, idx) => ({
      "S.No": idx + 1,
      "Roll Number": s.rollNumber,
      "Register Number": s.registerNumber,
      "Student Name": s.studentName,
      "Mentor Name": s.mentorName || "-",
      "Department": s.department,
      "Year": s.year,
      "Section": s.section,
      "Email": s.email || "-",
      "Phone": s.phoneNumber || "-",
      "Status": "Pending Response"
    }));

    const pendingSheet = XLSX.utils.json_to_sheet(pendingRows);
    XLSX.utils.book_append_sheet(workbook, pendingSheet, "Non Responders");

    // Sheet 3: Poll metadata & stats
    const statsRows = [
      { "Metric": "Poll Name", "Value": reportData.poll.title },
      { "Metric": "Question", "Value": reportData.poll.question },
      { "Metric": "Deadline", "Value": reportData.poll.deadline },
      { "Metric": "Total Students", "Value": reportData.stats.totalStudents },
      { "Metric": "Responded", "Value": reportData.stats.respondedCount },
      { "Metric": "Pending", "Value": reportData.stats.pendingCount },
      { "Metric": "Participation Rate", "Value": `${reportData.stats.participationRate}%` },
      { "Metric": "Report Date", "Value": new Date().toLocaleDateString() }
    ];

    const statsSheet = XLSX.utils.json_to_sheet(statsRows);
    XLSX.utils.book_append_sheet(workbook, statsSheet, "Summary Stats");

    XLSX.writeFile(workbook, `SC_Smart_Poll_${reportData.poll.title.replace(/\s+/g, '_')}_Report.xlsx`);
  };

  const handleDownloadFullPDF = () => {
    if (!reportData) return;
    downloadFullPollReportPDF(reportData, smartSummary);
  };

  const handleDownloadExecSummaryPDF = () => {
    if (!reportData) return;
    downloadExecutiveSummaryPDF(reportData, smartSummary);
  };

  const handleDownloadDefaultersPDF = () => {
    if (!reportData) return;
    downloadNonRespondersPDF(reportData);
  };

  const handlePrint = (type: 'summary' | 'non-responders') => {
    setPrintType(type);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <div className="space-y-6">
      {/* Selector card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h3 className="text-md font-bold text-slate-900 font-display">Generate Academic Reports</h3>
          <p className="text-xs text-slate-500">Select any active or closed poll to build and download reports.</p>
        </div>

        <select
          value={selectedPollId}
          onChange={(e) => setSelectedPollId(e.target.value)}
          className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 text-slate-700 font-semibold"
        >
          {polls.map(p => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>
      </div>

      {reportLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-slate-500 mt-3 font-semibold">Gathering poll response databases...</p>
        </div>
      ) : reportData ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Visual Stats View & Downloads */}
          <div className="lg:col-span-2 space-y-6">
            {/* Visual Charts Overview */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-4 flex-wrap gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">Report Preview</span>
                  <h4 className="text-lg font-bold text-slate-900 font-display mt-0.5">{reportData.poll.title}</h4>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleDownloadFullPDF}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 cursor-pointer shadow-xs transition-all"
                    title="Download full formal PDF report with tables and stats"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>Download Full PDF</span>
                  </button>

                  <button
                    onClick={handleDownloadExecSummaryPDF}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 cursor-pointer shadow-xs transition-all"
                    title="Download 1-page executive summary PDF"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Exec Summary PDF</span>
                  </button>

                  <button
                    onClick={handleExportExcel}
                    className="px-3.5 py-1.5 border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl hover:bg-emerald-100 flex items-center space-x-1.5 cursor-pointer transition-all"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Excel</span>
                  </button>

                  <button
                    onClick={() => handlePrint('summary')}
                    className="px-3.5 py-1.5 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 flex items-center space-x-1 cursor-pointer transition-all"
                    title="Print view"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    <span>Print</span>
                  </button>
                </div>
              </div>

              {/* Statistical cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-200">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total</p>
                  <p className="text-xl font-bold text-slate-900 mt-1">{reportData.stats.totalStudents}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-200">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Responded</p>
                  <p className="text-xl font-bold text-emerald-600 mt-1">{reportData.stats.respondedCount}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-200">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Pending</p>
                  <p className="text-xl font-bold text-amber-600 mt-1">{reportData.stats.pendingCount}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-200">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Participation</p>
                  <p className="text-xl font-bold text-purple-600 mt-1">{reportData.stats.participationRate}%</p>
                </div>
              </div>

              {/* Option-wise distribution */}
              <div className="space-y-4 pt-2">
                <h5 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Option Distribution results</h5>
                {reportData.stats.respondedCount === 0 && (
                  <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center">
                    <p className="text-slate-600 font-semibold text-xs">No responses received yet.</p>
                  </div>
                )}
                {reportData.poll.options.map(opt => {
                  const count = reportData.optionsStats[opt] || 0;
                  const percent = reportData.stats.respondedCount > 0 
                    ? Math.round((count / reportData.stats.respondedCount) * 100) 
                    : 0;

                  return (
                    <div key={opt} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-700">{opt}</span>
                        <span className="text-slate-500">{count} vote(s) ({percent}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full rounded-full" style={{ width: `${percent}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Smart AI summary card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Gemini AI Smart Summaries</span>
                </h4>
                {!smartSummary && (
                  <button
                    onClick={generateSmartSummary}
                    disabled={summaryLoading}
                    className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-xl hover:bg-blue-100 flex items-center space-x-1 cursor-pointer"
                  >
                    {summaryLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    <span>{summaryLoading ? "Summarizing..." : "Generate AI Summary"}</span>
                  </button>
                )}
              </div>

              {summaryLoading ? (
                <div className="py-6 text-center text-xs text-slate-500 font-semibold flex items-center justify-center space-x-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Prompting Gemini 3.5 Flash to compute report trends...</span>
                </div>
              ) : smartSummary ? (
                <div className="bg-blue-50/40 rounded-xl p-4 border border-blue-100 text-sm text-blue-900 leading-relaxed font-medium">
                  {smartSummary}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">
                  Click 'Generate AI Summary' above to let Gemini compile smart analytics and option insights.
                </p>
              )}
            </div>
          </div>

          {/* Right Side: Non-Responder PDF Generation Card */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 mb-4 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span>Non Responder Report</span>
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed mb-6">
                Creates a clean document targeting students who missed the deadline. Ideal for faculty submissions or physical follow-ups.
              </p>

              <div className="space-y-3">
                <button
                  onClick={handleDownloadDefaultersPDF}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-2 cursor-pointer shadow-xs transition-colors"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Download Defaulters PDF</span>
                </button>

                <button
                  onClick={() => setReminderModalOpen(true)}
                  className="w-full py-2.5 border border-amber-300 bg-amber-50 text-amber-900 text-xs font-bold rounded-xl hover:bg-amber-100 flex items-center justify-center space-x-2 cursor-pointer transition-colors"
                >
                  <Send className="w-4 h-4 text-amber-600" />
                  <span>Send Reminder Message</span>
                </button>

                <button
                  onClick={() => handlePrint('non-responders')}
                  className="w-full py-2.5 border border-slate-200 bg-slate-50 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 flex items-center justify-center space-x-2 cursor-pointer transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Defaulters List</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500 py-10 text-center">No reports data available.</p>
      )}

      {/* HIDDEN PRINT PREVIEW ELEMENTS STYLED WITH @media print CSS */}
      {printType && reportData && (
        <div className="hidden print:block fixed inset-0 bg-white text-black p-8 z-50 overflow-auto font-sans">
          {printType === 'summary' ? (
            <div className="space-y-6">
              <div className="border-b-2 border-black pb-4 text-center">
                <h1 className="text-2xl font-black uppercase tracking-wider">SC SMART POLL AI</h1>
                <p className="text-xs uppercase tracking-widest font-semibold mt-1">Poll Summary Report — Academic Division</p>
                <p className="text-[10px] text-gray-500 mt-2">Generated Date: {new Date().toLocaleDateString()} | Developed By SC TECH</p>
              </div>

              <div className="grid grid-cols-2 gap-4 border border-black p-4 rounded-md">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Poll Name</p>
                  <p className="text-sm font-bold">{reportData.poll.title}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Target Section</p>
                  <p className="text-sm font-bold">
                    Dept: {reportData.poll.targetDepartment} | Year: {reportData.poll.targetYear} | Sec: {reportData.poll.targetSection}
                  </p>
                </div>
                <div className="mt-2">
                  <p className="text-xs font-bold text-gray-400 uppercase">Question</p>
                  <p className="text-xs font-medium">{reportData.poll.question}</p>
                </div>
                <div className="mt-2">
                  <p className="text-xs font-bold text-gray-400 uppercase">Deadline Details</p>
                  <p className="text-xs font-bold">{reportData.poll.deadline}</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="border border-black p-2">
                  <p className="text-[10px] uppercase font-bold text-gray-500">Total</p>
                  <p className="text-md font-bold">{reportData.stats.totalStudents}</p>
                </div>
                <div className="border border-black p-2">
                  <p className="text-[10px] uppercase font-bold text-gray-500">Responded</p>
                  <p className="text-md font-bold">{reportData.stats.respondedCount}</p>
                </div>
                <div className="border border-black p-2">
                  <p className="text-[10px] uppercase font-bold text-gray-500">Pending</p>
                  <p className="text-md font-bold">{reportData.stats.pendingCount}</p>
                </div>
                <div className="border border-black p-2 bg-gray-50">
                  <p className="text-[10px] uppercase font-bold text-gray-500">Participation</p>
                  <p className="text-md font-bold">{reportData.stats.participationRate}%</p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase border-b-2 border-black pb-1">Result breakdown</h3>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-black">
                      <th className="py-1">Option Choice</th>
                      <th className="py-1 text-right">Votes</th>
                      <th className="py-1 text-right">Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.poll.options.map(opt => {
                      const count = reportData.optionsStats[opt] || 0;
                      const percent = reportData.stats.respondedCount > 0 
                        ? Math.round((count / reportData.stats.respondedCount) * 100) 
                        : 0;
                      return (
                        <tr key={opt} className="border-b border-gray-100">
                          <td className="py-1 font-semibold">{opt}</td>
                          <td className="py-1 text-right">{count}</td>
                          <td className="py-1 text-right">{percent}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {smartSummary && (
                <div className="p-4 border border-dashed border-black rounded-md">
                  <h4 className="text-xs font-bold uppercase mb-1">AI Analytical Insights</h4>
                  <p className="text-xs italic leading-relaxed">{smartSummary}</p>
                </div>
              )}

              <div className="pt-12 text-center text-[10px] text-gray-500 border-t border-gray-200 uppercase tracking-widest font-semibold">
                Developed By SC TECH © 2026
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="border-b-2 border-black pb-4 text-center">
                <h1 className="text-2xl font-black uppercase tracking-wider text-red-700">SC SMART POLL AI</h1>
                <p className="text-xs uppercase tracking-widest font-semibold mt-1">Non Responder Defaulters List</p>
                <p className="text-[10px] text-gray-500 mt-2">Generated Date: {new Date().toLocaleDateString()} | Developed By SC TECH</p>
              </div>

              <div className="border border-black p-4 rounded-md text-xs space-y-1 bg-amber-50/10">
                <p><strong>Associated Poll:</strong> {reportData.poll.title}</p>
                <p><strong>Department Targeted:</strong> {reportData.poll.targetDepartment} — Yr {reportData.poll.targetYear} — Sec {reportData.poll.targetSection}</p>
                <p><strong>Total Pending Count:</strong> {reportData.stats.pendingCount} out of {reportData.stats.totalStudents} total students</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase border-b border-black pb-1">Pending Students Register</h3>
                <table className="w-full text-left text-xs border-collapse border border-black">
                  <thead>
                    <tr className="bg-gray-100 border-b border-black text-gray-800 font-bold">
                      <th className="py-1.5 px-2 border-r border-black">Roll No</th>
                      <th className="py-1.5 px-2 border-r border-black">Register No</th>
                      <th className="py-1.5 px-2 border-r border-black">Student Name</th>
                      <th className="py-1.5 px-2 border-r border-black">Dept</th>
                      <th className="py-1.5 px-2 border-r border-black">Sec</th>
                      <th className="py-1.5 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.pendingStudents.map(st => (
                      <tr key={st.rollNumber} className="border-b border-black">
                        <td className="py-1.5 px-2 border-r border-black font-mono font-bold">{st.rollNumber}</td>
                        <td className="py-1.5 px-2 border-r border-black font-mono">{st.registerNumber}</td>
                        <td className="py-1.5 px-2 border-r border-black font-semibold">{st.studentName}</td>
                        <td className="py-1.5 px-2 border-r border-black">{st.department}</td>
                        <td className="py-1.5 px-2 border-r border-black">{st.section}</td>
                        <td className="py-1.5 px-2 font-bold text-amber-700">PENDING</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-12 text-center text-[10px] text-gray-500 border-t border-gray-200 uppercase tracking-widest font-semibold">
                Developed By SC TECH © 2026
              </div>
            </div>
          )}
        </div>
      )}
      {/* Reminder Modal */}
      <ReminderModal
        isOpen={reminderModalOpen}
        onClose={() => setReminderModalOpen(false)}
        poll={reportData?.poll || null}
        pendingStudents={reportData?.pendingStudents || []}
      />
    </div>
  );
}
