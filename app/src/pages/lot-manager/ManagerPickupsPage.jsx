import { useState, useEffect } from 'react';
import { Truck, Search, Filter, Loader2, Navigation, MessageCircle, Phone, Car, Clock, User, MapPin } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getToken } from '../../api/auth';
import { useNavigate } from 'react-router-dom';

export default function ManagerPickupsPage() {
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'completed'
  const [pendingCount, setPendingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPickups();
  }, [activeTab]);

  const fetchPickups = async () => {
    setLoading(true);
    try {
      const token = getToken('AccessToken');
      const [pendingRes, completedRes] = await Promise.all([
        fetch('https://gd1-grand-auto-depot-one-9ms1.onrender.com/api/lot-manager/pickups?isCompleted=false', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('hhttps://gd1-grand-auto-depot-one-9ms1.onrender.com/api/lot-manager/pickups?isCompleted=true', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!pendingRes.ok || !completedRes.ok) throw new Error("Failed to fetch pickups");
      
      const pendingData = await pendingRes.json();
      const completedData = await completedRes.json();

      const pendingList = pendingData.data || [];
      const completedList = completedData.data || [];

      setPendingCount(pendingList.length);
      setCompletedCount(completedList.length);

      if (activeTab === 'pending') {
        setPickups(pendingList);
      } else {
        setPickups(completedList);
      }
    } catch (err) {
      toast.error(err.message || "Error loading pickups");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'Requested': { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Requested' },
      'Assigned': { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Assigned to You' },
      'AgentAccepted': { bg: 'bg-indigo-50', text: 'text-indigo-700', label: 'Accepted' },
      'InProgress': { bg: 'bg-purple-50', text: 'text-purple-700', label: 'In Progress' },
      'VehiclePicked': { bg: 'bg-orange-50', text: 'text-orange-700', label: 'Vehicle Picked' },
      'InTransit': { bg: 'bg-cyan-50', text: 'text-cyan-700', label: 'In Transit' },
      'Stored': { bg: 'bg-green-50', text: 'text-green-700', label: 'Stored' },
      'Completed': { bg: 'bg-green-50', text: 'text-green-700', label: 'Completed' },
      'Declined': { bg: 'bg-red-50', text: 'text-red-700', label: 'Declined' }
    };
    
    // Check if status is numeric (from Enum stringification issues)
    const mapNumeric = {
      '0': 'Requested', '1': 'Assigned', '2': 'AgentAccepted', '3': 'AgentDeclined',
      '4': 'InProgress', '5': 'ReachedLocation', '6': 'NotVerified', '7': 'VehiclePicked',
      '8': 'InTransit', '9': 'Stored', '10': 'Declined'
    };
    
    const mappedStatus = mapNumeric[status] || status;
    const config = statusMap[mappedStatus] || { bg: 'bg-gray-50', text: 'text-gray-700', label: mappedStatus };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${config.bg} ${config.text} border border-current/10`}>
        {config.label}
      </span>
    );
  };

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `https://gd1-grand-auto-depot-one-9ms1.onrender.com${url.startsWith('/') ? url : `/${url}`}`;
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-[28px] font-black text-gray-900 tracking-tight">Pickup Requests</h2>
          <p className="text-gray-500 text-sm mt-1">Manage vehicles assigned to you for pickup</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white rounded-2xl p-1.5 border border-gray-100 shadow-sm w-full max-w-md">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
            activeTab === 'pending' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Pending Pickups ({pendingCount})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
            activeTab === 'completed' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Completed ({completedCount})
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        </div>
      ) : pickups.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
          <Truck size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-bold text-gray-900">No {activeTab} pickups found</h3>
          <p className="text-gray-500 text-sm mt-2">You don't have any {activeTab} pickup assignments at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {pickups.map((pickup) => (
            <div key={pickup.pickupRequestId} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
              <div className="h-32 bg-gray-100 relative">
                {pickup.vehicleImage ? (
                  <img src={getImageUrl(pickup.vehicleImage)} alt={pickup.vehicleBrand} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <Car size={24} />
                    <span className="text-[10px] font-medium mt-1">No Image</span>
                  </div>
                )}
                <div className="absolute top-2 right-2 shadow-sm scale-90">
                  {getStatusBadge(pickup.status)}
                </div>
              </div>
              
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="mb-3">
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{pickup.vehicleBrand} {pickup.vehicleModel}</h3>
                    <p className="text-xs font-semibold text-gray-400 mt-0.5">{pickup.registrationNo}</p>
                  </div>

                  <div className="space-y-2 mb-4 bg-gray-50 p-3 rounded-xl text-xs">
                    <div className="flex items-center gap-2">
                      <User size={13} className="text-gray-400 shrink-0" />
                      <span className="font-semibold text-gray-500">Customer:</span>
                      <span className="font-bold text-gray-900 truncate">{pickup.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={13} className="text-gray-400 shrink-0" />
                      <span className="font-semibold text-gray-500">Time:</span>
                      <span className="font-bold text-gray-900 truncate">
                        {new Date(pickup.requestedPickupTime).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={13} className="text-gray-400 shrink-0" />
                      <span className="font-semibold text-gray-500">Location:</span>
                      <span className="font-bold text-gray-900 truncate" title={pickup.pickupAddress}>{pickup.pickupAddress || 'Unspecified'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto">
                  <button 
                    onClick={() => navigate(`/lot-manager/pickup-details/${pickup.pickupRequestId}`)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors text-sm"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
