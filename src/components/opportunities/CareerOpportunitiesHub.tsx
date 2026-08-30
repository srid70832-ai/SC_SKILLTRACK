import React, { useState, useEffect } from 'react';
import { 
  Trophy, Briefcase, Compass, Search, Filter, RefreshCw, Calendar, 
  MapPin, Users, Award, ExternalLink, Bookmark, Share2, Bell, Clock, 
  Sparkles, CheckCircle2, AlertCircle, ArrowUpDown, ChevronRight, Zap, 
  Code, Shield, Cpu, Globe, Cloud, Smartphone, Flame, Check, X, ShieldCheck, Plus
} from 'lucide-react';
import { Opportunity, OpportunityDomain, OpportunityCategory, UserSession } from '../../types';
import InternalRegistrationModal from './InternalRegistrationModal';
import InternalRegistrationManagement from './InternalRegistrationManagement';
import StudentInternalRegistrationsList from './StudentInternalRegistrationsList';

interface CareerOpportunitiesHubProps {
  session?: UserSession;
}

const DOMAINS: OpportunityDomain[] = [
  'AI', 'ML', 'Data Science', 'Cyber Security', 'IoT', 
  'Web', 'Mobile', 'Cloud', 'Robotics', 'Blockchain', 'Open Source'
];

const CATEGORIES: OpportunityCategory[] = [
  'Hackathons', 'AI Competitions', 'Coding Challenges', 
  'Smart India Hackathon', 'Capture The Flag (CTF)', 'Ideathons', 'Internships'
];

type MainTab = 'hackathons' | 'competitions' | 'internships' | 'internal_registrations';
type SortOption = 'latest' | 'closing_soon' | 'highest_prize' | 'ai_first' | 'beginner';

