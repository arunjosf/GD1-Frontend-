import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import usePolling from '../hooks/usePolling';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Calendar, Car, ArrowRight, CreditCard, XCircle, Clock, BadgeCheck, MapPin, CheckCircle2, X, Truck, Wrench, LayoutDashboard } from 'lucide-react';

export default function UserBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelModalBookingId, setCancelModalBookingId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchBookings = async () => {
      if (!isAuthenticated) return;
      try {
        const match = document.cookie.match(new RegExp('(^| )AccessToken=([^;]+)'));
        const token = match ? match[2] : null;

        if (!token) throw new Error("No token found");

        const res = await fetch('https://gd1-grand-auto-depot-one-9ms1.onrender.com/api/LotBooking/bookings', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error(`Failed to fetch bookings: ${res.status}`);
        
        const data = await res.json();
        setBookings(data.data || []);
      } catch (err) {
        console.error(err);
        toast.error(`Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [isAuthenticated, navigate]);

  // Poll API every 15 seconds
  usePolling(async () => {
    try {
      const match = document.cookie.match(new RegExp('(^| )AccessToken=([^;]+)'));
      const token = match ? match[2] : null;
      if (!token) return;
      const res = await fetch('https://gd1-grand-auto-depot-one-9ms1.onrender.com/api/LotBooking/bookings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setBookings(data.data || []);
        }
      }
    } catch (e) { /* ignore polling errors */ }
  }, 15000, isAuthenticated);

  const handlePayment = (bookingId) => {
    navigate(`/agreement/${bookingId}`);
  };

  const openCancelModal = (bookingId) => {
    setCancelModalBookingId(bookingId);
    setCancelReason('');
  };

  const closeCancelModal = () => {
    setCancelModalBookingId(null);
    setCancelReason('');
  };

  const handleCancelBooking = async () => {
    if (!cancelReason.trim()) {
      toast.error("You must provide a reason to cancel.");
      return;
    }

    setIsCancelling(true);
    try {
      const match = document.cookie.match(new RegExp('(^| )AccessToken=([^;]+)'));
      const token = match ? match[2] : null;

      const response = await fetch(`https://gd1-grand-auto-depot-one-9ms1.onrender.com/api/LotBooking/${cancelModalBookingId}/cancel?reason=${encodeURIComponent(cancelReason.trim())}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success || response.ok) {
        toast.success("Booking cancelled successfully.");
        closeCancelModal();
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.error(data.message || "Failed to cancel booking.");
      }
    } catch (err) {
      toast.error("An error occurred while cancelling the booking.");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow pt-25 lg:pt-[140px] pb-20 px-[6vw]">
        <div className="max-w-5xl mx-auto">
          
          <div className="mb-10 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold font-black text-[#111] tracking-tight mb-3">My Bookings</h1>
            <p className="text-gray-500 text-[14px]">Manage your vehicle parking reservations.</p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          ) : bookings.length === 0 ? (
            <div className="bg-white rounded-[2rem] p-12 text-center shadow-xl border border-gray-100">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-5">
                 <Calendar className="text-gray-400 w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-[#111] mb-2">No Bookings Found</h3>
              <p className="text-gray-500 mb-6">You haven't made any bookings yet.</p>
              <button onClick={() => navigate('/home')} className="bg-[#111] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#333] transition-colors">
                Find Parking
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {bookings.map(booking => {
                const isPending = booking.status === 'PendingVerification' || booking.status == 13 || booking.status === 'Pending' || booking.status == 0;
                const isRejected = booking.status === 'AdminRejected' || booking.status == 14;
                const isApproved = booking.status === 'VerifiedPendingPayment' || booking.status == 15;
                const isConfirmed = booking.status === 'Confirmed' || booking.status == 1;
                const isCancelled = booking.status === 'Cancelled' || booking.status == 4;
                const isAgreementDeclined = booking.status === 'AgreementDeclined' || booking.status == 6;
                let isMoveOutReached = false;
                if (booking.endDate) {
                  const end = new Date(booking.endDate);
                  const now = new Date();
                  end.setHours(0,0,0,0);
                  const diffTime = end.getTime() - now.getTime();
                  if (Math.ceil(diffTime / (1000 * 60 * 60 * 24)) <= 0) {
                    isMoveOutReached = true;
                  }
                }

                const isCompleted = booking.status === 'Completed' || booking.status == 3 || isMoveOutReached;

                const isInactive = isCancelled || isRejected || isAgreementDeclined || isCompleted;

                let dotColor = 'bg-gray-300';
                let shortStatusLabel = 'Unknown';
                let longStatusMessage = '';
                
                if (isPending) { 
                  dotColor = 'bg-orange-500'; 
                  shortStatusLabel = 'Pending'; 
                  longStatusMessage = 'Your booking is under verification. You will be notified when the garage owner verifies the booking.'; 
                }
                if (isRejected) { 
                  dotColor = 'bg-red-500'; 
                  shortStatusLabel = 'Garage Admin Rejected'; 
                  longStatusMessage = `Garage Admin Rejected: ${booking.rejectionReason || 'No reason provided.'}`;
                }
                if (isAgreementDeclined) {
                  dotColor = 'bg-red-500';
                  shortStatusLabel = 'Agreement Rejected';
                  longStatusMessage = `Agreement Rejected: ${booking.rejectionReason || 'By User'}`;
                }
                if (isCancelled) {
                  dotColor = 'bg-red-500';
                  shortStatusLabel = 'Cancelled';
                  longStatusMessage = `Cancelled: ${booking.rejectionReason || 'No reason provided.'}`;
                }
                if (isApproved) { 
                  dotColor = 'bg-blue-500'; 
                  shortStatusLabel = 'Verified'; 
                  longStatusMessage = 'Your booking is successfully verified.'; 
                }
                if (isConfirmed) { 
                  dotColor = 'bg-green-500'; 
                  shortStatusLabel = 'Confirmed'; 
                  longStatusMessage = 'Your booking is confirmed.';
                }
                const isInLot = booking.status === 'InLot' || booking.status == 2;
                if (isInLot) {
                  dotColor = 'bg-blue-600';
                  shortStatusLabel = 'Stored in Garage';
                  longStatusMessage = 'Your vehicle is safely stored in the garage.';
                }
                if (isCompleted) {
                  dotColor = 'bg-gray-600';
                  shortStatusLabel = 'Vehicle Moved Out';
                  longStatusMessage = 'Your vehicle storage has been completed.';
                }

                return (
                  <div key={booking.id} className={`bg-white rounded-[24px] p-4 md:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 border border-gray-100 flex flex-col md:flex-row gap-5 md:gap-6 ${isInactive ? '' : 'hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] group'}`}>
                     
                     {/* Left: Slot Image */}
                     <div className={`w-full md:w-72 h-56 md:h-auto rounded-2xl overflow-hidden shrink-0 relative bg-gray-100 ${isInactive ? 'opacity-50 grayscale' : ''}`}>
                       <img 
                         src={booking.propertyImageUrl ? (booking.propertyImageUrl.startsWith('http') ? booking.propertyImageUrl : `https://gd1-grand-auto-depot-one-9ms1.onrender.com${booking.propertyImageUrl.startsWith('/') ? '' : '/'}${booking.propertyImageUrl}`) : "https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?q=80&w=800&auto=format&fit=crop"} 
                         alt="Parking Slot"
                         className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                         onError={(e) => { e.target.onerror = null; }}
                       />
                       <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full text-[11px] font-black text-[#111] shadow-sm tracking-wide">
                         SLOT {booking.slotNumber || 'TBD'}
                       </div>
                     </div>

                     {/* Right: Content */}
                     <div className="flex-1 flex flex-col">
                       {/* Top Header: Title & Price */}
                       <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-2">
                          <div>
                             <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                               <h2 className={`text-[20px] font-bold font-black text-[#111] tracking-tight ${isInactive ? 'opacity-50 grayscale' : ''}`}>{booking.propertyName}</h2>
                               <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md tracking-wider ${
                                 isPending ? 'bg-orange-100 text-orange-700' :
                                 isApproved ? 'bg-blue-100 text-blue-700' :
                                 isRejected ? 'bg-red-100 text-red-700' :
                                 isAgreementDeclined ? 'bg-red-100 text-red-700' :
                                 isConfirmed ? 'bg-green-100 text-green-700' :
                                 isCancelled ? 'bg-red-100 text-red-700' :
                                 'bg-gray-100 text-gray-700'
                               }`}>
                                 {shortStatusLabel === 'Unknown' ? `UNKNOWN (${booking.status})` : shortStatusLabel}
                               </span>
                             </div>
                             
                             <div className={`flex items-center gap-2 text-[12px] text-gray-500 font-medium ${isInactive ? 'opacity-50 grayscale' : ''}`}>
                               <MapPin className="w-4 h-4 shrink-0" />
                               <span className="truncate">{booking.propertyAddress}</span>
                             </div>
                          </div>
                          
                          {/* Price */}
                          <div className={`text-left md:text-right mt-2 md:mt-0 ${isInactive ? 'opacity-50 grayscale' : ''}`}>
                            <p className="text-[10px] text-gray-400 font-medium tracking-widest mb-0.5">Total Payment</p>
                            <h3 className="text-[25px] font-bold font-black text-[#111]">${booking.totalCost}</h3>
                          </div>
                       </div>

                       {/* Middle: Details Grid */}
                       <div className={`flex flex-wrap gap-2 md:gap-3 mt-4 mb-6 md:mb-4 ${isInactive ? 'opacity-50 grayscale' : ''}`}>
                         <div className="flex items-center gap-2 px-3 py-2 bg-gray-50/80 rounded-xl border border-gray-100/80">
                           {booking.vehicleImageUrl ? (
                             <img 
                               src={booking.vehicleImageUrl.startsWith('http') ? booking.vehicleImageUrl : `https://gd1-grand-auto-depot-one-9ms1.onrender.com${booking.vehicleImageUrl.startsWith('/') ? '' : '/'}${booking.vehicleImageUrl}`} 
                               alt="Vehicle" 
                               className="w-6 h-6 rounded-full object-cover shrink-0 border border-gray-200 shadow-sm"
                               onError={(e) => { e.target.onerror = null; e.target.src="https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=100&auto=format&fit=crop"; }}
                             />
                           ) : (
                             <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center shrink-0 border border-gray-300 shadow-sm">
                               <Car className="w-3.5 h-3.5 text-gray-500" />
                             </div>
                           )}
                           <span className="text-[13px] font-bold text-[#111]">{booking.vehicleBrand} {booking.vehicleModel}</span>
                           <span className="text-[10px] font-bold text-gray-500 bg-white px-1.5 py-0.5 rounded shadow-sm border border-gray-200 uppercase tracking-widest ml-1">
                             {booking.vehicleLicensePlate || booking.registrationNo}
                           </span>
                         </div>
                         <div className="flex items-center gap-2 px-3 py-2 bg-gray-50/80 rounded-xl border border-gray-100/80">
                           <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                           <span className="text-[13px] font-bold text-[#111]">
                             <span className="text-gray-500 font-semibold mr-1">Start:</span>{new Date(booking.startDate).toLocaleDateString()} 
                             <span className="text-gray-500 font-semibold mx-1">|</span> 
                             <span className="text-gray-500 font-semibold mr-1">End:</span>{new Date(booking.endDate).toLocaleDateString()}
                           </span>
                         </div>
                       </div>

                       {/* Spacer */}
                       <div className="flex-1"></div>

                       {/* Bottom: Status Message */}
                       <div className={`mt-auto rounded-2xl p-1 md:p-2 flex items-start gap-3 border ${
                         isPending ? 'bg-orange-50/30 border-orange-100' : 
                         isApproved ? 'bg-blue-50/30 border-blue-100' :   
                         (isRejected || isAgreementDeclined || isCancelled) ? 'bg-red-50/30 border-red-100' : 
                         isConfirmed ? 'bg-green-50/30 border-green-100' : 
                         'bg-gray-50/50 border-gray-100'
                       }`}>
                          {isPending && (
                            <p className="text-orange-700 font-semibold text-[12px] flex items-center gap-2">
                              <Clock className="w-4 h-4 shrink-0" />
                              {longStatusMessage}
                            </p>
                          )}
                          {isRejected && (
                             <p className="text-red-700 font-semibold text-[13px] flex items-center gap-2">
                               <X className="w-4 h-4 shrink-0" />
                               {longStatusMessage}
                             </p>
                          )}
                          {isAgreementDeclined && (
                             <p className="text-red-700 font-semibold text-[13px] flex items-center gap-2">
                               <X className="w-4 h-4 shrink-0" />
                               {longStatusMessage}
                             </p>
                          )}
                          {isApproved && (
                            <p className="text-blue-700 font-semibold text-[13px] flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 shrink-0" />
                              {longStatusMessage}
                            </p>
                          )}
                          {isConfirmed && (
                            <p className="text-green-700 font-semibold text-[13px] flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 shrink-0" />
                              {longStatusMessage}
                            </p>
                          )}
                          {isInLot && (
                            <p className="text-blue-700 font-semibold text-[13px] flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 shrink-0" />
                              {longStatusMessage}
                            </p>
                          )}
                          {isCancelled && (
                            <p className="text-red-700 font-semibold text-[13px] flex items-center gap-2">
                              <XCircle className="w-4 h-4 shrink-0" />
                              {longStatusMessage}
                            </p>
                          )}
                       </div>

                       {/* Action Buttons Row */}
                       <div className="flex flex-wrap items-center justify-end gap-3 mt-5 w-full">
                         {booking.pickupStatus && booking.status !== 'Stored' && booking.status != 10 && !isInLot && !isCompleted && (
                            <button 
                              onClick={() => navigate(`/track-pickup/${booking.id}`)}
                              className="flex-1 sm:flex-none px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-[13px] shadow-md transition-all flex items-center justify-center gap-1.5"
                            >
                              <Truck size={14} />
                              Track Pickup
                            </button>
                         )}
                         {(isPending || isApproved) && (
                            <button 
                              onClick={() => openCancelModal(booking.id)}
                              className="flex-1 sm:flex-none px-6 py-2.5 md:py-2.5 bg-gray-100 hover:bg-red-50 text-black rounded-xl font-bold text-[13px] shadow-sm transition-all"
                            >
                              Cancel Booking
                            </button>
                         )}
                         {isApproved && (
                            <button 
                              onClick={() => handlePayment(booking.id)}
                              className="flex-1 sm:flex-none px-6 py-2.5 md:py-2.5 bg-[#2563eb] hover:bg-blue-700 text-white rounded-xl font-bold text-[13px] shadow-md shadow-black/10 transition-all"
                            >
                              Continue Booking
                            </button>
                         )}
                         {isConfirmed && (
                            <button 
                              onClick={() => navigate(`/agreement/${booking.id}`)}
                              className="flex-1 sm:flex-none px-8 py-2.5 bg-white hover:bg-gray-50 text-[#111] border border-gray-200 rounded-xl font-bold text-[13px] shadow-sm transition-all"
                            >
                              View Agreement
                            </button>
                         )}
                         {booking.hasActiveServiceRequest && booking.activeServiceRequestId && (
                           <button 
                              onClick={() => navigate(`/track-service/${booking.activeServiceRequestId}`)}
                              className="flex-1 sm:flex-none px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-[13px] shadow-md transition-all flex items-center justify-center gap-1.5"
                            >
                              <Wrench size={14} />
                              Track Service
                            </button>
                         )}
                          {isInLot && (
                            <button 
                               onClick={() => navigate(`/stored-vehicle/${booking.id}`)}
                               className="flex-1 sm:flex-none px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-[13px] shadow-md transition-all flex items-center justify-center gap-1.5"
                             >
                               <LayoutDashboard size={14} />
                               View Vehicle Dashboard
                             </button>
                          )}
                         {isCompleted && (
                           <button 
                              onClick={() => navigate(`/vehicle-journey/${booking.vehicleId}`, { state: { bookingId: booking.id } })}
                              className="flex-1 sm:flex-none px-6 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-bold text-[13px] shadow-md transition-all flex items-center justify-center gap-1.5"
                            >
                              <MapPin size={14} />
                              View Vehicle Journey
                            </button>
                         )}
                       </div>
                     </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {cancelModalBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={closeCancelModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition-colors"
            >
              <X size={24} />
            </button>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#111]">Cancel Booking</h3>
                <p className="text-sm text-gray-500">Booking #{cancelModalBookingId}</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-900 mb-2">Reason for Cancellation</label>
              <textarea 
                className="w-full border border-gray-200 rounded-xl p-4 text-sm focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none transition-all resize-none bg-gray-50/50"
                rows="4"
                placeholder="Please tell us why you are cancelling this booking..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              ></textarea>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button 
                onClick={closeCancelModal}
                disabled={isCancelling}
                className="px-6 py-2.5 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Keep Booking
              </button>
              <button 
                onClick={handleCancelBooking}
                disabled={isCancelling}
                className="px-6 py-2.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                {isCancelling && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



