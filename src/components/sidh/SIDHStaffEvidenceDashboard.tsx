import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Send, 
  Download, 
  RefreshCw, 
  BookOpen, 
  Award, 
  SlidersHorizontal,
  ChevronRight,
  ExternalLink,
  Eye,
  FileSpreadsheet
} from 'lucide-react';
import { SIDHStudentComputedSummary, SIDHAnalyticsData } from '../../types';
import { StudentActivityProfileModal } from './StudentActivityProfileModal';
import { StaffRequestUpdateModal } from './StaffRequestUpdateModal';
import { StaffReviewEvidenceModal } from './StaffReviewEvidenceModal';

export const SIDHStaffEvidenceDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<SIDHStudentComputedSummary[]>([]);
  const [analytics, setAnalytics] = useState<SIDHAnalyticsData | null>(null);
  const [freshnessThreshold, setFreshnessThreshold] = useState<number>(14);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [yearFilter, setYearFilter] = useState<string>('All');
  const [ageFilter, setAgeFilter] = useState<string>('All');

  // Modals state
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<string | null>(null);
  const [selectedStudentForRequest, setSelectedStudentForRequest] = useState<{ reg: string; name?: string } | null>(null);
  const [selectedEvidenceForReview, setSelectedEvidenceForReview] = useState<string | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [bulkActionSuccess, setBulkActionSuccess] = useState<string | null>(null);

  const fetchMasterData = async () => {
    setLoading(true);
    try {
      const [resMaster, resAnalytics] = await Promise.all([
        fetch('/api/sidh/master-data').then(r => r.json()),
        fetch('/api/sidh/analytics').then(r => r.json())
      ]);

      if (resMaster.students) {
        setStudents(resMaster.students);
      }
      if (resMaster.freshnessDaysThreshold) {
        setFreshnessThreshold(resMaster.freshnessDaysThreshold);
      }
      if (resAnalytics.analytics) {
        setAnalytics(resAnalytics.analytics);
      }
    } catch (err) {
      console.error("Error fetching SIDH master data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  const handleUpdateThreshold = async (newDays: number) => {
    try {
      await fetch('/api/sidh/evidence-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ freshnessDaysThreshold: newDays })
      });
      setFreshnessThreshold(newDays);
      setShowSettingsModal(false);
      fetchMasterData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleBulkRequestStale = async () => {
    const staleStudents = students.filter(s => s.status === 'ACTION REQUIRED' || s.status === 'NO ACTIVITY');
    if (staleStudents.length === 0) {
      setBulkActionSuccess('All students currently have active, fresh evidence!');
      setTimeout(() => setBulkActionSuccess(null), 3000);
      return;
    }

    try {
      for (const s of staleStudents.slice(0, 15)) {
        await fetch('/api/sidh/requests/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            registerNumber: s.registerNumber,
            requestedBy: 'Department Coordinator',
            customMessage: 'SIDH verification notice: Please upload your recent course certificate or export.'
          })
        });
      }
      setBulkActionSuccess(`Dispatched update requests to ${Math.min(staleStudents.length, 15)} students with outdated or missing evidence.`);
      setTimeout(() => setBulkActionSuccess(null), 4000);
      fetchMasterData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportCSV = () => {
    const headers = ["Register Number", "Student Name", "Department", "Verification Status", "Evidence Source", "Courses Count", "Completed Count", "Certificates Count", "Last Verified Date", "Evidence Age (Days)"];
    const rows = filteredStudents.map(s => [
      `"${s.registerNumber}"`,
      `"${s.studentName}"`,
      `"${s.department || 'AI & DS'}"`,
      `"${s.status}"`,
      `"${s.evidenceSource || 'None'}"`,
      s.coursesCount,
      s.completedCount,
      s.certificatesCount,
      `"${s.lastVerifiedAt ? new Date(s.lastVerifiedAt).toISOString().slice(0, 10) : 'Never'}"`,
      s.evidenceAgeDays !== null ? s.evidenceAgeDays : 'N/A'
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SIDH_Student_Verification_Audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter logic
  const filteredStudents = students.filter(s => {
    const matchesSearch = 
      s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.registerNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
    const matchesDept = deptFilter === 'All' || s.department === deptFilter;

    let matchesAge = true;
    if (ageFilter === 'fresh') {
      matchesAge = s.evidenceAgeDays !== null && s.evidenceAgeDays <= freshnessThreshold;
    } else if (ageFilter === 'expiring') {
      matchesAge = s.evidenceAgeDays !== null && s.evidenceAgeDays > freshnessThreshold && s.evidenceAgeDays <= 30;
    } else if (ageFilter === 'stale') {
      matchesAge = s.evidenceAgeDays !== null && s.evidenceAgeDays > 30;
    } else if (ageFilter === 'none') {
      matchesAge = s.evidenceAgeDays === null;
    }

    return matchesSearch && matchesStatus && matchesDept && matchesAge;
  });

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED ACTIVE':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">🟢 VERIFIED ACTIVE</span>;
      case 'RECENTLY SYNCED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 whitespace-nowrap">🔵 RECENTLY SYNCED</span>;
      case 'ACTION REQUIRED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 whitespace-nowrap">🟡 ACTION REQUIRED</span>;
      case 'NOT VERIFIED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 whitespace-nowrap">🔴 NOT VERIFIED</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700 whitespace-nowrap">⚪ NO ACTIVITY</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Control Bar */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Evidence-Based SIDH Verification System</span>
            </div>
            <h2 className="text-2xl font-black text-white">Staff Verification Cockpit</h2>
            <p className="text-xs text-slate-400">
              Real-time audit of official Skill India Digital Hub (SIDH) evidence submissions, certificate proofs, and freshness status across all master students.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowSettingsModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
              Freshness: <span className="text-white">{freshnessThreshold} Days</span>
            </button>

            <button
              onClick={fetchMasterData}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Refresh Master Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metric Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400" /> Master Students
          </div>
          <div className="text-2xl font-black text-white">{analytics?.totalStudents ?? analytics?.totalMasterStudents ?? students.length}</div>
          <div className="text-[10px] text-slate-500">Department Registered</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Verified Active
          </div>
          <div className="text-2xl font-black text-emerald-400">
            {analytics?.verifiedActiveCount ?? students.filter(s => s.status === 'VERIFIED ACTIVE').length}
          </div>
          <div className="text-[10px] text-slate-500">&lt;= {freshnessThreshold} days fresh</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-[11px] font-semibold text-blue-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-400" /> Recently Synced
          </div>
          <div className="text-2xl font-black text-blue-400">
            {analytics?.recentlySyncedCount ?? students.filter(s => s.status === 'RECENTLY SYNCED').length}
          </div>
          <div className="text-[10px] text-slate-500">&lt;= 7 days sync</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-[11px] font-semibold text-amber-400 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" /> Action Required
          </div>
          <div className="text-2xl font-black text-amber-400">
            {analytics?.actionRequiredCount ?? students.filter(s => s.status === 'ACTION REQUIRED').length}
          </div>
          <div className="text-[10px] text-slate-500">Stale &gt; {freshnessThreshold}d</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" /> No Activity
          </div>
          <div className="text-2xl font-black text-slate-400">
            {analytics?.noEvidenceCount ?? analytics?.noActivityCount ?? students.filter(s => s.status === 'NO ACTIVITY').length}
          </div>
          <div className="text-[10px] text-slate-500">Zero evidence</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-[11px] font-semibold text-amber-400 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-400" /> Certificates
          </div>
          <div className="text-2xl font-black text-amber-300">
            {analytics?.totalCertificates ?? students.reduce((acc, s) => acc + s.certificatesCount, 0)}
          </div>
          <div className="text-[10px] text-slate-500">Verified IDs</div>
        </div>
      </div>

      {/* Bulk Action Notification */}
      {bulkActionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{bulkActionSuccess}</span>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search student name, register number, or roll number..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Quick Bulk Request Button */}
          <button
            onClick={handleBulkRequestStale}
            className="px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shrink-0"
          >
            <Send className="w-3.5 h-3.5" /> Request Updates from Stale ({students.filter(s => s.status === 'ACTION REQUIRED' || s.status === 'NO ACTIVITY').length})
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80">
          <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Status:
          </span>
          {['All', 'VERIFIED ACTIVE', 'RECENTLY SYNCED', 'ACTION REQUIRED', 'NOT VERIFIED', 'NO ACTIVITY'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                statusFilter === st
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {st === 'All' ? 'All Statuses' : st}
            </button>
          ))}

          <span className="text-[11px] font-semibold text-slate-400 ml-auto mr-1">Freshness:</span>
          <select
            value={ageFilter}
            onChange={e => setAgeFilter(e.target.value)}
            className="px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:outline-none"
          >
            <option value="All">All Ages</option>
            <option value="fresh">Fresh (&lt;= {freshnessThreshold}d)</option>
            <option value="expiring">Expiring (15-30d)</option>
            <option value="stale">Stale (&gt; 30d)</option>
            <option value="none">No Evidence</option>
          </select>
        </div>
      </div>

      {/* Student Master Verification Table */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-bold">Student Master</th>
                <th className="py-3.5 px-4 font-bold">Verification Status</th>
                <th className="py-3.5 px-4 font-bold">Evidence Source</th>
                <th className="py-3.5 px-4 font-bold text-center">Verified Courses</th>
                <th className="py-3.5 px-4 font-bold text-center">Certificates</th>
                <th className="py-3.5 px-4 font-bold">Evidence Age</th>
                <th className="py-3.5 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No students match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map(student => (
                  <tr key={student.student_id || student.registerNumber} className="hover:bg-slate-800/40 transition-colors">
                    
                    {/* Student Info */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-sm">{student.studentName}</div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span className="font-mono text-blue-400 font-semibold">{student.registerNumber}</span>
                        <span>•</span>
                        <span>{student.department || 'AI & DS'}</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      {renderStatusBadge(student.status)}
                    </td>

                    {/* Source */}
                    <td className="py-3.5 px-4 text-slate-300">
                      {student.evidenceSource ? (
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-mono border border-slate-700">
                          {student.evidenceSource.replace(/_/g, ' ')}
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">None</span>
                      )}
                    </td>

                    {/* Verified Courses Count */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-bold text-white">{student.coursesCount}</span>
                      {student.completedCount > 0 && (
                        <span className="text-[10px] text-emerald-400 ml-1">({student.completedCount} completed)</span>
                      )}
                    </td>

                    {/* Certificates Count */}
                    <td className="py-3.5 px-4 text-center">
                      {student.certificatesCount > 0 ? (
                        <span className="font-bold text-amber-400 flex items-center justify-center gap-1">
                          <Award className="w-3.5 h-3.5" /> {student.certificatesCount}
                        </span>
                      ) : (
                        <span className="text-slate-600 font-mono">0</span>
                      )}
                    </td>

                    {/* Evidence Age */}
                    <td className="py-3.5 px-4">
                      {student.evidenceAgeDays !== null ? (
                        <div className="space-y-0.5">
                          <span className={`font-bold ${
                            student.evidenceAgeDays <= freshnessThreshold ? 'text-emerald-400' :
                            student.evidenceAgeDays <= 30 ? 'text-amber-400' : 'text-rose-400'
                          }`}>
                            {student.evidenceAgeDays === 0 ? 'Today' : `${student.evidenceAgeDays}d ago`}
                          </span>
                          <div className="text-[10px] text-slate-500">
                            {student.lastVerifiedAt ? new Date(student.lastVerifiedAt).toLocaleDateString() : ''}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic text-[11px]">No Evidence</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedStudentForProfile(student.registerNumber)}
                          className="p-1.5 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 transition-colors"
                          title="View 9-Section Activity Profile"
                        >
                          <Eye className="w-3.5 h-3.5" /> Profile
                        </button>

                        <button
                          onClick={() => setSelectedStudentForRequest({ reg: student.registerNumber, name: student.studentName })}
                          className="p-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 border border-slate-700 text-xs font-bold flex items-center gap-1 transition-colors"
                          title="Request update from student"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Showing {filteredStudents.length} of {students.length} students</span>
          <span>Official Evidence Freshness Standard: &lt;= {freshnessThreshold} Days</span>
        </div>
      </div>

      {/* Freshness Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-blue-400" /> Evidence Freshness Threshold
            </h3>
            <p className="text-xs text-slate-400">
              Set the number of calendar days before verified evidence is marked as 🟡 ACTION REQUIRED.
            </p>

            <div className="grid grid-cols-3 gap-2">
              {[7, 14, 30].map(days => (
                <button
                  key={days}
                  onClick={() => handleUpdateThreshold(days)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                    freshnessThreshold === days
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {days} Days
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowSettingsModal(false)}
              className="w-full py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* 9-Section Student Activity Profile Modal */}
      {selectedStudentForProfile && (
        <StudentActivityProfileModal
          registerNumber={selectedStudentForProfile}
          onClose={() => setSelectedStudentForProfile(null)}
          onRequestUpdate={(reg) => {
            setSelectedStudentForProfile(null);
            setSelectedStudentForRequest({ reg });
          }}
          onOpenStaffReview={(evidenceId) => {
            setSelectedEvidenceForReview(evidenceId);
          }}
        />
      )}

      {/* Staff Update Request Modal */}
      {selectedStudentForRequest && (
        <StaffRequestUpdateModal
          registerNumber={selectedStudentForRequest.reg}
          studentName={selectedStudentForRequest.name}
          onClose={() => setSelectedStudentForRequest(null)}
          onRequestSent={() => {
            fetchMasterData();
          }}
        />
      )}

      {/* Staff Review Evidence Modal */}
      {selectedEvidenceForReview && (
        <StaffReviewEvidenceModal
          evidenceId={selectedEvidenceForReview}
          onClose={() => setSelectedEvidenceForReview(null)}
          onReviewSubmitted={() => {
            fetchMasterData();
          }}
        />
      )}

    </div>
  );
};
