import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Car, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  ShieldCheck,
  DollarSign,
  MessageSquare,
  Truck
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getToken } from '../../api/auth';

export default function LotOwnerVehicleDetailsPage() {
  const { id } = useParams(); // This is the BookingId
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookingDetails();
  }, [id]);

  const fetchBookingDetails = async () => {
    setLoading(true);
    try {
      const token = getToken('AccessToken');
      const res = await fetch(`https://localhost:7108/${id}booking-By-Id`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        if (res.status === 404) throw new Error("Vehicle/Booking not found");
        throw new Error("Failed to fetch vehicle details");
      }
      const result = await res.json();
      if (!result.success) throw new Error(result.message);
      setBooking(result.data);
    } catch (err) {
      toast.error(err.message || "Error loading vehicle details");
      navigate('/lot-owner/vehicles');
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `https://localhost:7108${url.startsWith('/') ? url : `/${url}`}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
         <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!booking) return null;

  return (
    <div className="w-full max-w-[1200px] mx-auto space-y-6 animate-fade-in pb-10">
      <div className="flex items-center gap-4 mb-6 pt-10 px-6">
        <button 
          onClick={() => navigate('/lot-owner/vehicles')}
          className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm shrink-0"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-[28px] font-black text-gray-900 tracking-tight">Vehicle Details</h2>
          <p className="text-gray-500 text-sm mt-1">{booking.vehicleBrand} {booking.vehicleModel}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-6">
        {/* Left Column: Image and Basic Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="h-64 bg-gray-100 relative">
              {booking.vehicleImageUrl ? (
                <img src={getImageUrl(booking.vehicleImageUrl)} alt={booking.vehicleBrand} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                  <Car size={48} />
                  <span className="text-sm font-medium mt-2">No Image</span>
                </div>
              )}
            </div>
            <div className="p-6">
              <h3 className="text-2xl font-black text-gray-900 leading-tight mb-2">{booking.vehicleBrand} {booking.vehicleModel}</h3>
              <div className="flex items-center gap-2 mb-6">
                <span className="px-3 py-1 bg-gray-100 text-gray-900 font-bold text-sm rounded-lg">
                  {booking.vehicleLicensePlate}
                </span>
                <span className="px-3 py-1 bg-blue-50 text-blue-700 font-bold text-sm rounded-lg">
                  Stored in Lot
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 shrink-0">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500">Status</p>
                    <p className="text-sm font-bold text-gray-900">{booking.status === 2 || booking.status === 'InLot' ? 'In Lot' : booking.status}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500">Stored Since</p>
                    <p className="text-sm font-bold text-gray-900">{new Date(booking.startDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Owner Info and Actions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <User size={20} className="text-blue-500" /> Vehicle Owner Details
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-2xl p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-600 shadow-sm shrink-0">
                  <User size={20} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Full Name</p>
                  <p className="text-base font-bold text-gray-900">{booking.userName || 'Owner Name'}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-600 shadow-sm shrink-0">
                  <Phone size={20} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Phone Number</p>
                  <p className="text-base font-bold text-gray-900">{booking.userPhone || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
               Quick Actions
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               <button 
                  onClick={() => navigate('/messages')}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors"
               >
                  <MessageSquare size={18} /> Message Owner
               </button>
               <button 
                  onClick={() => window.location.href = `tel:${booking.userPhone}`}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
               >
                  <Phone size={18} /> Call Owner
               </button>
               <button 
                  onClick={() => navigate(`/track-pickup/${booking.id}`)}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
               >
                  <Truck size={18} /> View Journey
               </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
