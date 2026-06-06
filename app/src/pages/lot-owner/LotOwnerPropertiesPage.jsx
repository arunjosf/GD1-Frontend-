import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Building2, MapPin, Plus, UserPlus } from 'lucide-react';
import { getToken } from '../../api/auth';

export default function LotOwnerPropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const token = getToken('AccessToken');
      if (!token) throw new Error("No token found");

      const res = await fetch('https://localhost:7108/api/lot-manager/properties', { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (!res.ok) throw new Error("Failed to fetch properties");
      const result = await res.json();
      setProperties(result.data || []);
    } catch (err) {
      toast.error(err.message || 'Could not load properties.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 animate-fade-in pt-4 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-[28px] font-bold text-[#111]">My Properties</h2>
          <p className="text-gray-500 text-sm mt-1">Manage your vehicle storage properties and view their details.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
             <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Building2 size={48} className="mb-4 opacity-20" strokeWidth={1} />
            <p>No properties found.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {properties.map((property) => {
              return (
                <div key={property.id} className="flex flex-col px-6 py-6 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                             <span className="font-bold text-[#111] text-lg">{property.name}</span>
                             <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${property.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                               {property.status}
                             </span>
                          </div>
                          
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-3">
                              <div className="flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm">
                                  <MapPin size={16} className="text-blue-500"/>
                                  <span className="font-medium text-gray-900">{property.addressLine}, {property.city}</span>
                              </div>
                              <div className="flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm">
                                  <span className="font-medium text-gray-900">Total Slots: {property.totalSlots}</span>
                              </div>
                              <div className="flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm">
                                  <span className="font-medium text-gray-900">Available: {property.availableSlots}</span>
                              </div>
                          </div>
                      </div>

                      <div className="flex flex-col items-end gap-3 mt-4 lg:mt-0 w-full lg:w-auto">
                        <div className="flex gap-3 w-full lg:w-auto">
                          <button className="px-6 py-2.5 bg-white text-blue-600 border border-blue-200 rounded-xl font-bold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
                            <UserPlus size={18} /> Invite Manager
                          </button>
                        </div>
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
