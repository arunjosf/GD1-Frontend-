import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeft, CheckCircle, XCircle, FileText, Car, MapPin, Calendar, CreditCard, ShieldCheck, User, X
} from 'lucide-react';

export default function LotOwnerBookingDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState(null);

  const fetchBookingDetail = async () => {
    setLoading(true);
    try {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; AccessToken=`);
      const token = parts.length === 2 ? parts.pop().split(';').shift() : null;
      if (!token) throw new Error("No token found");

     
      const res = await fetch(`https://localhost:7108/${id}booking-By-Id`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (!res.ok) throw new Error("Failed to fetch booking details");
      const result = await res.json();
      setBooking(result.data || result);
    } catch (err) {
      toast.error(err.message || 'Could not load booking details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchBookingDetail();
  }, [id]);

  const handleVerify = async (isApproved) => {
    if (!isApproved && !showRejectInput) {
        setShowRejectInput(true);
        setRejectionReason('');
        return;
    }

    setActionLoading(true);
    try {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; AccessToken=`);
      const token = parts.length === 2 ? parts.pop().split(';').shift() : null;
      
      const formData = new FormData();
      formData.append('isApproved', isApproved);
      if (!isApproved) {
         formData.append('rejectionReason', rejectionReason);
      }

      const res = await fetch(`https://localhost:7108/api/LotBooking/${id}/verify`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      if (data.success) {
         toast.success(isApproved ? "Booking Approved!" : "Booking Rejected.");
         setShowRejectInput(false);
         fetchBookingDetail(); // refresh data
      } else {
         toast.error(data.message || "Failed to verify booking.");
      }
    } catch (err) {
       toast.error("Network error.");
    } finally {
       setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
         <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex flex-col justify-center items-center h-[70vh] text-gray-500">
         <FileText size={64} className="mb-4 opacity-20" />
         <p className="text-lg">Booking not found.</p>
         <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 hover:underline">Go Back</button>
      </div>
    );
  }

  const startDate = new Date(booking.startDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  const endDate = new Date(booking.endDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  const createdDate = new Date(booking.createdAt).toLocaleString();
  
  const statusStr = String(booking.status);
  const isPending = statusStr === 'PendingVerification' || statusStr === '13';
  const isCancelled = statusStr === 'Cancelled' || statusStr === '4' || statusStr === 'AgreementDeclined' || statusStr === '6' || statusStr === 'AdminRejected' || statusStr === '14';
  
  let statusLabel = booking.status;
  let statusBadgeColor = 'bg-gray-100 text-gray-700 border-gray-200';
  
  if (isPending) {
      statusLabel = 'Pending Verification';
      statusBadgeColor = 'bg-orange-50 text-orange-700 border-orange-200';
  } else if (statusStr === 'AdminRejected' || statusStr === '14') {
      statusLabel = 'Rejected';
      statusBadgeColor = 'bg-red-50 text-red-700 border-red-200';
  } else if (statusStr === 'VerifiedPendingPayment' || statusStr === '15') {
      statusLabel = 'Approved (Awaiting Payment)';
      statusBadgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
  } else if (statusStr === 'Confirmed' || statusStr === '1') {
      statusLabel = 'Confirmed';
      statusBadgeColor = 'bg-green-50 text-green-700 border-green-200';
  }

  // Common Section Card Wrapper
  const Section = ({ title, icon, children }) => (
    <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-50">
        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-600">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-[#111]">{title}</h3>
      </div>
      {children}
    </div>
  );

  return (
    <div className="w-full max-w-[1200px] mx-auto animate-fade-in pt-4 pb-16 space-y-4 relative">
      {/* Full Screen Image Modal */}
      {fullScreenImage && (
        <div 
          className="fixed top-0 left-0 w-screen h-screen z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 cursor-zoom-out animate-fade-in"
          onClick={() => setFullScreenImage(null)}
        >
          <img 
            src={fullScreenImage} 
            alt="Full screen preview" 
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl cursor-default" 
            onClick={(e) => e.stopPropagation()} 
          />
          <button 
            onClick={() => setFullScreenImage(null)}
            className="absolute top-6 right-6 text-white bg-black/50 hover:bg-black/80 rounded-full p-2 transition-colors"
          >
            <X size={28} />
          </button>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectInput && (
        <div className="fixed top-0 left-0 w-screen h-screen z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-[24px] p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2"><XCircle className="text-red-500" /> Reject Booking</h3>
              <button onClick={() => setShowRejectInput(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Reason for rejecting this booking (optional).</p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Reason for rejection (optional)..."
              className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-1 focus:ring-red-500 outline-none transition-all resize-none h-32 mb-6"
            />
            <div className="flex gap-3">
              <button 
                onClick={() => setShowRejectInput(false)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
              <button 
                disabled={actionLoading}
                onClick={() => handleVerify(false)}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[32px] font-bold text-[#111] tracking-tight">Booking #{booking.id}</h1>
            <div className={`px-3 py-1 rounded-full text-xs font-bold border ${statusBadgeColor}`}>
              {statusLabel}
            </div>
          </div>
          <p className="text-gray-500 text-sm mt-1">Requested on {createdDate}</p>
        </div>
      </div>

      {/* Cancelled Banner */}
      {isCancelled && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-4">
          <XCircle className="text-red-500 w-6 h-6 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-red-800 font-bold text-[16px]">Booking Cancelled</h4>
            {booking.rejectionReason && <p className="text-red-600 text-[14px] mt-1">{booking.rejectionReason}</p>}
          </div>
        </div>
      )}

      {/* Action Bar for Pending */}
      {isPending && (
        <div className="bg-white rounded-[24px] shadow-sm border border-orange-100 py-5 p-6 flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-orange-400"></div>
          <div>
            <h3 className="text-[16px] font-bold text-gray-900">Verification Required!</h3>
            <p className="text-gray-500 text-[13px] mt-1">Review the vehicle and owner documents before approving this booking.</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
              onClick={() => handleVerify(false)}
              disabled={actionLoading}
              className="flex-1 md:flex-none text-[14px] px-6 py-2 bg-white text-red-600 border border-red-200 rounded-xl font-semibold hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
            >
              <XCircle size={16} /> Reject
            </button>
            <button 
              onClick={() => handleVerify(true)}
              disabled={actionLoading}
              className="flex-1 md:flex-none px-6 py-2 bg-blue-600 text-[14px] text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
            >
              <CheckCircle size={18} /> Approve
            </button>
          </div>
        </div>
      )}
      
      {(statusStr === 'AdminRejected' || statusStr === '14') && booking.rejectionReason && (
        <div className="bg-red-50 rounded-[24px] border border-red-100 p-6 flex gap-4">
          <XCircle className="text-red-500 shrink-0 mt-1" size={24} />
          <div>
            <h3 className="text-red-800 font-bold">Booking Rejected</h3>
            <p className="text-red-700 text-sm mt-1">{booking.rejectionReason}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">

          {/* Comprehensive Vehicle & Owner Section */}
          <Section title="Vehicle & Owner Information" icon={<Car size={20} />}>
            <div className="flex flex-col gap-8">
              {/* Top row: Vehicle Image and Details */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-1/2 aspect-video bg-gray-50 rounded-2xl p-2 border border-gray-100 overflow-hidden group relative">
                  {booking.vehicleImageUrl ? (
                    <div className="w-full h-full cursor-pointer" onClick={() => setFullScreenImage(booking.vehicleImageUrl)}>
                      <img src={booking.vehicleImageUrl} alt="Vehicle" className="w-full h-full object-contain rounded-xl" />
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/5 transition-colors flex items-center justify-center">
                        <span className="bg-white/90 text-black px-4 py-2 rounded-full text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm shadow-sm">View Full</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-400 flex flex-col items-center justify-center h-full w-full">
                      <Car size={32} className="mb-2" />
                      <span className="text-xs">No image provided</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-center space-y-4">
                  <div className="border-b border-gray-100 pb-1">
                    <p className="text-[13px]  font-semibold text-gray-500 tracking-wider mb-1">Brand & Model</p>
                    <p className="text-[18px] font-semibold text-gray-900">{booking.vehicleBrand} {booking.vehicleModel}</p>
                  </div>
                  <div className="border-b border-gray-100 pb-3">
                    <p className="text-[13px] font-semibold text-gray-500 tracking-wider mb-1">Registration No</p>
                    <span className="inline-block bg-gray-100 text-gray-900 px-3 py-0.5 rounded-lg font-mono font-bold tracking-wider text-lg border border-gray-200">
                      {booking.registrationNo}
                    </span>
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-gray-500 tracking-wider mb-1">Owner Name</p>
                    <div className="flex text-[16px] items-center gap-2 font-semibold text-gray-900">
      
                      {booking.ownerName}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom row: Documents */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-gray-100">
                <div className="space-y-3">
                  <p className="text-sm font-bold text-gray-700 uppercase tracking-wider">Registration Certificate (RC)</p>
                  <div className="bg-gray-50 rounded-2xl p-2 border border-gray-100 aspect-video overflow-hidden group relative">
                    {booking.vehicleRcUrl ? (
                      <div className="w-full h-full cursor-pointer" onClick={() => setFullScreenImage(booking.vehicleRcUrl)}>
                        <img src={booking.vehicleRcUrl} alt="Vehicle RC" className="w-full h-full object-cover rounded-xl hover:opacity-90 transition-opacity" />
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/5 transition-colors flex items-center justify-center">
                          <span className="bg-white/90 text-black px-4 py-2 rounded-full text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm shadow-sm">View Full</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-100/50 rounded-xl">
                        <FileText size={32} className="mb-2" />
                        <span className="text-xs font-medium">RC missing or API needs restart</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-bold text-gray-700 uppercase tracking-wider">Owner ID Proof</p>
                  <div className="bg-gray-50 rounded-2xl p-2 border border-gray-100 aspect-video overflow-hidden group relative">
                    {booking.ownerIdProofUrl ? (
                      <div className="w-full h-full cursor-pointer" onClick={() => setFullScreenImage(booking.ownerIdProofUrl)}>
                        <img src={booking.ownerIdProofUrl} alt="Owner ID Proof" className="w-full h-full object-cover rounded-xl hover:opacity-90 transition-opacity" />
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/5 transition-colors flex items-center justify-center">
                          <span className="bg-white/90 text-black px-4 py-2 rounded-full text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm shadow-sm">View Full</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-100/50 rounded-xl">
                        <User size={32} className="mb-2" />
                        <span className="text-xs font-medium">ID Proof missing or API needs restart</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Section>

          <Section title="Property Details" icon={<MapPin size={20} />}>
            <div className="flex flex-col md:flex-row gap-4 items-stretch">
              <div className="w-full md:w-2/5 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
                {booking.propertyImageUrl ? (
                   <img src={booking.propertyImageUrl} alt={booking.propertyName} className="w-full h-full object-cover min-h-[160px]" />
                ) : (
                   <div className="w-full h-full min-h-[160px] flex items-center justify-center">
                      <MapPin className="text-gray-300" size={32} />
                   </div>
                )}
              </div>
              <div className="flex-1 flex flex-col justify-center gap-3 py-2">
                <div className="space-y-2">
                  <h4 className="text-[20px] font-semibold text-gray-900 leading-tight">{booking.propertyName}</h4>
                  <p className="text-gray-500 text-[14px] font-medium">{booking.propertyAddress}</p>
                </div>
                <div className="mt-1 p-2 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between md:mr-20">
                  <span className="text-gray-700 text-[14px] font-semibold">Assigned Slot Number:</span>
                  <span className="text-[18px] font-black text-indigo-900 bg-white px-4 py-1 rounded-lg shadow-sm">{booking.slotNumber || 'Pending'}</span>
                </div>
              </div>
            </div>
          </Section>
        </div>

        {/* Right Column (1/3 width) */}
        <div className="space-y-4">
          
          <Section title="Booking Summary" icon={<Calendar size={20} />}>
            <div className="space-y-4">
              <div className="flex items-start gap-4">  
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <Calendar size={18} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold tracking-wider mb-1">Duration</p>
                  <p className="font-semibold text-gray-900">{startDate} - {endDate}</p>
                </div>
              </div>
              
              <div className="h-px bg-gray-100 my-4 w-full"></div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <CreditCard size={18} className="text-blue-600" />
                </div>
                <div className="w-full">
                  <p className="text-xs text-gray-500 font-semibold  tracking-wider mb-2">Cost Breakdown</p>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Price per day</span>
                    <span className="font-medium">₹{booking.pricePerDay}</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <span className="font-bold text-gray-900">Total Cost</span>
                    <span className="text-xl font-bold text-black">₹{booking.totalCost}</span>
                  </div>
                </div>
              </div>
            </div>
          </Section>

        </div>
      </div>
    </div>
  );
}
