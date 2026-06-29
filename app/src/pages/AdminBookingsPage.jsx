import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken } from '../api/auth';
import { toast } from 'react-hot-toast';
import { MapPin, Calendar, Clock, Car, ChevronRight, Wrench, Search, IndianRupee, CheckCircle, AlertCircle } from 'lucide-react';

const api = {
  get: async (url) => {
    const res = await fetch(`https://gd1-grand-auto-depot-one-9ms1.onrender.com/api${url}`, {
      headers: { Authorization: `Bearer ${getToken('AccessToken')}` }
    });
    if (!res.ok) throw new Error('API Error');
    return { data: await res.json() };
  }
};

export default function AdminBookingsPage() {
  const [data, setData] = useState({ garageBookings: [], serviceBookings: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('garage');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await api.get('/admin/bookings');
      setData(response.data.data || { garageBookings: [], serviceBookings: [] });
    } catch (error) {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const renderGarageBookings = () => {
    const filtered = data.garageBookings?.filter(b => b.propertyName?.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!filtered || filtered.length === 0) {
      return (
        <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-[2rem] border border-gray-100">
          No garage bookings found.
        </div>
      );
    }

    return filtered.map((booking) => (
      <div key={booking.bookingId} className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col lg:flex-row p-5 gap-6 hover:border-blue-100">
        
        {/* Vehicle Info */}
        <div className="flex-1 lg:max-w-[300px] flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center shrink-0 border border-blue-100/50">
              <Car size={24} className="text-blue-600 drop-shadow-sm" />
            </div>
            <div>
              <h3 className="font-black text-gray-900 text-lg leading-tight">
                {booking.vehicleBrand} {booking.vehicleModel}
              </h3>
              <span className="text-xs font-bold text-gray-500 tracking-wide">
                {booking.vehicleRegistrationNo}
              </span>
            </div>
          </div>
          <div className="inline-flex w-fit items-center px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-black uppercase tracking-wider rounded-lg border border-blue-100">
            <span className="w-2 h-2 rounded-full bg-blue-500 mr-2 animate-pulse"></span>
            {booking.status}
          </div>
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-gray-200 to-transparent"></div>

        {/* Details Grid */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 items-center">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0 group-hover:bg-blue-50 transition-colors">
              <Calendar size={18} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
            <div>
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Duration</p>
              <p className="text-sm font-bold text-gray-800">{formatDate(booking.startDate)}</p>
              <p className="text-xs font-semibold text-gray-500">to {formatDate(booking.endDate)}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0 group-hover:bg-blue-50 transition-colors">
              <MapPin size={18} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
            <div>
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Property</p>
              <p className="text-sm font-bold text-gray-800 line-clamp-1">{booking.propertyName}</p>
              <p className="text-xs font-semibold text-gray-500">{booking.propertyCity}</p>
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="lg:w-[280px] shrink-0 bg-gray-50 rounded-2xl p-5 border border-gray-100 flex flex-col justify-center">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Price/Day</span>
            <span className="text-sm font-black text-gray-900">₹{booking.pricePerDay}</span>
          </div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Total Cost</span>
            <span className="text-base font-black text-gray-900">₹{booking.totalCost}</span>
          </div>
          <div className="pt-4 border-t border-gray-200 border-dashed flex justify-between items-center">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Payment</span>
            <div className={`flex items-center gap-1.5 text-sm font-black ${booking.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-orange-500'}`}>
              {booking.paymentStatus === 'Paid' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {booking.paymentStatus}
            </div>
          </div>
        </div>

      </div>
    ));
  };

  const renderServiceBookings = () => {
    const filtered = data.serviceBookings?.filter(b => b.serviceCenterName?.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!filtered || filtered.length === 0) {
      return (
        <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-[2rem] border border-gray-100">
          No service bookings found.
        </div>
      );
    }

    return filtered.map((booking) => (
      <div key={booking.serviceRequestId} className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col lg:flex-row p-5 gap-6 hover:border-purple-100">
        
        {/* Vehicle Info */}
        <div className="flex-1 lg:max-w-[300px] flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center shrink-0 border border-purple-100/50">
              <Car size={24} className="text-purple-600 drop-shadow-sm" />
            </div>
            <div>
              <h3 className="font-black text-gray-900 text-lg leading-tight">
                {booking.vehicleBrand} {booking.vehicleModel}
              </h3>
              <span className="text-xs font-bold text-gray-500 tracking-wide">
                {booking.vehicleRegistrationNo}
              </span>
            </div>
          </div>
          <div className="inline-flex w-fit items-center px-3 py-1.5 bg-purple-50 text-purple-700 text-xs font-black uppercase tracking-wider rounded-lg border border-purple-100">
            <span className="w-2 h-2 rounded-full bg-purple-500 mr-2 animate-pulse"></span>
            {booking.status}
          </div>
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-gray-200 to-transparent"></div>

        {/* Details Grid */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-center">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0 group-hover:bg-purple-50 transition-colors">
              <Wrench size={18} className="text-gray-400 group-hover:text-purple-600 transition-colors" />
            </div>
            <div>
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Service</p>
              <p className="text-sm font-bold text-gray-800 line-clamp-2 leading-tight">{booking.serviceType}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0 group-hover:bg-purple-50 transition-colors">
              <MapPin size={18} className="text-gray-400 group-hover:text-purple-600 transition-colors" />
            </div>
            <div>
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Location</p>
              <p className="text-sm font-bold text-gray-800 line-clamp-1">{booking.serviceCenterName}</p>
              <p className="text-xs font-semibold text-gray-500">{booking.serviceCenterCity}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0 group-hover:bg-purple-50 transition-colors">
              <Calendar size={18} className="text-gray-400 group-hover:text-purple-600 transition-colors" />
            </div>
            <div>
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Date</p>
              <p className="text-sm font-bold text-gray-800">{formatDate(booking.scheduledDate)}</p>
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="lg:w-[280px] shrink-0 bg-gray-50 rounded-2xl p-5 border border-gray-100 flex flex-col justify-center">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Amount</span>
            <span className="text-base font-black text-gray-900">₹{booking.amount}</span>
          </div>
          <div className="pt-4 border-t border-gray-200 border-dashed flex justify-between items-center">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Payment</span>
            <div className={`flex items-center gap-1.5 text-sm font-black ${booking.isPaid ? 'text-emerald-600' : 'text-orange-500'}`}>
              {booking.isPaid ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {booking.isPaid ? 'Paid' : 'Unpaid'}
            </div>
          </div>
        </div>

      </div>
    ));
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Platform Bookings</h1>
            <p className="text-gray-500">Manage all garage and service center bookings.</p>
          </div>
          
          <div className="flex bg-gray-100 p-1 rounded-xl w-full md:w-auto">
            <button 
              onClick={() => { setActiveTab('garage'); setSearchQuery(''); }}
              className={`flex-1 md:flex-none px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'garage' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              Garage Bookings ({data.garageBookings?.length || 0})
            </button>
            <button 
              onClick={() => { setActiveTab('service'); setSearchQuery(''); }}
              className={`flex-1 md:flex-none px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'service' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              Service Bookings ({data.serviceBookings?.length || 0})
            </button>
          </div>
        </div>

        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={activeTab === 'garage' ? "Search by Garage Name..." : "Search by Service Center Name..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
          />
        </div>

        <div className="flex flex-col gap-4">
          {activeTab === 'garage' ? renderGarageBookings() : renderServiceBookings()}
        </div>

      </div>
    </div>
  );
}
