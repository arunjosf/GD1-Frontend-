import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getToken } from '../../api/auth';

const api = {
  get: async (url) => {
    const res = await fetch(`https://localhost:7108/api${url}`, {
      headers: { Authorization: `Bearer ${getToken('AccessToken')}` }
    });
    if (!res.ok) throw new Error('API Error');
    return { data: await res.json() };
  },
  post: async (url, body) => {
    const res = await fetch(`https://localhost:7108/api${url}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken('AccessToken')}` 
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('API Error');
    return { data: await res.json() };
  },
  put: async (url, body) => {
    const res = await fetch(`https://localhost:7108/api${url}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken('AccessToken')}` 
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('API Error');
    return { data: await res.json() };
  }
};

import { toast } from 'react-hot-toast';
import { ChevronLeft, MapPin, User, Car, Wrench, FileText, CheckCircle, Upload } from 'lucide-react';
import { useCall } from '../../context/CallContext';

const scIcon = L.divIcon({
  html: `<div style="width: 32px; height: 32px; background-color: #2563eb; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg></div>`,
  className: 'sc-marker-icon',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const vehicleIcon = L.divIcon({
  html: `<div style="width: 32px; height: 32px; background-color: #ef4444; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg></div>`,
  className: 'vehicle-marker-icon',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

function MapBoundsManager({ locations }) {
  const map = useMap();
  useEffect(() => {
    if (locations && locations.length > 0) {
      const bounds = L.latLngBounds(locations);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [locations, map]);
  return null;
}

export default function SCBookingDetailsPage() {
  const { id } = useParams();
  const [routeCoords, setRouteCoords] = useState(null);
  const navigate = useNavigate();
  const { startCall } = useCall();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (booking && booking.propertyLatitude && booking.propertyLongitude && booking.serviceCenterLatitude && booking.serviceCenterLongitude) {
      const fetchRoute = async () => {
        try {
          const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${booking.serviceCenterLongitude},${booking.serviceCenterLatitude};${booking.propertyLongitude},${booking.propertyLatitude}?overview=full&geometries=geojson`);
          const data = await res.json();
          if (data.routes && data.routes.length > 0) {
            const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
            setRouteCoords(coords);
          }
        } catch (e) {
          console.error("Failed to fetch route", e);
        }
      };
      fetchRoute();
    }
  }, [booking]);

  const [mechanics, setMechanics] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedMechanic, setSelectedMechanic] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [route, setRoute] = useState([]);
  
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [billFile, setBillFile] = useState(null);
  const [amount, setAmount] = useState('');
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    fetchBookingDetails();
    fetchMechanics();
  }, [id]);

  const fetchBookingDetails = async () => {
    try {
      const response = await api.get(`/service-center/request/${id}`);
      if (!response.data || !response.data.data) {
        toast.error("Booking not found");
        navigate('/service-center/bookings');
        return;
      }
      const found = response.data.data;
      setBooking(found);
      
      // Attempt to fetch route if we have coordinates
      // In a real scenario, these would come from the API correctly
      // For this test, we'll just draw a straight line if coordinates exist
      if (found.propertyLatitude && found.propertyLongitude && found.serviceCenterLatitude && found.serviceCenterLongitude) {
        setRoute([
          [parseFloat(found.serviceCenterLatitude), parseFloat(found.serviceCenterLongitude)],
          [parseFloat(found.propertyLatitude), parseFloat(found.propertyLongitude)]
        ]);
      } else {
        // Fallback coordinates for demo map
        setRoute([
          [11.0168, 76.9558], // Example SC location
          [11.0268, 76.9658]  // Example Vehicle location
        ]);
      }
    } catch (error) {
      toast.error('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const fetchMechanics = async () => {
    try {
      const response = await api.get('/service-center/mechanics');
      setMechanics(response.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleComplete = async () => {
    if (!billFile) {
      toast.error('Please upload a bill file');
      return;
    }
    if (billFile.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed for the service bill');
      return;
    }
    if (!amount || isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    setCompleting(true);
    try {
      const formData = new FormData();
      formData.append('completionNotes', completionNotes);
      formData.append('billFile', billFile);
      formData.append('amount', amount);

      const res = await fetch(`https://localhost:7108/api/service-center/bookings/${booking.id}/complete`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${getToken('AccessToken')}` 
        },
        body: formData
      });
      if (!res.ok) throw new Error('API Error');
      
      toast.success('Service marked as completed and notifications sent!');
      setShowCompleteModal(false);
      navigate('/service-center/bookings');
    } catch (error) {
      toast.error('Failed to complete service');
    } finally {
      setCompleting(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedMechanic) {
      toast.error('Please select a mechanic');
      return;
    }
    
    setAssigning(true);
    try {
      await api.post('/service-center/assign-mechanic', {
        serviceRequestId: booking.id,
        mechanicId: parseInt(selectedMechanic),
        scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : null,
        adminNotes: adminNotes
      });
      toast.success('Mechanic assigned and notified successfully!');
      setShowAssignModal(false);
      navigate('/service-center/bookings');
    } catch (error) {
      toast.error('Failed to assign mechanic');
    } finally {
      setAssigning(false);
    }
  };

  if (loading) return <div className="flex h-full items-center justify-center">Loading...</div>;
  if (!booking) return null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <button 
        onClick={() => navigate('/service-center/bookings')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold transition-colors"
      >
        <ChevronLeft size={20} />
        Back to Bookings
      </button>

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Booking #{booking.id}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-black uppercase tracking-wider rounded-md">
              {booking.status}
            </span>
            <span className="text-sm font-bold text-gray-500">
              Scheduled for {new Date(booking.scheduledDate || booking.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        {(booking.status === 'Pending' || booking.status === 'Requested') && (
          <button 
            onClick={() => navigate('/service-center/bookings/' + booking.id + '/assign')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm"
          >
            <Wrench size={18} />
            Assign Mechanic
          </button>
        )}
          {['Assigned', 'Assigned Mechanic', 'Approved', 'Mechanic Arrived Garage', 'OTP Verified'].includes(booking.status) && (
            <button 
              onClick={() => setShowCompleteModal(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm"
            >
              <CheckCircle size={18} />
              Submit Service Report
            </button>
          )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Car size={18} className="text-blue-600"/> Vehicle
            </h3>
            <div className="w-full h-40 bg-gray-100 rounded-xl overflow-hidden mb-4 border border-gray-200">
              <img src={booking.vehicleLatestConditionImageUrl ? (booking.vehicleLatestConditionImageUrl.startsWith('http') ? booking.vehicleLatestConditionImageUrl : `https://localhost:7108${booking.vehicleLatestConditionImageUrl}`) : 'https://placehold.co/400x300/e2e8f0/64748b?text=No+Image'} className="w-full h-full object-cover" alt="Vehicle" />
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Brand / Model</p>
                <p className="font-bold text-gray-900">{booking.vehicleBrand} {booking.vehicleModel}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Registration No</p>
                <p className="font-mono font-bold text-gray-900">{booking.vehicleRegistrationNo}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin size={18} className="text-red-600"/> Garage Details
            </h3>
            <p className="font-bold text-gray-900">{booking.propertyName || 'Unknown Garage'}</p>
            <p className="text-sm text-gray-600 mt-1">{booking.propertyAddress}, {booking.propertyCity}</p>
            <p className="text-xs text-gray-500 mt-2 italic">Vehicle is stationed at this storage property.</p>
          </div>

          {booking.notes && (
            <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText size={18} className="text-orange-600"/> Owner Notes
              </h3>
              <p className="text-sm text-gray-700 bg-orange-50 p-3 rounded-xl border border-orange-100">
                {booking.notes}
              </p>
            </div>
          )}

          {/* Contact Directory */}
          <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User size={18} className="text-purple-600"/> Contact Directory
            </h3>
            
            <div className="space-y-4">
              {/* Vehicle Owner */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Vehicle Owner</p>
                <p className="font-bold text-gray-900 mb-3">{booking.vehicleOwnerName || 'Unknown'}</p>
                <div className="flex gap-2">
                  <button onClick={() => {
                      if (booking.vehicleOwnerId) {
                          startCall(booking.vehicleOwnerId, 'manager', booking.vehicleOwnerName || 'Vehicle Owner');
                      } else {
                          toast.error("Cannot call this user.");
                      }
                  }} className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border border-gray-200 hover:bg-gray-100 text-gray-800 rounded-lg font-bold text-xs transition-colors">
                    <Car size={14} />
                    Call
                  </button>
                  {booking.vehicleOwnerId > 0 && (
                    <button onClick={() => navigate(`/service-center/messages?userId=${booking.vehicleOwnerId}`)} className="flex-1 flex items-center justify-center gap-2 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xs shadow-sm transition-colors">
                      <User size={14} />
                      Message
                    </button>
                  )}
                </div>
              </div>

              {/* Garage Owner */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Garage Owner</p>
                <p className="font-bold text-gray-900 mb-3">{booking.lotOwnerName || 'Unknown'}</p>
                <div className="flex gap-2">
                  <button onClick={() => {
                      if (booking.lotOwnerId) {
                          startCall(booking.lotOwnerId, 'manager', booking.lotOwnerName || 'Garage Owner');
                      } else {
                          toast.error("Cannot call this user.");
                      }
                  }} className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border border-gray-200 hover:bg-gray-100 text-gray-800 rounded-lg font-bold text-xs transition-colors">
                    <MapPin size={14} />
                    Call
                  </button>
                  {booking.lotOwnerId > 0 && (
                    <button onClick={() => navigate(`/service-center/messages?userId=${booking.lotOwnerId}`)} className="flex-1 flex items-center justify-center gap-2 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xs shadow-sm transition-colors">
                      <User size={14} />
                      Message
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Map */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm h-[500px] flex flex-col relative">
          <div className="absolute top-4 left-4 z-40 bg-white px-4 py-2 rounded-xl shadow-md border border-gray-100 flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
              <div className="w-3 h-3 rounded-full bg-blue-600"></div> SC
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
              <div className="w-3 h-3 rounded-full bg-red-600"></div> Vehicle
            </div>
          </div>
          
          {route.length > 0 && (
            <MapContainer 
              center={route[0]} 
              zoom={13} 
              style={{ width: '100%', height: '100%', zIndex: 1 }}
              zoomControl={false}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              />
              <Marker position={route[0]} icon={scIcon} />
              <Marker position={route[1]} icon={vehicleIcon} />
              {routeCoords ? (
                <Polyline 
                  positions={routeCoords} 
                  color="#3b82f6" 
                  weight={5} 
                />
              ) : (
                <Polyline 
                  positions={route} 
                  color="#3b82f6" 
                  weight={4} 
                  dashArray="8, 8" 
                  opacity={0.7}
                />
              )}
              <MapBoundsManager locations={route} />
            </MapContainer>
          )}
        </div>
      </div>

      
      {/* Complete Service Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-green-50">
              <h3 className="text-xl font-black text-green-900">Complete Service</h3>
              <button onClick={() => setShowCompleteModal(false)} className="text-green-700 hover:text-green-900">
                <ChevronLeft className="rotate-180" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <span className="block text-sm font-bold text-gray-700 mb-2">Upload Bill / Invoice Document <span className="text-red-500">*</span></span>
                <label className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-green-400 hover:bg-green-50/50 transition-all bg-gray-50 cursor-pointer group">
                  <div className="space-y-2 text-center">
                    <Upload className="mx-auto h-10 w-10 text-gray-400 group-hover:text-green-500 transition-colors" />
                    <div className="flex text-sm text-gray-600 justify-center">
                      <span className="relative font-bold text-green-600 group-hover:text-green-700 transition-colors">
                        Upload a PDF file
                      </span>
                      <input type="file" className="sr-only" onChange={(e) => setBillFile(e.target.files[0])} accept=".pdf" />
                    </div>
                    <p className="text-xs text-gray-500 font-medium">{billFile ? billFile.name : 'PDF up to 5MB'}</p>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Service Amount (₹) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter total service cost"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none text-sm"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Completion Notes</label>
                <textarea
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="Enter details of work done, parts replaced, etc..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none text-sm min-h-[100px]"
                />
              </div>
              
              <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex items-start gap-3">
                <div className="text-green-600 mt-0.5"><CheckCircle size={18} /></div>
                <p className="text-xs font-medium text-green-800 leading-relaxed">
                  Completing the service will notify the vehicle owner and property manager, and log the event in the vehicle's journey.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button 
                onClick={() => setShowCompleteModal(false)}
                className="flex-1 px-4 py-3 font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleComplete}
                disabled={completing || !billFile}
                className="flex-1 px-4 py-3 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {completing ? 'Submitting...' : 'Submit Completion'}
              </button>
            </div>
          </div>
        </div>
      )}

      

    </div>
  );
}
