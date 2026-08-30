import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Mic, BarChart3, Users, FileText, Sparkles, Trophy, GraduationCap, 
  Activity, ShieldCheck, Compass, FileCheck 
} from 'lucide-react';
import { UserSession } from '../types';
import CreatePollTab from './CreatePollTab';
import ActivePollsTab from './ActivePollsTab';
import StudentsTab from './StudentsTab';
import ReportsTab from './ReportsTab';
import HackathonHubContainer from './hackathon/HackathonHubContainer';
import CodeAnalyticsContainer from './analytics/CodeAnalyticsContainer';
import CareerOpportunitiesHub from './opportunities/CareerOpportunitiesHub';
import InternalRegistrationManagement from './opportunities/InternalRegistrationManagement';
import SIDHCourseTrackerContainer from './sidh/SIDHCourseTrackerContainer';
import StaffResumeAnalyticsView from './resume/StaffResumeAnalyticsView';

interface StaffDashboardProps {
  session: UserSession;
  onLogout: () => void;
}

export default function StaffDashboard({ session, onLogout }: StaffDashboardProps) {
  const [activeTab, setActiveTab] = useState<'create' | 'active' | 'students' | 'reports' | 'opportunities' | 'internal-registrations' | 'hackathons' | 'code-analytics' | 'sidh-tracker' | 'resume-analytics'>('create');

  const staffName = session.name || (
    session.username.toLowerCase() === 'padmapriya' ? 'Padmapriya' : 
    session.username.toLowerCase() === 'prema' ? 'Prema' : 
    session.username.toLowerCase() === 'gowtham' ? 'Gowtham' : 'Staff Admin'
  );

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 md:px-8 py-4 sm:py-8">
      {/* Premium Glassmorphism Hero Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl mb-5 sm:mb-8 p-4 sm:p-6 md:p-8 border border-slate-200/80 shadow-xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white"
      >
        {/* Subtle Background Accent Glows */}
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-orange-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 min-w-0">
            {/* Header Icon */}
            <div 
              className="p-2.5 sm:p-3.5 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-blue-600 text-white shadow-lg shrink-0 border border-white/20"
            >
              <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>

            <div className="space-y-1 sm:space-y-1.5 min-w-0">
              {/* Badge Pills */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30 backdrop-blur-md flex items-center gap-1">
                  <Activity className="w-3 h-3 text-blue-400 animate-pulse shrink-0" /> Live Tracking
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/30 backdrop-blur-md flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-amber-400 shrink-0" /> Academic Division
                </span>
              </div>

              {/* Title */}
              <h1 
                className="text-lg sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight font-display flex items-center gap-1.5"
              >
                🎓 Student Tracking System
              </h1>

              {/* Subtitle */}
              <p 
                className="text-xs sm:text-sm text-slate-300 max-w-2xl font-normal leading-relaxed"
              >
                Track student participation, hackathon registrations, qualification progress, and academic activities in real time.
              </p>
            </div>
          </div>

          {/* User Profile Info Card */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-inner self-stretch lg:self-auto justify-between lg:justify-start"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-md shrink-0">
              {staffName.charAt(0)}
            </div>
            <div>
              <div className="text-[10px] sm:text-xs text-slate-400 font-medium">Logged in Coordinator</div>
              <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                {staffName}
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Staff Menu Tabs Selection Bar with Motion Underline Indicator */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5 sm:gap-2 mb-6 sm:mb-8 bg-slate-200/70 p-1.5 sm:p-2 rounded-2xl border border-slate-300/60 shadow-sm backdrop-blur-md">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveTab('create')}
          className={`relative flex items-center justify-center space-x-1.5 sm:space-x-2 py-2.5 sm:py-3.5 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer min-w-0 ${
            activeTab === 'create'
              ? 'bg-white text-blue-600 shadow-md border border-slate-200'
              : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Mic className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="truncate">Create Poll</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveTab('active')}
          className={`relative flex items-center justify-center space-x-1.5 sm:space-x-2 py-2.5 sm:py-3.5 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer min-w-0 ${
            activeTab === 'active'
              ? 'bg-white text-blue-600 shadow-md border border-slate-200'
              : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="truncate">Active Polls</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveTab('students')}
          className={`relative flex items-center justify-center space-x-1.5 sm:space-x-2 py-2.5 sm:py-3.5 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer min-w-0 ${
            activeTab === 'students'
              ? 'bg-white text-blue-600 shadow-md border border-slate-200'
              : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Users className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="truncate">Students</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveTab('reports')}
          className={`relative flex items-center justify-center space-x-1.5 sm:space-x-2 py-2.5 sm:py-3.5 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer min-w-0 ${
            activeTab === 'reports'
              ? 'bg-white text-blue-600 shadow-md border border-slate-200'
              : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="truncate">Reports</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setActiveTab('code-analytics')}
          className={`relative flex items-center justify-center space-x-1.5 sm:space-x-2 py-2.5 sm:py-3.5 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer min-w-0 ${
            activeTab === 'code-analytics'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 border border-blue-400'
              : 'bg-blue-100/80 text-blue-900 hover:bg-blue-200/80 border border-blue-300/70'
          }`}
        >
          <Activity className="w-4 h-4 text-blue-600 fill-blue-600/30 shrink-0" />
          <span className="font-extrabold tracking-wide truncate">Code Analytics</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setActiveTab('opportunities')}
          className={`relative flex items-center justify-center space-x-1.5 sm:space-x-2 py-2.5 sm:py-3.5 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer min-w-0 ${
            activeTab === 'opportunities'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25 border border-indigo-400'
              : 'bg-indigo-100/80 text-indigo-950 hover:bg-indigo-200/80 border border-indigo-300/70'
          }`}
        >
          <Compass className="w-4 h-4 text-indigo-600 fill-indigo-600/30 shrink-0" />
          <span className="font-extrabold tracking-wide truncate">Opportunities</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setActiveTab('internal-registrations')}
          className={`relative flex items-center justify-center space-x-1.5 sm:space-x-2 py-2.5 sm:py-3.5 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer min-w-0 ${
            activeTab === 'internal-registrations'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25 border border-emerald-400'
              : 'bg-emerald-100/80 text-emerald-950 hover:bg-emerald-200/80 border border-emerald-300/70'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600 fill-emerald-600/30 shrink-0" />
          <span className="font-extrabold tracking-wide truncate">Registrations</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setActiveTab('hackathons')}
          className={`relative flex items-center justify-center space-x-1.5 sm:space-x-2 py-2.5 sm:py-3.5 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer min-w-0 ${
            activeTab === 'hackathons'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/25 border border-orange-400'
              : 'bg-amber-100/80 text-amber-900 hover:bg-amber-200/80 border border-amber-300/70'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-400 fill-amber-400/30 shrink-0" />
          <span className="font-extrabold tracking-wide truncate">Hackathon Hub</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setActiveTab('sidh-tracker')}
          className={`relative flex items-center justify-center space-x-1.5 sm:space-x-2 py-2.5 sm:py-3.5 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer min-w-0 ${
            activeTab === 'sidh-tracker'
              ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg shadow-teal-500/25 border border-teal-400'
              : 'bg-teal-100/80 text-teal-950 hover:bg-teal-200/80 border border-teal-300/70'
          }`}
        >
          <GraduationCap className="w-4 h-4 text-teal-600 shrink-0" />
          <span className="font-extrabold tracking-wide truncate">SIDH Courses</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setActiveTab('resume-analytics')}
          className={`relative flex items-center justify-center space-x-1.5 sm:space-x-2 py-2.5 sm:py-3.5 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer min-w-0 ${
            activeTab === 'resume-analytics'
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25 border border-violet-400'
              : 'bg-violet-100/80 text-violet-950 hover:bg-violet-200/80 border border-violet-300/70'
          }`}
        >
          <FileCheck className="w-4 h-4 text-violet-600 shrink-0" />
          <span className="font-extrabold tracking-wide truncate">Resume Analytics</span>
        </motion.button>
      </div>

      {/* Render Active Tab Screen */}
      <motion.div 
        key={activeTab}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        {activeTab === 'create' && <CreatePollTab onPollCreated={() => setActiveTab('active')} />}
        {activeTab === 'active' && <ActivePollsTab />}
        {activeTab === 'students' && <StudentsTab />}
        {activeTab === 'reports' && <ReportsTab />}
        {activeTab === 'opportunities' && <CareerOpportunitiesHub session={session} />}
        {activeTab === 'internal-registrations' && <InternalRegistrationManagement session={session} />}
        {activeTab === 'code-analytics' && <CodeAnalyticsContainer key={session.username} session={session} />}
        {activeTab === 'hackathons' && <HackathonHubContainer session={session} />}
        {activeTab === 'sidh-tracker' && <SIDHCourseTrackerContainer session={session} />}
        {activeTab === 'resume-analytics' && <StaffResumeAnalyticsView />}
      </motion.div>
    </div>
  );
}
