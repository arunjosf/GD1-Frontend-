import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, MapPin, Wrench, ChevronRight, Car } from 'lucide-react';
import { getToken } from '../api/auth';
import { toast } from 'react-hot-toast';

export default function OwnerServicesPage() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Upcoming'); // 'Upcoming' | 'Serviced'
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const token = getToken('AccessToken');
      const res = await fetch(`https://gd1-grand-auto-depot-one-9ms1.onrender.com/service-center/my-service-requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch services');
      const result = await res.json();
      setServices(result.data || []);
    } catch (error) {
      toast.error('Could not load services');
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = 
      (service.vehicleBrand?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (service.vehicleModel?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (service.vehicleRegistrationNo?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      
    const isCompletedOrCancelled = service.isCompleted === true || service.status === 'Cancelled';
    
    if (activeTab === 'Upcoming') return matchesSearch && !isCompletedOrCancelled;
    if (activeTab === 'Serviced') return matchesSearch && isCompletedOrCancelled;
    return false;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12 pt-6 px-4 md:px-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Services</h1>
          <p className="text-gray-500 mt-1">Track and manage vehicle services</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex p-1 bg-gray-50 rounded-xl w-full sm:w-auto">
          <button 
            onClick={() => setActiveTab('Upcoming')}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'Upcoming' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Upcoming Services
          </button>
          <button 
            onClick={() => setActiveTab('Serviced')}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'Serviced' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Serviced History
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search brand, model..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-medium outline-none transition-all"
          />
        </div>
      </div>

      {filteredServices.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Wrench className="text-gray-400" size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No {activeTab.toLowerCase()} services found</h3>
          <p className="text-gray-500">When vehicles require service, they will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredServices.map(service => (
            <div key={service.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all group flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 border border-gray-100">
                      <Car size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 leading-tight">{service.vehicleBrand} {service.vehicleModel}</h3>
                      <span className="inline-block mt-1 px-2.5 py-0.5 bg-gray-100 rounded text-xs font-mono font-bold text-gray-600">
                        {service.vehicleRegistrationNo}
                      </span>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    service.status === 'Service Completed' ? 'bg-green-50 text-green-700' :
                    service.status === 'Cancelled' ? 'bg-red-50 text-red-700' :
                    'bg-blue-50 text-blue-700'
                  }`}>
                    {service.status}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Wrench size={16} className="text-gray-400 shrink-0" />
                    <span className="font-medium line-clamp-1">{service.serviceCenterName}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Calendar size={16} className="text-gray-400 shrink-0" />
                    <span className="font-medium">{service.scheduledDate ? new Date(service.scheduledDate).toLocaleDateString() : 'Unscheduled'}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border-t border-gray-50 bg-gray-50/50 group-hover:bg-blue-50/30 transition-colors">
                <button 
                  onClick={() => navigate(`/track-service/${service.id}`)}
                  className="w-full flex items-center justify-between text-blue-600 font-bold text-sm px-2"
                >
                  <span>Track Service Journey</span>
                  <ChevronRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
