import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Search, ChevronRight, ArrowLeft, CheckCircle, XCircle, User, Briefcase, FileText, Image as ImageIcon, MapPin } from 'lucide-react';

export default function AdminApplicationsPage() {
  const [activeTab, setActiveTab] = useState('franchise'); // 'franchise' or 'service-center'
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Counts
  const [counts, setCounts] = useState({ franchise: 0, serviceCenter: 0 });

  // Full-page detailed view state
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [detailedApp, setDetailedApp] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCounts = useCallback(async () => {
    try {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; AccessToken=`);
      const token = parts.length === 2 ? parts.pop().split(';').shift() : null;
      if (!token) return;

      const [franchiseRes, scRes] = await Promise.all([
        fetch('https://localhost:7108/api/admin/franchise/applications', { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => null),
        fetch('https://localhost:7108/api/admin/service-centers/applications', { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => null)
      ]);

      let fCount = 0;
      let scCount = 0;

      if (franchiseRes && franchiseRes.ok) {
        const result = await franchiseRes.json();
        fCount = (result.data || []).filter(app => app.status === 'Pending').length;
      }
      if (scRes && scRes.ok) {
        const result = await scRes.json();
        scCount = (result.data || []).filter(app => app.status === 'Pending').length;
      }

      setCounts({ franchise: fCount, serviceCenter: scCount });
    } catch { /* ignore */ }
  }, []);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; AccessToken=`);
      const token = parts.length === 2 ? parts.pop().split(';').shift() : null;
      if (!token) throw new Error("No token found");

      const endpoint = activeTab === 'franchise' 
        ? 'https://localhost:7108/api/admin/franchise/applications'
        : 'https://localhost:7108/api/admin/service-centers/applications';

      const res = await fetch(endpoint, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to fetch applications");
      const result = await res.json();
      setApplications(result.data || []);
    } catch (err) {
      toast.error(err.message || 'Could not load applications.');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchCounts();
    fetchApplications();
  }, [fetchCounts, fetchApplications]);

  const loadApplicationDetail = async (id) => {
    setSelectedAppId(id);
    setDetailLoading(true);
    try {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; AccessToken=`);
      const token = parts.length === 2 ? parts.pop().split(';').shift() : null;
      if (!token) throw new Error("No token found");

      const endpoint = activeTab === 'franchise'
        ? `https://localhost:7108/api/admin/franchise/applications/${id}`
        : `https://localhost:7108/api/admin/service-centers/applications/${id}`; // NOTE: This endpoint might not exist for detailed SC view if it returns all data in list, but let's assume it does or fallback to the list item

      const res = await fetch(endpoint, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const result = await res.json();
        setDetailedApp(result.data);
      } else {
        // Fallback to the item from the list if detail endpoint fails
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

  const handleUpdateStatus = async (decision) => {
    if (!detailedApp) return;
    setActionLoading(true);
    try {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; AccessToken=`);
      const token = parts.length === 2 ? parts.pop().split(';').shift() : null;
      if (!token) throw new Error("No token found");

      const endpoint = activeTab === 'franchise'
        ? `https://localhost:7108/api/admin/franchise/applications/${detailedApp.id}/update-status`
        : `https://localhost:7108/api/admin/service-centers/${detailedApp.id}/update-status`;

      const formData = new FormData();
      formData.append('Decision', decision); // "Approved" or "Rejected"
      formData.append('AdminNotes', `Action taken: ${decision}`);

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
      fetchCounts();
    } catch (err) {
      toast.error(err.message || 'Could not update status.');
    } finally {
      setActionLoading(false);
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
              </div>
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
              </div>
            </div>
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Core Details */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-[#111] flex items-center gap-2 border-b border-gray-100 pb-3">
                <Briefcase size={20} className="text-blue-500" /> Application Data
              </h3>
              <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100 space-y-4">
                {Object.keys(detailedApp)
                  .filter(k => !['id', 'firstName', 'lastName', 'fullName', 'email', 'contactEmail', 'phone', 'phoneNumber', 'createdAt', 'status', 'businessName', 'city', 'state', 'ownerName', 'propertyFrontImageUrl', 'otherImageUrls', 'images', 'oemCertificateUrl'].includes(k))
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
                        <p className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                        <p className="text-sm font-medium text-gray-900 break-words">{displayVal}</p>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Images and Documents */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-[#111] flex items-center gap-2 border-b border-gray-100 pb-3">
                <ImageIcon size={20} className="text-blue-500" /> Documents & Images
              </h3>
              <div className="space-y-4">
                {detailedApp.propertyFrontImageUrl && (
                  <div className="group rounded-2xl border border-gray-200 overflow-hidden relative shadow-sm hover:shadow-md transition-all">
                    <img src={detailedApp.propertyFrontImageUrl} alt="Property Front" className="w-full h-48 object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                      <p className="text-white font-medium">Property Front</p>
                    </div>
                  </div>
                )}
                
                {detailedApp.oemCertificateUrl && (
                  <div className="group rounded-2xl border border-gray-200 overflow-hidden relative shadow-sm hover:shadow-md transition-all bg-gray-50 flex items-center justify-center h-24">
                    <a href={detailedApp.oemCertificateUrl} target="_blank" rel="noreferrer" className="text-blue-600 font-medium flex items-center gap-2 hover:underline">
                      <FileText size={20} /> View OEM Certificate
                    </a>
                  </div>
                )}

                {(detailedApp.otherImageUrls || detailedApp.images || []).length > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    {(detailedApp.otherImageUrls || detailedApp.images).map((url, i) => (
                      <div key={i} className="rounded-xl border border-gray-200 overflow-hidden relative shadow-sm">
                        <img src={url} alt={`Additional ${i+1}`} className="w-full h-24 object-cover" />
                        <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2">
                          <p className="text-white text-xs font-medium truncate">Facility Image {i+1}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!detailedApp.propertyFrontImageUrl && !detailedApp.oemCertificateUrl && (detailedApp.otherImageUrls || detailedApp.images || []).length === 0 && (
                  <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <ImageIcon size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No images or documents provided.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Action Bottom Bar */}
        {(detailedApp.status === 'Pending' || detailedApp.status === 'UnderReview') && (
          <div className="fixed bottom-0 left-0 right-0 lg:ml-[260px] bg-white border-t border-gray-100 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-40 flex justify-end gap-4 items-center">
            <button 
              onClick={() => handleUpdateStatus('Rejected')}
              disabled={actionLoading}
              className="px-8 py-3 bg-white text-red-600 border border-red-200 rounded-xl font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <XCircle size={20} /> Reject
            </button>
            <button 
              onClick={() => handleUpdateStatus('Approved')}
              disabled={actionLoading}
              className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-blue-500/20"
            >
              <CheckCircle size={20} /> {activeTab === 'franchise' ? 'Assign Agent / Approve' : 'Approve'}
            </button>
          </div>
        )}
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 animate-fade-in pt-4 pb-10">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-[28px] font-bold text-[#111]">Applications</h2>
          <p className="text-gray-500 text-sm mt-1">Manage and review all incoming applications.</p>
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

      {/* Segmented Toggle with Pending Counts */}
      <div className="flex p-1 bg-gray-100 rounded-xl w-max">
        <button
          onClick={() => setActiveTab('franchise')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
            activeTab === 'franchise' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Franchise Applications
          {counts.franchise > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'franchise' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'}`}>
              {counts.franchise}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('service-center')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
            activeTab === 'service-center' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Service Center Applications
          {counts.serviceCenter > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'service-center' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'}`}>
              {counts.serviceCenter}
            </span>
          )}
        </button>
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
            {applications.map((app) => {
              const dateObj = app.createdAt ? new Date(app.createdAt) : new Date();
              const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
              const formattedTime = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
              
              let dotColor = 'bg-gray-300';
              if (app.status === 'Pending') dotColor = 'bg-orange-400';
              if (app.status === 'Approved') dotColor = 'bg-green-500';
              if (app.status === 'Rejected') dotColor = 'bg-red-500';
              if (app.status === 'UnderReview') dotColor = 'bg-blue-500';

              return (
                <div 
                  key={app.id} 
                  onClick={() => loadApplicationDetail(app.id)}
                  className="flex items-center px-6 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50/80 transition-colors cursor-pointer group gap-4"
                >
                  {/* Avatar & Name */}
                  <div className="flex items-center gap-3 w-1/4 min-w-[200px]">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 font-bold text-xs shrink-0">
                      {getApplicantName(app).charAt(0)}
                    </div>
                    <span className="font-semibold text-[14px] text-gray-900 truncate">
                      {getApplicantName(app)}
                    </span>
                  </div>

                  {/* Dot & Summary */}
                  <div className="flex items-center gap-2 flex-1 min-w-[250px]">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`}></div>
                    <span className="text-[14px] text-gray-600 font-medium truncate">
                      {app.businessName || app.contactEmail || app.email || 'Application Submitted'}
                    </span>
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

    </div>
  );
}
