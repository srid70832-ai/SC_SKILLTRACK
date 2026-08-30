import React, { useState, useEffect } from 'react';
import { 
  Award, Upload, ShieldCheck, CheckCircle2, Clock, 
  AlertCircle, ExternalLink, Plus, Search, X, Sparkles 
} from 'lucide-react';
import { Hackathon, HackathonCertificate, UserSession } from '../../types';

interface CertificatesTabProps {
  session: UserSession;
  hackathons: Hackathon[];
}

export default function CertificatesTab({ session, hackathons }: CertificatesTabProps) {
  const [certificates, setCertificates] = useState<HackathonCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [hackathonId, setHackathonId] = useState(hackathons[0]?.id || '');
  const [certType, setCertType] = useState<HackathonCertificate['type']>('Participation');
  const [certificateUrl, setCertificateUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const student = session.studentDetails;
  const studentRoll = student?.rollNumber || session.username || "25BAD004";
  const studentName = student?.studentName || session.name || "Student";
  const studentDept = student?.department || "AI&DS";

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/hackathon/certificates');
      if (res.ok) {
        const data = await res.json();
        setCertificates(data);
      }
    } catch (e) {
      console.error("Fetch certificates error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hackathonId) return;

    setUploading(true);
    const selectedH = hackathons.find(h => h.id === hackathonId);

    const payload = {
      hackathonId,
      hackathonTitle: selectedH?.title || "Hackathon",
      studentRollNumber: studentRoll,
      studentName,
      department: studentDept,
      type: certType,
      certificateUrl: certificateUrl || "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80"
    };

    try {
      const res = await fetch('/api/hackathon/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        fetchCertificates();
        setShowUploadModal(false);
        setCertificateUrl('');
      }
    } catch (e) {
      console.error("Upload certificate error:", e);
    } finally {
      setUploading(false);
    }
  };

  const filteredCerts = certificates.filter(c => 
    c.studentRollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.hackathonTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 font-display flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-500" />
            <span>Verified Hackathon Certificates Repository</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload participation, finalist, and winner certificates for staff verification and permanent college record tracking.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Certificate</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search by student name, roll number, certificate type or hackathon title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Certificates Cards Grid */}
      {filteredCerts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Award className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No certificates uploaded yet</h3>
          <p className="text-xs text-slate-400">Click "Upload Certificate" to submit your hackathon achievements!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCerts.map((cert) => (
            <div 
              key={cert.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="relative h-48 bg-slate-900 overflow-hidden border-b border-slate-200">
                <img 
                  src={cert.certificateUrl} 
                  alt={cert.type} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-amber-900 shadow-sm">
                  {cert.type} Certificate
                </div>

                <div className="absolute top-3 right-3">
                  <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full shadow-sm ${
                    cert.verificationStatus === 'Approved' ? 'bg-emerald-500 text-white' :
                    cert.verificationStatus === 'Rejected' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'
                  }`}>
                    ● {cert.verificationStatus}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">{cert.hackathonTitle}</span>
                  <h3 className="text-sm font-bold text-slate-900 mt-0.5">{cert.studentName}</h3>
                  <p className="text-xs text-slate-500">{cert.studentRollNumber} • {cert.department}</p>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Staff Feedback</span>
                  <span className="text-slate-700 font-medium">{cert.staffRemarks || "Pending staff review"}</span>
                </div>

                <a 
                  href={cert.certificateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>View Official Certificate</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 font-display">Upload Hackathon Certificate</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadCertificate} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Select Hackathon</label>
                <select
                  value={hackathonId}
                  onChange={(e) => setHackathonId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  {hackathons.map(h => <option key={h.id} value={h.id}>{h.title}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Certificate Category</label>
                <select
                  value={certType}
                  onChange={(e) => setCertType(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  <option value="Participation">Participation Certificate</option>
                  <option value="Round Qualification">Round Qualification Certificate</option>
                  <option value="Semi Finalist">Semi Finalist Certificate</option>
                  <option value="Finalist">Finalist Certificate</option>
                  <option value="Winner">Winner 🏆 Certificate</option>
                  <option value="Runner Up">Runner-Up 🥈 Certificate</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Certificate Image / Drive Link</label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/... or image URL"
                  value={certificateUrl}
                  onChange={(e) => setCertificateUrl(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Submit for Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
