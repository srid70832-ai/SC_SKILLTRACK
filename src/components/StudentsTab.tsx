import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Edit, Trash2, Upload, FileSpreadsheet, X, Check, Search, Filter, Key, RefreshCw,
  Lock, Unlock, ShieldAlert, History, UserCheck, AlertCircle, Clock, ShieldCheck, CheckCircle2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Student } from '../types';

interface SecurityInfo {
  passwordChanged: boolean;
  isLocked: boolean;
  failedAttempts: number;
  lastLoginAt: string | null;
  lastPasswordChangedAt: string | null;
  resetRequested: boolean;
  resetRequestedAt: string | null;
}

export default function StudentsTab() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  const [filterSection, setFilterSection] = useState('All');

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRollNumber, setEditingRollNumber] = useState<string | null>(null);

  // Security Modal State
  const [securityStudent, setSecurityStudent] = useState<Student | null>(null);
  const [securityInfo, setSecurityInfo] = useState<SecurityInfo | null>(null);
  const [securityLoading, setSecurityLoading] = useState(false);
  
  // Form fields
  const [rollNumber, setRollNumber] = useState('');
  const [registerNumber, setRegisterNumber] = useState('');
  const [studentName, setStudentName] = useState('');
  const [department, setDepartment] = useState('AI&DS');
  const [year, setYear] = useState('II');
  const [section, setSection] = useState('A');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [studentStatus, setStudentStatus] = useState<'Active' | 'Inactive'>('Active');

  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/students');
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingRollNumber(null);
    setRollNumber('');
    setRegisterNumber('');
    setStudentName('');
    setDepartment('AI&DS');
    setYear('II');
    setSection('A');
    setPhoneNumber('');
    setEmail('');
    setStudentStatus('Active');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (s: Student) => {
    setEditingRollNumber(s.rollNumber);
    setRollNumber(s.rollNumber);
    setRegisterNumber(s.registerNumber);
    setStudentName(s.studentName);
    setDepartment(s.department);
    setYear(s.year);
    setSection(s.section);
    setPhoneNumber(s.phoneNumber);
    setEmail(s.email);
    setStudentStatus(s.studentStatus);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (roll: string) => {
    if (!confirm(`Are you sure you want to delete student with Roll Number ${roll}? This will also delete their credentials and responses.`)) return;
    try {
      const res = await fetch(`/api/students/${roll}`, { method: 'DELETE' });
      if (res.ok) {
        setStudents(students.filter(s => s.rollNumber !== roll));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetPassword = async (s: Student) => {
    if (!confirm(`Reset password for ${s.studentName} (${s.registerNumber}) back to default initial password?`)) return;
    try {
      const res = await fetch('/api/auth/reset-student-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: s.registerNumber })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || `Password reset successfully for ${s.studentName}`);
        if (securityStudent && securityStudent.registerNumber === s.registerNumber) {
          openSecurityModal(s);
        }
      } else {
        alert(data.error || "Failed to reset password.");
      }
    } catch (e) {
      alert("Error resetting password.");
    }
  };

  const handleToggleLock = async (s: Student) => {
    try {
      const res = await fetch('/api/auth/toggle-lock-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: s.registerNumber })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        if (securityStudent && securityStudent.registerNumber === s.registerNumber) {
          openSecurityModal(s);
        }
      } else {
        alert(data.error || "Failed to toggle account lock state.");
      }
    } catch (e) {
      alert("Error updating lock status.");
    }
  };

  const openSecurityModal = async (s: Student) => {
    setSecurityStudent(s);
    setSecurityInfo(null);
    setSecurityLoading(true);
    try {
      const res = await fetch(`/api/auth/student-security-info/${s.registerNumber}`);
      if (res.ok) {
        const data = await res.json();
        setSecurityInfo(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!rollNumber.trim() || !registerNumber.trim() || !studentName.trim() || !department.trim() || !year.trim() || !section.trim()) {
      setFormError("Please fill in all required fields.");
      return;
    }

    const payload = {
      rollNumber,
      registerNumber,
      studentName,
      department,
      year,
      section,
      phoneNumber,
      email,
      studentStatus
    };

    try {
      if (editingRollNumber) {
        // Edit Mode
        const res = await fetch(`/api/students/${editingRollNumber}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
          setStudents(students.map(s => s.rollNumber === editingRollNumber ? data : s));
          setIsModalOpen(false);
        } else {
          setFormError(data.error || "Failed to update student.");
        }
      } else {
        // Add Mode
        const res = await fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
          setStudents([...students, data]);
          setIsModalOpen(false);
        } else {
          setFormError(data.error || "Failed to add student.");
        }
      }
    } catch (err) {
      setFormError("Connection error. Please try again.");
    }
  };

  // CSV/Excel file parser & uploader
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const parsedData = XLSX.utils.sheet_to_json(ws);
        
        // Post parsing, upload to DB
        const res = await fetch('/api/students/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ students: parsedData })
        });
        const data = await res.json();
        if (res.ok) {
          alert(data.message || "Students imported successfully!");
          fetchStudents();
        } else {
          alert(data.error || "Failed to import students.");
        }
      } catch (err) {
        alert("Invalid spreadsheet file structure. Please ensure it has columns: Roll Number, Register Number, Student Name, Department, Year, Section, Email, Phone Number.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Filter and search logic
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.registerNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = filterDept === 'All' || s.department.toLowerCase() === filterDept.toLowerCase();
    const matchesSection = filterSection === 'All' || s.section.toLowerCase() === filterSection.toLowerCase();
    return matchesSearch && matchesDept && matchesSection;
  });

  return (
    <div className="space-y-6">
      {/* Search & Top Action Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative rounded-xl shadow-xs flex-1 sm:max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
              placeholder="Search by Name, Roll, Register..."
            />
          </div>

          {/* Department Filter */}
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs focus:ring-2 focus:ring-blue-500 text-slate-600 font-semibold"
          >
            <option value="All">All Departments</option>
            <option value="AI&DS">AI&DS</option>
            <option value="CSE">CSE</option>
            <option value="IT">IT</option>
            <option value="ECE">ECE</option>
          </select>

          {/* Section Filter */}
          <select
            value={filterSection}
            onChange={(e) => setFilterSection(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs focus:ring-2 focus:ring-blue-500 text-slate-600 font-semibold"
          >
            <option value="All">All Sections</option>
            <option value="A">A Section</option>
            <option value="B">B Section</option>
          </select>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />
          <button
            onClick={triggerFileSelect}
            className="px-3.5 py-2 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 flex items-center space-x-1.5 cursor-pointer shadow-xs"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Excel / CSV Import</span>
          </button>

          <button
            onClick={openAddModal}
            className="px-3.5 py-2 bg-blue-600 text-white text-xs font-black rounded-xl hover:bg-blue-700 flex items-center space-x-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Main Students Database Grid/List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-xs text-slate-500 mt-3 font-semibold">Loading Student Database...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            No students found matching filters. Try adjusting your search query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-500 border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Roll No</th>
                  <th className="py-3 px-4">Register No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Mentor Name</th>
                  <th className="py-3 px-4">Department / Yr / Sec</th>
                  <th className="py-3 px-4">Coding Profiles</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map(s => (
                  <tr key={s.rollNumber} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{s.rollNumber}</td>
                    <td className="py-3.5 px-4 font-mono">{s.registerNumber}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{s.studentName}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-600">{s.mentorName || '-'}</td>
                    <td className="py-3.5 px-4">
                      <span className="bg-blue-50 text-blue-850 px-2 py-0.5 rounded-sm text-[10px] font-bold border border-blue-100">
                        {s.department} {s.year} {s.section}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1">
                        {s.profileCompleted ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 w-fit">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Profile Completed ✅</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 w-fit">
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            <span>⚠️ Profile Incomplete</span>
                          </span>
                        )}
                        <div className="flex flex-wrap gap-1.5 text-[9px] font-mono">
                          <span className={s.profileLinks?.leetcode ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                            LeetCode {s.profileLinks?.leetcode ? '✅' : '❌'}
                          </span>
                          <span className={s.profileLinks?.codeforces ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                            Codeforces {s.profileLinks?.codeforces ? '✅' : '❌'}
                          </span>
                          <span className={s.profileLinks?.codechef ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                            CodeChef {s.profileLinks?.codechef ? '✅' : '❌'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        s.studentStatus === 'Active' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-red-50 text-red-800 border border-red-100'
                      }`}>
                        {s.studentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right flex justify-end gap-1.5">
                      <button
                        onClick={() => openSecurityModal(s)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-xl cursor-pointer"
                        title="Security Info & Login History"
                      >
                        <ShieldCheck className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleResetPassword(s)}
                        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-xl cursor-pointer"
                        title="Reset Student Password"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleLock(s)}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-xl cursor-pointer"
                        title="Toggle Account Lock State"
                      >
                        <Lock className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(s)}
                        className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
                        title="Edit profile"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(s.rollNumber)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-xl cursor-pointer"
                        title="Delete student"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-md font-bold text-slate-900">
                {editingRollNumber ? 'Edit Student Details' : 'Register New Student'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-800 text-xs font-semibold rounded-r-xl">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Roll Number *</label>
                  <input
                    type="text"
                    value={rollNumber}
                    disabled={editingRollNumber !== null}
                    onChange={(e) => setRollNumber(e.target.value)}
                    placeholder="22AD01"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Register Number *</label>
                  <input
                    type="text"
                    value={registerNumber}
                    onChange={(e) => setRegisterNumber(e.target.value)}
                    placeholder="717822AD001"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Full Name *</label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Arjun Kumar"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-2 py-1.5 text-xs focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="AI&DS">AI&DS</option>
                    <option value="CSE">CSE</option>
                    <option value="IT">IT</option>
                    <option value="ECE">ECE</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Year</label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-2 py-1.5 text-xs focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="I">I Year</option>
                    <option value="II">II Year</option>
                    <option value="III">III Year</option>
                    <option value="IV">IV Year</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Section</label>
                  <select
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-2 py-1.5 text-xs focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Phone Number</label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+919876543210"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="arjun@sctech.edu"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Student status</label>
                <select
                  value={studentStatus}
                  onChange={(e) => setStudentStatus(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Security & Login History Modal */}
      {securityStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500/20 text-cyan-400 rounded-xl border border-blue-400/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-display">Student Security Profile</h3>
                  <p className="text-[11px] text-slate-400">{securityStudent.studentName} ({securityStudent.registerNumber})</p>
                </div>
              </div>
              <button 
                onClick={() => setSecurityStudent(null)} 
                className="text-slate-400 hover:text-white p-1 rounded-xl bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {securityLoading ? (
                <div className="py-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
                  <p className="text-xs text-slate-500 font-semibold mt-3">Fetching security metrics...</p>
                </div>
              ) : securityInfo ? (
                <>
                  {/* Account Status Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Account Lock State</span>
                      <div className="flex items-center space-x-2">
                        {securityInfo.isLocked ? (
                          <>
                            <Lock className="w-4 h-4 text-red-500" />
                            <span className="text-xs font-bold text-red-600">LOCKED (5 Failed Attempts)</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span className="text-xs font-bold text-emerald-700">ACTIVE / UNLOCKED</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Password Status</span>
                      <div className="flex items-center space-x-2">
                        {securityInfo.passwordChanged ? (
                          <>
                            <ShieldCheck className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-bold text-blue-700">Custom Password</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                            <span className="text-xs font-bold text-amber-600">Default Password</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Reset Request Alert (if any) */}
                  {securityInfo.resetRequested && (
                    <div className="p-4 bg-amber-50 border border-amber-300/80 rounded-2xl flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <span className="font-bold text-amber-900 block">Password Reset Requested</span>
                        <p className="text-amber-800">Student submitted a password reset request on {securityInfo.resetRequestedAt ? new Date(securityInfo.resetRequestedAt).toLocaleString() : 'recently'}.</p>
                      </div>
                    </div>
                  )}

                  {/* Detailed Log Metrics */}
                  <div className="space-y-3 bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs">
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60">
                      <span className="text-slate-500 font-medium flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> Last Login Timestamp
                      </span>
                      <span className="font-bold text-slate-800 font-mono">
                        {securityInfo.lastLoginAt ? new Date(securityInfo.lastLoginAt).toLocaleString() : 'Never logged in'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60">
                      <span className="text-slate-500 font-medium flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5 text-slate-400" /> Password Changed At
                      </span>
                      <span className="font-bold text-slate-800 font-mono">
                        {securityInfo.lastPasswordChangedAt ? new Date(securityInfo.lastPasswordChangedAt).toLocaleString() : 'Not changed'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1.5">
                      <span className="text-slate-500 font-medium flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-slate-400" /> Failed Login Attempts
                      </span>
                      <span className={`font-bold font-mono px-2 py-0.5 rounded-full text-[10px] ${
                        securityInfo.failedAttempts > 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {securityInfo.failedAttempts} / 5
                      </span>
                    </div>
                  </div>

                  {/* Quick Admin Action Controls */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => handleToggleLock(securityStudent)}
                      className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {securityInfo.isLocked ? (
                        <>
                          <Unlock className="w-4 h-4 text-emerald-600" />
                          <span>Unlock Account</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 text-red-600" />
                          <span>Lock Account</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleResetPassword(securityStudent)}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Key className="w-4 h-4" />
                      <span>Reset Password</span>
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-xs text-slate-500 text-center">Unable to load security profile.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
