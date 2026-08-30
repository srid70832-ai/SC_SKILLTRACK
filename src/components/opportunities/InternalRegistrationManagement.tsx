import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  FileText, Download, Filter, Search, RefreshCw, CheckCircle2,
  XCircle, Clock, AlertCircle, Eye, ShieldCheck, Trophy, Briefcase,
  Users, Check, X, Bell, ExternalLink, Calendar, Building, ChevronDown, Sparkles
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InternalRegistration, UserSession, StaffNotification } from '../../types';

interface InternalRegistrationManagementProps {
  session: UserSession;
}

export default function InternalRegistrationManagement({ session }: InternalRegistrationManagementProps) {
  const [registrations, setRegistrations] = useState<InternalRegistration[]>([]);
  const [notifications, setNotifications] = useState<StaffNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('All');
  const [sectionFilter, setSectionFilter] = useState('All');
  const [mentorFilter, setMentorFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [opportunityFilter, setOpportunityFilter] = useState('All');

  // Modal State
  const [selectedReg, setSelectedReg] = useState<InternalRegistration | null>(null);
  const [editingStatus, setEditingStatus] = useState<string>('');
  const [editingRemarks, setEditingRemarks] = useState<string>('');
  const [updating, setUpdating] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Fetch registrations & notifications from DB
  const fetchRegistrations = async () => {
    setSyncing(true);
    try {
      const [regRes, notifRes] = await Promise.all([
        fetch('/api/opportunity-registrations'),
        fetch('/api/staff/notifications')
      ]);

      if (regRes.ok) {
        const data = await regRes.json();
        setRegistrations(data.registrations || []);
      }

      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setNotifications(notifData || []);
      }
    } catch (err) {
      console.error('Error fetching registrations:', err);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  // Mark notifications read
  const handleMarkNotificationsRead = async () => {
    try {
      await fetch('/api/staff/notifications/read', { method: 'PUT' });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  // Options for Dropdowns
  const uniqueOpportunities = useMemo(() => {
    const set = new Set(registrations.map(r => r.opportunityName));
    return ['All', ...Array.from(set)];
  }, [registrations]);

  const uniqueMentors = useMemo(() => {
    const set = new Set(registrations.map(r => r.mentorName).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [registrations]);

  // Filtered registrations
  const filteredRegistrations = useMemo(() => {
    return registrations.filter(r => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (r.studentName || '').toLowerCase().includes(q);
        const matchReg = (r.registerNumber || '').toLowerCase().includes(q);
        const matchOpp = (r.opportunityName || '').toLowerCase().includes(q);
        const matchMentor = (r.mentorName || '').toLowerCase().includes(q);
        const matchOrg = (r.organizer || '').toLowerCase().includes(q);
        const matchExtId = (r.officialRegistrationId || '').toLowerCase().includes(q);
        if (!matchName && !matchReg && !matchOpp && !matchMentor && !matchOrg && !matchExtId) {
          return false;
        }
      }

      // Opportunity
      if (opportunityFilter !== 'All' && r.opportunityName !== opportunityFilter) {
        return false;
      }

      // Category
      if (categoryFilter !== 'All') {
        const catMatch = (r.category || '').toLowerCase() === categoryFilter.toLowerCase();
        if (!catMatch) return false;
      }

      // Dept
      if (deptFilter !== 'All' && r.department !== deptFilter) return false;

      // Year
      if (yearFilter !== 'All' && String(r.year) !== String(yearFilter)) return false;

      // Section
      if (sectionFilter !== 'All' && String(r.section) !== String(sectionFilter)) return false;

      // Mentor
      if (mentorFilter !== 'All' && r.mentorName !== mentorFilter) return false;

      // Verification Status
      if (statusFilter !== 'All') {
        if ((r.verificationStatus || '').toLowerCase() !== statusFilter.toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }, [
    registrations, searchQuery, opportunityFilter, categoryFilter,
    deptFilter, yearFilter, sectionFilter, mentorFilter, statusFilter
  ]);

  // Statistics
  const stats = useMemo(() => {
    const total = registrations.length;
    const hackathons = registrations.filter(r => (r.category || '').toLowerCase().includes('hackathon')).length;
    const internships = registrations.filter(r => (r.category || '').toLowerCase().includes('internship')).length;
    const competitions = registrations.filter(r => (r.category || '').toLowerCase().includes('competition')).length;
    
    const pending = registrations.filter(r => (r.verificationStatus || '').toLowerCase() === 'pending').length;
    const approved = registrations.filter(r => ['verified', 'approved'].includes((r.verificationStatus || '').toLowerCase())).length;
    const rejected = registrations.filter(r => (r.verificationStatus || '').toLowerCase() === 'rejected').length;

    const todayStr = new Date().toLocaleDateString('en-GB');
    const todayCount = registrations.filter(r => {
      if (!r.submissionDate) return false;
      return r.submissionDate.includes(todayStr);
    }).length;

    return { total, hackathons, internships, competitions, pending, approved, rejected, todayCount };
  }, [registrations]);

  // Open Details Modal
  const handleOpenDetails = (reg: InternalRegistration) => {
    setSelectedReg(reg);
    setEditingStatus(reg.verificationStatus || 'Pending');
    setEditingRemarks(reg.remarks || '');
  };

  // Update Status in DB
  const handleUpdateStatus = async (statusToSet?: string) => {
    if (!selectedReg) return;
    const finalStatus = statusToSet || editingStatus;

    setUpdating(true);
    try {
      const res = await fetch(`/api/opportunity-registrations/${selectedReg.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationStatus: finalStatus,
          registrationStatus: finalStatus === 'Verified' || finalStatus === 'Approved' ? 'Verified' : 'Submitted',
          remarks: editingRemarks,
          updatedBy: session.name || 'Staff'
        })
      });

      if (res.ok) {
        showToast(`Registration status updated to "${finalStatus}"`);
        setRegistrations(prev => prev.map(r => {
          if (r.id === selectedReg.id) {
            return {
              ...r,
              verificationStatus: finalStatus,
              remarks: editingRemarks,
              updatedAt: new Date().toISOString()
            };
          }
          return r;
        }));
        setSelectedReg(null);
      } else {
        showToast('Failed to update status');
      }
    } catch (e) {
      console.error(e);
      showToast('Error updating status');
    } finally {
      setUpdating(false);
    }
  };

  // Quick Action verify
  const handleQuickStatus = async (reg: InternalRegistration, newStatus: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/opportunity-registrations/${reg.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationStatus: newStatus,
          registrationStatus: newStatus === 'Approved' || newStatus === 'Verified' ? 'Verified' : 'Submitted',
          remarks: `Quick marked as ${newStatus} by Staff`,
          updatedBy: session.name || 'Staff'
        })
      });

      if (res.ok) {
        showToast(`Status updated to ${newStatus}`);
        setRegistrations(prev => prev.map(r => r.id === reg.id ? { ...r, verificationStatus: newStatus } : r));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    if (filteredRegistrations.length === 0) {
      showToast('No records available to export.');
      return;
    }

    const exportData = filteredRegistrations.map((r, idx) => ({
      'S.No': idx + 1,
      'Student Name': r.studentName,
      'Register Number': r.registerNumber,
      'Department': r.department,
      'Year': r.year,
      'Section': r.section,
      'Mentor Name': r.mentorName,
      'Opportunity Name': r.opportunityName,
      'Category': r.category,
      'Organizer': r.organizer,
      'Official Registration ID': r.officialRegistrationId,
      'Official Registration Email': r.officialRegistrationEmail,
      'Team Name': r.teamName || 'Individual',
      'Team Members': Array.isArray(r.teamMembers) ? r.teamMembers.join(', ') : r.teamMembers || '',
      'Submission Date': r.submissionDate,
      'Verification Status': r.verificationStatus,
      'Staff Remarks': r.remarks || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Internal Registrations');
    XLSX.writeFile(workbook, `Internal_Registrations_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('Excel report downloaded successfully!');
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredRegistrations.length === 0) {
      showToast('No records available to export.');
      return;
    }

    const headers = [
      'S.No', 'Student Name', 'Register Number', 'Department', 'Year', 'Section',
      'Mentor Name', 'Opportunity Name', 'Category', 'Organizer', 'Registration ID',
      'Registration Email', 'Submission Date', 'Verification Status', 'Remarks'
    ];

    const csvRows = [
      headers.join(','),
      ...filteredRegistrations.map((r, i) => [
        i + 1,
        `"${r.studentName}"`,
        `"${r.registerNumber}"`,
        `"${r.department}"`,
        `"${r.year}"`,
        `"${r.section}"`,
        `"${r.mentorName}"`,
        `"${r.opportunityName}"`,
        `"${r.category}"`,
        `"${r.organizer}"`,
        `"${r.officialRegistrationId}"`,
        `"${r.officialRegistrationEmail}"`,
        `"${r.submissionDate}"`,
        `"${r.verificationStatus}"`,
        `"${(r.remarks || '').replace(/"/g, '""')}"`
      ].join(','))
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Internal_Registrations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV report downloaded successfully!');
  };

  // Export to PDF
  const handleExportPDF = () => {
    if (filteredRegistrations.length === 0) {
      showToast('No records available to export.');
      return;
    }

    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.text('SC SMART POLL AI - Internal Registration Report', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()} | Total Records: ${filteredRegistrations.length}`, 14, 22);

    const tableHeaders = [
      ['#', 'Student Name', 'Reg No', 'Dept', 'Yr/Sec', 'Opportunity', 'Category', 'Reg ID', 'Date', 'Status']
    ];

    const tableRows = filteredRegistrations.map((r, i) => [
      i + 1,
      r.studentName,
      r.registerNumber,
      r.department,
      `${r.year}-${r.section}`,
      r.opportunityName,
      r.category,
      r.officialRegistrationId,
      r.submissionDate,
      r.verificationStatus
    ]);

    autoTable(doc, {
      head: tableHeaders,
      body: tableRows,
      startY: 28,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] }
    });

    doc.save(`Internal_Registrations_PDF_${new Date().toISOString().slice(0, 10)}.pdf`);
    showToast('PDF report generated successfully!');
  };

  const unreadNotifs = notifications.filter(n => !n.read);

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center space-x-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Hero Banner Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 sm:p-8 text-white shadow-2xl border border-indigo-900/50">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Career Opportunities • Internal Registrations</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-display text-white">
              Internal Registration Management
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Verify, audit, and manage student submissions for Hackathons, Internships, Ideathons, and Career Opportunities across departments.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={fetchRegistrations}
              disabled={syncing}
              className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-3 rounded-2xl border border-slate-700 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              <span>Sync Database</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-lg transition-all cursor-pointer border border-emerald-400/30"
            >
              <Download className="w-4 h-4" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        {/* Staff Notification Banner */}
        {unreadNotifs.length > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between bg-amber-500/10 p-3 rounded-2xl border border-amber-500/20">
            <div className="flex items-center space-x-3 text-xs text-amber-200">
              <Bell className="w-4 h-4 text-amber-400 animate-bounce" />
              <span className="font-bold">
                🔔 {unreadNotifs.length} New Internal Registration{unreadNotifs.length > 1 ? 's' : ''} Received!
              </span>
              <span className="hidden sm:inline text-amber-300/80">({unreadNotifs[0]?.message})</span>
            </div>
            <button
              onClick={handleMarkNotificationsRead}
              className="text-[11px] font-extrabold text-amber-300 hover:text-white underline cursor-pointer"
            >
              Dismiss All
            </button>
          </div>
        )}
      </div>

      {/* 8 Statistics Dashboard Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Total Regs</span>
          <div className="text-xl font-extrabold text-slate-900">{stats.total}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-sm space-y-1">
          <span className="text-[10px] font-extrabold text-amber-600 uppercase block">Hackathons</span>
          <div className="text-xl font-extrabold text-amber-800">{stats.hackathons}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-sm space-y-1">
          <span className="text-[10px] font-extrabold text-emerald-600 uppercase block">Internships</span>
          <div className="text-xl font-extrabold text-emerald-800">{stats.internships}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-sm space-y-1">
          <span className="text-[10px] font-extrabold text-blue-600 uppercase block">Competitions</span>
          <div className="text-xl font-extrabold text-blue-800">{stats.competitions}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-300 bg-amber-50/50 shadow-sm space-y-1">
          <span className="text-[10px] font-extrabold text-amber-700 uppercase block">Pending</span>
          <div className="text-xl font-extrabold text-amber-900">{stats.pending}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-300 bg-emerald-50/50 shadow-sm space-y-1">
          <span className="text-[10px] font-extrabold text-emerald-700 uppercase block">Approved</span>
          <div className="text-xl font-extrabold text-emerald-900">{stats.approved}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-red-200 bg-red-50/30 shadow-sm space-y-1">
          <span className="text-[10px] font-extrabold text-red-600 uppercase block">Rejected</span>
          <div className="text-xl font-extrabold text-red-800">{stats.rejected}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-purple-200 bg-purple-50/30 shadow-sm space-y-1">
          <span className="text-[10px] font-extrabold text-purple-600 uppercase block">Today</span>
          <div className="text-xl font-extrabold text-purple-900">{stats.todayCount}</div>
        </div>
      </div>

      {/* Filter and Control Toolbar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Instant Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Instant Search by Student Name, Register Number, Opportunity Name, or Mentor..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Export Dropdown Group */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Excel (.xlsx)
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              CSV
            </button>
            <button
              onClick={handleExportPDF}
              className="px-3.5 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              PDF
            </button>
          </div>
        </div>

        {/* Dropdown Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
          {/* Category Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase block">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none"
            >
              <option value="All">All Categories</option>
              <option value="Hackathon">Hackathon</option>
              <option value="Internship">Internship</option>
              <option value="Competition">Competition</option>
              <option value="Ideathon">Ideathon</option>
              <option value="AI Competitions">AI Competitions</option>
              <option value="Coding Challenges">Coding Challenges</option>
              <option value="Smart India Hackathon">SIH</option>
              <option value="CTF">CTF</option>
            </select>
          </div>

          {/* Department Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase block">Department</label>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none"
            >
              <option value="All">All Departments</option>
              <option value="AI&DS">AI & DS</option>
              <option value="CSE">CSE</option>
              <option value="ECE">ECE</option>
              <option value="IT">IT</option>
              <option value="MECH">MECH</option>
            </select>
          </div>

          {/* Year Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase block">Year</label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none"
            >
              <option value="All">All Years</option>
              <option value="I">I Year</option>
              <option value="II">II Year</option>
              <option value="III">III Year</option>
              <option value="IV">IV Year</option>
            </select>
          </div>

          {/* Section Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase block">Section</label>
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none"
            >
              <option value="All">All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
            </select>
          </div>

          {/* Mentor Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase block">Mentor</label>
            <select
              value={mentorFilter}
              onChange={(e) => setMentorFilter(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none"
            >
              {uniqueMentors.map((m, i) => (
                <option key={i} value={m}>{m === 'All' ? 'All Mentors' : m}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase block">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Verified">Verified / Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* Opportunity Filter */}
          <div className="space-y-1 col-span-2 sm:col-span-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase block">Opportunity</label>
            <select
              value={opportunityFilter}
              onChange={(e) => setOpportunityFilter(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none truncate"
            >
              {uniqueOpportunities.map((o, i) => (
                <option key={i} value={o}>{o === 'All' ? 'All Opportunities' : o}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h3 className="font-extrabold text-slate-900 text-sm">
              Registered Records ({filteredRegistrations.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">Showing database verified registrations</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
            <p className="text-xs font-semibold">Loading internal registrations from database...</p>
          </div>
        ) : filteredRegistrations.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">No Internal Registrations Found</h4>
            <p className="text-xs max-w-sm mx-auto text-slate-400">
              No registration submissions match your filter criteria. When students submit registration proofs, they will automatically appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider">
                  <th className="p-4">Student Name</th>
                  <th className="p-4">Reg No</th>
                  <th className="p-4">Dept / Yr / Sec</th>
                  <th className="p-4">Mentor</th>
                  <th className="p-4">Opportunity & Category</th>
                  <th className="p-4">Organizer</th>
                  <th className="p-4">Submission Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Proof</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredRegistrations.map((r) => {
                  const statusLower = (r.verificationStatus || '').toLowerCase();
                  const isVerified = ['verified', 'approved'].includes(statusLower);
                  const isRejected = statusLower === 'rejected';

                  return (
                    <tr
                      key={r.id}
                      onClick={() => handleOpenDetails(r)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      {/* Student Name */}
                      <td className="p-4">
                        <div className="font-extrabold text-slate-900 text-sm">{r.studentName}</div>
                        <div className="text-[11px] text-slate-400">{r.officialRegistrationEmail || `${r.registerNumber}@sctech.edu`}</div>
                      </td>

                      {/* Register Number */}
                      <td className="p-4 font-mono font-bold text-slate-800">
                        {r.registerNumber}
                      </td>

                      {/* Dept / Yr / Sec */}
                      <td className="p-4">
                        <span className="font-bold text-slate-900">{r.department}</span>
                        <div className="text-[11px] text-slate-500">Yr {r.year} • Sec {r.section}</div>
                      </td>

                      {/* Mentor */}
                      <td className="p-4 text-slate-800 font-semibold">
                        {r.mentorName || 'Mrs.B.Padmapriya'}
                      </td>

                      {/* Opportunity & Category */}
                      <td className="p-4 max-w-xs">
                        <div className="font-extrabold text-indigo-950 truncate">{r.opportunityName}</div>
                        <span className="inline-block mt-0.5 px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded-md text-[10px]">
                          {r.category}
                        </span>
                      </td>

                      {/* Organizer */}
                      <td className="p-4 text-slate-600 font-medium">
                        {r.organizer || 'Official'}
                      </td>

                      {/* Submission Date */}
                      <td className="p-4 text-slate-600">
                        <div className="font-bold text-slate-800">{r.submissionDate || 'Today'}</div>
                        <div className="text-[10px] text-slate-400 font-mono">ID: {r.officialRegistrationId || 'Not Provided'}</div>
                      </td>

                      {/* Verification Status Badge */}
                      <td className="p-4">
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2.5 py-1 rounded-full text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Verified</span>
                          </span>
                        ) : isRejected ? (
                          <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 border border-red-300 font-bold px-2.5 py-1 rounded-full text-[11px]">
                            <XCircle className="w-3.5 h-3.5 text-red-600" />
                            <span>Rejected</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2.5 py-1 rounded-full text-[11px]">
                            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                            <span>Pending</span>
                          </span>
                        )}
                      </td>

                      {/* Registration Proof Preview/Link */}
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        {r.uploadedProofUrl ? (
                          <a
                            href={r.uploadedProofUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center space-x-1.5 text-blue-600 hover:text-blue-800 font-bold text-xs bg-blue-50 px-2.5 py-1.5 rounded-xl border border-blue-200 transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Proof</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 font-medium">No Proof</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-center space-x-1" onClick={(e) => e.stopPropagation()}>
                        {!isVerified && (
                          <button
                            onClick={(e) => handleQuickStatus(r, 'Verified', e)}
                            title="Verify Registration"
                            className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg transition-all cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        {!isRejected && (
                          <button
                            onClick={(e) => handleQuickStatus(r, 'Rejected', e)}
                            title="Reject Registration"
                            className="p-1.5 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg transition-all cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenDetails(r)}
                          title="View Details"
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Popup Modal */}
      {selectedReg && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 relative"
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedReg(null)}
              className="absolute top-4 right-4 z-20 bg-slate-100 hover:bg-slate-200 text-slate-700 p-2.5 rounded-full transition-all cursor-pointer border border-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 text-white">
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block mb-1">
                {selectedReg.category} • {selectedReg.department}
              </span>
              <h2 className="text-xl font-extrabold">{selectedReg.opportunityName}</h2>
              <p className="text-xs text-slate-300">Host / Organizer: {selectedReg.organizer}</p>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-slate-800">
              {/* Student Information Grid */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Student Profile Details</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold block">Student Name</span>
                    <span className="font-extrabold text-slate-900">{selectedReg.studentName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block">Register No</span>
                    <span className="font-mono font-bold text-slate-900">{selectedReg.registerNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block">Dept / Yr / Sec</span>
                    <span className="font-bold text-slate-900">{selectedReg.department} - {selectedReg.year} / {selectedReg.section}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block">Mentor</span>
                    <span className="font-bold text-slate-900">{selectedReg.mentorName}</span>
                  </div>
                </div>
              </div>

              {/* Registration & Team Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <span className="text-slate-400 font-bold block">Official Registration ID</span>
                  <span className="font-mono font-extrabold text-sm text-indigo-900 bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-200 inline-block">
                    {selectedReg.officialRegistrationId || 'Not Provided (Optional)'}
                  </span>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <span className="text-slate-400 font-bold block">Official Registration Email</span>
                  <span className="font-semibold text-slate-800 bg-white px-3 py-1 rounded-xl border border-slate-200 inline-block truncate w-full">
                    {selectedReg.officialRegistrationEmail}
                  </span>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1 sm:col-span-2">
                  <span className="text-slate-400 font-bold block">Team Details</span>
                  <div className="font-bold text-slate-900">Team Name: {selectedReg.teamName || 'Individual'}</div>
                  <div className="text-slate-600 text-xs">
                    Members: {Array.isArray(selectedReg.teamMembers) ? selectedReg.teamMembers.join(', ') : selectedReg.teamMembers || selectedReg.studentName}
                  </div>
                </div>
              </div>

              {/* Uploaded Proof Section */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Uploaded Registration Proof</h4>
                {selectedReg.uploadedProofUrl ? (
                  <div className="space-y-3">
                    {selectedReg.uploadedProofUrl.startsWith('data:image') || selectedReg.uploadedProofUrl.includes('unsplash') ? (
                      <img
                        src={selectedReg.uploadedProofUrl}
                        alt="Registration Proof"
                        className="max-h-56 object-contain mx-auto rounded-xl border border-slate-300 shadow-md bg-white p-1"
                      />
                    ) : null}

                    <div className="text-center">
                      <a
                        href={selectedReg.uploadedProofUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow transition-all cursor-pointer"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Open Full Size Proof Document</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No proof file attached.</p>
                )}
              </div>

              {/* Staff Verification Controls */}
              <div className="bg-amber-50/80 p-5 rounded-2xl border border-amber-200 space-y-4">
                <h4 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600" /> Staff Verification Control
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Verification Status</label>
                    <select
                      value={editingStatus}
                      onChange={(e) => setEditingStatus(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                    >
                      <option value="Pending">Pending Verification</option>
                      <option value="Verified">Verified & Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Staff Remarks / Notes</label>
                    <input
                      type="text"
                      value={editingRemarks}
                      onChange={(e) => setEditingRemarks(e.target.value)}
                      placeholder="e.g. Valid registration proof verified"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    onClick={() => handleUpdateStatus('Rejected')}
                    disabled={updating}
                    className="px-4 py-2.5 bg-red-100 hover:bg-red-200 text-red-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('Verified')}
                    disabled={updating}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow transition-all cursor-pointer"
                  >
                    Approve & Verify
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
