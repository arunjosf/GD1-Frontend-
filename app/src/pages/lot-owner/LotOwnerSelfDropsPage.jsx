import { useState, useEffect } from 'react';
import { Search, Filter, Loader2, Car, Clock, User, MapPin } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getToken } from '../../api/auth';
import { useNavigate } from 'react-router-dom';

export default function LotOwnerSelfDropsPage() {
  const [selfDrops, setSelfDrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'completed', 'cancelled'
  const [pendingCount, setPendingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [cancelledCount, setCancelledCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSelfDrops();
  }, [activeTab]);

  const fetchSelfDrops = async () => {
    setLoading(true);
    try {
      const token = getToken('AccessToken');
      const [pendingRes, completedRes] = await Promise.all([
        fetch('hhttps://gd1-grand-auto-depot-one-9ms1.onrender.com/api/lot-owner/dashboard/self-drops?isCompleted=false', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('https://gd1-grand-auto-depot-one-9ms1.onrender.com/api/lot-owner/dashboard/self-drops?isCompleted=true', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!pendingRes.ok || !completedRes.ok) throw new Error("Failed to fetch self drops");
      
      const pendingData = await pendingRes.json();
      const completedData = await completedRes.json();

      const rawPending = pendingData.data || [];
      const rawCompleted = completedData.data || [];

      const isCancelledStatus = (status) => {
        if (!status && status !== 0) return false;
        const s = String(status).toLowerCase();
        return s.includes('cancel') || s.includes('reject') || s.includes('decline') || s === '4' || s === '14' || s === '6';
      };
      
      const cancelledList = [...rawPending, ...rawCompleted].filter(d => d && isCancelledStatus(d.status));
      const pendingList = rawPending.filter(d => d && !isCancelledStatus(d.status));
      const completedList = rawCompleted.filter(d => d && !isCancelledStatus(d.status));

      setPendingCount(pendingList.length);
      setCompletedCount(completedList.length);
      setCancelledCount(cancelledList.length);

      if (activeTab === 'pending') {
        setSelfDrops(pendingList);
      } else if (activeTab === 'completed') {
        setSelfDrops(completedList);
      } else {
        setSelfDrops(cancelledList);
      }
    } catch (err) {
      toast.error(err.message || "Error loading self drops");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    if (!status && status !== 0) return <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-50 text-gray-700">Unknown</span>;
    const str = String(status).toLowerCase();
    
    let config = { bg: 'bg-gray-50', text: 'text-gray-700', label: status };
    
    if (str.includes('confirm') || str === '1') config = { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Pending Arrival' };
    else if (str.includes('inlot') || str === '2') config = { bg: 'bg-green-50', text: 'text-green-700', label: 'Stored' };
    else if (str.includes('complet') || str === '3') config = { bg: 'bg-green-50', text: 'text-green-700', label: 'Completed' };
    else if (str.includes('reject') || str === '14') config = { bg: 'bg-red-50', text: 'text-red-700', label: 'Rejected' };
    else if (str.includes('cancel') || str === '4') config = { bg: 'bg-red-50', text: 'text-red-700', label: 'Cancelled' };
    else if (str.includes('decline') || str === '6') config = { bg: 'bg-red-50', text: 'text-red-700', label: 'Declined' };

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
          <h2 className="text-[28px] font-black text-gray-900 tracking-tight">Self Drops</h2>
          <p className="text-gray-500 text-sm mt-1">View vehicles dropped off at your properties</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white rounded-2xl p-1.5 border border-gray-100 shadow-sm w-full max-w-2xl">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
            activeTab === 'pending' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Pending Drop-offs ({pendingCount})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
            activeTab === 'completed' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Stored ({completedCount})
        </button>
        <button
          onClick={() => setActiveTab('cancelled')}
          className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
            activeTab === 'cancelled' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Cancelled ({cancelledCount})
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        </div>
      ) : selfDrops.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
          <MapPin size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-bold text-gray-900">No {activeTab} self drops found</h3>
          <p className="text-gray-500 text-sm mt-2">There are no {activeTab} self-dropped vehicles at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {selfDrops.map((drop) => (
            <div key={drop.bookingId} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
              <div className="h-32 bg-gray-100 relative">
                {drop.vehicleImage ? (
                  <img src={getImageUrl(drop.vehicleImage)} alt={drop.vehicleBrand} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <Car size={24} />
                    <span className="text-[10px] font-medium mt-1">No Image</span>
                  </div>
                )}
                <div className="absolute top-2 right-2 shadow-sm scale-90">
                  {getStatusBadge(drop.status)}
                </div>
              </div>
              
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="mb-3">
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{drop.vehicleBrand} {drop.vehicleModel}</h3>
                    <p className="text-xs font-semibold text-gray-400 mt-0.5">{drop.registrationNo}</p>
                  </div>

                  <div className="space-y-2 mb-4 bg-gray-50 p-3 rounded-xl text-xs">
                    <div className="flex items-center gap-2">
                      <User size={13} className="text-gray-400 shrink-0" />
                      <span className="font-semibold text-gray-500">Customer:</span>
                      <span className="font-bold text-gray-900 truncate">{drop.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={13} className="text-gray-400 shrink-0" />
                      <span className="font-semibold text-gray-500">Start Date:</span>
                      <span className="font-bold text-gray-900 truncate">
                        {new Date(drop.startDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto">
                  <button 
                    onClick={() => {
                      if (activeTab === 'cancelled') {
                        toast.error("Cannot view details of a cancelled booking.");
                        return;
                      }
                      navigate(`/lot-owner/self-drops/${drop.bookingId}`)
                    }}
                    className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl font-bold transition-colors text-sm ${
                      activeTab === 'cancelled' 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
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
