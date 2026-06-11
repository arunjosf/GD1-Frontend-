import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Car, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  ShieldCheck, 
  DollarSign, 
  Loader2,
  FileText
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getToken } from '../../api/auth';

export default function ManagerVehicleDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVehicleDetails();
  }, [id]);

  const fetchVehicleDetails = async () => {
    setLoading(true);
    try {
      const token = getToken('AccessToken');
      const res = await fetch(`https://localhost:7108/api/lot-manager/vehicles/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        if (res.status === 404) throw new Error("Vehicle not found");
        throw new Error("Failed to fetch vehicle details");
      }
      const result = await res.json();
      if (!result.success) throw new Error(result.message);
      setVehicle(result.data);
    } catch (err) {
      toast.error(err.message || "Error loading vehicle details");
      navigate('/lot-manager/vehicles');
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `https://localhost:7108${url.startsWith('/') ? url : `/${url}`}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
         <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!vehicle) return null;

  return (
    <div className="w-full max-w-[1200px] mx-auto space-y-6 animate-fade-in pb-10">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate('/lot-manager/vehicles')}
          className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm shrink-0"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-[28px] font-black text-gray-900 tracking-tight">Vehicle Details</h2>
          <p className="text-gray-500 text-sm mt-1">{vehicle.brand} {vehicle.model}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Image and Basic Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="h-64 bg-gray-100 relative">
              {vehicle.imageUrl ? (
                <img src={getImageUrl(vehicle.imageUrl)} alt={vehicle.brand} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                  <Car size={48} />
                  <span className="text-sm font-medium mt-2">No Image</span>
                </div>
              )}
            </div>
            <div className="p-6">
              <h3 className="text-2xl font-black text-gray-900 leading-tight mb-2">{vehicle.brand} {vehicle.model}</h3>
              <div className="flex items-center gap-2 mb-6">
                <span className="px-3 py-1 bg-gray-100 text-gray-900 font-bold text-sm rounded-lg">
                  {vehicle.registrationNo}
                </span>
                <span className="px-3 py-1 bg-blue-50 text-blue-700 font-bold text-sm rounded-lg">
                  {vehicle.category}
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 shrink-0">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500">Verification</p>
                    <p className="text-sm font-bold text-gray-900">{vehicle.verificationStatus || 'Unknown'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500">Stored Since</p>
                    <p className="text-sm font-bold text-gray-900">{new Date(vehicle.storedSince).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Owner Info and Actions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <User size={20} className="text-blue-500" /> Owner Details
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-2xl p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-600 shadow-sm shrink-0">
                  <User size={20} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Full Name</p>
                  <p className="text-base font-bold text-gray-900">{vehicle.ownerName}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-600 shadow-sm shrink-0">
                  <Phone size={20} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Phone Number</p>
                  <p className="text-base font-bold text-gray-900">{vehicle.ownerPhone || 'Not provided'}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-600 shadow-sm shrink-0">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Email Address</p>
                  <p className="text-base font-bold text-gray-900 truncate">{vehicle.ownerEmail || 'Not provided'}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-green-600 shadow-sm shrink-0">
                  <DollarSign size={20} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Price Per Day</p>
                  <p className="text-base font-bold text-gray-900">Rs. {vehicle.pricePerDay}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
               Quick Actions
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <button 
                    onClick={() => navigate(`/track-pickup/${vehicle.bookingId}`)}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                 >
                    View Vehicle Journey
                 </button>
               <button 
                  onClick={() => navigate('/lot-manager/tasks')}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors"
               >
                  <FileText size={18} /> Add Condition Report
               </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
