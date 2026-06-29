import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Car, MapPin, CheckCircle2, Navigation, Search } from 'lucide-react';

export default function MyVehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchVehicles = async () => {
      try {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; AccessToken=`);
        const token = parts.length === 2 ? parts.pop().split(';').shift() : null;

        if (!token) throw new Error("No token found");

        const res = await fetch('https://gd1-grand-auto-depot-one-9ms1.onrender.com/api/vehicle/my-vehicle', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error("Failed to fetch vehicles");
        
        const data = await res.json();
        
        // Sort stored vehicles first
        const sortedVehicles = (data.data || []).sort((a, b) => {
          if (a.isStored && !b.isStored) return -1;
          if (!a.isStored && b.isStored) return 1;
          return 0;
        });

        setVehicles(sortedVehicles);
      } catch {
        toast.error("Failed to load your vehicles");
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [isAuthenticated, navigate]);

  const filteredVehicles = vehicles.filter(v => 
    (v.brand?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (v.model?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (v.registrationNo?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow pt-[140px] pb-20 px-[6vw]">
        <div className="max-w-5xl mx-auto">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-[#111] tracking-tight mb-2">My Vehicles</h1>
              <p className="text-gray-500 text-[14px]">Manage and monitor all your registered vehicles.</p>
            </div>
            
            <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
              <div className="w-full md:w-80 relative">
                <input
                  type="text"
                  placeholder="Search your vehicles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm text-sm"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
              <button 
                onClick={() => navigate('/add-vehicle')}
                className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-[14px] shadow-sm transition-all whitespace-nowrap"
              >
                Add New Vehicle
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="bg-white rounded-[2rem] p-12 text-center shadow-sm border border-gray-100 max-w-2xl mx-auto">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-5">
                 <Car className="text-gray-400 w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-[#111] mb-2">No Vehicles Found</h3>
              <p className="text-gray-500 mb-6">We couldn't find any vehicles matching your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVehicles.map(vehicle => {
                const getImageUrl = (url) => {
                  if (!url) return "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&auto=format&fit=crop";
                  if (url.startsWith('http')) return url;
                  return `https://gd1-grand-auto-depot-one-9ms1.onrender.com${url.startsWith('/') ? url : `/${url}`}`;
                };

                return (
                  <div key={vehicle.id} className="group bg-white rounded-3xl border border-gray-200/80 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 overflow-hidden flex flex-col relative translate-y-0 hover:-translate-y-1">
                    <div className="h-44 bg-gray-100 relative overflow-hidden">
                      <img 
                        src={getImageUrl(vehicle.profileImageUrl)} 
                        alt={vehicle.model}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        onError={(e) => { e.target.onerror = null; e.target.src="https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&auto=format&fit=crop"; }}
                      />
                      {vehicle.isStored ? (
                        <div className="absolute top-4 right-4 bg-green-500 text-white px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest shadow-lg flex items-center gap-1.5 border border-green-400">
                          <CheckCircle2 size={12} />
                          STORED
                        </div>
                      ) : (
                        <div className="absolute top-4 right-4 bg-gray-800 text-white px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest shadow-lg border border-gray-700">
                          IDLE
                        </div>
                      )}
                    </div>

                    <div className="p-5 flex-1 flex flex-col">
                      <div className="mb-4">
                        <h2 className="text-[17px] font-black text-[#111] leading-tight mb-1">
                          {vehicle.brand} {vehicle.model}
                        </h2>
                        <div className="flex items-center gap-2 mt-2">
                           <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border border-gray-200">
                             {vehicle.registrationNo}
                           </span>
                        </div>
                      </div>

                      <div className="space-y-3 mb-6 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                        {vehicle.isStored && vehicle.lotName ? (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                              <MapPin size={14} className="text-blue-500" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Stored At</p>
                              <p className="text-[13px] font-bold text-[#111] truncate">{vehicle.lotName}</p>
                              {vehicle.location && (
                                <p className="text-[12px] font-medium text-gray-500 truncate">{vehicle.location}</p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 opacity-50">
                            <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0">
                              <MapPin size={14} className="text-gray-400" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Location</p>
                              <p className="text-[13px] font-bold text-gray-500">Not Stored</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-auto">
                        {vehicle.isStored ? (
                          <button 
                            onClick={() => {
                              if (vehicle.activeBookingId) {
                                navigate(`/stored-vehicle/${vehicle.activeBookingId}`);
                              } else {
                                navigate('/my-bookings');
                              }
                            }}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-[13px] shadow-sm transition-all flex items-center justify-center gap-2"
                          >
                            View Details
                          </button>
                        ) : (
                          <button 
                            onClick={() => navigate('/home')}
                            className="w-full py-3 bg-blue-50 border border-transparent hover:border-blue-200 text-blue-700 rounded-xl font-bold text-[13px] transition-all flex items-center justify-center gap-2"
                          >
                            <Navigation size={14} />
                            Find Parking
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
    </div>
  );
}
