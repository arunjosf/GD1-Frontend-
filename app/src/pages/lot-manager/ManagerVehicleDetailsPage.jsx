import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Car, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  ShieldCheck, 
  DollarSign, 
  Loader2,
  FileText,
  ArrowRight,
  Wrench,
  X,
  MessageCircle,
  Camera,
  Check
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getToken } from '../../api/auth';
import { useCall } from '../../context/CallContext';
export default function ManagerVehicleDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { startCall } = useCall();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);

  const [isRecommendModalOpen, setIsRecommendModalOpen] = useState(false);
  const [recommendRemarks, setRecommendRemarks] = useState('');
  const [isSubmittingRecommend, setIsSubmittingRecommend] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchVehicleDetails();
  }, [id]);

  useEffect(() => {
    if (isRecommendModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isRecommendModalOpen]);

  const fetchVehicleDetails = async () => {
    setLoading(true);
    try {
      const token = getToken('AccessToken');
      const res = await fetch(`https://localhost:7108/api/lot-manager/vehicles/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        if (res.status === 404) throw new Error("Vehicle not found");
        throw new Error("Failed to fetch vehicle details");
      }
      const result = await res.json();
      if (!result.success) throw new Error(result.message);
      setVehicle(result.data);

      try {
        const sRes = await fetch('https://localhost:7108/api/lot-manager/my-services', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const sResult = await sRes.json();
        if (sResult.success) {
            setServices(sResult.data.filter(s => s.vehicleId == result.data.vehicleId));
        }
      } catch (e) { console.error('Failed to fetch services', e); }

    } catch (err) {
      toast.error(err.message || "Error loading vehicle details");
      navigate('/lot-manager/vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleRecommendSubmit = async () => {
    if (!recommendRemarks.trim()) return;
    setIsSubmittingRecommend(true);
    try {
      const token = getToken('AccessToken');
      const response = await fetch('https://localhost:7108/api/lot-manager/recommend-service', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vehicleId: vehicle.vehicleId,
          remarks: recommendRemarks
        })
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Service recommended successfully!");
        setIsRecommendModalOpen(false);
        setRecommendRemarks('');
        setVehicle(prev => ({ ...prev, hasServiceRecommendation: true, managerServiceRemarks: recommendRemarks }));
      } else {
        toast.error(data.message || "Failed to recommend service");
      }
    } catch (err) {
      toast.error("Error submitting recommendation");
    } finally {
      setIsSubmittingRecommend(false);
    }
  };

  const handleCall = () => {
    if (vehicle?.lotOwnerId && vehicle?.lotOwnerName) {
      startCall(vehicle.lotOwnerId, 'lot-owner', vehicle.lotOwnerName);
    } else {
      toast.error("");
    }
  };

  const handleMessage = () => {
    if (vehicle?.lotOwnerId && vehicle?.lotOwnerName) {
      navigate('/lot-manager/messages', { 
        state: { 
          preselect: { 
            category: 'manager',
            referenceId: vehicle.lotOwnerId, 
            name: vehicle.lotOwnerName 
          } 
        } 
      });
    } else {
      toast.error("Messaging context not available.");
    }
  };

  const getNextUpdateDate = () => {
    if (!vehicle?.storedSince) return null;
    const startDate = new Date(vehicle.storedSince);
    startDate.setDate(startDate.getDate() + 7);
    return startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  
  const getUpcomingService = () => {
    if (!services || services.length === 0) return null;
    return services.find(s => s.status !== 'Service Completed' && s.status !== 'Completed' && s.status !== 'Cancelled');
  };
  const upcomingService = getUpcomingService();

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `https://localhost:7108${url.startsWith('/') ? url : `/${url}`}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
         <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!vehicle) return null;

  return (
    <>
      <div className="w-full max-w-[1200px] mx-auto space-y-6 animate-fade-in pb-10">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => navigate('/lot-manager/vehicles')}
            className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-[28px] font-black text-gray-900 tracking-tight">Vehicle Details</h2>
            <p className="text-gray-500 text-sm mt-1">{vehicle.brand} {vehicle.model}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Image and Basic Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="h-64 bg-gray-100 relative">
                {vehicle.imageUrl ? (
                  <img src={getImageUrl(vehicle.imageUrl)} alt={vehicle.brand} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <Car size={48} />
                    <span className="text-sm font-medium mt-2">No Image</span>
                  </div>
                )}
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-black text-gray-900 leading-tight mb-2">{vehicle.brand} {vehicle.model}</h3>
                <div className="flex items-center gap-2 mb-6">
                  <span className="px-3 py-1 bg-gray-100 text-gray-900 font-bold text-sm rounded-lg">
                    {vehicle.registrationNo}
                  </span>
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 font-bold text-sm rounded-lg">
                    {vehicle.category}
                  </span>
                </div>

                {upcomingService && (
                  <div className="mb-4 bg-blue-50 rounded-2xl border border-blue-100 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 relative">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping absolute"></div>
                        <div className="w-2 h-2 bg-blue-600 rounded-full relative z-10"></div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-blue-600 mb-0.5">Upcoming Service</p>
                        <p className="text-sm font-bold text-blue-900">{upcomingService.status}</p>
                      </div>
                    </div>
                      <button
                        onClick={() => navigate(`/lot-manager/services/${upcomingService.id}`)}
                        className="px-4 py-2 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                      >
                        Track
                      </button>
                  </div>
                )}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 shrink-0">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500">Verification</p>
                      <p className="text-sm font-bold text-gray-900">{vehicle.verificationStatus || 'Unknown'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500">Stored Since</p>
                      <p className="text-sm font-bold text-gray-900">{new Date(vehicle.storedSince).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Last Service Report */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
                <Wrench size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-0.5">Last Service Report</p>
                <p className="text-sm font-bold text-gray-900">
                  {vehicle.lastServiceReportDate ? new Date(vehicle.lastServiceReportDate).toLocaleDateString() : 'No service done yet'}
                </p>
              </div>
            </div>




          </div>

          {/* Right Column: Owner Info and Actions */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <User size={20} className="text-blue-500" /> Owner Details
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-2xl p-4 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-600 shadow-sm shrink-0">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">Full Name</p>
                    <p className="text-base font-bold text-gray-900">{vehicle.ownerName}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-600 shadow-sm shrink-0">
                    <Mail size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">Email Address</p>
                    <p className="text-base font-bold text-gray-900 truncate">{vehicle.ownerEmail || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Connect with Boss */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Phone size={20} className="text-blue-500" /> Connect with Boss
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={handleCall}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-50 text-gray-700 hover:bg-gray-100 font-bold transition-colors text-sm shadow-sm border border-gray-100"
                >
                  <Phone size={16} /> Call Boss
                </button>
                <button 
                  onClick={handleMessage}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-50 text-gray-700 hover:bg-gray-100 font-bold transition-colors text-sm shadow-sm border border-gray-100"
                >
                  <MessageCircle size={16} /> Message Boss
                </button>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                Quick Actions
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                   <button 
                      onClick={() => navigate(`/track-pickup/${vehicle.bookingId}`)}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border-2 border-gray-200 text-gray-700 text-sm font-bold hover:bg-gray-50 transition-colors"
                   >
                      <ArrowRight size={16} /> View Journey
                   </button>
                 {vehicle.hasServiceRecommendation ? (
                   <div className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 text-sm font-bold">
                      <Wrench size={16} /> Service Recommended
                   </div>
                 ) : (
                   <button 
                      onClick={() => setIsRecommendModalOpen(true)}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border-2 border-gray-200 text-gray-700 text-sm font-bold hover:bg-gray-50 transition-colors"
                   >
                      <Wrench size={16} /> Recommend Service
                   </button>
                 )}
                 <button 
                    onClick={() => navigate(`/lot-manager/submit-weekly/adhoc/${id}`)}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors"
                 >
                    <FileText size={16} /> Submit Weekly Report
                 </button>
              </div>
            </div>

            {/* Weekly Update */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col transition-all duration-300">
              <div className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-gray-50 rounded-2xl flex shrink-0 items-center justify-center text-[#1d1d1f] border border-gray-200/60 shadow-sm">
                    <Calendar size={26} />
                  </div>
                  <div>
                    <h4 className="text-[22px] font-bold text-[#1d1d1f] tracking-tight mb-1">
                      Weekly Update Tracking
                    </h4>
                    <p className="text-[#86868b] text-[13px] font-medium max-w-[320px] leading-relaxed">Keep owners informed with regular updates</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {vehicle.recentWeeklyUpdateImages || vehicle.weeklyUpdateDescription ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                        <p className="text-sm font-bold text-gray-900">
                          Last Updated: {vehicle.lastWeeklyUpdateDate ? new Date(vehicle.lastWeeklyUpdateDate).toLocaleDateString() : 'Recently'}
                        </p>
                      </div>
                      <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold border border-blue-100">
                        Next due in {7 - (vehicle.lastWeeklyUpdateDate ? Math.floor((new Date() - new Date(vehicle.lastWeeklyUpdateDate)) / (1000 * 60 * 60 * 24)) : 0)} days
                      </div>
                    </div>

                    {vehicle.weeklyUpdateDescription && (
                      <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 relative">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500 rounded-l-2xl"></div>
                        <p className="text-xs font-bold tracking-widest text-blue-500 uppercase mb-2">Manager's Remark</p>
                        <p className="text-gray-900 font-medium text-base italic">"{vehicle.weeklyUpdateDescription}"</p>
                      </div>
                    )}
                    
                    {vehicle.recentWeeklyUpdateImages && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[
                          { label: 'Front', url: vehicle.recentWeeklyUpdateImages.frontImageUrl },
                          { label: 'Rear', url: vehicle.recentWeeklyUpdateImages.rearImageUrl },
                          { label: 'Left', url: vehicle.recentWeeklyUpdateImages.leftSideImageUrl },
                          { label: 'Right', url: vehicle.recentWeeklyUpdateImages.rightSideImageUrl },
                          { label: 'Interior', url: vehicle.recentWeeklyUpdateImages.interiorImageUrl },
                          { label: 'Odometer', url: vehicle.recentWeeklyUpdateImages.odometerImageUrl },
                        ].filter(img => img.url).map((img, i) => (
                          <div key={i} className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer border border-gray-100 shadow-sm" onClick={() => setSelectedImage(img)}>
                            <img src={img.url.startsWith('http') ? img.url : `https://localhost:7108${img.url}`} alt={img.label} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-transparent flex items-end p-3">
                              <span className="bg-white/90 text-black px-2 py-1 rounded-md font-bold text-[10px] tracking-wide shadow-sm">{img.label}</span>
                            </div>
                            <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                              <Camera size={14} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-4">
                      <Calendar size={28} />
                    </div>
                    <h5 className="text-lg font-bold text-gray-900 mb-2">No Weekly Updates Yet</h5>
                    <p className="text-gray-500 font-medium text-sm max-w-sm mb-6">
                      Perform condition checks every 7 days to keep the owner informed about their vehicle's status.
                    </p>
                    <div className="bg-white px-6 py-4 rounded-2xl border border-gray-100 shadow-sm inline-flex flex-col items-center">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Next Update Due</span>
                      <span className="text-xl font-black text-blue-600">{getNextUpdateDate() || "Pending"}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* On-Demand Images Section - below weekly update */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Camera size={20} className="text-blue-500" /> On-Demand Images
                </h4>
              </div>
              {vehicle.recentOnDemandImages ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Front', url: vehicle.recentOnDemandImages.frontImageUrl },
                      { label: 'Rear', url: vehicle.recentOnDemandImages.rearImageUrl },
                      { label: 'Left', url: vehicle.recentOnDemandImages.leftSideImageUrl },
                      { label: 'Right', url: vehicle.recentOnDemandImages.rightSideImageUrl },
                      { label: 'Interior', url: vehicle.recentOnDemandImages.interiorImageUrl },
                      { label: 'Odometer', url: vehicle.recentOnDemandImages.odometerImageUrl },
                    ].filter(img => img.url).map((img, i) => (
                      <div
                        key={i}
                        className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer border border-gray-100"
                        onClick={() => setSelectedImage(img)}
                      >
                        <img
                          src={img.url.startsWith('http') ? img.url : `https://localhost:7108${img.url}`}
                          alt={img.label}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-transparent flex items-end p-2">
                          <span className="text-white font-bold text-[10px] uppercase tracking-wider">{img.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 font-medium">
                    Last submitted: {vehicle.lastOnDemandImageDate ? new Date(vehicle.lastOnDemandImageDate).toLocaleDateString() : 'Recently'}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100 shrink-0">
                      <Camera size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-500">Status</p>
                      <p className="text-gray-900 font-medium text-sm">
                        {vehicle.hasPendingOnDemandRequest ? 'Owner requested — submit via Tasks' : 'No on-demand images yet'}
                      </p>
                    </div>
                  </div>
                  {vehicle.hasPendingOnDemandRequest && (
                    <button
                      onClick={() => navigate('/lot-manager/tasks')}
                      className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Camera size={16} /> Submit Images
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recommend Service Modal */}
      {isRecommendModalOpen && (
        <div className="fixed inset-0 lg:left-[240px] xl:left-[260px] z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 md:p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setIsRecommendModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
            >
              <X size={18} />
            </button>
            
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-6">
              <Wrench size={24} />
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Recommend Service</h3>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Let the owner know if the vehicle requires maintenance or a service check.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Manager Remarks</label>
                <textarea 
                  value={recommendRemarks}
                  onChange={(e) => setRecommendRemarks(e.target.value)}
                  placeholder="E.g. The battery is low and engine oil needs replacement."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none h-32 text-sm text-gray-900 placeholder:text-gray-400"
                ></textarea>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button 
                  onClick={() => setIsRecommendModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleRecommendSubmit}
                  disabled={isSubmittingRecommend || !recommendRemarks.trim()}
                  className="flex-1 py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmittingRecommend ? <Loader2 size={18} className="animate-spin" /> : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Per-Image Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-5 right-5 w-11 h-11 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <X size={22} />
          </button>
          <img
            src={selectedImage.url.startsWith('http') ? selectedImage.url : `https://localhost:7108${selectedImage.url}`}
            alt={selectedImage.label}
            className="max-w-[90vw] max-h-[80vh] object-contain rounded-2xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
          <p className="text-white font-bold text-base mt-5 tracking-wide uppercase">{selectedImage.label}</p>
        </div>
      )}
    </>
  );
}
