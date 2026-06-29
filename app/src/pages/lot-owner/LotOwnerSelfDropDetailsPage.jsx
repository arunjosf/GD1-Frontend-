import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getToken } from '../../api/auth';
import { 
  ArrowLeft, Calendar, Clock, User, 
  MapPin, Eye, Car, Shield, CheckCircle2, Loader2
} from 'lucide-react';

export default function LotOwnerSelfDropDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  // Image lightbox modal
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const [expandedImage, setExpandedImage] = useState(null);
  const [expandedTitle, setExpandedTitle] = useState('');

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    try {
      const token = getToken('AccessToken');
      if (!token) return;

      const res = await fetch(`https://gd1-grand-auto-depot-one-9ms1.onrender.com/api/lot-owner/dashboard/self-drops/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error("Failed to fetch self drop details");
      const result = await res.json();
      if (result.success) {
        setDetail(result.data);
      } else {
        toast.error("Details could not be resolved.");
        navigate('/lot-owner/self-drops');
      }
    } catch (err) {
      toast.error(err.message || "Error fetching details");
    } finally {
      setLoading(false);
    }
  };

  const handleImageExpand = (url, title) => {
    if (!url) return;
    setExpandedImage(url);
    setExpandedTitle(title);
    setIsImageExpanded(true);
  };

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `https://gd1-grand-auto-depot-one-9ms1.onrender.com${url.startsWith('/') ? url : `/${url}`}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!detail) return null;

  return (
    <div className="w-full max-w-[1200px] mx-auto space-y-6 pb-12 animate-fade-in relative">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <button 
            onClick={() => navigate('/lot-owner/self-drops')}
            className="w-9 h-9 flex items-center justify-center bg-white border border-gray-100 text-gray-600 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm shrink-0"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Self Drop Details</h2>
            <p className="text-gray-500 text-xs sm:text-sm mt-0.5 hidden sm:block">View customer drop-off details</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Main Details & Images */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <h3 className="font-extrabold text-gray-900 text-lg mb-4">Vehicle & Documents</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Vehicle Image</span>
                <div 
                  onClick={() => handleImageExpand(getImageUrl(detail.vehicleImage), "Vehicle Image")}
                  className="aspect-video bg-gray-50 border border-gray-100 rounded-xl overflow-hidden cursor-pointer group relative shadow-sm"
                >
                  {detail.vehicleImage ? (
                    <img src={getImageUrl(detail.vehicleImage)} alt="Vehicle" className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-200" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400"><Car size={24} /><span className="text-[10px] font-medium mt-1">No Image</span></div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Owner ID Proof</span>
                <div 
                  onClick={() => handleImageExpand(getImageUrl(detail.ownerIdProofUrl), "Owner ID Proof")}
                  className="aspect-video bg-gray-50 border border-gray-100 rounded-xl overflow-hidden cursor-pointer group relative shadow-sm"
                >
                  {detail.ownerIdProofUrl ? (
                    <img src={getImageUrl(detail.ownerIdProofUrl)} alt="ID Proof" className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-200" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400"><User size={24} /><span className="text-[10px] font-medium mt-1">Not Uploaded</span></div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Vehicle RC</span>
                <div 
                  onClick={() => handleImageExpand(getImageUrl(detail.vehicleRcUrl), "Vehicle RC")}
                  className="aspect-video bg-gray-50 border border-gray-100 rounded-xl overflow-hidden cursor-pointer group relative shadow-sm"
                >
                  {detail.vehicleRcUrl ? (
                    <img src={getImageUrl(detail.vehicleRcUrl)} alt="RC Document" className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-200" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400"><Shield size={24} /><span className="text-[10px] font-medium mt-1">Not Uploaded</span></div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Manager Condition Report (if stored) */}
          {(detail.status === 'InLot' || detail.status === 'Completed') && detail.verifiedAt && (
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="text-green-600 w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-lg">Storage Condition Report</h3>
                  <p className="text-green-600 text-xs font-bold">Safely stored in lot</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {[
                  { key: 'frontImageUrl', label: 'Front' },
                  { key: 'rearImageUrl', label: 'Rear' },
                  { key: 'leftSideImageUrl', label: 'Left Side' },
                  { key: 'rightSideImageUrl', label: 'Right Side' },
                  { key: 'interiorImageUrl', label: 'Interior' },
                  { key: 'odometerImageUrl', label: 'Odometer' }
                ].map((item) => (
                  <div 
                    key={item.key} 
                    onClick={() => handleImageExpand(getImageUrl(detail[item.key]), item.label)}
                    className="aspect-square bg-gray-50 border border-gray-100 rounded-xl overflow-hidden cursor-pointer group relative shadow-sm"
                  >
                    {detail[item.key] ? (
                      <img src={getImageUrl(detail[item.key])} alt={item.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-2 text-center">
                        <span className="text-[9px] font-bold mt-1">{item.label}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {detail.managerRemarks && (
                <div className="mt-4 bg-gray-50 p-4 rounded-xl text-sm text-gray-700">
                  <span className="font-bold block mb-1">Remarks:</span>
                  {detail.managerRemarks}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right Col: Customer & Booking Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Vehicle Information</h3>
              <p className="text-xl font-black text-gray-900 leading-tight">
                {detail.vehicleBrand} {detail.vehicleModel}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg border border-gray-200">
                  {detail.registrationNo}
                </span>
                <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${
                  detail.status === 'Confirmed' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                  'bg-green-50 text-green-700 border-green-100'
                }`}>
                  {detail.status === 'Confirmed' ? 'Pending Drop-off' : detail.status}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Customer Details</h3>
              
              <div className="flex items-start gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <User size={16} />
                </div>
                <div>
                  <p className="font-bold text-sm text-gray-900">{detail.customerName}</p>
                  <p className="text-xs text-gray-500 font-medium">{detail.customerEmail}</p>
                  <p className="text-xs text-gray-500 font-medium">{detail.customerPhone}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Storage Details</h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <MapPin className="text-gray-400 shrink-0" size={16} />
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 font-medium">Property</span>
                    <span className="text-sm font-bold text-gray-900">{detail.propertyName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Car className="text-gray-400 shrink-0" size={16} />
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 font-medium">Assigned Slot</span>
                    <span className="text-sm font-bold text-gray-900">{detail.slotName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="text-gray-400 shrink-0" size={16} />
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 font-medium">Storage Period</span>
                    <span className="text-sm font-bold text-gray-900">
                      {new Date(detail.startDate).toLocaleDateString()} - {new Date(detail.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {isImageExpanded && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsImageExpanded(false)}
        >
          <div className="relative max-w-4xl w-full flex flex-col items-center">
            <button 
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
              onClick={() => setIsImageExpanded(false)}
            >
              <Eye size={32} />
            </button>
            {expandedTitle && (
              <h3 className="text-white text-lg font-bold mb-4">{expandedTitle}</h3>
            )}
            <img 
              src={expandedImage} 
              alt="Expanded" 
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
