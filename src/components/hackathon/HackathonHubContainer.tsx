import React, { useState, useEffect } from 'react';
import { 
  Trophy, Calendar, CheckCircle2, Users, ShieldCheck, 
  Award, BarChart3, Settings, Sparkles, Plus, Flame, Clock, RefreshCw 
} from 'lucide-react';
import { UserSession, Hackathon, HackathonRegistration } from '../../types';
import HackathonLogo from './HackathonLogo';
import HackathonDashboard from './HackathonDashboard';
import UpcomingHackathonsTab from './UpcomingHackathonsTab';
import MyHackathonsTab from './MyHackathonsTab';
import InternalSubmissionModal from './InternalSubmissionModal';
import TeamFinderTab from './TeamFinderTab';
import StatusTrackingTab from './StatusTrackingTab';
import CertificatesTab from './CertificatesTab';
import ReportsTab from './ReportsTab';
import AdminManagementTab from './AdminManagementTab';
import AIAssistantTab from './AIAssistantTab';

interface HackathonHubContainerProps {
  session: UserSession;
}

export default function HackathonHubContainer({ session }: HackathonHubContainerProps) {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [registrations, setRegistrations] = useState<HackathonRegistration[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncingLive, setSyncingLive] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Modal State for Internal Submission
  const [showSubmissionModal, setShowSubmissionModal] = useState<boolean>(false);
  const [selectedHackathonForSubmission, setSelectedHackathonForSubmission] = useState<Hackathon | null>(null);

  const isStaff = session.role === 'Staff';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [hRes, rRes] = await Promise.all([
        fetch('/api/hackathons'),
        fetch('/api/hackathon/registrations')
      ]);

      if (hRes.ok) {
        const hData = await hRes.json();
        setHackathons(hData);
      }

      if (rRes.ok) {
        const rData = await rRes.json();
        setRegistrations(rData);
      }
    } catch (err) {
      console.error("Error fetching Hackathon Hub data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncLiveHackathons = async () => {
    try {
      setSyncingLive(true);
      setSyncMessage(null);
      const res = await fetch('/api/hackathons/sync', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSyncMessage(`Fetched ${data.count} live hackathons!`);
        await fetchData();
        setTimeout(() => setSyncMessage(null), 4000);
      } else {
        setSyncMessage(data.error || 'Sync failed');
      }
    } catch (err) {
      setSyncMessage('Network error during sync');
    } finally {
      setSyncingLive(false);
    }
  };

  const handleOpenSubmissionModal = (hackathon?: Hackathon) => {
    setSelectedHackathonForSubmission(hackathon || null);
    setShowSubmissionModal(true);
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Trophy },
    { id: 'upcoming', label: 'Upcoming Hackathons', icon: Calendar },
    { id: 'my_hackathons', label: 'My Hackathons', icon: CheckCircle2, studentOnly: true },
    { id: 'team_finder', label: 'Team Finder', icon: Users },
    { id: 'status_tracking', label: 'Status Tracking', icon: ShieldCheck },
    { id: 'certificates', label: 'Certificates', icon: Award },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'ai_assistant', label: 'AI Copilot', icon: Sparkles },
    ...(isStaff ? [{ id: 'admin', label: 'Admin Review', icon: Settings }] : [])
  ];

  const visibleTabs = tabs.filter(t => !t.studentOnly || !isStaff);

  return (
    <div className="space-y-6">
      {/* Module Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <HackathonLogo size="lg" />

        {/* Action Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            onClick={handleSyncLiveHackathons}
            disabled={syncingLive}
            className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-extrabold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            title="Sync live real-time upcoming hackathons from Unstop & Devpost"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${syncingLive ? 'animate-spin' : ''}`} />
            <span>{syncingLive ? 'Syncing...' : 'Sync Live Hackathons'}</span>
          </button>

          <button
            onClick={() => handleOpenSubmissionModal()}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Submit Registration Proof</span>
          </button>
        </div>
      </div>

      {/* Primary Sub-Navigation Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-2xs overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 min-w-max">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-amber-600'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto" />
          <p className="text-xs font-bold text-slate-500">Loading SC Hackathon Hub...</p>
        </div>
      ) : (
        /* Tab Content Renderer */
        <div className="transition-all">
          {activeTab === 'dashboard' && (
            <HackathonDashboard
              session={session}
              hackathons={hackathons}
              registrations={registrations}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenInternalSubmission={(h) => handleOpenSubmissionModal(h)}
            />
          )}

          {activeTab === 'upcoming' && (
            <UpcomingHackathonsTab
              hackathons={hackathons}
              onOpenInternalSubmission={(h) => handleOpenSubmissionModal(h)}
              onOpenTeamFinder={() => setActiveTab('team_finder')}
              onSyncLive={handleSyncLiveHackathons}
              syncingLive={syncingLive}
              syncMessage={syncMessage}
            />
          )}

          {activeTab === 'my_hackathons' && (
            <MyHackathonsTab
              session={session}
              registrations={registrations}
              onOpenUploadCertificate={() => setActiveTab('certificates')}
              onOpenInternalSubmissionModal={() => handleOpenSubmissionModal()}
            />
          )}

          {activeTab === 'team_finder' && (
            <TeamFinderTab
              session={session}
              hackathons={hackathons}
            />
          )}

          {activeTab === 'status_tracking' && (
            <StatusTrackingTab
              session={session}
              registrations={registrations}
            />
          )}

          {activeTab === 'certificates' && (
            <CertificatesTab
              session={session}
              hackathons={hackathons}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsTab
              hackathons={hackathons}
              registrations={registrations}
            />
          )}

          {activeTab === 'ai_assistant' && (
            <AIAssistantTab />
          )}

          {activeTab === 'admin' && isStaff && (
            <AdminManagementTab
              session={session}
              hackathons={hackathons}
              registrations={registrations}
              onRefreshData={fetchData}
            />
          )}
        </div>
      )}

      {/* Internal Registration Modal */}
      {showSubmissionModal && (
        <InternalSubmissionModal
          session={session}
          hackathons={hackathons}
          selectedHackathon={selectedHackathonForSubmission}
          onClose={() => setShowSubmissionModal(false)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}
