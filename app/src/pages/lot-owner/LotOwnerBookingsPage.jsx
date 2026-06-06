import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { FileText, Car, Calendar, CheckCircle, XCircle, MapPin, Hash, ArrowRight, Search } from 'lucide-react';

export default function LotOwnerBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectingId, setRejectingId] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'completed'
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; AccessToken=`);
      const token = parts.length === 2 ? parts.pop().split(';').shift() : null;
      if (!token) throw new Error("No token found");

      const res = await fetch('https://localhost:7108/api/LotBooking/bookings', { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (!res.ok) throw new Error("Failed to fetch bookings");
      const result = await res.json();
      setBookings(result.data || []);
    } catch (err) {
      toast.error(err.message || 'Could not load bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleVerify = async (bookingId, isApproved) => {
    if (!isApproved && !rejectionReason.trim() && rejectingId === bookingId) {
       toast.error("Please provide a rejection reason.");
       return;
    }

    if (!isApproved && rejectingId !== bookingId) {
        setRejectingId(bookingId);
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

      const res = await fetch(`https://localhost:7108/api/LotBooking/${bookingId}/verify`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      if (data.success) {
         toast.success(isApproved ? "Booking Approved!" : "Booking Rejected.");
         setRejectingId(null);
         fetchBookings();
      } else {
         toast.error(data.message || "Failed to verify booking.");
      }
    } catch (err) {
       toast.error("Network error.");
    } finally {
       setActionLoading(false);
    }
  };

  const filteredBookings = bookings.filter(b => {
      const statusStr = String(b.status);
      if (activeTab === 'pending') {
          return statusStr === 'PendingVerification' || statusStr === '13';
      } else if (activeTab === 'completed') {
          return statusStr === 'Confirmed' || statusStr === '1';
      } else if (activeTab === 'cancelled') {
          return statusStr === 'Cancelled' || statusStr === '4' || statusStr === 'AgreementDeclined' || statusStr === '6' || statusStr === 'AdminRejected' || statusStr === '14';
      }
      return false;
  });

  const searchedBookings = filteredBookings.filter(b => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      const propMatch = b.propertyName?.toLowerCase().includes(term);
      const vehicleMatch = (b.vehicleBrand + ' ' + b.vehicleModel)?.toLowerCase().includes(term);
      const regMatch = b.registrationNo?.toLowerCase().includes(term);
      return propMatch || vehicleMatch || regMatch;
  });

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 animate-fade-in pt-4 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-[28px] font-bold text-[#111]">
            {activeTab === 'pending' ? 'Pending Bookings' : activeTab === 'completed' ? 'Completed Bookings' : 'Cancelled Bookings'}
          </h2>
          <p className="text-gray-500 text-sm mt-1">Manage all booking requests and active reservations.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center px-4 sm:px-0">
        <div className="flex p-1 bg-gray-100 rounded-xl w-max my-2 sm:my-0">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === 'pending' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Pending Verification
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'pending' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'}`}>
               {bookings.filter(b => String(b.status) === 'PendingVerification' || String(b.status) === '13').length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === 'completed' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Completed Bookings
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'}`}>
               {bookings.filter(b => String(b.status) === 'Confirmed' || String(b.status) === '1').length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('cancelled')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === 'cancelled' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Cancelled
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'cancelled' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'}`}>
               {bookings.filter(b => String(b.status) === 'Cancelled' || String(b.status) === '4' || String(b.status) === 'AgreementDeclined' || String(b.status) === '6' || String(b.status) === 'AdminRejected' || String(b.status) === '14').length}
            </span>
          </button>
        </div>
        
        <div className="w-full sm:w-auto sm:ml-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by property, vehicle, or registration..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-[350px] pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
             <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : searchedBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <FileText size={48} className="mb-4 opacity-20" strokeWidth={1} />
            <p>{searchTerm ? 'No bookings matched your search.' : 'No bookings found in this category.'}</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {searchedBookings.map((booking) => {
              const startDate = new Date(booking.startDate).toLocaleDateString();
              const endDate = new Date(booking.endDate).toLocaleDateString();
              const statusStr = String(booking.status);
              const isPending = statusStr === 'PendingVerification' || statusStr === '13';
              
              let statusLabel = booking.status;
              let badgeStyle = 'bg-gray-50 text-gray-700';
              if (isPending) {
                  statusLabel = 'Pending Verification';
                  badgeStyle = 'bg-orange-50 text-orange-700';
              } else if (statusStr === 'AdminRejected' || statusStr === '14') {
                  statusLabel = 'Rejected by Admin';
                  badgeStyle = 'bg-red-50 text-red-700';
              } else if (statusStr === 'VerifiedPendingPayment' || statusStr === '15') {
                  statusLabel = 'Awaiting Payment';
                  badgeStyle = 'bg-blue-50 text-blue-700';
              } else if (statusStr === 'Confirmed' || statusStr === '1') {
                  statusLabel = 'Confirmed';
                  badgeStyle = 'bg-green-50 text-green-700';
              } else if (statusStr === 'AgreementDeclined' || statusStr === '6') {
                  statusLabel = 'Agreement Rejection';
                  badgeStyle = 'bg-red-50 text-red-800';
              } else if (statusStr === 'Cancelled' || statusStr === '4') {
                  statusLabel = 'Intentionally Cancelled';
                  badgeStyle = 'bg-red-50 text-red-800';
              }

              return (
                <div 
                  key={booking.id} 
                  onClick={() => navigate(`./${booking.id}`)}
                  className="flex flex-col px-6 py-6 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors cursor-pointer"
                >
                  <div className="flex flex-col gap-5">
                      <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                             {/* <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`}></div> */}
                             <span className="font-bold text-[#111] text-lg">Booking #{booking.id}</span>
                             <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border border-gray-200/50 ${badgeStyle}`}>{statusLabel}</span>
                          </div>
                          
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-3">
                              <div className="flex flex-col gap-2 bg-gray-50/50 p-3 rounded-xl border border-gray-100 w-full sm:w-auto">
                                <div className="flex items-center gap-1.5">
                                  <MapPin size={16} className="text-red-500" />
                                  <span className="font-bold text-gray-900">{booking.propertyName}</span>
                                </div>
                                <div className="text-xs text-gray-500 ml-5">{booking.propertyAddress}</div>
                              </div>
                              <div className="flex flex-col gap-2 bg-gray-50/50 p-3 rounded-xl border border-gray-100 w-full sm:w-auto">
                                <div className="flex items-center gap-1.5">
                                  <Car size={16} className="text-blue-500"/>
                                  <span className="font-bold text-gray-900">{booking.vehicleBrand} {booking.vehicleModel}</span>
                                </div>
                                <div className="text-xs text-gray-500 font-mono ml-5">{booking.registrationNo}</div>
                              </div>
                              <div className="flex flex-col gap-2 bg-gray-50/50 p-3 rounded-xl border border-gray-100 w-full sm:w-auto">
                                <div className="flex items-center gap-1.5">
                                  <Hash size={16} className="text-indigo-500"/>
                                  <span className="font-bold text-gray-900">Assigned Slot</span>
                                </div>
                                <div className="text-xs text-gray-500 ml-5">{booking.slotNumber || 'Pending'}</div>
                              </div>
                              <div className="flex flex-col gap-2 bg-gray-50/50 p-3 rounded-xl border border-gray-100 w-full sm:w-auto">
                                <div className="flex items-center gap-1.5">
                                  <Calendar size={16} className="text-orange-500"/>
                                  <span className="font-bold text-gray-900">Duration</span>
                                </div>
                                <div className="text-xs text-gray-500 ml-5">{startDate} - {endDate}</div>
                              </div>
                          </div>
                          
                          {(statusStr === 'AgreementDeclined' || statusStr === '6' || statusStr === 'Cancelled' || statusStr === '4' || statusStr === 'AdminRejected' || statusStr === '14') && booking.rejectionReason && (
                              <div className="mt-4 p-3 bg-red-50/50 border border-red-100 rounded-xl flex items-start gap-2">
                                <XCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                                <div>
                                  <span className="font-bold text-red-800 text-sm block mb-0.5">Cancellation Reason</span>
                                  <span className="text-red-700 text-sm block leading-tight">{booking.rejectionReason}</span>
                                </div>
                              </div>
                          )}
                      </div>

                      <div className="w-full pt-1 flex justify-end">
                        <button 
                          onClick={() => navigate(`./${booking.id}`)}
                          className="px-5 py-2 bg-blue-600 text-white rounded-xl text-[13px] font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-md"
                        >
                          View Details <ArrowRight size={16} />
                        </button>
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
