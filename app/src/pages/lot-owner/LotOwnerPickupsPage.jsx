import React, { useState, useEffect } from 'react';
import { Truck, MapPin, Calendar, CheckCircle, Clock, Car } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function LotOwnerPickupsPage() {
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('requested'); // 'requested' or 'assigned'

  useEffect(() => {
    fetchPickups();
  }, []);

  usePolling(() => {
    fetchPickups(true);
  }, 15000);

  const fetchPickups = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; AccessToken=`);
      const token = parts.length === 2 ? parts.pop().split(';').shift() : null;

      if (!token) return;

      const res = await fetch('https://gd1-grand-auto-depot-one-9ms1.onrender.com/api/Pickup/lot-owner/all-requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setPickups(data.data || []);
      } else {
        toast.error("Failed to load pickup requests");
      }
    } catch (err) {
      toast.error("Network error while loading pickups");
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `https://gd1-grand-auto-depot-one-9ms1.onrender.com${cleanUrl}`;
  };

  const filteredPickups = pickups.filter(p => {
    if (activeTab === 'requested') {
      return p.status === 'Requested';
    } else {
      return p.status !== 'Requested' && p.status !== 'Declined';
    }
  });

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-white animate-fade-in">
      <div className="p-6 border-b border-gray-100 flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pickup Requests</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and track pickup requests for your properties.</p>
        </div>
        
        {/* Toggle requested and track assigned */}
        <div className="flex bg-gray-100 p-1 rounded-xl shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('requested')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
              activeTab === 'requested'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Requested ({pickups.filter(p => p.status === 'Requested').length})
          </button>
          <button
            onClick={() => setActiveTab('assigned')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
              activeTab === 'assigned'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Track Assigned ({pickups.filter(p => p.status !== 'Requested' && p.status !== 'Declined').length})
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredPickups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Truck size={48} className="mb-4 opacity-20" strokeWidth={1} />
            <p>No {activeTab === 'requested' ? 'requested' : 'assigned/active'} pickup requests found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-gray-50/50">
            {filteredPickups.map((pickup) => (
              <div key={pickup.pickupRequestId} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${
                    pickup.status === 'Stored' ? 'bg-green-100 text-green-700' :
                    pickup.status === 'Requested' ? 'bg-orange-100 text-orange-700' :
                    pickup.status === 'Declined' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {pickup.status === 'Stored' ? <CheckCircle size={12}/> : <Clock size={12}/>}
                    {pickup.status}
                  </span>
                  <div className="text-sm font-semibold text-gray-500 flex items-center gap-1">
                     <Calendar size={14} />
                     {new Date(pickup.bookingStartDate).toLocaleDateString()}
                  </div>
                </div>

                <div className="space-y-4 flex-grow">
                  <div className="flex gap-4 items-center">
                    {pickup.vehicleImage ? (
                      <img src={getImageUrl(pickup.vehicleImage)} alt="Vehicle" className="w-16 h-16 rounded-lg object-cover bg-gray-100 border border-gray-200" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                        <Car size={24} />
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{pickup.vehicleBrand} {pickup.vehicleModel}</h3>
                      <div className="inline-block mt-1 px-2 py-0.5 bg-gray-100 rounded text-xs font-medium text-gray-600 font-mono">
                        {pickup.registrationNo}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin size={16} className="mt-1 text-gray-400 shrink-0" />
                    <span className="line-clamp-2">{pickup.pickupAddress || 'Address not provided'}</span>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">{pickup.customerName}</p>
                    <p className="text-xs text-gray-500">{pickup.customerPhone}</p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100">
                  <a href={`/lot-owner/pickup/${pickup.pickupRequestId}`} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold transition-colors">
                    View Details
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

