import { useState, useEffect, useRef } from 'react';
import { 
  DollarSign, 
  Calendar, 
  Wrench, 
  ArrowUpRight,
  Clock,
  MapPin,
  Car
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getToken } from '../../api/auth';
import { toast } from 'react-hot-toast';

const api = {
  get: async (url) => {
    const res = await fetch(`https://gd1-grand-auto-depot-one-9ms1.onrender.com/api${url}`, {
      headers: { Authorization: `Bearer ${getToken('AccessToken')}` }
    });
    if (!res.ok) throw new Error('API Error');
    return { data: await res.json() };
  }
};

export default function SCDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const welcomeShown = useRef(false);

  useEffect(() => {
    fetchStats();

    // Show once-only welcome toast after application acceptance
    if (!welcomeShown.current && localStorage.getItem('gd1_newly_partnered') === 'true') {
      welcomeShown.current = true;
      localStorage.removeItem('gd1_newly_partnered');
      setTimeout(() => {
        toast.success(
          '🎉 Congratulations! You are now partnered with GD1. Welcome to your Service Center dashboard!',
          {
            duration: 7000,
            style: {
              background: 'linear-gradient(135deg, #1e3a5f, #0f6cbd)',
              color: '#fff',
              fontWeight: '600',
              fontSize: '14px',
              borderRadius: '12px',
              padding: '16px 20px',
              maxWidth: '420px',
            },
            iconTheme: { primary: '#fbbf24', secondary: '#1e3a5f' },
          }
        );
      }, 800);
    }
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/service-center/dashboard');
      setStats(response.data.data);
    } catch (error) {
      toast.error('Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Revenue', value: `₹${stats?.totalRevenue?.toLocaleString() || 0}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Total Bookings', value: stats?.totalBookings || 0, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Mechanics', value: stats?.totalMechanics || 0, icon: Wrench, color: 'text-purple-600', bg: 'bg-purple-50' }
  ];

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all group">
              <div>
                <p className="text-gray-500 font-medium mb-1">{stat.label}</p>
                <h3 className="text-3xl font-black text-gray-900 tracking-tight">{stat.value}</h3>
              </div>
              <div className={`w-14 h-14 ${stat.bg} rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform`}>
                <Icon size={24} className={stat.color} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Full Width Graph Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Revenue Overview</h3>
            <p className="text-sm text-gray-500 mt-1">Last 6 Months performance</p>
          </div>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-semibold flex items-center gap-1 bg-blue-50 px-4 py-2 rounded-xl transition-colors">
            Detailed Report <ArrowUpRight size={16} />
          </button>
        </div>
        <div className="p-8">
          <div className="h-[250px] flex items-end justify-between gap-4">
            {stats?.monthlyRevenue?.map((month, i) => {
              const maxRev = Math.max(...(stats.monthlyRevenue.map(m => m.revenue) || [1]));
              const height = maxRev > 0 ? `${(month.revenue / maxRev) * 100}%` : '0%';
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-3 group relative">
                  <div className="w-full flex-1 flex items-end justify-center rounded-t-xl overflow-hidden bg-gray-50">
                    <div 
                      className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-xl transition-all duration-1000 group-hover:from-blue-500 group-hover:to-blue-300"
                      style={{ height: height === '0%' ? '4px' : height }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-500 group-hover:text-blue-600 transition-colors">{month.month}</span>
                  
                  {/* Tooltip */}
                  <div className="absolute -top-10 bg-gray-900 text-white text-xs font-bold py-1 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    ₹{month.revenue.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pending Bookings - Full Width Short Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xl font-bold text-gray-900">Pending Bookings</h3>
          <button 
            onClick={() => navigate('/service-center/bookings')}
            className="text-gray-500 hover:text-gray-900 text-sm font-semibold transition-colors"
          >
            View All
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {stats?.pendingBookings?.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 shadow-sm">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No pending bookings at the moment.</p>
            </div>
          ) : (
            stats?.pendingBookings?.map((booking) => (
              <div 
                key={booking.id} 
                onClick={() => navigate(`/service-center/bookings/${booking.bookingId}`)}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer flex flex-col md:flex-row items-center gap-4 md:gap-6 group"
              >
                {/* Vehicle Image */}
                <div className="w-full md:w-32 h-20 bg-gray-100 rounded-xl overflow-hidden shrink-0 relative">
                  {booking.serviceCenterImage ? (
                    <img src={booking.serviceCenterImage} alt={booking.vehicleModel} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Car size={32} className="text-gray-300" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2 bg-yellow-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                    {booking.status}
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 w-full flex flex-col justify-center">
                  <div className="flex flex-wrap items-baseline gap-2 mb-1">
                    <h4 className="font-bold text-gray-900 text-lg truncate">
                      {booking.vehicleBrand} {booking.vehicleModel}
                    </h4>
                    <span className="text-sm font-semibold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-100">
                      {booking.vehicleRegistrationNo}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate mb-2">
                    {booking.serviceType} • {booking.notes || "No additional notes"}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                      <Clock size={14} />
                      {new Date(booking.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                      <MapPin size={14} className="text-gray-400" />
                      {booking.propertyCity || "Customer Location"}
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="w-full md:w-auto shrink-0 flex items-center justify-end pr-2">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <ArrowUpRight size={20} />
                  </div>
                </div>
              </div>
            ))
          )}
      </div>
      </div>

      {/* Completed Bookings - Full Width Short Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xl font-bold text-gray-900">Recently Completed Services</h3>
          <button 
            onClick={() => navigate('/service-center/bookings')}
            className="text-gray-500 hover:text-gray-900 text-sm font-semibold transition-colors"
          >
            View All
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {stats?.completedBookings?.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 shadow-sm">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No completed bookings at the moment.</p>
            </div>
          ) : (
            stats?.completedBookings?.map((booking) => (
              <div 
                key={booking.id} 
                onClick={() => navigate(`/service-center/bookings/${booking.bookingId}`)}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer flex flex-col md:flex-row items-center gap-4 md:gap-6 group"
              >
                {/* Vehicle Image */}
                <div className="w-full md:w-32 h-20 bg-gray-100 rounded-xl overflow-hidden shrink-0 relative">
                  {booking.serviceCenterImage ? (
                    <img src={booking.serviceCenterImage.startsWith('http') ? booking.serviceCenterImage : `https://gd1-grand-auto-depot-one-9ms1.onrender.com${booking.serviceCenterImage}`} className="w-full h-full object-cover" alt="Vehicle" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Car size={32} className="opacity-50" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-bold text-emerald-600 shadow-sm">
                    {booking.status}
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 flex flex-col gap-2 w-full">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 leading-tight">
                        {booking.vehicleBrand} {booking.vehicleModel}
                      </h4>
                      <div className="text-sm font-medium text-gray-500 mt-0.5">
                        {booking.vehicleRegistrationNo}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
                        <Wrench size={12} />
                        {booking.serviceType}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                      <Clock size={14} />
                      {new Date(booking.updatedAt || booking.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                      <MapPin size={14} className="text-gray-400" />
                      {booking.propertyCity || "Customer Location"}
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="w-full md:w-auto shrink-0 flex items-center justify-end pr-2">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <ArrowUpRight size={20} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
