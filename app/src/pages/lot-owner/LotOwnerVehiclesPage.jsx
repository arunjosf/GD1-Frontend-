import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Car, Search, MapPin, Calendar, Clock, ShieldCheck } from 'lucide-react';

export default function LotOwnerVehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || role !== 'LotOwner') {
      navigate('/login');
      return;
    }

    const fetchVehicles = async () => {
      try {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; AccessToken=`);
        const token = parts.length === 2 ? parts.pop().split(';').shift() : null;

        if (!token) throw new Error("No token found");

        const res = await fetch(`https://localhost:7108/api/vehicle/admin/lot-owner/manager/all-vehicles?search=${searchTerm}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error("Failed to fetch vehicles");
        
        const data = await res.json();
        setVehicles(data.data || []);
      } catch {
        toast.error("Failed to load stored vehicles");
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [isAuthenticated, navigate, role, searchTerm]);

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow pt-[140px] pb-20 px-[6vw]">
        <div className="max-w-7xl mx-auto">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-[#111] tracking-tight mb-2">Parked Vehicles</h1>
              <p className="text-gray-500 text-[14px]">Overview of all vehicles currently stored in your properties.</p>
            </div>
            
            <div className="w-full md:w-auto relative">
              <input
                type="text"
                placeholder="Search by license plate or model..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-80 pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="bg-white rounded-[2rem] p-12 text-center shadow-xl border border-gray-100">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-5">
                 <Car className="text-gray-400 w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-[#111] mb-2">No Vehicles Found</h3>
              <p className="text-gray-500 mb-6">There are currently no vehicles matching your search criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map(vehicle => {
                const getImageUrl = (url) => {
                  if (!url) return "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&auto=format&fit=crop";
                  if (url.startsWith('http')) return url;
                  return `https://localhost:7108${url.startsWith('/') ? url : `/${url}`}`;
                };

                return (
                  <div key={vehicle.id} className="group bg-white rounded-3xl border border-gray-200/80 shadow-md hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 overflow-hidden flex flex-col relative translate-y-0 hover:-translate-y-1">
                    <div className="h-48 bg-gray-100 relative overflow-hidden">
                      <img 
                        src={getImageUrl(vehicle.profileImageUrl)} 
                        alt={vehicle.model}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        onError={(e) => { e.target.onerror = null; e.target.src="https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&auto=format&fit=crop"; }}
                      />
                      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5 border border-gray-100/50">
                        <ShieldCheck size={14} className="text-blue-600" />
                        <span className="text-[11px] font-black tracking-widest text-gray-900 uppercase">
                          {vehicle.registrationNo}
                        </span>
                      </div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col">
                      <div className="mb-4">
                        <h2 className="text-xl font-black text-[#111] leading-tight mb-1">
                          {vehicle.brand} {vehicle.model}
                        </h2>
                        <div className="flex items-center gap-2 mt-2">
                           <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">{vehicle.category || 'Vehicle'}</span>
                        </div>
                      </div>

                      <div className="space-y-3 mb-6 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                        {vehicle.lotName && (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-sm">
                              <MapPin size={14} className="text-gray-500" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Location</p>
                              <p className="text-[13px] font-bold text-[#111] truncate">{vehicle.lotName}</p>
                            </div>
                          </div>
                        )}
                        {vehicle.startDate && (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-sm">
                              <Calendar size={14} className="text-gray-500" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Stored Since</p>
                              <p className="text-[13px] font-bold text-[#111]">
                                {new Date(vehicle.startDate).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-auto">
                        <button 
                          onClick={() => navigate(`/lot-owner/vehicles/${vehicle.bookingId}`)}
                          className="w-full py-3.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold text-[13px] shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all focus:outline-none focus:ring-4 focus:ring-gray-100 flex items-center justify-center gap-2 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600"
                        >
                          View Details
                        </button>
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
