import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken } from '../../api/auth';
import { toast } from 'react-hot-toast';
import { MapPin, Phone, Building2, Car, ChevronRight, Wrench, Search, PhoneCall } from 'lucide-react';

const api = {
  get: async (url) => {
    const res = await fetch(`https://gd1-grand-auto-depot-one-9ms1.onrender.com/api${url}`, {
      headers: { Authorization: `Bearer ${getToken('AccessToken')}` }
    });
    if (!res.ok) throw new Error('API Error');
    return { data: await res.json() };
  }
};

export default function AdminPartnersPage() {
  const [data, setData] = useState({ garages: [], serviceCenters: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('garage');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const res = await api.get('/admin/partners');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to fetch partners');
    } finally {
      setLoading(false);
    }
  };

  const renderGarages = () => {
    const filtered = data.garages?.filter(g => g.name?.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!filtered || filtered.length === 0) {
      return (
        <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-[2rem] border border-gray-100">
          No garages found.
        </div>
      );
    }

    return filtered.map((garage) => (
      <div 
        key={garage.id} 
        onClick={() => navigate(`/admin/partners/garage/${garage.id}`)}
        className="group cursor-pointer bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col lg:flex-row p-5 gap-6 hover:border-blue-100"
      >
        {/* Garage Info */}
        <div className="flex-1 lg:max-w-[300px] flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
              {garage.imageUrl ? (
                 <img src={garage.imageUrl} alt={garage.name} className="w-full h-full object-cover" />
              ) : (
                 <div className="w-full h-full flex items-center justify-center"><Building2 className="text-gray-400" /></div>
              )}
            </div>
            <div>
              <h3 className="font-black text-gray-900 text-lg leading-tight line-clamp-2">
                {garage.name}
              </h3>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-gray-200 to-transparent"></div>

        {/* Details Grid */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0 group-hover:bg-blue-50 transition-colors">
              <MapPin size={18} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
            <div>
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Location</p>
              <p className="text-sm font-bold text-gray-800 line-clamp-1">{garage.addressLine}</p>
              <p className="text-xs font-semibold text-gray-500">{garage.city}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0 group-hover:bg-blue-50 transition-colors">
              <PhoneCall size={18} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
            <div>
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Contact</p>
              <p className="text-sm font-bold text-gray-800">{garage.phoneNumber}</p>
            </div>
          </div>
        </div>

        {/* Bookings Summary */}
        <div className="lg:w-[200px] shrink-0 bg-gray-50 rounded-2xl p-4 border border-gray-100 flex flex-col justify-center items-center group-hover:bg-blue-50 transition-colors">
          <div className="flex gap-4 mb-1">
            <div className="text-center">
              <div className="text-2xl font-black text-gray-900 group-hover:text-blue-600 transition-colors">{garage.totalBookings}</div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-blue-500">{garage.activeBookings || 0}</div>
              <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wide">Active</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center shrink-0 px-2">
            <ChevronRight className="text-gray-300 group-hover:text-blue-500 transition-colors" />
        </div>
      </div>
    ));
  };

  const renderServiceCenters = () => {
    const filtered = data.serviceCenters?.filter(sc => sc.name?.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!filtered || filtered.length === 0) {
      return (
        <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-[2rem] border border-gray-100">
          No service centers found.
        </div>
      );
    }

    return filtered.map((sc) => (
      <div 
        key={sc.id} 
        onClick={() => navigate(`/admin/partners/service-center/${sc.id}`)}
        className="group cursor-pointer bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col lg:flex-row p-5 gap-6 hover:border-purple-100"
      >
        {/* SC Info */}
        <div className="flex-1 lg:max-w-[300px] flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
              {sc.imageUrl ? (
                 <img src={sc.imageUrl} alt={sc.name} className="w-full h-full object-cover" />
              ) : (
                 <div className="w-full h-full flex items-center justify-center"><Wrench className="text-gray-400" /></div>
              )}
            </div>
            <div>
              <h3 className="font-black text-gray-900 text-lg leading-tight line-clamp-2">
                {sc.name}
              </h3>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-gray-200 to-transparent"></div>

        {/* Details Grid */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0 group-hover:bg-purple-50 transition-colors">
              <MapPin size={18} className="text-gray-400 group-hover:text-purple-600 transition-colors" />
            </div>
            <div>
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Location</p>
              <p className="text-sm font-bold text-gray-800 line-clamp-1">{sc.addressLine}</p>
              <p className="text-xs font-semibold text-gray-500">{sc.city}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0 group-hover:bg-purple-50 transition-colors">
              <PhoneCall size={18} className="text-gray-400 group-hover:text-purple-600 transition-colors" />
            </div>
            <div>
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Contact</p>
              <p className="text-sm font-bold text-gray-800">{sc.phoneNumber}</p>
            </div>
          </div>
        </div>

        {/* Bookings Summary */}
        <div className="lg:w-[200px] shrink-0 bg-gray-50 rounded-2xl p-4 border border-gray-100 flex flex-col justify-center items-center group-hover:bg-purple-50 transition-colors">
          <div className="flex gap-4 mb-1">
            <div className="text-center">
              <div className="text-2xl font-black text-gray-900 group-hover:text-purple-600 transition-colors">{sc.totalBookings}</div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-purple-500">{sc.activeBookings || 0}</div>
              <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wide">Active</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center shrink-0 px-2">
            <ChevronRight className="text-gray-300 group-hover:text-purple-500 transition-colors" />
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
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Partners</h1>
            <p className="text-gray-500 font-medium">Manage your GD1 platform partners</p>
          </div>

          <div className="flex items-center gap-2 bg-gray-200/50 p-1 rounded-xl w-full md:w-auto">
            <button
              onClick={() => { setActiveTab('garage'); setSearchQuery(''); }}
              className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg font-bold text-sm transition-all duration-300 ${
                activeTab === 'garage' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Garages
            </button>
            <button
              onClick={() => { setActiveTab('service'); setSearchQuery(''); }}
              className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg font-bold text-sm transition-all duration-300 ${
                activeTab === 'service' 
                  ? 'bg-white text-purple-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Service Centers
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder={activeTab === 'garage' ? "Search garages by name..." : "Search service centers by name..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium"
          />
        </div>

        {/* Lists */}
        <div className="flex flex-col gap-4">
          {activeTab === 'garage' ? renderGarages() : renderServiceCenters()}
        </div>

      </div>
    </div>
  );
}
