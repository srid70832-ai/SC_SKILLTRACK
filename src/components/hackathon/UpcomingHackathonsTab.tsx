import React, { useState } from 'react';
import { 
  Search, Filter, ExternalLink, Users, Calendar, MapPin, 
  Trophy, Globe, Tag, Sparkles, CheckCircle2, ArrowRight, ShieldAlert, Laptop,
  RefreshCw, Radio, Zap, Check
} from 'lucide-react';
import { Hackathon, HackathonCategory, HackathonMode, HackathonScope } from '../../types';

interface UpcomingHackathonsTabProps {
  hackathons: Hackathon[];
  onOpenInternalSubmission: (hackathon: Hackathon) => void;
  onOpenTeamFinder?: (hackathon: Hackathon) => void;
  onSyncLive?: () => void;
  syncingLive?: boolean;
  syncMessage?: string | null;
}

export default function UpcomingHackathonsTab({ 
  hackathons, 
  onOpenInternalSubmission,
  onOpenTeamFinder,
  onSyncLive,
  syncingLive,
  syncMessage
}: UpcomingHackathonsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedMode, setSelectedMode] = useState<string>('All');
  const [selectedScope, setSelectedScope] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedSource, setSelectedSource] = useState<string>('All');

  const categories = ['All', 'AI/ML', 'Web3/Blockchain', 'Cyber Security', 'Cloud & DevOps', 'Mobile Apps', 'IoT & Hardware', 'Open Innovation'];
  const modes = ['All', 'Online', 'Offline', 'Hybrid'];
  const scopes = ['All', 'National', 'International'];
  const statuses = ['All', 'Live', 'Upcoming', 'Closed'];

  const filteredHackathons = hackathons.filter(h => {
    const matchesSearch = 
      h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.organizer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.theme.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (h.source && h.source.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'All' || h.category === selectedCategory;
    const matchesMode = selectedMode === 'All' || h.mode === selectedMode;
    const matchesScope = selectedScope === 'All' || h.scope === selectedScope;
    const matchesStatus = selectedStatus === 'All' || h.status === selectedStatus;
    const matchesSource = 
      selectedSource === 'All' ? true :
      selectedSource === 'Live' ? (h.isAutoFetched || !!h.source) :
      selectedSource === 'Unstop' ? (h.source === 'Unstop') :
      selectedSource === 'Devpost' ? (h.source === 'Devpost') :
      selectedSource === 'Faculty' ? (!h.isAutoFetched && !h.source) : true;

    return matchesSearch && matchesCategory && matchesMode && matchesScope && matchesStatus && matchesSource;
  });

  const liveAutoCount = hackathons.filter(h => h.isAutoFetched || h.source).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* REAL-TIME LIVE AUTO-SYNC BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-5 text-white shadow-xl border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 animate-pulse" /> Real-Time Live API Integration Active
            </span>
            <span className="text-[10px] bg-emerald-950 border border-emerald-500/30 text-emerald-300 font-extrabold px-2 py-0.5 rounded-full">
              {liveAutoCount} Live Fetched
            </span>
          </div>
          <h2 className="text-lg font-black font-display tracking-tight text-white flex items-center gap-2">
            Automatic Live Hackathons Stream
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Live upcoming hackathons are automatically synchronized in real-time from official public endpoints (Unstop & Devpost APIs). Click official links to register on external platforms, then submit internal proof for staff verification.
          </p>
        </div>

        <div className="flex flex-col items-end gap-2 w-full md:w-auto shrink-0">
          <button
            onClick={onSyncLive}
            disabled={syncingLive}
            className="w-full md:w-auto px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 active:scale-95 text-white text-xs font-extrabold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer border border-emerald-400/30"
          >
            <RefreshCw className={`w-4 h-4 ${syncingLive ? 'animate-spin' : ''}`} />
            <span>{syncingLive ? 'Fetching Live APIs...' : 'Auto-Sync Live Hackathons'}</span>
          </button>
          {syncMessage && (
            <span className="text-[11px] font-bold text-emerald-300 bg-emerald-950/80 px-3 py-1 rounded-lg border border-emerald-500/30 flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-400" /> {syncMessage}
            </span>
          )}
        </div>
      </div>

      {/* Search & Multi-Filters Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search by hackathon name, organizer, theme, platform (Unstop, Devpost)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-extrabold text-emerald-900 cursor-pointer focus:ring-2 focus:ring-emerald-500"
            >
              <option value="All">All Sources ({hackathons.length})</option>
              <option value="Live">Real-Time Live ({liveAutoCount})</option>
              <option value="Unstop">Unstop API</option>
              <option value="Devpost">Devpost API</option>
              <option value="Faculty">Faculty Curated</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer focus:ring-2 focus:ring-amber-500"
            >
              <option value="All">All Statuses</option>
              {statuses.filter(s => s !== 'All').map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer focus:ring-2 focus:ring-amber-500"
            >
              <option value="All">All Modes</option>
              {modes.filter(m => m !== 'All').map(m => <option key={m} value={m}>{m}</option>)}
            </select>

            <select
              value={selectedScope}
              onChange={(e) => setSelectedScope(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer focus:ring-2 focus:ring-amber-500"
            >
              <option value="All">All Scopes</option>
              {scopes.filter(s => s !== 'All').map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100 no-scrollbar">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5" /> Category:
          </span>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Mandatory Official Registration Info Callout */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-900">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs space-y-0.5">
          <span className="font-bold block text-amber-950">Mandatory Registration Flow Notice</span>
          <p className="text-amber-800 leading-relaxed">
            Official registration <strong>ALWAYS</strong> happens on the official organizer website (Unstop, Devpost, SIH, MLH, Devfolio).
            Click <strong>"Official Registration"</strong> to complete external registration on their portal, then click <strong>"Internal Submission"</strong> here to record your proof for campus verification and certificate tracking!
          </p>
        </div>
      </div>

      {/* Hackathons Cards Grid */}
      {filteredHackathons.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Trophy className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No hackathons found</h3>
          <p className="text-xs text-slate-400">Try adjusting your search query or filter settings.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {filteredHackathons.map((h) => (
            <div 
              key={h.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
            >
              {/* Header Banner & Logo */}
              <div className="relative h-44 bg-slate-900 overflow-hidden">
                <img 
                  src={h.bannerUrl} 
                  alt={h.title} 
                  className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />

                {/* Organizer Logo Badge & Source Tag */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <div className="bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 shadow-md flex items-center gap-2">
                    <img src={h.logoUrl} alt={h.organizer} className="w-7 h-7 object-cover rounded-xl" />
                    <span className="text-xs font-black text-slate-900 tracking-tight pr-1 truncate max-w-[130px]">{h.organizer}</span>
                  </div>

                  {(h.isAutoFetched || h.source) && (
                    <span className="bg-emerald-500 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 border border-emerald-300">
                      <Radio className="w-3 h-3 animate-pulse" /> Live {h.source || "API"}
                    </span>
                  )}
                </div>

                {/* Top Right Mode & Scope Badge */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5">
                  <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-full shadow-sm ${
                    h.mode === 'Online' ? 'bg-emerald-500 text-white' :
                    h.mode === 'Offline' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'
                  }`}>
                    {h.mode}
                  </span>
                  <span className="px-2.5 py-1 bg-amber-500 text-white text-[10px] font-black uppercase rounded-full shadow-sm">
                    {h.scope}
                  </span>
                </div>

                {/* Bottom Prize Pool Banner */}
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                  <span className="px-3 py-1 bg-amber-500/90 text-white text-xs font-extrabold rounded-lg backdrop-blur-sm shadow-sm flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5" /> Prize Pool: {h.prizePool}
                  </span>
                  <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md ${
                    h.status === 'Live' ? 'bg-emerald-500 text-white animate-pulse' :
                    h.status === 'Upcoming' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    ● {h.status}
                  </span>
                </div>
              </div>

              {/* Card Body Info */}
              <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-600">
                    <Tag className="w-3.5 h-3.5" />
                    <span>{h.category}</span>
                    <span>•</span>
                    <span className="text-slate-500 truncate">{h.theme}</span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 font-display leading-snug">
                    {h.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {h.description}
                  </p>
                </div>

                {/* Metadata Pill Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Team: <strong>{h.minTeamSize} - {h.maxTeamSize} Members</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Deadline: <strong>{h.registrationDeadline}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Venue: <strong className="truncate">{h.venue}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Laptop className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Event Date: <strong>{h.eventDate}</strong></span>
                  </div>
                </div>

                {/* Eligibility Tag */}
                <div className="text-[11px] text-slate-500 bg-amber-50/60 border border-amber-100 p-2.5 rounded-lg">
                  <strong className="text-amber-900">Eligibility:</strong> {h.eligibility}
                </div>

                {/* Action Buttons Row */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2">
                  <a
                    href={h.officialWebsiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-1/2 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>Official Registration</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={() => onOpenInternalSubmission(h)}
                    className="w-full sm:w-1/2 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Internal Submission</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
