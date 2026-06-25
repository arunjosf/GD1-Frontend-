import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { ChevronRight, ArrowLeft, CheckCircle, XCircle, User, Briefcase, FileText, Image as ImageIcon, MapPin, Phone, Mail, Building2, AlertCircle } from 'lucide-react';

const API = 'https://localhost:7108';

function getToken() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; AccessToken=`);
  return parts.length === 2 ? parts.pop().split(';').shift() : null;
}

const STATUS_TABS = ['All', 'Pending', 'Under Review', 'Approved', 'Rejected'];

function matchesTab(app, tab) {
  if (tab === 'All') return true;
  if (tab === 'Pending') return app.status === 'PendingReview' || app.status === 'Pending';
  if (tab === 'Under Review') return app.status === 'UnderReview' || app.status === 'Assigned';
  if (tab === 'Approved') return app.status === 'Approved' || app.status === 'Completed';
  if (tab === 'Rejected') return app.status === 'Rejected' || app.status === 'Cancelled';
  return false;
}

function StatusBadge({ status }) {
  const map = {
    PendingReview: 'bg-amber-50 text-amber-700 border-amber-200',
    Pending: 'bg-amber-50 text-amber-700 border-amber-200',
    UnderReview: 'bg-blue-50 text-blue-700 border-blue-200',
    Assigned: 'bg-blue-50 text-blue-700 border-blue-200',
    Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Rejected: 'bg-red-50 text-red-700 border-red-200',
    Cancelled: 'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${map[status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
      {status || 'Unknown'}
    </span>
  );
}

export default function AdminServiceCenterApplicationsPage() {
  const [filterTab, setFilterTab] = useState('All');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedAppId, setSelectedAppId] = useState(null);
  const [detailedApp, setDetailedApp] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [expandedImage, setExpandedImage] = useState(null);

  useEffect(() => {
    document.body.style.overflow = showRejectModal ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showRejectModal]);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API}/api/admin/service-centers/applications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      setApplications(result.data || []);
    } catch (err) {
      toast.error('Could not load applications: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  const loadDetail = async (id) => {
    setSelectedAppId(id);
    setDetailedApp(null);
    setDetailLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API}/api/admin/service-centers/applications/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const fromList = applications.find(a => a.id === id);
      if (res.ok) {
        const result = await res.json();
        setDetailedApp(result.data || fromList);
      } else {
        setDetailedApp(fromList);
      }
    } catch {
      setDetailedApp(applications.find(a => a.id === id));
    } finally {
      setDetailLoading(false);
    }
  };

  const handleUpdateStatus = async (decision, reason = '') => {
    if (!detailedApp) return;
    setActionLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API}/api/admin/service-centers/${detailedApp.id}/update-status`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          decision: decision === 'Approved' ? 1 : 2,
          adminNotes: reason || `Action taken: ${decision}`
        })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result?.message || `HTTP ${res.status}`);

      toast.success(`Application ${decision.toLowerCase()} successfully`);
      setSelectedAppId(null);
      setDetailedApp(null);
      fetchApplications();
    } catch (err) {
      toast.error(err.message || 'Something went wrong.');
    } finally {
      setActionLoading(false);
    }
  };

  const confirmReject = async () => {
    if (!rejectReason.trim()) { toast.error('Please provide a rejection reason.'); return; }
    setShowRejectModal(false);
    await handleUpdateStatus('Rejected', rejectReason);
  };

  const getApplicantName = (app) => app.ownerName || app.fullName || app.firstName || 'Unknown';

  // ─── Detail view ──────────────────────────────────────────────────────────
  if (selectedAppId) {
    if (detailLoading || !detailedApp) {
      return (
        <div className="flex justify-center items-center h-[60vh]">
          <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
        </div>
      );
    }

    const isClosed = detailedApp.status === 'Rejected' || detailedApp.status === 'Cancelled' || detailedApp.status === 'Approved';

    const docs = [
        { label: 'Owner ID Proof', url: detailedApp.ownerIdProofUrl },
        { label: 'Business Registration', url: detailedApp.businessRegistrationUrl },
      ].filter(d => d.url);

    const images = detailedApp.images || [];

    return (
      <>
        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowRejectModal(false)} />
            <div className="relative bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl z-10">
              <h3 className="text-xl font-black text-gray-900 mb-1">Reject Application</h3>
              <p className="text-sm text-gray-500 mb-5 flex items-center gap-1.5">
                <AlertCircle size={14} className="text-amber-500 shrink-0" />
                If a payment was made, a refund will be initiated automatically via Razorpay.
              </p>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Reason for Rejection *</label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none h-28 focus:outline-none focus:ring-2 focus:ring-red-400 transition"
                placeholder="e.g. Missing documents, invalid location..."
              />
              <div className="flex gap-3 mt-5 justify-end">
                <button onClick={() => setShowRejectModal(false)} className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition">
                  Cancel
                </button>
                <button onClick={confirmReject} className="px-5 py-2.5 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition shadow-lg shadow-red-500/20">
                  Reject & Refund
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-32">
          {/* Back */}
          <button
            onClick={() => { setSelectedAppId(null); setDetailedApp(null); }}
            className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition mb-6 mt-2 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /> Back to Applications
          </button>

          {/* Header Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 h-2" />
            <div className="p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 font-black text-2xl shrink-0 border border-blue-200">
                  {getApplicantName(detailedApp).charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">{getApplicantName(detailedApp)}</h2>
                    <StatusBadge status={detailedApp.status} />
                  </div>
                  <p className="text-sm text-gray-500 mb-3">{detailedApp.name || detailedApp.businessName || '—'}</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {(detailedApp.email || detailedApp.contactEmail) && (
                      <span className="flex items-center gap-1 bg-gray-50 border border-gray-100 text-gray-600 px-2.5 py-1 rounded-lg">
                        <Mail size={11} /> {detailedApp.email || detailedApp.contactEmail}
                      </span>
                    )}
                    {detailedApp.phoneNumber && (
                      <span className="flex items-center gap-1 bg-gray-50 border border-gray-100 text-gray-600 px-2.5 py-1 rounded-lg">
                        <Phone size={11} /> {detailedApp.phoneNumber}
                      </span>
                    )}
                    {(detailedApp.city || detailedApp.state) && (
                      <span className="flex items-center gap-1 bg-gray-50 border border-gray-100 text-gray-600 px-2.5 py-1 rounded-lg">
                        <MapPin size={11} /> {[detailedApp.city, detailedApp.state].filter(Boolean).join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Two-column grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Application Data */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100">
                <Briefcase size={15} className="text-blue-500" /> Application Details
              </h3>
              <div className="space-y-3">
                {[
                    { label: 'Address', val: detailedApp.addressLine },
                    { label: 'City', val: detailedApp.city },
                    { label: 'District', val: detailedApp.district },
                    { label: 'State', val: detailedApp.state },
                    { label: 'Country', val: detailedApp.country },
                    { label: 'Postal Code', val: detailedApp.postalCode },
                    { label: 'Fee Status', val: detailedApp.feeStatus },
                  { label: 'Application Fee', val: detailedApp.applicationFee ? `₹${detailedApp.applicationFee}` : null },
                  { label: 'Submitted', val: detailedApp.createdAt ? new Date(detailedApp.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : null },
                  { label: 'Admin Notes', val: detailedApp.adminNotes },
                ].filter(r => r.val !== null && r.val !== undefined && r.val !== '').map(row => (
                  <div key={row.label} className="flex gap-3">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide w-28 shrink-0 mt-0.5">{row.label}</p>
                    <p className="text-sm text-gray-800 break-words flex-1">{row.val}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Documents & Images */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100">
                <FileText size={15} className="text-blue-500" /> Documents & Images
              </h3>
              <div className="space-y-4">
                  {docs.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Documents ({docs.length})</p>
                      <div className="grid grid-cols-2 gap-2">
                        {docs.map((doc, i) => (
                          <div key={i} onClick={() => setExpandedImage(expandedImage === doc.url ? null : doc.url)} className="group rounded-xl border border-gray-200 overflow-hidden relative shadow-sm hover:shadow-md transition aspect-video cursor-pointer bg-gray-50 flex items-center justify-center">
                            <img src={doc.url} alt={doc.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                              <span className="text-white font-bold text-xs">{doc.label}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {images.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Facility Images ({images.length})</p>
                    <div className="grid grid-cols-2 gap-2">
                        {images.map((url, i) => (
                          <div key={i} onClick={() => setExpandedImage(expandedImage === url ? null : url)} className="group rounded-xl border border-gray-200 overflow-hidden relative shadow-sm hover:shadow-md transition aspect-video cursor-pointer">
                            <img src={url} alt={`Facility ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                              <ImageIcon size={18} className="text-white" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                )}

                {expandedImage && (
                  <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setExpandedImage(null)} />
                    <div className="relative max-w-5xl w-full max-h-[90vh] flex items-center justify-center z-10">
                      <img src={expandedImage} alt="Expanded view" className="max-w-full max-h-[90vh] rounded-xl object-contain shadow-2xl" />
                      <button onClick={() => setExpandedImage(null)} className="absolute top-4 right-4 md:-top-4 md:-right-4 bg-white text-gray-900 p-2 rounded-full hover:bg-gray-200 transition shadow-lg z-20">
                        <XCircle size={24}/>
                      </button>
                    </div>
                  </div>
                )}

                {docs.length === 0 && images.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                    <ImageIcon size={32} className="mb-2 opacity-30" strokeWidth={1} />
                    <p className="text-sm">No documents or images uploaded.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky bottom action bar */}
        {!isClosed && (
          <div className="fixed bottom-0 left-0 right-0 lg:ml-[260px] bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] z-50 px-4 sm:px-6 py-3 flex flex-col sm:flex-row justify-end gap-3 items-stretch sm:items-center">
            <button
              onClick={() => { setRejectReason(''); setShowRejectModal(true); }}
              disabled={actionLoading}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-white text-red-600 border border-red-200 rounded-xl text-sm font-bold hover:bg-red-50 transition disabled:opacity-50"
            >
              <XCircle size={16} /> Reject & Refund
            </button>
            {detailedApp.status !== 'Approved' && (
              <button
                  onClick={() => handleUpdateStatus('Approved')}
                  disabled={actionLoading}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition disabled:opacity-50 shadow-lg shadow-blue-500/20"
                >
                {actionLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle size={16} />}
                {actionLoading ? 'Processing…' : 'Approve Application'}
              </button>
            )}
          </div>
        )}
      </>
    );
  }

  // ─── List view ────────────────────────────────────────────────────────────
  const filtered = applications.filter(a => matchesTab(a, filterTab));

  return (
    <div className="px-4 sm:px-6 pb-10 max-w-6xl mx-auto">
      {/* Page title */}
      <div className="mb-6 pt-2">
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
          <Building2 size={22} className="text-blue-500" /> Service Center Applications
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Review and manage all Service Center partner applications</p>
      </div>

      {/* Scrollable tabs */}
      <div className="mb-5 -mx-4 sm:-mx-6 px-4 sm:px-6 overflow-x-auto scrollbar-hide">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-max min-w-full sm:w-auto">
          {STATUS_TABS.map(tab => {
            const count = tab === 'All' ? applications.length : applications.filter(a => matchesTab(a, tab)).length;
            const active = filterTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setFilterTab(tab)}
                className={`flex items-center gap-1.5 px-3 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${active ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
              >
                {tab}
                {count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${active ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cards / table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-52">
            <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-52 text-gray-400">
            <FileText size={40} strokeWidth={1} className="mb-3 opacity-30" />
            <p className="text-sm">No {filterTab.toLowerCase()} applications.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map(app => {
              const date = app.createdAt ? new Date(app.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
              return (
                <div
                  key={app.id}
                  onClick={() => loadDetail(app.id)}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 hover:bg-gray-50/80 transition cursor-pointer group"
                >
                  {/* Avatar + name */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                      {getApplicantName(app).charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{getApplicantName(app)}</p>
                      <p className="text-xs text-gray-500 truncate">{app.name || app.businessName || app.email || '—'}</p>
                    </div>
                  </div>

                  {/* Status + date */}
                  <div className="flex items-center gap-3 sm:gap-4 flex-wrap sm:flex-nowrap pl-12 sm:pl-0">
                    <StatusBadge status={app.status} />
                    <span className="text-xs text-gray-400 whitespace-nowrap">{date}</span>
                    <div className="shrink-0 ml-auto sm:ml-0">
                      <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center group-hover:bg-blue-700 transition shadow-sm">
                        <ChevronRight size={14} strokeWidth={2.5} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
