import React, { useState } from 'react';
import { 
  BarChart3, Download, FileSpreadsheet, FileText, Trophy, 
  Users, Award, ShieldCheck, Filter, ArrowUpRight 
} from 'lucide-react';
import { Hackathon, HackathonRegistration } from '../../types';

interface ReportsTabProps {
  hackathons: Hackathon[];
  registrations: HackathonRegistration[];
}

export default function ReportsTab({ hackathons, registrations }: ReportsTabProps) {
  const [selectedHackathonId, setSelectedHackathonId] = useState('All');
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState('All');

  const filtered = registrations.filter(r => {
    const matchesH = selectedHackathonId === 'All' || r.hackathonId === selectedHackathonId;
    const matchesD = selectedDepartmentFilter === 'All' || r.department === selectedDepartmentFilter;
    return matchesH && matchesD;
  });

  // Analytics Computation
  const departments = ['AI&DS', 'CSE', 'IT', 'ECE', 'EEE', 'MECH'];
  const deptStats = departments.map(dept => {
    const total = filtered.filter(r => r.department === dept).length;
    const verified = filtered.filter(r => r.department === dept && r.status === 'Verified').length;
    const winners = filtered.filter(r => r.department === dept && r.currentRound === 'Winner').length;
    return { dept, total, verified, winners };
  });

  const years = ['I', 'II', 'III', 'IV'];
  const yearStats = years.map(yr => {
    const total = filtered.filter(r => r.year === yr).length;
    return { yr, total };
  });

  // Funnel
  const registeredCount = filtered.length;
  const verifiedCount = filtered.filter(r => r.status === 'Verified').length;
  const round1Count = filtered.filter(r => ['Round 1 Qualified', 'Round 2 Qualified', 'Round 3 Qualified', 'Semi Finalist', 'Finalist', 'Winner'].includes(r.currentRound)).length;
  const finalistsCount = filtered.filter(r => ['Finalist', 'Winner'].includes(r.currentRound)).length;
  const winnersCount = filtered.filter(r => r.currentRound === 'Winner').length;

  // Export CSV
  const handleExportCSV = () => {
    const headers = ["S.No", "Hackathon Title", "Student Roll", "Register No", "Student Name", "Department", "Year", "External Reg ID", "Status", "Current Round", "Team Name", "Submitted At"];
    const rows = filtered.map((r, idx) => [
      idx + 1,
      `"${r.hackathonTitle}"`,
      r.studentRollNumber,
      r.registerNumber,
      `"${r.studentName}"`,
      r.department,
      r.year,
      r.externalRegId,
      r.status,
      r.currentRound,
      `"${r.teamName}"`,
      new Date(r.submittedAt).toLocaleDateString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SC_Hackathon_Hub_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 font-display flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-amber-500" />
            <span>Hackathon Analytics & Official Reports</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Comprehensive department-wise, year-wise, and round progression analytics for college administration and NAAC records.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Export Excel / CSV Report</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 w-full">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Filter Hackathon</label>
          <select
            value={selectedHackathonId}
            onChange={(e) => setSelectedHackathonId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
          >
            <option value="All">All Hackathons ({hackathons.length})</option>
            {hackathons.map(h => <option key={h.id} value={h.id}>{h.title}</option>)}
          </select>
        </div>

        <div className="flex-1 w-full">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Filter Department</label>
          <select
            value={selectedDepartmentFilter}
            onChange={(e) => setSelectedDepartmentFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
          >
            <option value="All">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Submissions</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{registeredCount}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Verified</span>
          <div className="text-2xl font-black text-indigo-600 mt-1">{verifiedCount}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Round Qualified</span>
          <div className="text-2xl font-black text-blue-600 mt-1">{round1Count}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Finalists</span>
          <div className="text-2xl font-black text-purple-600 mt-1">{finalistsCount}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-amber-600 uppercase">Winners 🏆</span>
          <div className="text-2xl font-black text-amber-600 mt-1">{winnersCount}</div>
        </div>
      </div>

      {/* Department Breakdown Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 font-display">
          Department-Wise Participation & Winner Conversion
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {deptStats.map(ds => (
            <div key={ds.dept} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-xs font-bold text-slate-900 uppercase block">{ds.dept}</span>
              <div className="text-xl font-black text-amber-600">{ds.total} <span className="text-[10px] font-normal text-slate-500">Regs</span></div>
              <div className="text-[10px] font-semibold text-emerald-700">{ds.verified} Verified</div>
              <div className="text-[10px] font-bold text-amber-600">{ds.winners} Champions 🏆</div>
            </div>
          ))}
        </div>
      </div>

      {/* Master Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Detailed Master Hackathon Submissions Records ({filtered.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Student Name</th>
                <th className="p-3">Roll / Reg No</th>
                <th className="p-3">Dept & Year</th>
                <th className="p-3">Hackathon Title</th>
                <th className="p-3">Reg ID</th>
                <th className="p-3">Status</th>
                <th className="p-3">Round</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r, idx) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="p-3 text-slate-400 font-mono">{idx + 1}</td>
                  <td className="p-3 font-bold text-slate-900">{r.studentName}</td>
                  <td className="p-3 font-mono text-slate-600">{r.studentRollNumber}</td>
                  <td className="p-3 text-slate-600">{r.department} - Year {r.year}</td>
                  <td className="p-3 font-semibold text-slate-800">{r.hackathonTitle}</td>
                  <td className="p-3 font-mono text-amber-600">{r.externalRegId}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                      r.status === 'Verified' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-amber-700">{r.currentRound}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
