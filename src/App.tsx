import React, { useState, useEffect } from 'react';
import { UserSession } from './types';
import LoginScreen from './components/LoginScreen';
import StudentView from './components/StudentView';
import StaffDashboard from './components/StaffDashboard';
import ChangePasswordScreen from './components/ChangePasswordScreen';
import ProfileSetupScreen from './components/ProfileSetupScreen';
import DirectPollView from './components/DirectPollView';
import { StorageService } from './services/studentStorage';
import SmartPollLogo from './components/SmartPollLogo';
import Footer from './components/Footer';

export default function App() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [directPollId, setDirectPollId] = useState<string | null>(null);

  // Load session and check URL query parameters on initialization
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pId = params.get('poll') || params.get('pollId');
    if (pId) {
      setDirectPollId(pId);
    }

    const storedSession = localStorage.getItem('sc_poll_session');
    if (storedSession) {
      try {
        setSession(JSON.parse(storedSession));
      } catch (e) {
        console.error("Error loading session:", e);
        localStorage.removeItem('sc_poll_session');
        StorageService.clearProfile();
      }
    }
    setIsInitializing(false);
  }, []);

  const handleLoginSuccess = (newSession: UserSession) => {
    // Completely clear prior session caches to prevent data leakage
    sessionStorage.clear();
    StorageService.clearProfile();
    localStorage.removeItem('sc_poll_session');

    setSession(newSession);
    localStorage.setItem('sc_poll_session', JSON.stringify(newSession));
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem('sc_poll_session');
    StorageService.clearProfile();
    sessionStorage.clear();
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-500 font-semibold uppercase tracking-wide">Starting SC SkillTrack AI...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 text-slate-900">
      {/* Top Universal Branding Bar - Professional Polish style */}
      {!directPollId && (
        <header className="h-14 sm:h-16 bg-white border-b border-slate-200 flex items-center justify-between px-3 sm:px-6 lg:px-8 sticky top-0 z-40 no-print">
          <div className="max-w-7xl mx-auto flex justify-between items-center w-full gap-2">
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <SmartPollLogo size="md" showText={true} />
            </div>

            {session && (
              <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                <div className="flex flex-col items-end min-w-0">
                  <span className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-[100px] sm:max-w-xs">
                    {session.name || session.username}
                  </span>
                  <span className="text-[10px] sm:text-xs text-slate-500 font-medium truncate max-w-[110px] sm:max-w-xs">
                    {session.role === 'Staff' 
                      ? 'Staff • AI & DS Dept' 
                      : `Reg: ${session.username}`}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-2.5 sm:px-4 py-1.5 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {directPollId ? (
          <DirectPollView 
            pollId={directPollId} 
            onBackToLogin={() => {
              const url = new URL(window.location.href);
              url.searchParams.delete('poll');
              url.searchParams.delete('pollId');
              window.history.pushState({}, '', url.toString());
              setDirectPollId(null);
            }} 
          />
        ) : !session ? (
          <LoginScreen onLoginSuccess={handleLoginSuccess} />
        ) : session.role === 'Staff' ? (
          <StaffDashboard key={session.username} session={session} onLogout={handleLogout} />
        ) : !session.passwordChanged ? (
          <ChangePasswordScreen 
            key={session.username}
            session={session} 
            onPasswordChanged={handleLoginSuccess} 
            onLogout={handleLogout} 
          />
        ) : (!session.profileCompleted || !(session.profileLinks?.leetcode?.trim() && session.profileLinks?.codechef?.trim() && session.profileLinks?.codeforces?.trim())) ? (
          <ProfileSetupScreen
            key={session.username}
            session={session}
            onProfileCompleted={handleLoginSuccess}
            onLogout={handleLogout}
          />
        ) : (
          <StudentView key={session.username} session={session} onLogout={handleLogout} />
        )}
      </main>

      {/* FOOTER MANDATED ON ALL PAGES */}
      <Footer />
    </div>
  );
}
