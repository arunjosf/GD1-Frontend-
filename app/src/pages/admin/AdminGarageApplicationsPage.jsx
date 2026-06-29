import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Search, ChevronRight, ArrowLeft, CheckCircle, XCircle, User, Briefcase, FileText, Image as ImageIcon, MapPin, Calendar } from 'lucide-react';

export default function AdminGarageApplicationsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [filterTab, setFilterTab] = useState('Pending'); // 'Pending', 'Assigned', 'Completed'
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Full-page detailed view state
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [detailedApp, setDetailedApp] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [expandedImage, setExpandedImage] = useState(null);

  // Agent Assignment State
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [nearbyAgents, setNearbyAgents] = useState([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [assignLoadingId, setAssignLoadingId] = useState(null);
  
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  // Reject Modal State
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (expandedImage || showAgentModal || showReportModal || showRejectModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [expandedImage, showAgentModal, showReportModal, showRejectModal]);




  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; AccessToken=`);
      const token = parts.length === 2 ? parts.pop().split(';').shift() : null;
      if (!token) throw new Error("No token found");

      const endpoint = 'https://gd1-grand-auto-depot-one-9ms1.onrender.com/api/admin/franchise/applications';

      const res = await fetch(endpoint, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to fetch applications");
      const result = await res.json();
      setApplications(result.data || []);
    } catch (err) {
      toast.error(err.message || 'Could not load applications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const loadApplicationDetail = async (id) => {
    setSelectedAppId(id);
    setDetailLoading(true);
    try {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; AccessToken=`);
      const token = parts.length === 2 ? parts.pop().split(';').shift() : null;
      if (!token) throw new Error("No token found");

      const endpoint = `https://gd1-grand-auto-depot-one-9ms1.onrender.com/api/admin/franchise/applications/${id}`;

      const res = await fetch(endpoint, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const result = await res.json();
        setDetailedApp(result.data);
      } else {
        const appFromList = applications.find(a => a.id === id);
        setDetailedApp(appFromList);
      }
    } catch {
      const appFromList = applications.find(a => a.id === id);
      setDetailedApp(appFromList);
    } finally {
      setDetailLoading(false);
    }
  };

  // Handle returning from Assign Agent page
  useEffect(() => {
    if (location.state?.selectedAppId && !selectedAppId) {
      loadApplicationDetail(location.state.selectedAppId);
      // Clear state so it doesn't re-trigger on simple re-renders
      navigate('.', { replace: true, state: {} });
    }
  }, [location.state, navigate, selectedAppId]);

  const handleUpdateStatus = async (decision, reason = null) => {
    if (!detailedApp) return;
    setActionLoading(true);
    try {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; AccessToken=`);
      const token = parts.length === 2 ? parts.pop().split(';').shift() : null;
      if (!token) throw new Error("No token found");

      const endpoint = `https://gd1-grand-auto-depot-one-9ms1.onrender.com/api/admin/franchise/applications/${detailedApp.id}/update-status`;

      const formData = new FormData();
      formData.append('Decision', decision === 'Approved' ? '1' : '2'); // Enum: Approved=1, Rejected=2
      formData.append('AdminNotes', reason || `Action taken: ${decision}`);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) throw new Error("Failed to update status");
      
      toast.success(`Application successfully ${decision.toLowerCase()}!`);
      setSelectedAppId(null);
      setDetailedApp(null);
      fetchApplications();
    } catch (err) {
      toast.error(err.message || 'Could not update status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefundClick = () => {
    setRejectReason('');
    setShowRejectModal(true);
  };

  const confirmRefund = async () => {
    if (!detailedApp) return;
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    setShowRejectModal(false);
    await handleUpdateStatus('Rejected', rejectReason);
  };

  const handleOpenAgentModal = async () => {
    setShowAgentModal(true);
    setLoadingAgents(true);
    setScheduledDate('');
    try {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; AccessToken=`);
      const token = parts.length === 2 ? parts.pop().split(';').shift() : null;
      if (!token) return;
      const res = await fetch(`https://gd1-grand-auto-depot-one-9ms1.onrender.com/api/admin/franchise/applications/${detailedApp.id}/nearby-agents`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      setNearbyAgents(result.data || []);
    } catch (err) {
      toast.error('Could not load nearby agents.');
    } finally {
      setLoadingAgents(false);
    }
  };

  const handleAssignAgent = async (agentId) => {
    if (!scheduledDate) {
      toast.error("Please select a scheduled date.");
      return;
    }
    setAssignLoadingId(agentId);
    try {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; AccessToken=`);
      const token = parts.length === 2 ? parts.pop().split(';').shift() : null;
      
      const res = await fetch(`https://gd1-grand-auto-depot-one-9ms1.onrender.com/api/admin/franchise/applications/${detailedApp.id}/assign-agent`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          agentId: agentId,
          scheduledDate: new Date(scheduledDate).toISOString()
        })
      });

      if (!res.ok) throw new Error("Failed to assign agent");
      toast.success("Agent assigned successfully!");
      setShowAgentModal(false);
      
      setSelectedAppId(null);
      setDetailedApp(null);
      fetchApplications();
    } catch (err) {
      toast.error(err.message || 'Could not assign agent.');
    } finally {
      setAssignLoadingId(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-orange-50 text-orange-600 border-orange-200';
      case 'approved': return 'bg-green-50 text-green-600 border-green-200';
      case 'rejected': return 'bg-red-50 text-red-600 border-red-200';
      case 'underreview': return 'bg-blue-50 text-blue-600 border-blue-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getApplicantName = (app) => {
    if (app.firstName && app.lastName) return `${app.firstName} ${app.lastName}`;
    if (app.fullName) return app.fullName;
    if (app.ownerName) return app.ownerName;
    return 'Unknown Applicant';
  };

  // FULL PAGE DETAILED VIEW
  if (selectedAppId) {
    if (detailLoading || !detailedApp) {
      return (
        <div className="flex justify-center items-center h-[calc(100vh-100px)]">
           <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      );
    }

    return (
      <>
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowRejectModal(false)}></div>
          <div className="relative bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl">
            <h3 className="text-2xl font-black text-[#111] mb-2 tracking-tight">Reject Application</h3>
            <p className="text-gray-500 mb-6">
              {detailedApp?.assignments?.some(a => a.status === 'Completed') 
                ? "This application has a completed inspection. A partial refund of ₹1000 will be initiated automatically."
                : "No completed inspection found. A full refund of ₹2000 will be initiated automatically."}
            </p>

            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">Reason for Rejection <span className="text-red-500">*</span></label>
              <textarea 
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all resize-none h-32"
                placeholder="e.g. Missing required documents, unsatisfactory location, etc."
              />
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowRejectModal(false)}
                className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmRefund}
                className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30"
              >
                Reject & Refund
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="w-full max-w-[1200px] mx-auto animate-fade-in relative pb-32">
        <button 
          onClick={() => { setSelectedAppId(null); setDetailedApp(null); }}
          className="flex items-center gap-2 text-gray-500 hover:text-blue-600 font-medium mb-6 transition-colors"
        >
          <ArrowLeft size={18} /> Back to Applications
        </button>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header Info */}
          <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-start gap-6 bg-gradient-to-br from-white to-gray-50">
            <div className="w-20 h-20 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-3xl shrink-0 shadow-sm border border-blue-200">
              {getApplicantName(detailedApp).charAt(0)}
            </div>
            <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-3xl font-bold text-[#111] tracking-tight">{getApplicantName(detailedApp)}</h2>
                  <span className={`px-3 py-1 text-xs font-bold rounded-full border shadow-sm ${getStatusColor(detailedApp.status)}`}>
                    {detailedApp.status || 'Pending'}
                  </span>
                  {detailedApp.status === 'Rejected' && detailedApp.isRefunded && (
                    <span className="px-3 py-1 text-xs font-bold rounded-full border shadow-sm bg-red-100 text-red-700 border-red-200">
                      Refunded ({detailedApp.refundTransactionId})
                    </span>
                  )}
                </div>
                {detailedApp.adminNotes && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-100 rounded-xl">
                    <p className="text-sm font-bold text-red-800 mb-1">Rejection Reason / Admin Notes:</p>
                    <p className="text-sm text-red-600">{detailedApp.adminNotes}</p>
                  </div>
                )}
                <p className="text-gray-500 font-medium text-lg mb-4">{detailedApp.businessName || 'No Business Name'}</p>
              
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-gray-600 bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
                  <User size={16} className="text-gray-400" /> {detailedApp.contactEmail || detailedApp.email || 'No email'}
                </div>
                <div className="flex items-center gap-1.5 text-gray-600 bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
                  <FileText size={16} className="text-gray-400" /> {detailedApp.phone || detailedApp.phoneNumber || 'No phone'}
                </div>
                <div className="flex items-center gap-1.5 text-gray-600 bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
                  <MapPin size={16} className="text-gray-400" /> {detailedApp.city && detailedApp.state ? `${detailedApp.city}, ${detailedApp.state}` : 'Location missing'}
                </div>
                {detailedApp.preferredInspectionDate && (
                  <div className="flex items-center gap-1.5 text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 shadow-sm font-medium">
                    <Calendar size={16} className="text-blue-500" /> Pref. Date: {new Date(detailedApp.preferredInspectionDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
            
            {/* Top Action Buttons */}
            <div className="flex flex-col gap-3 shrink-0 mt-6 md:mt-0 w-full md:w-auto">
              {detailedApp.status !== 'Rejected' && detailedApp.status !== 'Cancelled' && (
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  {detailedApp.status !== 'Approved' && (
                    <button 
                      onClick={() => handleUpdateStatus('Approved')}
                      disabled={actionLoading}
                      className="w-full sm:w-auto justify-center px-6 py-2.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      <CheckCircle size={18} /> Accept
                    </button>
                  )}
                  <button 
                    onClick={handleRefundClick}
                    disabled={actionLoading}
                    className="w-full sm:w-auto justify-center px-6 py-2.5 bg-white text-red-600 border border-red-200 rounded-xl font-bold hover:bg-red-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <XCircle size={18} /> Cancel and Refund
                  </button>
                  {!(detailedApp.inspectionReport || detailedApp.InspectionReport) && (
                    <button 
                      onClick={() => navigate(`/admin/applications/garage/${detailedApp.id}/assign`)}
                      disabled={actionLoading}
                      className="w-full sm:w-auto justify-center px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-md shadow-blue-500/20"
                    >
                      <User size={18} /> Assign Agent
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="p-8 flex flex-col gap-10">
            {/* Assignment Details */}
            {detailedApp.assignments && detailedApp.assignments.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[#111] flex items-center gap-2 border-b border-gray-100 pb-3">
                  <User size={20} className="text-purple-500" /> Assignment Details
                </h3>
                {(() => {
                  const assignment = detailedApp.assignments && detailedApp.assignments.length > 0 ? detailedApp.assignments[detailedApp.assignments.length - 1] : null;
                  const report = detailedApp.inspectionReport || detailedApp.InspectionReport;
                  const hasReport = !!report;
                  return (
                    <div className="flex flex-col sm:flex-row items-center justify-between bg-purple-50 p-6 rounded-2xl border border-purple-100">
                      <div>
                        <p className="text-sm text-purple-600 font-bold uppercase tracking-wide mb-1">Assigned Agent</p>
                        <p className="text-lg font-bold text-gray-900">{assignment.agentName || 'Unknown Agent'}</p>
                        {assignment.agentPhone && <p className="text-sm text-gray-600 flex items-center gap-1 mt-1"><Phone size={14} /> {assignment.agentPhone}</p>}
                        <p className="text-sm text-gray-600 mt-1 flex items-center gap-1"><Calendar size={14} /> Scheduled: {new Date(assignment.scheduledDate).toLocaleDateString()}</p>
                      </div>
                      <div className="mt-4 sm:mt-0">
                        {hasReport ? (
                          <button 
                            onClick={() => {
                              document.getElementById('inspection-report-section')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="px-5 py-2.5 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-md">
                            View Inspection Report
                          </button>
                        ) : (
                          <button disabled className="px-5 py-2.5 bg-gray-200 text-gray-500 rounded-xl font-bold cursor-not-allowed border border-gray-300">
                            Inspection Report Not Submitted
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Main Content Area */}
            <div className="space-y-10 w-full">
              {/* Application Data */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[#111] flex items-center gap-2 border-b border-gray-100 pb-3">
                  <Briefcase size={20} className="text-blue-500" /> Application Data
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                  {Object.keys(detailedApp)
                    .filter(k => !['id', 'firstName', 'lastName', 'fullName', 'email', 'contactEmail', 'phone', 'phoneNumber', 'createdAt', 'status', 'businessName', 'city', 'state', 'ownerName', 'propertyFrontImageUrl', 'otherImageUrls', 'images', 'businessRegistrationUrl', 'licenseDocumentUrl', 'ownerIdProofUrl', 'propertyProofUrl', 'oemCertificateUrl', 'latitude', 'longitude', 'isAIVerified', 'hasCCTV', 'hasSecurity', 'hasFireSafety', 'hasWorkshop', 'hasWashingArea', 'slots'].includes(k))
                    .map(key => {
                      const val = detailedApp[key];
                      if (val === null || val === undefined || typeof val === 'object' || val === '') return null;
                      
                      let displayVal = val.toString();
                      if (typeof val === 'boolean') {
                        displayVal = val ? 'Yes' : 'No';
                      } else if (typeof val === 'string' && key.toLowerCase().includes('date') && !isNaN(Date.parse(val))) {
                        displayVal = new Date(val).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                      }

                      return (
                        <div key={key}>
                          <p className="text-[11px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                          <p className="text-[14px] font-semibold text-[#111] break-words">{displayVal}</p>
                        </div>
                      );
                    })}
                </div>
              </div>
              
              {/* Facilities */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[#111] flex items-center gap-2 border-b border-gray-100 pb-3">
                  <CheckCircle size={20} className="text-green-500" /> Facilities
                </h3>
                <div className="flex flex-wrap gap-3">
                  {detailedApp.hasCCTV && <span className="px-4 py-2 bg-blue-50 text-blue-700 font-bold tracking-wide rounded-full text-[12px] border border-blue-100 shadow-sm">CCTV Surveillance</span>}
                  {detailedApp.hasSecurity && <span className="px-4 py-2 bg-blue-50 text-blue-700 font-bold tracking-wide rounded-full text-[12px] border border-blue-100 shadow-sm">24/7 Security</span>}
                  {detailedApp.hasFireSafety && <span className="px-4 py-2 bg-blue-50 text-blue-700 font-bold tracking-wide rounded-full text-[12px] border border-blue-100 shadow-sm">Fire Safety System</span>}
                  {detailedApp.hasWorkshop && <span className="px-4 py-2 bg-blue-50 text-blue-700 font-bold tracking-wide rounded-full text-[12px] border border-blue-100 shadow-sm">On-site Workshop</span>}
                  {detailedApp.hasWashingArea && <span className="px-4 py-2 bg-blue-50 text-blue-700 font-bold tracking-wide rounded-full text-[12px] border border-blue-100 shadow-sm">Washing Area</span>}
                  {!detailedApp.hasCCTV && !detailedApp.hasSecurity && !detailedApp.hasFireSafety && !detailedApp.hasWorkshop && !detailedApp.hasWashingArea && (
                    <span className="text-gray-500 text-sm font-medium">No specific facilities indicated.</span>
                  )}
                </div>
              </div>

              {/* Slot Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[#111] flex items-center gap-2 border-b border-gray-100 pb-3">
                  <MapPin size={20} className="text-indigo-500" /> Slot Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {(detailedApp.slots || []).map((slot, i) => (
                    <div key={i} className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm flex flex-col hover:border-gray-300 transition-all">
                      {slot.imageUrl ? (
                        <div className="relative h-40 overflow-hidden cursor-pointer" onClick={() => setExpandedImage(slot.imageUrl)}>
                          <img src={slot.imageUrl} alt={`Slot ${slot.slotNumber}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                          <div className="absolute inset-0 bg-black/10 hover:bg-transparent transition-colors"></div>
                        </div>
                      ) : (
                        <div className="w-full h-40 bg-gray-50 flex flex-col items-center justify-center text-gray-400 border-b border-gray-100">
                          <ImageIcon size={32} className="mb-2 opacity-50" />
                          <span className="text-xs font-medium">No Image</span>
                        </div>
                      )}
                      <div className="p-5">
                        <p className="font-bold text-[#111] text-base mb-3 border-b border-gray-50 pb-2">Slot #{slot.slotNumber}</p>
                        <div className="flex justify-between items-center text-[13px] text-gray-500 font-medium">
                          <span className="flex items-center gap-1">Area: <strong className="text-[#111]">{slot.squareFeet} sq ft</strong></span>
                          <span className="flex items-center gap-1">Height: <strong className="text-[#111]">{slot.heightFeet} ft</strong></span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(detailedApp.slots || []).length === 0 && (
                    <p className="text-sm text-gray-500 bg-gray-50 p-6 rounded-2xl w-full text-center border border-dashed border-gray-200">No slots provided.</p>
                  )}
                </div>
              </div>
              {/* Documents and Images */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[#111] flex items-center gap-2 border-b border-gray-100 pb-3">
                  <FileText size={20} className="text-blue-500" /> Documents & Images
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {/* Images */}
                  {detailedApp.propertyFrontImageUrl && (
                    <div className="group rounded-3xl border border-gray-200 overflow-hidden relative shadow-sm cursor-pointer hover:ring-4 hover:ring-blue-100 hover:border-blue-300 transition-all h-48" onClick={() => setExpandedImage(detailedApp.propertyFrontImageUrl)}>
                      <img src={detailedApp.propertyFrontImageUrl} alt="Property Front" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
                        <p className="text-white text-[13px] tracking-wide font-bold">Property Front View</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Documents Links */}
                  {[
                    { label: "Business Registration", url: detailedApp.businessRegistrationUrl },
                    { label: "License Document", url: detailedApp.licenseDocumentUrl },
                    { label: "Owner ID Proof", url: detailedApp.ownerIdProofUrl },
                    { label: "Property Proof", url: detailedApp.propertyProofUrl },
                    { label: "OEM Certificate", url: detailedApp.oemCertificateUrl }
                  ].map((doc, idx) => {
                    if (!doc.url) return null;
                    const isPdf = doc.url.toLowerCase().includes('.pdf');
                    
                    if (!isPdf) {
                      return (
                        <div key={idx} className="group rounded-3xl border border-gray-200 overflow-hidden relative shadow-sm cursor-pointer hover:ring-4 hover:ring-blue-100 hover:border-blue-300 transition-all h-48" onClick={() => setExpandedImage(doc.url)}>
                          <img src={doc.url} alt={doc.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
                            <p className="text-white text-[13px] tracking-wide font-bold">{doc.label}</p>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <a key={idx} href={doc.url} target="_blank" rel="noreferrer" className="group flex items-center justify-between p-4 bg-white rounded-3xl border border-gray-200 hover:border-blue-300 hover:shadow-[0_8px_20px_rgba(37,99,235,0.08)] transition-all h-full max-h-48">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <FileText size={20} />
                          </div>
                          <span className="text-[14px] font-bold text-[#111]">{doc.label}</span>
                        </div>
                        <ChevronRight size={20} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                      </a>
                    );
                  })}
                  
                  {/* Other Images */}
                  {(detailedApp.otherImageUrls || []).map((url, i) => (
                    <div key={`img-${i}`} className="group rounded-3xl border border-gray-200 overflow-hidden relative shadow-sm cursor-pointer hover:ring-4 hover:ring-blue-100 hover:border-blue-300 transition-all h-48" onClick={() => setExpandedImage(url)}>
                      <img src={url} alt={`Additional ${i+1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                        <p className="text-white text-[13px] tracking-wide font-bold">{`Other Image ${i+1}`}</p>
                      </div>
                    </div>
                  ))}

                  {/* Empty State */}
                  {!detailedApp.propertyFrontImageUrl && !detailedApp.oemCertificateUrl && !detailedApp.businessRegistrationUrl && !detailedApp.licenseDocumentUrl && !detailedApp.ownerIdProofUrl && !detailedApp.propertyProofUrl && (detailedApp.otherImageUrls || []).length === 0 && (
                    <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-3xl border border-dashed border-gray-200 col-span-full">
                      <ImageIcon size={32} className="mx-auto mb-3 opacity-30" />
                      <p className="text-[13px] font-medium">No documents or images provided.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Inline Inspection Report */}
              {(() => {
                const report = detailedApp.inspectionReport || detailedApp.InspectionReport;
                if (report) {
                  return (
                    <div id="inspection-report-section" className="space-y-4 pt-8 mt-8 border-t border-gray-100">
                      <h3 className="text-xl font-bold text-[#111] flex items-center gap-2 border-b border-gray-100 pb-3">
                        <CheckCircle size={24} className="text-green-500" /> Inspection Report
                      </h3>
                      
                      <div className="space-y-8">
                        <div>
                          <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">Overall Description</h4>
                          <p className="text-gray-900 bg-gray-50 p-4 rounded-xl border border-gray-100">{report.overallDescription || 'No description provided.'}</p>
                        </div>

                        {report.siteImages && report.siteImages.length > 0 && (
                          <div>
                            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Agent Site Images</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                              {report.siteImages.map((img, idx) => {
                                const imgUrl = typeof img === 'string' ? img : img.imageUrl;
                                return (
                                  <div key={idx} className="h-32 rounded-xl overflow-hidden cursor-pointer border border-gray-200 shadow-sm" onClick={() => setExpandedImage(imgUrl)}>
                                    <img src={imgUrl} alt={`Site ${idx}`} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div>
                          <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Slot Verifications</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {(report.slotVerifications || []).map((sv, idx) => (
                              <div key={idx} className={`p-4 rounded-xl border ${sv.isVerified ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                <div className="flex justify-between items-start mb-3">
                                  <p className="font-bold text-gray-900">Slot #{sv.slotNumber}</p>
                                  {sv.isVerified ? (
                                    <span className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full"><CheckCircle size={12}/> VERIFIED</span>
                                  ) : (
                                    <span className="flex items-center gap-1 text-xs font-bold text-red-700 bg-red-100 px-2 py-1 rounded-full"><XCircle size={12}/> REJECTED</span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-600 mb-3 font-medium">{sv.squareFeet} sq ft • {sv.heightFeet} ft height</p>
                                {sv.imageUrl && (
                                  <div className="h-24 rounded-lg overflow-hidden cursor-pointer border border-gray-200" onClick={() => setExpandedImage(sv.imageUrl)}>
                                    <img src={sv.imageUrl} alt="Slot" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                                  </div>
                                )}
                              </div>
                            ))}
                            {(report.slotVerifications || []).length === 0 && (
                              <p className="text-sm text-gray-500">No slots verified.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

            </div>
          </div>
        </div>
      </div>
      {expandedImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 animate-fade-in" onClick={() => setExpandedImage(null)}>
          <button className="absolute top-6 right-6 text-white hover:text-gray-300 z-[101]">
            <XCircle size={36} />
          </button>
          <img src={expandedImage} alt="Expanded view" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" onClick={e => e.stopPropagation()} />
        </div>
      )}

      </>
    );
  }

  // LIST VIEW
  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 animate-fade-in pt-4 pb-10">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-[28px] font-bold text-[#111]">Garage Partnership Applications</h2>
          <p className="text-gray-500 text-sm mt-1">Manage and review all incoming garage applications.</p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search applications..." 
            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-full text-sm focus:ring-2 focus:ring-blue-500 w-full sm:w-64 shadow-sm outline-none transition-all"
          />
        </div>
      </div>

      {/* Status Segmented Toggle */}
      <div className="flex p-1 bg-gray-100 rounded-xl w-max">
        {['Pending', 'Assigned', 'Completed', 'Cancelled'].map((tab) => {
          const isActive = filterTab === tab;
          const count = applications.filter(app => {
            if (tab === 'Pending') return app.status === 'Pending';
            if (tab === 'Assigned') return app.status === 'UnderReview' || app.status === 'Assigned';
            if (tab === 'Completed') return app.status === 'Approved' || app.status === 'Completed';
            if (tab === 'Cancelled') return app.status === 'Rejected' || app.status === 'Cancelled';
            return false;
          }).length;

          return (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                isActive ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab}
              {count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Data Grid */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
             <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <FileText size={48} className="mb-4 opacity-20" strokeWidth={1} />
            <p>No applications found in this category.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {applications.filter(app => {
              if (filterTab === 'Pending') return app.status === 'Pending';
              if (filterTab === 'Assigned') return app.status === 'UnderReview' || app.status === 'Assigned';
              if (filterTab === 'Completed') return app.status === 'Approved' || app.status === 'Completed';
              if (filterTab === 'Cancelled') return app.status === 'Rejected' || app.status === 'Cancelled';
              return true;
            }).map((app) => {
              const dateObj = app.createdAt ? new Date(app.createdAt) : new Date();
              const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
              const formattedTime = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
              
              let dotColor = 'bg-gray-300';
              if (app.status === 'Pending') dotColor = 'bg-orange-400';
              if (app.status === 'Approved') dotColor = 'bg-green-500';
              if (app.status === 'Rejected' || app.status === 'Cancelled') dotColor = 'bg-red-500';
              if (app.status === 'UnderReview' || app.status === 'Assigned') dotColor = 'bg-blue-500';

              return (
                <div 
                  key={app.id} 
                  onClick={() => loadApplicationDetail(app.id)}
                  className="flex items-center px-6 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50/80 transition-colors cursor-pointer group gap-4"
                >
                  {/* Image, Name & Location */}
                  <div className="flex items-center gap-4 flex-1 min-w-[300px]">
                    <div className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                      {app.propertyFrontImageUrl ? (
                        <img src={app.propertyFrontImageUrl} alt="Front" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <ImageIcon size={28} />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`}></div>
                        <span className="font-bold text-[15px] text-gray-900 truncate max-w-[200px]">
                          {getApplicantName(app)}
                        </span>
                        {app.status === 'Cancelled' && (
                          <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold whitespace-nowrap border border-red-200">
                            User Cancelled
                          </span>
                        )}
                          {app.status === 'Rejected' && app.isRefunded && (
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold whitespace-nowrap border border-red-200">
                                Refunded
                              </span>
                              <span className="text-[10px] text-gray-500 font-mono">
                                {app.refundTransactionId}
                              </span>
                            </div>
                          )}
                          {app.status === 'Rejected' && !app.isRefunded && (
                            <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold whitespace-nowrap border border-red-200">
                              Rejected
                            </span>
                          )}
                      </div>
                      <span className="text-[13px] text-gray-500 font-medium truncate flex items-center gap-1">
                        <MapPin size={12} /> {app.address || (app.city && app.state ? `${app.city}, ${app.state}` : 'Location missing')}
                      </span>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="w-[140px] shrink-0">
                    <span className="text-[13px] text-gray-500 font-medium">{formattedDate}</span>
                  </div>

                  {/* Time / Extra Info */}
                  <div className="w-[100px] shrink-0">
                    <span className="text-[13px] text-gray-500 font-medium">{formattedTime}</span>
                  </div>

                  {/* Action Button */}
                  <div className="shrink-0 pl-4">
                    <button className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded shadow-sm hover:bg-blue-700 transition-colors">
                      <ChevronRight size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowRejectModal(false)}></div>
          <div className="relative bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl">
            <h3 className="text-2xl font-black text-[#111] mb-2 tracking-tight">Reject Application</h3>
            <p className="text-gray-500 mb-6">
              {detailedApp?.assignments?.some(a => a.status === 'Completed') 
                ? "This application has a completed inspection. A partial refund of ₹1000 will be initiated automatically."
                : "No completed inspection found. A full refund of ₹2000 will be initiated automatically."}
            </p>

            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">Reason for Rejection <span className="text-red-500">*</span></label>
              <textarea 
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all resize-none h-32"
                placeholder="e.g. Missing required documents, unsatisfactory location, etc."
              />
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowRejectModal(false)}
                className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmRefund}
                className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30"
              >
                Reject & Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

