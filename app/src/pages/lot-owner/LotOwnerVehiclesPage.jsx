import { useState, useEffect } from 'react';
import { Car, Search, ShieldCheck, Loader2, Calendar, MapPin, ChevronRight, User, Camera } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getToken } from '../../api/auth';
import { useNavigate } from 'react-router-dom';

export default function LotOwnerVehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const token = getToken('AccessToken');
      const res = await fetch(`https://localhost:7108/api/lot-owner/dashboard/vehicles`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch vehicles");
      const result = await res.json();
      setVehicles(result.data || []);
    } catch (err) {
      toast.error(err.message || "Error loading vehicles");
    } finally {
      setLoading(false);
    }
  };

  const filteredVehicles = vehicles.filter(v => 
    v.brand.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.model.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.registrationNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.ownerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `https://localhost:7108${url.startsWith('/') ? url : `/${url}`}`;
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-8 animate-fade-in pb-10">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl border border-white/10">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
          <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[150%] bg-gradient-to-b from-emerald-400 to-transparent rotate-45 blur-[100px]" />
          <div className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[150%] bg-gradient-to-t from-teal-400 to-transparent rotate-45 blur-[100px]" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-4">
              <ShieldCheck size={16} className="text-green-400" />
              <span className="text-xs font-bold tracking-wider text-green-50 uppercase">Secure Storage</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">Stored Vehicles</h1>
            <p className="text-blue-100/80 text-lg max-w-xl">Monitor and manage all vehicles currently safely parked in your managed properties.</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex flex-col items-center min-w-[140px]">
            <span className="text-4xl font-black text-white">{vehicles.length}</span>
            <span className="text-xs font-bold text-blue-200 uppercase tracking-wider mt-1">Total Vehicles</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white/80 backdrop-blur-xl p-3 rounded-3xl border border-gray-200 shadow-lg shadow-gray-200/50 flex items-center gap-3 sticky top-6 z-20 transition-all hover:bg-white">
        <div className="bg-blue-50 p-3 rounded-2xl text-blue-600">
          <Search size={22} strokeWidth={2.5} />
        </div>
        <input 
          type="text" 
          placeholder="Search by brand, model, registration no, or owner name..."
          className="flex-1 bg-transparent border-none focus:ring-0 text-gray-900 placeholder-gray-400 text-lg font-medium py-2"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex flex-col justify-center items-center py-32 space-y-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-gray-500 font-semibold animate-pulse">Fetching stored vehicles...</p>
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] p-16 text-center border border-gray-100 shadow-xl shadow-gray-200/50 flex flex-col items-center justify-center">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100">
            <Car size={40} className="text-gray-300" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-2">No Vehicles Found</h3>
          <p className="text-gray-500 text-lg max-w-md">We couldn't find any stored vehicles matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredVehicles.map((vehicle, idx) => {
            const isMoveOutReached = vehicle.endDate && new Date(vehicle.endDate) <= new Date();
            const isCompleted = vehicle.bookingStatus === 'Completed' || vehicle.bookingStatus === 3 || isMoveOutReached;

            return (
              <div 
                key={vehicle.bookingId} 
                className={`group bg-white rounded-3xl border border-gray-200/80 shadow-md transition-all duration-300 overflow-hidden flex flex-col relative ${
                  !isCompleted 
                    ? 'hover:shadow-2xl hover:shadow-blue-500/10 cursor-pointer translate-y-0 hover:-translate-y-1' 
                    : ''
                }`}
                style={{ animationDelay: `${idx * 50}ms` }}
                onClick={!isCompleted ? () => navigate(`/lot-owner/vehicles/${vehicle.vehicleId}?bookingId=${vehicle.bookingId}`, { state: { bookingId: vehicle.bookingId } }) : undefined}
              >
              {/* Image Section */}
              <div className="h-56 bg-gray-100 relative overflow-hidden">
                {vehicle.imageUrl ? (
                  <img src={getImageUrl(vehicle.imageUrl)} alt={vehicle.brand} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 bg-gradient-to-br from-gray-50 to-gray-200">
                    <Car size={48} strokeWidth={1.5} />
                  </div>
                )}
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
                
                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col items-start gap-2">
                  <span className="px-3 py-1.5 bg-white/95 backdrop-blur-sm text-gray-900 font-black text-xs rounded-xl shadow-sm border border-white/50">
                    {vehicle.registrationNo}
                  </span>
                  {vehicle.hasPendingOnDemandRequest && (
                    <span className="px-3 py-1.5 bg-orange-500/90 backdrop-blur-sm text-white font-bold text-xs rounded-xl shadow-sm border border-orange-400/50 flex items-center gap-1.5">
                      <Camera size={14} /> Image Requested
                    </span>
                  )}
                </div>
                <div className="absolute top-4 right-4">
                  {(() => {
                    const isMoveOutReached = vehicle.endDate && new Date(vehicle.endDate) <= new Date();
                    const isCompleted = vehicle.bookingStatus === 'Completed' || vehicle.bookingStatus === 3 || isMoveOutReached;
                    if (isCompleted) {
                      return (
                        <div className="px-3 py-1.5 bg-gray-600/90 backdrop-blur-sm text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5">
                          <ShieldCheck size={14} /> Moved Out
                        </div>
                      );
                    }
                    return (
                      <div className="px-3 py-1.5 bg-green-500/90 backdrop-blur-sm text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5">
                        <ShieldCheck size={14} /> Stored
                      </div>
                    );
                  })()}
                </div>

                {/* Title inside image area */}
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h3 className="text-xl font-black leading-tight drop-shadow-md">{vehicle.brand} {vehicle.model}</h3>
                </div>
              </div>
              
              {/* Info Section */}
              <div className="p-5 flex-1 flex flex-col bg-white">
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-3 text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <User size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Owner</span>
                      <span className="text-sm font-bold text-gray-900">{vehicle.ownerName}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-gray-500 group-hover:text-blue-600 transition-colors">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Stored Since</span>
                    <div className="flex items-center gap-1.5 font-bold text-sm text-gray-900">
                      <Calendar size={14} className="text-blue-500" /> 
                      {new Date(vehicle.storedSince).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 group-hover:scale-110 transition-all">
                    <ChevronRight size={18} />
                  </div>
                </div>

                {(() => {
                  const isMoveOutReached = vehicle.endDate && new Date(vehicle.endDate) <= new Date();
                  const isCompleted = vehicle.bookingStatus === 'Completed' || vehicle.bookingStatus === 3 || isMoveOutReached;
                  if (isCompleted) {
                    return (
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/lot-owner/vehicle-journey/${vehicle.vehicleId}`, { state: { bookingId: vehicle.bookingId } });
                          }}
                          className="w-full py-2.5 px-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-md shadow-gray-900/10 text-center cursor-pointer"
                        >
                          <span>View Vehicle Journey</span>
                          <ChevronRight size={16} />
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          )})}
        </div>
      )}
    </div>
  );
}