export default function CareerOpportunitiesHub({ session }: CareerOpportunitiesHubProps) {
  const [activeTab, setActiveTab] = useState<MainTab>('hackathons');
  const [internalRegModalOpp, setInternalRegModalOpp] = useState<Opportunity | null>(null);
  const [showGenericInternalModal, setShowGenericInternalModal] = useState<boolean>(false);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  // Filters & Sorting State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDomain, setSelectedDomain] = useState<string>('All');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('All');
  const [selectedMode, setSelectedMode] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [showPastOpportunities, setShowPastOpportunities] = useState<boolean>(false);

  // User Interactive State (Bookmarks, Toast, Remind Modal)
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sc_bookmarked_opportunities');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [reminderModalOpp, setReminderModalOpp] = useState<Opportunity | null>(null);
  const [reminderDays, setReminderDays] = useState<number>(1);
  const [detailModalOpp, setDetailModalOpp] = useState<Opportunity | null>(null);

  // Live countdown ticker state
  const [nowTime, setNowTime] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNowTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchOpportunities();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('sc_bookmarked_opportunities', JSON.stringify(bookmarkedIds));
    } catch (e) {
      console.error(e);
    }
  }, [bookmarkedIds]);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      setSyncError(null);
      const res = await fetch('/api/opportunities');
      const data = await res.json();

      if (res.ok && data.opportunities && Array.isArray(data.opportunities)) {
        setOpportunities(data.opportunities);
        if (data.lastSyncedAt) setLastSyncedAt(data.lastSyncedAt);
        if (data.error) setSyncError(data.error);
      } else {
        setSyncError(data.error || 'Unable to fetch latest opportunities.');
        setOpportunities([]);
      }
    } catch (err: any) {
      console.error('Error fetching opportunities:', err);
      setSyncError('Unable to fetch latest opportunities.');
      setOpportunities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSync = async () => {
    try {
      setSyncing(true);
      setSyncError(null);
      setSyncSuccessMsg(null);
      const res = await fetch('/api/opportunities/sync', { method: 'POST' });
      const data = await res.json();

      if (res.ok && data.success) {
        setOpportunities(data.opportunities || []);
        setLastSyncedAt(data.syncedAt);
        setSyncSuccessMsg(`Successfully synchronized ${data.count} live opportunities from HireToday!`);
        setTimeout(() => setSyncSuccessMsg(null), 5000);
      } else {
        setSyncError(data.error || 'Unable to fetch latest opportunities.');
      }
    } catch (err) {
      setSyncError('Unable to fetch latest opportunities.');
    } finally {
      setSyncing(false);
    }
  };

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (bookmarkedIds.includes(id)) {
      setBookmarkedIds(bookmarkedIds.filter(bId => bId !== id));
      showToast('Removed from Bookmarks');
    } else {
      setBookmarkedIds([...bookmarkedIds, id]);
      showToast('Saved to Bookmarks');
    }
  };

  const handleShare = (opp: Opportunity, e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = opp.officialUrl || window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      showToast('Official opportunity link copied to clipboard!');
    } else {
      showToast(`Share URL: ${shareUrl}`);
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const generateGoogleCalendarUrl = (opp: Opportunity) => {
    const title = encodeURIComponent(`[Deadline] ${opp.title} - ${opp.companyOrOrganizer}`);
    const details = encodeURIComponent(`Opportunity details:\n${opp.shortDescription}\n\nOfficial Link: ${opp.officialUrl}`);
    const location = encodeURIComponent(opp.location || 'Online');
    
    let startTime = new Date(opp.registrationDeadline);
    if (isNaN(startTime.getTime())) startTime = new Date(Date.now() + 86400000);
    const startIso = startTime.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const endTime = new Date(startTime.getTime() + 3600000);
    const endIso = endTime.toISOString().replace(/-|:|\.\d\d\d/g, '');

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${startIso}/${endIso}`;
  };

  // Filter logic based on tab, domain, category, search, and past toggle
  const filteredOpportunities = opportunities.filter((opp) => {
    // 1. Tab filter
    if (activeTab === 'hackathons') {
      const isHackathonType = opp.type === 'Hackathon' || 
        ['Hackathons', 'Smart India Hackathon', 'Ideathons'].includes(opp.category);
      if (!isHackathonType) return false;
    } else if (activeTab === 'competitions') {
      const isCompType = opp.type === 'Competition' || 
        ['AI Competitions', 'Coding Challenges', 'Capture The Flag (CTF)'].includes(opp.category);
      if (!isCompType) return false;
    } else if (activeTab === 'internships') {
      const isIntern = opp.type === 'Internship' || opp.category === 'Internships';
      if (!isIntern) return false;
    }

    // 2. Past filter vs active
    const isPast = opp.isExpired || (new Date(opp.registrationDeadline).getTime() < Date.now());
    if (showPastOpportunities) {
      if (!isPast) return false;
    } else {
      if (isPast) return false;
    }

    // 3. Subcategory Filter
    if (selectedSubCategory !== 'All') {
      if (opp.category.toLowerCase() !== selectedSubCategory.toLowerCase()) return false;
    }

    // 4. Domain Filter
    if (selectedDomain !== 'All') {
      const domMatch = opp.domain.toLowerCase().includes(selectedDomain.toLowerCase()) ||
        (opp.skillsRequired && opp.skillsRequired.some(s => s.toLowerCase().includes(selectedDomain.toLowerCase())));
      if (!domMatch) return false;
    }

    // 5. Mode Filter
    if (selectedMode !== 'All') {
      if (opp.mode.toLowerCase() !== selectedMode.toLowerCase()) return false;
    }

    // 6. Search Query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchTitle = opp.title.toLowerCase().includes(q);
      const matchCompany = opp.companyOrOrganizer.toLowerCase().includes(q);
      const matchDesc = opp.shortDescription.toLowerCase().includes(q);
      const matchSkills = opp.skillsRequired && opp.skillsRequired.some(s => s.toLowerCase().includes(q));
      if (!matchTitle && !matchCompany && !matchDesc && !matchSkills) return false;
    }

    return true;
  });

  // Sorting
  const sortedOpportunities = [...filteredOpportunities].sort((a, b) => {
    if (sortBy === 'closing_soon') {
      const timeA = new Date(a.registrationDeadline).getTime() || Infinity;
      const timeB = new Date(b.registrationDeadline).getTime() || Infinity;
      return timeA - timeB;
    }
    if (sortBy === 'highest_prize') {
      const getNum = (str: string) => {
        const matches = str.match(/\d[\d,.]*/);
        return matches ? parseFloat(matches[0].replace(/,/g, '')) : 0;
      };
      return getNum(b.prizePool) - getNum(a.prizePool);
    }
    if (sortBy === 'ai_first') {
      const aHasAi = a.domain.toLowerCase().includes('ai') ? 1 : 0;
      const bHasAi = b.domain.toLowerCase().includes('ai') ? 1 : 0;
      return bHasAi - aHasAi;
    }
    if (sortBy === 'beginner') {
      const aBeg = a.difficultyLevel === 'Beginner Friendly' ? 1 : 0;
      const bBeg = b.difficultyLevel === 'Beginner Friendly' ? 1 : 0;
      return bBeg - aBeg;
    }
    // Default: 'latest'
    const timeA = new Date(a.postedAt || a.registrationOpens).getTime() || 0;
    const timeB = new Date(b.postedAt || b.registrationOpens).getTime() || 0;
    return timeB - timeA;
  });

  const getCountdownString = (deadlineIso: string) => {
    const target = new Date(deadlineIso).getTime();
    if (isNaN(target)) return 'Date TBA';
    const diff = target - nowTime;
    if (diff <= 0) return 'Registration Closed';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) return `${days}d ${hours}h ${mins}m left`;
    return `${hours}h ${mins}m ${secs}s left`;
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center space-x-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Hero Header & Live Sync Bar */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 p-6 md:p-8 text-white shadow-2xl border border-indigo-900/50">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
              <span>HireToday Live Integration Engine</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-display text-white">
              Career & Opportunities Hub
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Explore real-time synchronized hackathons, competitive AI coding challenges, and high-impact internships powered directly by HireToday.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <button
              onClick={handleManualSync}
              disabled={syncing}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm px-5 py-3 rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer border border-blue-400/30"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Synchronizing...' : 'Sync Opportunities'}</span>
            </button>
          </div>
        </div>

        {/* Sync Status Banner */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Source: <a href="https://www.hiretoday.in/home" target="_blank" rel="noreferrer" className="text-indigo-300 underline font-semibold hover:text-white">HireToday (www.hiretoday.in)</a></span>
          </div>
          <div>
            {lastSyncedAt ? (
              <span>Last Synchronized: {new Date(lastSyncedAt).toLocaleTimeString()} ({new Date(lastSyncedAt).toLocaleDateString()})</span>
            ) : (
              <span>Auto-Sync Interval: Every 6 Hours</span>
            )}
          </div>
        </div>
      </div>

      {/* Sync Success or Failure Alert Messages */}
      {syncSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{syncSuccessMsg}</span>
          </div>
          <button onClick={() => setSyncSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-900"><X className="w-4 h-4" /></button>
        </div>
      )}

      {syncError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 text-sm font-semibold p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <span>Unable to fetch latest opportunities.</span>
          </div>
          <button onClick={handleManualSync} className="text-amber-700 underline text-xs font-bold hover:text-amber-950">Retry Sync</button>
        </div>
      )}

      {/* Main Category Tabs Bar (4 Main Tabs + Past Toggle) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white/80 backdrop-blur-md p-1.5 sm:p-2 rounded-2xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 w-full">
          <button
            onClick={() => { setActiveTab('hackathons'); setSelectedSubCategory('All'); }}
            className={`flex items-center justify-center space-x-1.5 sm:space-x-2 py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer min-w-0 ${
              activeTab === 'hackathons'
                ? 'bg-amber-500 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Trophy className="w-4 h-4 shrink-0" />
            <span className="truncate">Hackathons</span>
          </button>

          <button
            onClick={() => { setActiveTab('competitions'); setSelectedSubCategory('All'); }}
            className={`flex items-center justify-center space-x-1.5 sm:space-x-2 py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer min-w-0 ${
              activeTab === 'competitions'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Compass className="w-4 h-4 shrink-0" />
            <span className="truncate">Competitions</span>
          </button>

          <button
            onClick={() => { setActiveTab('internships'); setSelectedSubCategory('All'); }}
            className={`flex items-center justify-center space-x-1.5 sm:space-x-2 py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer min-w-0 ${
              activeTab === 'internships'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-4 h-4 shrink-0" />
            <span className="truncate">Internships</span>
          </button>

          <button
            onClick={() => { setActiveTab('internal_registrations'); setSelectedSubCategory('All'); }}
            className={`flex items-center justify-center space-x-1.5 sm:space-x-2 py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer min-w-0 ${
              activeTab === 'internal_registrations'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/80'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600 fill-emerald-600/20 shrink-0" />
            <span className="font-extrabold truncate">Internal Registrations</span>
          </button>
        </div>

        {/* Toggle Past Opportunities */}
        <div className="flex items-center justify-end px-2">
          <button
            onClick={() => setShowPastOpportunities(!showPastOpportunities)}
            className={`flex items-center space-x-2 text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer border ${
              showPastOpportunities
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{showPastOpportunities ? 'Showing Past Opportunities' : 'Show Past / Expired'}</span>
          </button>
        </div>
      </div>

      {activeTab === 'internal_registrations' ? (
        session?.role === 'Staff' ? (
          <InternalRegistrationManagement session={session} />
        ) : (
          <StudentInternalRegistrationsList session={session || { username: 'student', role: 'Student' }} />
        )
      ) : (
        <>
          {/* Subcategory Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs font-semibold">
        <span className="text-slate-400 font-bold uppercase tracking-wider px-1">Category:</span>
        <button
          onClick={() => setSelectedSubCategory('All')}
          className={`px-3 py-1.5 rounded-full border transition-all whitespace-nowrap cursor-pointer ${
            selectedSubCategory === 'All'
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
        >
          All Categories
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedSubCategory(cat)}
            className={`px-3 py-1.5 rounded-full border transition-all whitespace-nowrap cursor-pointer ${
              selectedSubCategory === cat
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Filters & Search Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        {/* Search Field */}
        <div className="relative md:col-span-5">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search by title, organizer, company, domain, or skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Domain Filter Dropdown */}
        <div className="md:col-span-3">
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">🌐 All Domains</option>
            {DOMAINS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Mode Filter Dropdown */}
        <div className="md:col-span-2">
          <select
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value)}
            className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">📍 All Modes</option>
            <option value="Online">Online</option>
            <option value="Offline">Offline</option>
            <option value="Hybrid">Hybrid</option>
          </select>
        </div>

        {/* Sorting Dropdown */}
        <div className="md:col-span-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="latest">⏱️ Latest Posted</option>
            <option value="closing_soon">⌛ Closing Soon</option>
            <option value="highest_prize">🏆 Highest Prize/Stipend</option>
            <option value="ai_first">🤖 AI Domain First</option>
            <option value="beginner">🌱 Beginner Friendly</option>
          </select>
        </div>
      </div>

      {/* Domain Quick-Chips Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-semibold">
        <span className="text-slate-400 font-bold uppercase tracking-wider px-1">Domain Tags:</span>
        <button
          onClick={() => setSelectedDomain('All')}
          className={`px-3 py-1 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
            selectedDomain === 'All'
              ? 'bg-blue-600 text-white font-bold shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All
        </button>
        {DOMAINS.map((domain) => (
          <button
            key={domain}
            onClick={() => setSelectedDomain(domain)}
            className={`px-3 py-1 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              selectedDomain === domain
                ? 'bg-blue-600 text-white font-bold shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {domain}
          </button>
        ))}
      </div>

      {/* Content Grid Header / Counter */}
      <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
        <span>
          Showing {sortedOpportunities.length} {activeTab} {showPastOpportunities ? '(Past)' : ''}
        </span>
        {bookmarkedIds.length > 0 && (
          <span className="text-indigo-600">
            {bookmarkedIds.length} Saved Bookmark{bookmarkedIds.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Opportunities Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-80 bg-slate-100 animate-pulse rounded-3xl border border-slate-200"></div>
          ))}
        </div>
      ) : sortedOpportunities.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No Opportunities Found</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            {syncError 
              ? syncError 
              : `No ${activeTab} matching your current search criteria. Try clearing your filters or refreshing sync.`}
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedDomain('All');
              setSelectedSubCategory('All');
              setSelectedMode('All');
              setShowPastOpportunities(false);
            }}
            className="inline-flex items-center space-x-2 bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedOpportunities.map((opp) => {
            const isBookmarked = bookmarkedIds.includes(opp.id);
            const countdownStr = getCountdownString(opp.registrationDeadline);
            const isClosingSoon = countdownStr.includes('h left') || countdownStr.includes('1d') || countdownStr.includes('2d');

            return (
              <div
                key={opp.id}
                onClick={() => setDetailModalOpp(opp)}
                className="group relative bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/80 hover:border-blue-400 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer transform hover:-translate-y-1"
              >
                {/* Header Banner Image & Badges */}
                <div className="relative h-40 w-full bg-slate-900 overflow-hidden">
                  <img
                    src={opp.logoUrl || opp.bannerUrl || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80'}
                    alt={opp.title}
                    className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>

                  {/* Top Action Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-white/20 uppercase tracking-wider">
                        {opp.category}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border uppercase tracking-wider ${
                        opp.mode === 'Online'
                          ? 'bg-emerald-500/90 text-white border-emerald-400/30'
                          : opp.mode === 'Hybrid'
                          ? 'bg-amber-500/90 text-white border-amber-400/30'
                          : 'bg-indigo-500/90 text-white border-indigo-400/30'
                      }`}>
                        {opp.mode}
                      </span>
                      {opp.isNew && (
                        <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse shadow-sm">
                          NEW
                        </span>
                      )}
                    </div>

                    {/* Bookmark Toggle Button */}
                    <button
                      onClick={(e) => toggleBookmark(opp.id, e)}
                      className={`p-2 rounded-full backdrop-blur-md transition-all cursor-pointer ${
                        isBookmarked
                          ? 'bg-rose-500 text-white shadow-lg'
                          : 'bg-slate-900/60 text-white hover:bg-slate-900'
                      }`}
                    >
                      <Bookmark className="w-4 h-4 fill-current" />
                    </button>
                  </div>

                  {/* Company & Title Overlay */}
                  <div className="absolute bottom-3 left-3 right-3 z-10">
                    <span className="text-xs font-semibold text-blue-300 block truncate">
                      {opp.companyOrOrganizer}
                    </span>
                    <h3 className="text-base font-bold text-white line-clamp-1 group-hover:text-blue-200 transition-colors">
                      {opp.title}
                    </h3>
                  </div>
                </div>

                {/* Card Content Body */}
                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  {/* Countdown Timer Bar */}
                  <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold ${
                    isClosingSoon
                      ? 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <div className="flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Deadline:</span>
                    </div>
                    <span className="font-extrabold">{countdownStr}</span>
                  </div>

                  {/* Domain & Skills Tag Chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {opp.domain.split(',').map((d, idx) => (
                      <span key={idx} className="bg-blue-50 text-blue-700 border border-blue-100 text-[11px] font-bold px-2.5 py-0.5 rounded-lg">
                        {d.trim()}
                      </span>
                    ))}
                    {opp.difficultyLevel && (
                      <span className="bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-semibold px-2 py-0.5 rounded-lg">
                        🌱 {opp.difficultyLevel}
                      </span>
                    )}
                  </div>

                  {/* Short Description */}
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {opp.shortDescription}
                  </p>

                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs font-semibold">
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 space-y-0.5">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Prize / Stipend</span>
                      <span className="text-emerald-700 font-extrabold truncate block flex items-center space-x-1">
                        <Sparkles className="w-3 h-3 text-amber-500 inline mr-1" />
                        {opp.prizePool}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 space-y-0.5">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Team / Eligibility</span>
                      <span className="text-slate-800 font-bold truncate block">
                        {opp.teamSize}
                      </span>
                    </div>
                  </div>

                  {/* Action Footer Bar */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5 z-10" onClick={(e) => e.stopPropagation()}>
                    <a
                      href={opp.officialUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 inline-flex items-center justify-center space-x-1 bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold py-2.5 px-3 rounded-xl shadow-sm transition-all cursor-pointer"
                    >
                      <span>Official</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setInternalRegModalOpp(opp);
                      }}
                      className="flex-1 inline-flex items-center justify-center space-x-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold py-2.5 px-3 rounded-xl shadow-sm transition-all cursor-pointer"
                      title="Submit Internal Registration Proof"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Internal Submit</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setReminderModalOpp(opp);
                      }}
                      title="Remind Me"
                      className="p-2.5 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800 rounded-xl transition-all cursor-pointer border border-slate-200"
                    >
                      <Bell className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
    )}

      {/* Detail Modal */}
      {detailModalOpp && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 relative">
            <button
              onClick={() => setDetailModalOpp(null)}
              className="absolute top-4 right-4 z-20 bg-slate-900/60 hover:bg-slate-900 text-white p-2 rounded-full backdrop-blur-md transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative h-48 bg-slate-900">
              <img
                src={detailModalOpp.bannerUrl || detailModalOpp.logoUrl}
                alt={detailModalOpp.title}
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
              <div className="absolute bottom-4 left-6 right-6 text-white space-y-1">
                <span className="bg-blue-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wide inline-block">
                  {detailModalOpp.category} • {detailModalOpp.mode}
                </span>
                <h2 className="text-xl font-extrabold">{detailModalOpp.title}</h2>
                <p className="text-xs text-blue-200 font-medium">{detailModalOpp.companyOrOrganizer}</p>
              </div>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="text-slate-400 font-bold block mb-1">Prize / Stipend</span>
                  <span className="text-emerald-700 font-extrabold text-sm">{detailModalOpp.prizePool}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="text-slate-400 font-bold block mb-1">Team Size</span>
                  <span className="text-slate-800 font-bold text-sm">{detailModalOpp.teamSize}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="text-slate-400 font-bold block mb-1">Location</span>
                  <span className="text-slate-800 font-bold text-sm">{detailModalOpp.location}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="text-slate-400 font-bold block mb-1">Difficulty</span>
                  <span className="text-slate-800 font-bold text-sm">{detailModalOpp.difficultyLevel}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">Description & Details</h4>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{detailModalOpp.shortDescription}</p>
              </div>

              <div>
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">Eligibility Criteria</h4>
                <p className="text-sm text-slate-700 font-medium">{detailModalOpp.eligibility}</p>
              </div>

              <div>
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">Required Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {detailModalOpp.skillsRequired.map((skill, idx) => (
                    <span key={idx} className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold px-3 py-1 rounded-xl">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
                <a
                  href={detailModalOpp.officialUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3 px-6 rounded-2xl shadow-lg transition-all cursor-pointer"
                >
                  <span>Apply on Official Site</span>
                  <ExternalLink className="w-4 h-4" />
                </a>

                <button
                  onClick={() => {
                    setReminderModalOpp(detailModalOpp);
                    setDetailModalOpp(null);
                  }}
                  className="flex items-center space-x-2 bg-slate-100 hover:bg-amber-100 text-slate-800 font-bold text-sm py-3 px-5 rounded-2xl transition-all cursor-pointer border border-slate-200"
                >
                  <Bell className="w-4 h-4 text-amber-600" />
                  <span>Set Reminder</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remind Me Modal */}
      {reminderModalOpp && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-6 relative">
            <button
              onClick={() => setReminderModalOpp(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 text-amber-600">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Set Event Reminder</h3>
                <p className="text-xs text-slate-500">{reminderModalOpp.title}</p>
              </div>
            </div>

            <div className="space-y-4 text-sm text-slate-700">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                <div><span className="font-bold text-slate-500">Organizer:</span> {reminderModalOpp.companyOrOrganizer}</div>
                <div><span className="font-bold text-slate-500">Deadline:</span> {new Date(reminderModalOpp.registrationDeadline).toLocaleString()}</div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Remind Me</label>
                <select
                  value={reminderDays}
                  onChange={(e) => setReminderDays(Number(e.target.value))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value={1}>1 Day Before Deadline</option>
                  <option value={2}>2 Days Before Deadline</option>
                  <option value={3}>3 Days Before Deadline</option>
                  <option value={7}>1 Week Before Deadline</option>
                </select>
              </div>

              <div className="pt-2 space-y-2">
                <a
                  href={generateGoogleCalendarUrl(reminderModalOpp)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => {
                    showToast('Opening Google Calendar Event...');
                    setReminderModalOpp(null);
                  }}
                  className="w-full flex items-center justify-center space-x-2 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-2xl shadow-md transition-all cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Add to Google Calendar</span>
                </a>

                <button
                  onClick={() => {
                    showToast(`Reminder saved! We'll notify you ${reminderDays} day(s) before deadline.`);
                    setReminderModalOpp(null);
                  }}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-all cursor-pointer"
                >
                  Confirm In-App Alert
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Internal Registration Modal Instance */}
      {(internalRegModalOpp || showGenericInternalModal) && (
        <InternalRegistrationModal
          opportunity={internalRegModalOpp}
          session={session || { username: 'student', role: 'Student' }}
          onClose={() => {
            setInternalRegModalOpp(null);
            setShowGenericInternalModal(false);
          }}
          onSuccess={() => {
            setInternalRegModalOpp(null);
            setShowGenericInternalModal(false);
            showToast('✅ Registration Submitted Successfully');
          }}
        />
      )}
    </div>
  );
}
