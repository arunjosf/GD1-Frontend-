import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  Building2, 
  MapPin, 
  ArrowLeft, 
  Phone, 
  MessageCircle, 
  UserX, 
  UserCheck, 
  ShieldAlert,
  Loader2,
  Users,
  UserPlus,
  X,
  FileText
} from 'lucide-react';
import { getToken } from '../../api/auth';

export default function LotOwnerManagersPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [managers, setManagers] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [togglingManagerId, setTogglingManagerId] = useState(null);
  const [expandedImage, setExpandedImage] = useState(null);

  useEffect(() => {
    if (location.state?.viewAllManagers) {
      fetchManagersForProperty({ id: 'all', name: 'All Properties' });
      setLoadingProperties(false);
    } else {
      fetchProperties();
    }
  }, [location.state]);

  const fetchProperties = async () => {
    setLoadingProperties(true);
    try {
      const token = getToken('AccessToken');
      if (!token) throw new Error("No token found");

      const res = await fetch('https://localhost:7108/api/lot-manager/properties', { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (!res.ok) throw new Error("Failed to fetch properties");
      const result = await res.json();
      setProperties(result.data || []);
    } catch (err) {
      toast.error(err.message || 'Could not load properties.');
    } finally {
      setLoadingProperties(false);
    }
  };

  const fetchManagersForProperty = async (property) => {
    setSelectedProperty(property);
    setLoadingManagers(true);
    try {
      const token = getToken('AccessToken');
      if (!token) throw new Error("No token found");

      const url = property && property.id !== 'all' 
        ? `https://localhost:7108/api/lot-manager/lot-owners/all-managers?propertyId=${property.id}`
        : `https://localhost:7108/api/lot-manager/lot-owners/all-managers`;

      const res = await fetch(url, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (!res.ok) throw new Error("Failed to fetch managers");
      const result = await res.json();
      setManagers(result.data || []);
    } catch (err) {
      toast.error(err.message || 'Could not load managers.');
    } finally {
      setLoadingManagers(false);
    }
  };

  const handleToggleBlock = async (manager) => {
    setTogglingManagerId(manager.lotManagerRecordId);
    try {
      const token = getToken('AccessToken');
      if (!token) throw new Error("No token found");

      const res = await fetch(`https://localhost:7108/api/lot-manager/managers/${manager.lotManagerRecordId}/toggle-status`, { 
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      const result = await res.json();
      if (res.ok && result.success) {
        toast.success(result.message || 'Status updated successfully.');
        // Update local status
        setManagers(prev => prev.map(m => 
          m.lotManagerRecordId === manager.lotManagerRecordId 
            ? { ...m, isActive: !m.isActive } 
            : m
        ));
      } else {
        toast.error(result.message || 'Failed to update manager status.');
      }
    } catch (err) {
      toast.error(err.message || 'Network error.');
    } finally {
      setTogglingManagerId(null);
    }
  };

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `https://localhost:7108${cleanUrl}`;
  };

  if (loadingProperties) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
         <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 animate-fade-in pt-4 pb-10 px-4">
      {/* Header / Navigation */}
      {!selectedProperty ? (
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-[28px] font-black text-gray-900 tracking-tight">Property Managers</h2>
            <p className="text-gray-500 text-sm mt-1">Select a property below to manage and contact its assigned managers.</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSelectedProperty(null)}
              className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm shrink-0"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-4">
              {selectedProperty.propertyImages && selectedProperty.propertyImages.length > 0 ? (
                <img src={getImageUrl(selectedProperty.propertyImages[0])} alt={selectedProperty.name} className="w-16 h-16 rounded-2xl object-cover border border-gray-100 shadow-sm hidden sm:block" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-sm hidden sm:flex">
                  <Building2 size={28} />
                </div>
              )}
              <div>
                <h2 className="text-[24px] font-black text-gray-900 tracking-tight">
                  Managers - {selectedProperty.name}
                </h2>
                {selectedProperty.id !== 'all' && (
                  <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
                    <MapPin size={14} className="text-gray-400" />
                    {selectedProperty.addressLine ? `${selectedProperty.addressLine}, ` : ''}{selectedProperty.city}{selectedProperty.state ? `, ${selectedProperty.state}` : ''}
                  </p>
                )}
              </div>
            </div>
          </div>
          <button className="px-5 py-2.5 bg-white text-blue-600 border border-blue-200 rounded-xl font-bold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 shadow-sm shrink-0">
            <UserPlus size={18} /> <span className="hidden sm:inline">Invite Manager</span>
          </button>
        </div>
      )}

      {/* Main Content */}
      {!selectedProperty ? (
        /* View 1: Properties List */
        properties.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm max-w-md mx-auto">
            <Building2 size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-bold text-gray-900">No Properties Found</h3>
            <p className="text-gray-500 text-sm mt-2">You must register a property before managing managers.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <div 
                key={property.id} 
                className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    {property.propertyImages && property.propertyImages.length > 0 ? (
                      <img src={getImageUrl(property.propertyImages[0])} alt={property.name} className="w-16 h-16 rounded-2xl object-cover border border-gray-100 shadow-sm" />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-sm">
                        <Building2 size={28} />
                      </div>
                    )}
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      property.status === 'Active' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-gray-50 text-gray-700 border border-gray-100'
                    }`}>
                      {property.status}
                    </span>
                  </div>

                  <h4 className="text-xl font-bold text-gray-900 mb-2 truncate">{property.name}</h4>
                  <div className="flex items-start gap-1.5 text-sm text-gray-500 mb-6">
                    <MapPin size={16} className="shrink-0 mt-0.5 text-gray-400" />
                    <span className="line-clamp-2">{property.addressLine ? `${property.addressLine}, ` : ''}{property.city}{property.state ? `, ${property.state}` : ''}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                  <div className="text-xs text-gray-500 font-semibold">
                    Slots: <span className="text-gray-900 font-bold">{property.totalSlots}</span>
                  </div>
                  <button 
                    onClick={() => fetchManagersForProperty(property)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <Users size={14} /> View Managers
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* View 2: Managers List of Selected Property */
        <div className="space-y-4">
          {loadingManagers ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
          ) : managers.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm max-w-md mx-auto">
              <Users size={48} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-bold text-gray-900">No Managers Assigned</h3>
              <p className="text-gray-500 text-sm mt-2">There are currently no managers assigned to this property.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {managers.map((manager) => {
                const isToggling = togglingManagerId === manager.lotManagerRecordId;
                const isBlocked = !manager.isActive;

                return (
                  <div 
                    key={manager.lotManagerRecordId}
                    className={`bg-white rounded-3xl border transition-all p-6 flex flex-col gap-5 ${
                      isBlocked ? 'border-red-100 bg-red-50/5' : 'border-gray-100 shadow-sm hover:shadow-md'
                    }`}
                  >
                    {/* Top Row: Info (left) & Icons (right) */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 w-full">
                      {/* Left: Selfie & Text */}
                      <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start text-center sm:text-left w-full sm:w-auto flex-1">
                        {manager.selfieUrl ? (
                          <div 
                            className="w-20 h-20 rounded-2xl overflow-hidden border border-gray-100 shadow-sm shrink-0 bg-white cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                            onClick={() => setExpandedImage(getImageUrl(manager.selfieUrl))}
                            title="Click to expand selfie"
                          >
                            <img src={getImageUrl(manager.selfieUrl)} alt={manager.managerName} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-20 h-20 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-2xl shrink-0 border border-blue-100 shadow-sm">
                            {manager.managerName[0]}
                          </div>
                        )}
                        <div className="space-y-2 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                            <h4 className="text-lg font-bold text-gray-900 truncate max-w-[180px]">{manager.managerName}</h4>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isBlocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                            }`}>
                              {isBlocked ? 'Blocked' : 'Active'}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                            <p className="text-xs text-gray-500 truncate">{manager.managerEmail}</p>
                            <p className="text-xs text-gray-500 font-semibold">{manager.managerPhone || 'No phone number'}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 border-t border-gray-50">
                            <p className="text-xs text-gray-500">Joined: <span className="font-semibold text-gray-700">{new Date(manager.addedAt).toLocaleDateString()}</span></p>
                            <p className="text-xs text-gray-500">Salary: <span className="font-semibold text-gray-700">{manager.salary ? `Rs.${manager.salary}` : 'Not Specified'}</span></p>
                          </div>
                        </div>
                      </div>

                      {/* Right: Message & Call icons */}
                      <div className="flex items-center justify-center sm:justify-end shrink-0">
                        {!isBlocked ? (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                window.dispatchEvent(new CustomEvent('START_GLOBAL_CALL', { detail: { 
                                  bookingId: manager.managerUserId, 
                                  category: 'manager',
                                  receiverName: manager.managerName 
                                }}));
                              }} 
                              className="w-10 h-10 flex items-center justify-center bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors shadow-sm"
                              title="Call Manager"
                            >
                              <Phone size={18} />
                            </button>
                            <button 
                              onClick={() => {
                                navigate('/lot-owner/messages', { 
                                  state: { 
                                    preselect: { 
                                      referenceId: manager.managerUserId, 
                                      category: 'manager',
                                      name: manager.managerName 
                                    } 
                                  } 
                                });
                              }} 
                              className="w-10 h-10 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors shadow-sm"
                              title="Message Manager"
                            >
                              <MessageCircle size={18} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2 opacity-30 cursor-not-allowed" title="Unblock manager to call or message">
                            <button disabled className="w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-400 rounded-full">
                              <Phone size={18} />
                            </button>
                            <button disabled className="w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-400 rounded-full">
                              <MessageCircle size={18} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Row: View ID Proof & Block buttons */}
                    <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 w-full border-t border-gray-50 pt-2 mt-auto">
                      {manager.idProofUrl && (
                        <button 
                          onClick={() => setExpandedImage(getImageUrl(manager.idProofUrl))}
                          className="px-4 py-2 text-xs font-bold border border-gray-200 text-blue-600 bg-white hover:bg-gray-50 rounded-xl flex items-center gap-1.5 transition-all shadow-sm focus:outline-none"
                        >
                          <FileText size={14} /> View ID Proof
                        </button>
                      )}
                      
                      {/* Block/Unblock toggle */}
                      <button 
                        onClick={() => handleToggleBlock(manager)}
                        disabled={isToggling}
                        className={`px-4 w-28 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border shadow-sm ${
                          isBlocked 
                            ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                            : 'bg-red-50 text-red-700 border-red-100 hover:bg-red-100/50'
                        }`}
                      >
                        {isToggling ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : isBlocked ? (
                          <>
                            <UserCheck size={14} /> Unblock
                          </>
                        ) : (
                          <>
                            <UserX size={14} /> Block
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Image Modal */}
      {expandedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setExpandedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
            <img src={expandedImage} alt="Expanded preview" className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain" />
            <button 
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors p-2 bg-black/50 rounded-full"
              onClick={() => setExpandedImage(null)}
            >
              <X size={24} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
