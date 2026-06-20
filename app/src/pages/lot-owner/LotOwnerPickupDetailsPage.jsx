import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { getToken } from '../../api/auth';
import BookingChat from '../../components/BookingChat';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { MapPin, Navigation, ArrowLeft, Phone, Calendar, Clock, Car, FileText, CheckCircle, CheckCircle2, XCircle, MessageCircle, Maximize2, Check } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Black Car Icon with Shadow Circle
const carIcon = L.divIcon({
  className: 'custom-live-car-icon',
  html: `
    <div style="position: relative; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 100%; height: 100%; background-color: rgba(37, 99, 235, 0.2); border-radius: 50%; animation: ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="position: absolute; width: 36px; height: 36px; background-color: rgba(37, 99, 235, 0.4); border-radius: 50%;"></div>
      <div style="position: absolute; width: 22px; height: 22px; background-color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3); border: 2px solid white;">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="black" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a2 2 0 0 0-1.6-.8H7.3a2 2 0 0 0-1.6.8L3 11l-.16.84A1 1 0 0 0 2 12.85V16h3m14 0v1.5a2.5 2.5 0 0 1-5 0V16m5 0h-5m-9 0v1.5a2.5 2.5 0 0 1-5 0V16m5 0H4"/></svg>
      </div>
    </div>
  `,
  iconSize: [60, 60],
  iconAnchor: [30, 30],
  popupAnchor: [0, -20]
});

// A component to automatically fit the map bounds to the polyline
function MapBoundsFit({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  return null;
}

const normalizeStatus = (status) => {
  if (status === undefined || status === null) return '';
  const statusStr = String(status).trim();
  switch (statusStr) {
    case '0':
    case 'Requested':
      return 'Requested';
    case '1':
    case 'Assigned':
      return 'Assigned';
    case '2':
    case 'ManagerScheduled':
      return 'ManagerScheduled';
    case '3':
    case 'Approved':
      return 'Approved';
    case '4':
    case 'Declined':
      return 'Declined';
    case '5':
    case 'OtpSent':
      return 'OtpSent';
    case '6':
    case 'OwnerOtpSubmitted':
      return 'OwnerOtpSubmitted';
    case '7':
    case 'Verified':
      return 'Verified';
    case '8':
    case 'VehiclePicked':
      return 'VehiclePicked';
    case '9':
    case 'InTransit':
      return 'InTransit';
    case '10':
    case 'Stored':
      return 'Stored';
    default:
      return statusStr;
  }
};

export default function LotOwnerPickupDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pickup, setPickup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [carPos, setCarPos] = useState(null);
  const [liveGpsPos, setLiveGpsPos] = useState(null);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [distance, setDistance] = useState(null); // in km
  const [duration, setDuration] = useState(null); // in mins
  const [isAssigningManager, setIsAssigningManager] = useState(false);
  const [isRouteOffline, setIsRouteOffline] = useState(false);
  const [availableManagers, setAvailableManagers] = useState([]);
  const [managersLoading, setManagersLoading] = useState(false);
  const [selectedManager, setSelectedManager] = useState(null);
  const [assignLoading, setAssignLoading] = useState(false);

  useEffect(() => {
    fetchPickupDetails();
  }, [id]);

  const fallbackPos = routeCoords.length > 0 ? routeCoords[0] : (pickup?.pickupLatitude && pickup?.pickupLongitude ? [pickup.pickupLatitude, pickup.pickupLongitude] : null);
  const displayCarPos = liveGpsPos || (pickup?.lastGpsLatitude && pickup?.lastGpsLongitude ? [pickup.lastGpsLatitude, pickup.lastGpsLongitude] : fallbackPos);

  // Live location animation simulation and SignalR connection
  const isTransit = pickup && (String(pickup.status).toUpperCase() === 'INTRANSIT' || String(pickup.status) === '9');
  const isActiveTracking = pickup && ['1', '2', '3', '5', '6', '7', '8', '9', 'Assigned', 'ManagerScheduled', 'Approved', 'OtpSent', 'OwnerOtpSubmitted', 'Verified', 'VehiclePicked', 'InTransit'].includes(String(pickup.status));

  useEffect(() => {
    // Fallback animation if no SignalR/Live tracking yet
    if (isTransit && routeCoords.length > 0 && !liveGpsPos) {
      let index = 0;
      const interval = setInterval(() => {
        setCarPos(routeCoords[index]);
        index = (index + 1) % routeCoords.length;
      }, 1200);
      return () => clearInterval(interval);
    } else {
      setCarPos(null);
    }
  }, [isTransit, routeCoords, liveGpsPos]);

  useEffect(() => {
    if (!isActiveTracking || !pickup?.bookingId) return;

    const value = `; ${document.cookie}`;
    const parts = value.split(`; AccessToken=`);
    const token = parts.length === 2 ? parts.pop().split(';').shift() : null;
    if (!token) return;

    console.log('[LotOwner] Connecting to TrackingHub for bookingId:', pickup.bookingId);

    const connection = new HubConnectionBuilder()
      .withUrl("https://localhost:7108/hubs/tracking", { accessTokenFactory: () => token })
      .configureLogging(LogLevel.Warning)
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveLocationUpdate", (lat, lng) => {
      console.log('[LotOwner] ReceiveLocationUpdate:', lat, lng);
      setLiveGpsPos([lat, lng]);
    });

    connection.start()
      .then(async () => {
        console.log('[LotOwner] TrackingHub connected, joining group:', pickup.bookingId);
        await connection.invoke("JoinTrackingGroup", Number(pickup.bookingId));
        console.log('[LotOwner] Joined tracking group:', pickup.bookingId);
      })
      .catch(err => console.error('[LotOwner] TrackingHub connection failed:', err));

    return () => {
      console.log('[LotOwner] Disconnecting from TrackingHub');
      connection.stop();
    };
  }, [pickup?.bookingId, isActiveTracking]);

  const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const fetchRoute = async (startLat, startLon, endLat, endLon) => {
    const sLat = parseFloat(startLat);
    const sLon = parseFloat(startLon);
    const eLat = parseFloat(endLat);
    const eLon = parseFloat(endLon);

    if (isNaN(sLat) || isNaN(sLon) || isNaN(eLat) || isNaN(eLon)) {
      console.warn("Invalid coordinates passed to fetchRoute:", { startLat, startLon, endLat, endLon });
      return;
    }

    // 1. Attempt official Project OSRM router
    try {
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${sLon},${sLat};${eLon},${eLat}?overview=full&geometries=geojson`);
      if (res.ok) {
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coords = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
          setRouteCoords(coords);
          setDistance((route.distance / 1000).toFixed(1));
          setDuration(Math.round(route.duration / 60));
          setIsRouteOffline(false);
          return;
        }
      }
    } catch (err) {
      console.warn("Primary OSRM router failed, trying backup...", err);
    }

    // 2. Attempt backup OSM DE router
    try {
      const res = await fetch(`https://routing.openstreetmap.de/routed-car/route/v1/driving/${sLon},${sLat};${eLon},${eLat}?overview=full&geometries=geojson`);
      if (res.ok) {
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coords = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
          setRouteCoords(coords);
          setDistance((route.distance / 1000).toFixed(1));
          setDuration(Math.round(route.duration / 60));
          setIsRouteOffline(false);
          return;
        }
      }
    } catch (err) {
      console.warn("Backup OSM DE router failed, using Haversine fallback...", err);
    }

    // 3. Fallback: Haversine distance
    const dist = calculateHaversineDistance(sLat, sLon, eLat, eLon);
    setDistance(dist.toFixed(1));
    setDuration(Math.round((dist / 45) * 60)); // assume 45 km/h average speed
    setRouteCoords([[sLat, sLon], [eLat, eLon]]);
    setIsRouteOffline(true);
  };


  const fetchPickupDetails = async () => {
    try {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; AccessToken=`);
      const token = parts.length === 2 ? parts.pop().split(';').shift() : null;

      if (!token) return;

      const res = await fetch(`https://localhost:7108/api/Pickup/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        if (data.data) {
          data.data.status = normalizeStatus(data.data.status);
        }
        setPickup(data.data);
        if (data.data.pickupLatitude && data.data.pickupLongitude && data.data.lotLatitude && data.data.lotLongitude) {
          fetchRoute(data.data.pickupLatitude, data.data.pickupLongitude, data.data.lotLatitude, data.data.lotLongitude);
        }
      } else {
        toast.error("Failed to load pickup details");
        navigate('/lot-owner/pickups');
      }
    } catch (err) {
      toast.error("Network error while loading pickup details");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAssignModal = async () => {
    setIsAssigningManager(true);
    setManagersLoading(true);
    try {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; AccessToken=`);
      const token = parts.length === 2 ? parts.pop().split(';').shift() : null;

      const checkDateStr = new Date(pickup.bookingStartDate).toISOString().split('T')[0];
      const res = await fetch(`https://localhost:7108/api/lot-manager/lot-owners/all-managers?propertyId=${pickup.propertyId}&checkDate=${checkDateStr}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        // Filter out inactive managers, but show those who are available
        const available = (data.data || []).filter(m => m.isAvailable && m.isActive);
        setAvailableManagers(available);
      } else {
        toast.error("Failed to load managers");
      }
    } catch (err) {
      toast.error("Network error while loading managers");
    } finally {
      setManagersLoading(false);
    }
  };

  const handleAssignManager = async (manager) => {
    if (!manager) {
      toast.error("Please select a manager.");
      return;
    }

    setAssignLoading(true);
    setSelectedManager(manager);
    try {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; AccessToken=`);
      const token = parts.length === 2 ? parts.pop().split(';').shift() : null;

      const res = await fetch(`https://localhost:7108/api/Pickup/lot-owner/assign-manager`, {
        method: 'POST',
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          PickupRequestId: pickup.pickupRequestId,
          ManagerId: manager.managerUserId,
          ArrivalTime: new Date().toISOString()
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Manager assigned successfully.");
        setIsAssigningManager(false);
        fetchPickupDetails();
      } else {
        toast.error(data.message || "Failed to assign manager.");
      }
    } catch (err) {
      toast.error("Network error.");
    } finally {
      setAssignLoading(false);
      setSelectedManager(null);
    }
  };

  const handleMessageClick = () => {
      // In the future we will implement predictive messages. For now just navigate
      navigate('/lot-owner/messages', { state: { preselect: { referenceId: pickup.bookingId, category: 'garage' }, predictiveMessage: true } });
  };

  const handleCallClick = () => {
      window.dispatchEvent(new CustomEvent('START_GLOBAL_CALL', { detail: { 
          bookingId: pickup.bookingId, 
          category: 'garage',
          receiverName: pickup.customerName 
      }}));
  };

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `https://localhost:7108${cleanUrl}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!pickup) return null;

  const pLat = parseFloat(pickup.pickupLatitude);
  const pLon = parseFloat(pickup.pickupLongitude);
  const lLat = parseFloat(pickup.lotLatitude);
  const lLon = parseFloat(pickup.lotLongitude);
  const hasValidCoords = !isNaN(pLat) && !isNaN(pLon) && !isNaN(lLat) && !isNaN(lLon);

  const getMapBounds = () => {
    if (routeCoords && routeCoords.length > 0) {
      return routeCoords;
    }
    if (hasValidCoords) {
      return [[pLat, pLon], [lLat, lLon]];
    }
    return null;
  };

  const mapBounds = getMapBounds();
  const mapKey = `${pLat}-${pLon}-${routeCoords.length}-${isMapExpanded}`;

  if (isAssigningManager) {
    return (
      <div className="max-w-6xl mx-auto pb-12 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsAssigningManager(false)}
              className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Assign Manager</h1>
              <p className="text-sm text-gray-500 mt-1">Select an active and available manager for this pickup day.</p>
            </div>
          </div>
        </div>

        {/* Content */}
        {managersLoading ? (
          <div className="flex justify-center items-center py-24">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : availableManagers.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm max-w-xl mx-auto">
            <Clock size={48} className="mx-auto mb-4 text-gray-300 animate-pulse" />
            <h3 className="text-lg font-bold text-gray-900">No Managers Available</h3>
            <p className="text-gray-500 text-sm mt-2">
              All managers are currently assigned to other active pickups on this day ({new Date(pickup.bookingStartDate).toLocaleDateString()}).
            </p>
            <button 
              onClick={() => setIsAssigningManager(false)}
              className="mt-6 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              Back to Details
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {availableManagers.map(manager => {
              const isThisAssignLoading = assignLoading && selectedManager?.managerUserId === manager.managerUserId;

              return (
                <div 
                  key={manager.managerUserId}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-5 flex flex-col sm:flex-row items-center justify-between gap-6 animate-fade-in"
                >
                  {/* Left: Selfie & Main Info */}
                  <div className="flex flex-col sm:flex-row gap-6 items-center text-center sm:text-left">
                    {manager.selfieUrl ? (
                      <div 
                        onClick={() => {
                          setFullScreenImage(getImageUrl(manager.selfieUrl));
                          setIsImageExpanded(true);
                        }}
                        className="relative group cursor-pointer w-24 h-24 rounded-2xl overflow-hidden border-2 border-gray-100 shadow-sm shrink-0"
                      >
                        <img 
                          src={getImageUrl(manager.selfieUrl)} 
                          alt={manager.managerName} 
                          className="w-full h-full object-cover" 
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Maximize2 size={16} className="text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-2xl shrink-0 border border-blue-100">
                        {manager.managerName[0]}
                      </div>
                    )}
                    <div className="space-y-1">
                      <h4 className="text-xl font-bold text-gray-900">{manager.managerName}</h4>
                      <p className="text-sm text-gray-500">{manager.managerEmail}</p>
                      <p className="text-sm text-gray-500 font-medium">{manager.managerPhone}</p>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-100/50 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        Available Today
                      </div>
                    </div>
                  </div>

                  {/* Right: Assign Button */}
                  <div className="shrink-0 w-full sm:w-auto">
                    <button 
                      onClick={() => handleAssignManager(manager)}
                      disabled={assignLoading}
                      className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-100 disabled:text-gray-400 text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-sm"
                    >
                      {isThisAssignLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        'Assign Pickup'
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Image Modal */}
        {isImageExpanded && fullScreenImage && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4" onClick={() => setIsImageExpanded(false)}>
              <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                  <button className="absolute -top-12 right-0 text-white hover:text-gray-300" onClick={() => setIsImageExpanded(false)}>
                      <XCircle size={32} />
                  </button>
                  <img src={fullScreenImage} alt="Expanded view" className="rounded-2xl max-h-[80vh] object-contain shadow-2xl" />
              </div>
          </div>
        )}
      </div>
    );
  }

  const isAssigned = pickup.managerName != null;
  const getAssignedStepIndex = (status) => {
    switch (status) {
      case 'Assigned': return 1;
      case 'OtpSent': return 2;
      case 'OwnerOtpSubmitted': return 2;
      case 'Verified': return 3;
      case 'VehiclePicked': return 3;
      case 'InTransit': return 4;
      case 'Stored': return 5;
      default: return 1;
    }
  };
  const assignedStatusIndex = getAssignedStepIndex(pickup.status);

  if (isAssigned) {
    return (
      <div className="max-w-6xl mx-auto pb-12 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">Pickup Tracking</h1>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${
                  pickup.status === 'Stored' ? 'bg-green-100 text-green-700' :
                  pickup.status === 'InTransit' ? 'bg-blue-100 text-blue-700' :
                  'bg-orange-100 text-orange-700'
                }`}>
                  {pickup.status === 'Assigned' ? 'Manager Assigned' : pickup.status}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">Real-time status of the vehicle transport</p>
            </div>
          </div>
        </div>

        {/* Verification Banner */}
        {pickup.verificationStatus === 'Mismatch' && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-4 mb-8">
            <XCircle className="text-red-500 w-6 h-6 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-red-800 font-bold text-[16px]">AI Verification: Name Mismatch</h4>
              <p className="text-red-600 text-[14px] mt-1">There is a mismatch between the username, vehicle RC name, and ID proof name.</p>
            </div>
          </div>
        )}
        
        {pickup.verificationStatus === 'Verified' && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-start gap-4 mb-8">
            <CheckCircle className="text-green-500 w-6 h-6 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-green-800 font-bold text-[16px]">AI Verification: Details Matched</h4>
              <p className="text-green-600 text-[14px] mt-1">The username, vehicle RC name, and ID proof name match successfully.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Vertical Timeline */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm relative overflow-hidden">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6">Live Status Timeline</h3>
            
            {/* Thin vertical line spanning all steps */}
            <div className="absolute left-[39px] top-[90px] bottom-[50px] w-0.5 bg-gray-100 z-0"></div>

            <div className="space-y-8 relative z-10">
              {/* Step 1: Manager Assigned */}
              <div className="flex gap-6">
                <div className="relative shrink-0">
                  {assignedStatusIndex > 1 ? (
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white border border-green-600 shadow-sm">
                      <Check size={14} strokeWidth={3} />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center relative shadow-sm">
                      <div className="w-3.5 h-3.5 rounded-full bg-blue-600 animate-ping absolute"></div>
                      <div className="w-3 h-3 rounded-full bg-blue-600 relative z-10"></div>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-extrabold text-gray-900">Manager Assigned</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Manager has been assigned to pick up your vehicle.</p>
                  
                  {/* Manager Profile Details */}
                  <div className="mt-4 bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col sm:flex-row gap-4 items-center sm:items-start">
                    {pickup.managerSelfieUrl ? (
                      <div 
                        onClick={() => {
                          setFullScreenImage(getImageUrl(pickup.managerSelfieUrl));
                          setIsImageExpanded(true);
                        }}
                        className="relative group cursor-pointer w-28 h-28 rounded-2xl overflow-hidden border-2 border-gray-200 shadow-sm shrink-0 bg-white"
                      >
                        <img src={getImageUrl(pickup.managerSelfieUrl)} alt="Manager Selfie" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Maximize2 size={20} className="text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-28 h-28 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-3xl shrink-0 border border-blue-100 shadow-sm">
                        {pickup.managerName[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0 text-center sm:text-left">
                      <p className="font-bold text-gray-900 text-lg">{pickup.managerName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{pickup.managerEmail}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{pickup.managerPhone}</p>
                      {pickup.managerArrivalTime && (
                        <div className="mt-2 text-xs text-blue-600 font-semibold flex items-center justify-center sm:justify-start gap-1">
                          <Clock size={14} />
                          <span>Est. Arrival: {new Date(pickup.managerArrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      )}
                    </div>

                    {/* Call & Message for Manager */}
                    <div className="flex gap-2 self-center sm:self-start">
                      <button 
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('START_GLOBAL_CALL', { detail: { 
                            bookingId: pickup.bookingId, 
                            category: 'garage',
                            receiverName: pickup.managerName 
                          }}));
                        }} 
                        className="w-10 h-10 flex items-center justify-center bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors shadow-sm"
                        title="Call Manager"
                      >
                        <Phone size={18} />
                      </button>
                      <button 
                        onClick={() => {
                          navigate('/lot-owner/messages', { state: { preselect: { referenceId: pickup.bookingId, category: 'garage' }, predictiveMessage: true } });
                        }} 
                        className="w-10 h-10 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors shadow-sm"
                        title="Message Manager"
                      >
                        <MessageCircle size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Departure Verification */}
              <div className="flex gap-6">
                <div className="relative shrink-0">
                  {assignedStatusIndex > 2 ? (
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white border border-green-600 shadow-sm">
                      <Check size={14} strokeWidth={3} />
                    </div>
                  ) : pickup.status === 'OtpSent' ? (
                    <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center relative shadow-sm">
                      <div className="w-3.5 h-3.5 rounded-full bg-blue-600 animate-ping absolute"></div>
                      <div className="w-3 h-3 rounded-full bg-blue-600 relative z-10"></div>
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`text-base font-extrabold ${assignedStatusIndex >= 2 ? 'text-gray-900' : 'text-gray-400'}`}>Departure Verification</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Vehicle condition report recorded at pickup location.</p>
                  
                  {pickup.status === 'OtpSent' && (
                    <div className="mt-3 bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-center gap-3 w-fit">
                      <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">OTP Sent to Vehicle Owner</span>
                    </div>
                  )}

                  {pickup.pickupImages && (
                    <div className="mt-4 bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                      {pickup.pickupImages.managerRemarks && (
                        <p className="text-sm text-gray-600 italic bg-white p-3 rounded-lg border-l-4 border-blue-500">
                          "{pickup.pickupImages.managerRemarks}"
                        </p>
                      )}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {[
                          { label: 'Front', img: pickup.pickupImages.frontImageUrl },
                          { label: 'Rear', img: pickup.pickupImages.rearImageUrl },
                          { label: 'Left Side', img: pickup.pickupImages.leftSideImageUrl },
                          { label: 'Right Side', img: pickup.pickupImages.rightSideImageUrl },
                          { label: 'Interior', img: pickup.pickupImages.interiorImageUrl },
                          { label: 'Odometer', img: pickup.pickupImages.odometerImageUrl },
                          { label: 'Live Selfie', img: pickup.pickupImages.selfieUrl }
                        ].map((item, idx) => item.img && (
                          <div key={idx} className="space-y-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.label}</p>
                            <div className="relative group cursor-pointer aspect-video bg-white rounded-lg overflow-hidden border border-gray-200" onClick={() => { setFullScreenImage(getImageUrl(item.img)); setIsImageExpanded(true); }}>
                              <img src={getImageUrl(item.img)} alt={item.label} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Maximize2 size={14} className="text-white" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 3: Manager OTP Submission */}
              <div className="flex gap-6">
                <div className="relative shrink-0">
                  {assignedStatusIndex > 3 ? (
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white border border-green-600 shadow-sm">
                      <Check size={14} strokeWidth={3} />
                    </div>
                  ) : assignedStatusIndex === 3 ? (
                    <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center relative shadow-sm">
                      <div className="w-3.5 h-3.5 rounded-full bg-blue-600 animate-ping absolute"></div>
                      <div className="w-3 h-3 rounded-full bg-blue-600 relative z-10"></div>
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`text-base font-extrabold ${assignedStatusIndex >= 3 ? 'text-gray-900' : 'text-gray-400'}`}>Manager OTP Submission</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Manager submits OTP to securely start the ride.</p>
                  {assignedStatusIndex >= 3 && (
                    <div className="mt-3 bg-green-50/50 p-4 rounded-xl border border-green-100 flex items-center gap-3 w-fit">
                      <CheckCircle2 size={18} className="text-green-600" />
                      <span className="text-xs font-bold text-green-700 uppercase tracking-wider">Manager successfully submitted OTP</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 4: In Transit */}
              <div className="flex gap-6">
                <div className="relative shrink-0">
                  {assignedStatusIndex > 4 ? (
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white border border-green-600 shadow-sm">
                      <Check size={14} strokeWidth={3} />
                    </div>
                  ) : pickup.status === 'InTransit' ? (
                    <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center relative shadow-sm">
                      <div className="w-3.5 h-3.5 rounded-full bg-blue-600 animate-ping absolute"></div>
                      <div className="w-3 h-3 rounded-full bg-blue-600 relative z-10"></div>
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`text-base font-extrabold ${pickup.status === 'InTransit' || assignedStatusIndex > 4 ? 'text-gray-900' : 'text-gray-400'}`}>In Transit</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Vehicle is being carefully driven to the garage.</p>
                  {pickup.status === 'InTransit' && (
                    <div className="mt-3 bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-center gap-3 w-fit">
                      <div className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></div>
                      <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Live location tracking active</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 5: Stored Securely */}
              <div className="flex gap-6">
                <div className="relative shrink-0">
                  {pickup.status === 'Stored' ? (
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white border border-green-600 shadow-sm">
                      <Check size={14} strokeWidth={3} />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`text-base font-extrabold ${pickup.status === 'Stored' ? 'text-gray-900' : 'text-gray-400'}`}>Stored Securely</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Vehicle has arrived at the garage and is parked securely.</p>
                  
                  {pickup.arrivalImages && (
                    <div className="mt-4 bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                      {pickup.arrivalImages.managerRemarks && (
                        <p className="text-sm text-gray-600 italic bg-white p-3 rounded-lg border-l-4 border-green-500">
                          "{pickup.arrivalImages.managerRemarks}"
                        </p>
                      )}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {[
                          { label: 'Front', img: pickup.arrivalImages.frontImageUrl },
                          { label: 'Rear', img: pickup.arrivalImages.rearImageUrl },
                          { label: 'Left Side', img: pickup.arrivalImages.leftSideImageUrl },
                          { label: 'Right Side', img: pickup.arrivalImages.rightSideImageUrl },
                          { label: 'Interior', img: pickup.arrivalImages.interiorImageUrl },
                          { label: 'Odometer', img: pickup.arrivalImages.odometerImageUrl }
                        ].map((item, idx) => item.img && (
                          <div key={idx} className="space-y-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.label}</p>
                            <div className="relative group cursor-pointer aspect-video bg-white rounded-lg overflow-hidden border border-gray-200" onClick={() => { setFullScreenImage(getImageUrl(item.img)); setIsImageExpanded(true); }}>
                              <img src={getImageUrl(item.img)} alt={item.label} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Maximize2 size={14} className="text-white" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Mini Map & Mini Car details */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Small Car details card linked to request page */}
            <div 
              onClick={() => navigate(`/lot-owner/bookings/${pickup.bookingId}`)}
              className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-400 transition-all cursor-pointer group flex items-center gap-4 animate-fade-in"
            >
              {pickup.vehicleImage ? (
                <img src={getImageUrl(pickup.vehicleImage)} alt="Vehicle" className="w-16 h-16 rounded-xl object-cover border border-gray-100 shrink-0 shadow-sm" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-200 shrink-0 shadow-sm">
                  <Car size={24} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors text-base">
                  {pickup.vehicleBrand} {pickup.vehicleModel}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    Owner: {pickup.customerName}
                  </span>
                  <span className="text-[10px] font-bold text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded tracking-wide">
                    {pickup.registrationNo || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>

            {/* Route Details Card */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Route Details</h3>
              <div className="space-y-4 relative">
                {/* Vertical line connecting markers */}
                <div className="absolute left-[9px] top-[14px] bottom-[14px] w-0.5 bg-gray-100"></div>

                <div className="flex gap-3 items-start text-xs relative">
                  <div className="w-5 h-5 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">Departure (Pickup)</p>
                    <p className="text-gray-900 font-semibold mt-0.5 leading-relaxed">{pickup.pickupAddress || 'Address not provided'}</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start text-xs relative">
                  <div className="w-5 h-5 rounded-full bg-green-50 border border-green-200 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin size={10} className="text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">Destination (Garage)</p>
                    <p className="text-gray-900 font-semibold mt-0.5 leading-relaxed">{pickup.lotAddress || 'Garage Address'}</p>
                  </div>
                </div>
              </div>

              {distance && duration && (
                <div className="flex justify-between items-center pt-3 border-t border-gray-100 text-xs text-blue-700 font-extrabold bg-blue-50/50 px-3 py-2.5 rounded-xl">
                  <span>{distance} km</span>
                  <span>{duration} mins</span>
                </div>
              )}
            </div>

            {/* Mini Map */}
            {hasValidCoords ? (
              (isActiveTracking || String(pickup.status).toUpperCase() === 'STORED' || String(pickup.status) === '10') ? (
                <div className="bg-white rounded-[2rem] p-4 border border-gray-100 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Live Route Map</h3>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setIsMapExpanded(true)}
                        className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-500 hover:text-gray-700"
                        title="Expand Map"
                      >
                        <Maximize2 size={14} />
                      </button>
                      {distance && duration && (
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100/40 shadow-sm leading-tight">
                          {distance} km • {duration} mins
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Distance statistics with offline warning */}
                  {isRouteOffline && (
                    <div className="bg-orange-50/50 p-2.5 rounded-xl border border-orange-100/30 text-[10px] text-orange-600 font-bold text-center">
                      ⚠️ Offline Estimations
                    </div>
                  )}

                  {/* Map view */}
                  <div 
                    onClick={() => setIsMapExpanded(true)}
                    className="h-[250px] w-full rounded-xl overflow-hidden border border-gray-200 z-0 cursor-pointer relative group"
                  >
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 z-[1000] transition-colors flex items-center justify-center">
                        <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full font-bold text-sm text-gray-800 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity translate-y-4 group-hover:translate-y-0 flex items-center gap-2">
                            <Maximize2 size={16} /> Click to Expand Map
                        </div>
                    </div>
                    <MapContainer 
                      key={`mini-${mapKey}`}
                      center={displayCarPos || carPos || [pLat, pLon]} 
                      zoom={12} 
                      style={{ height: '100%', width: '100%' }}
                      scrollWheelZoom={false}
                      zoomControl={false}
                      dragging={false}
                    >
                      <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png"
                        attribution='&copy; OpenStreetMap contributors &copy; CARTO'
                      />
                      
                      <MapBoundsFit bounds={mapBounds} />

                      {!isTransit && (
                        <Marker position={[pLat, pLon]}>
                          <Popup>
                            <div className="font-bold text-xs">Pickup Location</div>
                            <p className="text-xs text-gray-500 mt-1">{pickup.pickupAddress}</p>
                          </Popup>
                        </Marker>
                      )}

                      <Marker position={[lLat, lLon]}>
                        <Popup>
                          <div className="font-bold text-xs">Your Garage</div>
                          <p className="text-xs text-gray-500 mt-1">{pickup.lotAddress}</p>
                        </Popup>
                      </Marker>

                      {/* Simulated/Live Car Marker — always visible when tracking is active */}
                      {isActiveTracking && (
                        <Marker position={liveGpsPos || (pickup.lastGpsLatitude && pickup.lastGpsLongitude ? [pickup.lastGpsLatitude, pickup.lastGpsLongitude] : [pLat, pLon])} icon={carIcon}>
                          <Popup>
                            <div className="font-bold text-xs">{isTransit ? 'Vehicle In Transit' : 'Manager En-Route'}</div>
                            <p className="text-[10px] text-gray-500 mt-0.5">{liveGpsPos ? 'Live location' : (isTransit ? 'Moving towards garage...' : 'Manager approaching vehicle...')}</p>
                          </Popup>
                        </Marker>
                      )}

                      <Polyline 
                        positions={routeCoords.length > 0 ? routeCoords : [[pLat, pLon], [lLat, lLon]]} 
                        color="#2563eb" 
                        weight={4.5} 
                      />

                      {/* Road labels above polyline */}
                      <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png"
                        pane="shadowPane"
                      />
                    </MapContainer>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-gray-400 py-12 text-center">
                  <MapPin size={32} className="opacity-20 mb-3 text-blue-600 animate-pulse" />
                  <h4 className="text-sm font-bold text-gray-700">Live Tracking Pending</h4>
                  <p className="text-xs text-gray-500 max-w-[200px] mt-1.5 leading-relaxed">
                    Live route and car tracking will activate once the manager uploads the pre-condition report and starts the ride.
                  </p>
                </div>
              )
            ) : (
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-gray-400 py-12">
                <MapPin size={32} className="opacity-20 mb-2" />
                <p className="text-xs">Location tracking unavailable</p>
              </div>
            )}
          </div>
        </div>

        {/* Image Modal for Layout B */}
        {isImageExpanded && fullScreenImage && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4" onClick={() => setIsImageExpanded(false)}>
              <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                  <button className="absolute -top-12 right-0 text-white hover:text-gray-300" onClick={() => setIsImageExpanded(false)}>
                      <XCircle size={32} />
                  </button>
                  <img src={fullScreenImage} alt="Expanded view" className="rounded-2xl max-h-[80vh] object-contain shadow-2xl" />
              </div>
          </div>
        )}

        {/* Expanded Map Modal for Layout B */}
        {isMapExpanded && !isNaN(pLat) && !isNaN(pLon) && (
          <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm p-4 md:p-8 flex items-center justify-center animate-fade-in" onClick={() => setIsMapExpanded(false)}>
            <div className="bg-white rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
              
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Live Route Map</h3>
                  <p className="text-sm text-gray-500 mt-1">{pickup.pickupAddress}</p>
                </div>
                <button 
                  onClick={() => setIsMapExpanded(false)}
                  className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 hover:bg-gray-50 rounded-xl text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              {/* Modal Map Body */}
              <div className="flex-1 w-full relative z-0">
                <MapContainer 
                    key={`modal-layoutb-${mapKey}`}
                    center={displayCarPos || carPos || [pLat, pLon]} 
                    zoom={13} 
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={true}
                >
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png"
                        attribution='&copy; OpenStreetMap contributors &copy; CARTO'
                    />
                    
                    <MapBoundsFit bounds={mapBounds} />

                    {!isTransit && (
                      <Marker position={[pLat, pLon]}>
                          <Popup>
                              <div className="font-bold text-xs">Pickup Location</div>
                              <p className="text-xs text-gray-500 mt-1">{pickup.pickupAddress}</p>
                          </Popup>
                      </Marker>
                    )}

                    {!isNaN(lLat) && !isNaN(lLon) && (
                      <Marker position={[lLat, lLon]}>
                          <Popup>
                              <div className="font-bold text-xs">Your Garage</div>
                              <p className="text-xs text-gray-500 mt-1">{pickup.lotAddress}</p>
                          </Popup>
                      </Marker>
                    )}

                    {/* Live Moving Marker */}
                    {isActiveTracking && (
                      <Marker position={liveGpsPos || (pickup.lastGpsLatitude && pickup.lastGpsLongitude ? [pickup.lastGpsLatitude, pickup.lastGpsLongitude] : [pLat, pLon])} icon={carIcon}>
                        <Popup>
                          <div className="font-bold text-xs">{isTransit ? 'Vehicle in Transit' : 'Manager En-Route'}</div>
                          <p className="text-[10px] text-gray-500 mt-0.5">{liveGpsPos ? 'Live location' : (isTransit ? 'Moving towards garage...' : 'Manager approaching vehicle...')}</p>
                        </Popup>
                      </Marker>
                    )}

                    <Polyline 
                        positions={routeCoords.length > 0 ? routeCoords : (!isNaN(lLat) && !isNaN(lLon) ? [[pLat, pLon], [lLat, lLon]] : [])} 
                        color="#2563eb" 
                        weight={5} 
                    />

                    {/* Road labels above polyline */}
                    <TileLayer
                      url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png"
                      pane="shadowPane"
                    />
                </MapContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Pickup Details</h1>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${
                pickup.status === 'Stored' ? 'bg-green-100 text-green-700' :
                pickup.status === 'Requested' ? 'bg-orange-100 text-orange-700' :
                pickup.status === 'Declined' ? 'bg-red-100 text-red-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {pickup.status}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Manage this pickup request</p>
          </div>
        </div>
        <div className="flex gap-2">
          {(!pickup.managerName && pickup.status === 'Requested') && (
            <button 
              onClick={() => handleOpenAssignModal()}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              Assign Manager
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Details */}
        <div className="lg:col-span-1 space-y-6">

          {/* Contact User - Re-styled and moved to top */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
             <div className="flex justify-between items-center mb-2">
                 <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Contact Customer</h3>
             </div>
             <div className="flex items-center justify-between mt-4 bg-gray-50 p-4 rounded-xl">
                 <div>
                    <p className="font-bold text-gray-900 text-lg">{pickup.customerName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Customer</p>
                 </div>
                 <div className="flex gap-2">
                     <button onClick={handleCallClick} className="w-10 h-10 flex items-center justify-center bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors">
                         <Phone size={18} />
                     </button>
                     <button onClick={handleMessageClick} className="w-10 h-10 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors">
                         <MessageCircle size={18} />
                     </button>
                 </div>
             </div>
          </div>

          {/* Assigned Manager Card */}
          {pickup.managerName && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Assigned Manager</h3>
              <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl">
                {pickup.managerSelfieUrl ? (
                  <div 
                    onClick={() => {
                      setFullScreenImage(getImageUrl(pickup.managerSelfieUrl));
                      setIsImageExpanded(true);
                    }}
                    className="relative group cursor-pointer w-12 h-12 rounded-full overflow-hidden border border-gray-200 shrink-0"
                  >
                    <img src={getImageUrl(pickup.managerSelfieUrl)} alt="Manager" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Maximize2 size={12} className="text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
                    {pickup.managerName[0]}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-gray-900 truncate">{pickup.managerName}</p>
                  <p className="text-xs text-gray-500 truncate">{pickup.managerEmail}</p>
                  <p className="text-xs text-gray-500">{pickup.managerPhone}</p>
                </div>
              </div>
              {pickup.managerIdProofUrl && (
                <div className="mt-4">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">ID Proof</p>
                  <div className="relative group cursor-pointer w-full aspect-video bg-gray-50 rounded-xl overflow-hidden border border-gray-100" onClick={() => { setFullScreenImage(getImageUrl(pickup.managerIdProofUrl)); setIsImageExpanded(true); }}>
                    <img src={getImageUrl(pickup.managerIdProofUrl)} alt="ID Proof" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Maximize2 size={20} className="text-white" />
                    </div>
                  </div>
                </div>
              )}
              {pickup.managerArrivalTime && (
                <div className="mt-3 text-xs text-gray-500 flex items-center gap-1.5">
                  <Clock size={14} />
                  <span>Est. Arrival: {new Date(pickup.managerArrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}
            </div>
          )}

          {/* Vehicle Info */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Vehicle Information</h3>
            <div className="flex flex-col gap-4 mb-4">
                {pickup.vehicleImage ? (
                    <div className="relative group cursor-pointer w-full aspect-video bg-gray-50 rounded-2xl p-2 border border-gray-100 overflow-hidden" onClick={() => { setFullScreenImage(getImageUrl(pickup.vehicleImage)); setIsImageExpanded(true); }}>
                        <img src={getImageUrl(pickup.vehicleImage)} alt="Vehicle" className="w-full h-full rounded-xl object-cover border border-gray-200" />
                        <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Maximize2 size={24} className="text-white" />
                        </div>
                    </div>
                ) : (
                    <div className="w-full aspect-video bg-gray-50 rounded-2xl p-2 border border-gray-100 overflow-hidden flex flex-col items-center justify-center text-gray-400">
                        <Car size={32} className="opacity-50 mb-2" />
                        <span className="text-sm font-medium">No Image</span>
                    </div>
                )}
                <div className="text-center mt-2">
                    <h4 className="font-bold text-xl text-gray-900">{pickup.vehicleBrand} {pickup.vehicleModel}</h4>
                    <div className="inline-block mt-2 px-3 py-1 bg-gray-100 rounded text-sm font-medium text-gray-600 font-mono">
                      {pickup.registrationNo}
                    </div>
                </div>
            </div>
          </div>

          {/* Documents Info */}
          {(pickup.vehicleRcUrl || pickup.ownerIdProofUrl) && (
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Documents</h3>
            <div className="grid grid-cols-1 gap-6">
                {pickup.vehicleRcUrl && (
                    <div className="space-y-2">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Vehicle RC</p>
                        <div className="relative group cursor-pointer w-full aspect-video bg-gray-50 rounded-2xl p-2 border border-gray-100 overflow-hidden" onClick={() => { setFullScreenImage(getImageUrl(pickup.vehicleRcUrl)); setIsImageExpanded(true); }}>
                            <img src={getImageUrl(pickup.vehicleRcUrl)} alt="Vehicle RC" className="w-full h-full rounded-xl object-cover border border-gray-200" />
                            <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Maximize2 size={24} className="text-white" />
                            </div>
                        </div>
                    </div>
                )}
                {pickup.ownerIdProofUrl && (
                    <div className="space-y-2">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Owner ID Proof</p>
                        <div className="relative group cursor-pointer w-full aspect-video bg-gray-50 rounded-2xl p-2 border border-gray-100 overflow-hidden" onClick={() => { setFullScreenImage(getImageUrl(pickup.ownerIdProofUrl)); setIsImageExpanded(true); }}>
                            <img src={getImageUrl(pickup.ownerIdProofUrl)} alt="ID Proof" className="w-full h-full rounded-xl object-cover border border-gray-200" />
                            <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Maximize2 size={24} className="text-white" />
                            </div>
                        </div>
                    </div>
                )}
            </div>
          </div>
          )}
        </div>

        {/* Right Column: Map and Location */}
        <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Pickup Location</h3>
                    <div className="flex flex-wrap gap-2">
                        {hasValidCoords && (
                            <button 
                                onClick={() => setIsMapExpanded(true)}
                                className="flex items-center gap-2 text-sm font-bold text-gray-600 bg-gray-50 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
                                <Maximize2 size={16} />
                                Expand Map
                            </button>
                        )}
                    </div>
                </div>
                
                <div className="flex items-start gap-3 mb-4 p-4 bg-gray-50 rounded-xl">
                    <MapPin size={20} className="text-gray-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium text-gray-900">{pickup.pickupAddress}</p>
                        <p className="text-sm text-gray-500 mt-1">Requested Time: {new Date(pickup.bookingStartDate).toLocaleDateString()} {new Date(pickup.requestedPickupTime).toLocaleTimeString()}</p>
                    </div>
                </div>

                {/* Distance & Duration statistics */}
                {distance && duration && (
                    <div className="flex flex-col gap-2 mb-6 bg-blue-50/50 p-4 rounded-xl border border-blue-100/30 animate-fade-in">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                    {isRouteOffline ? 'Est. Straight Distance' : 'Driving Distance'}
                                </p>
                                <p className="text-lg font-black text-blue-600 mt-0.5">{distance} km</p>
                            </div>
                            <div className="text-center border-l border-blue-100/50">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                    {isRouteOffline ? 'Est. Air Travel Time' : 'Est. Driving Time'}
                                </p>
                                <p className="text-lg font-black text-blue-600 mt-0.5">{duration} mins</p>
                            </div>
                        </div>
                        {isRouteOffline && (
                            <p className="text-[10px] text-center text-orange-600 font-semibold mt-1">
                                ⚠️ Routing server offline. Showing straight-line estimations.
                            </p>
                        )}
                    </div>
                )}

                {/* Map */}
                {hasValidCoords ? (
                    <div 
                        onClick={() => setIsMapExpanded(true)}
                        className="h-[400px] w-full rounded-xl overflow-hidden border border-gray-200 z-0 cursor-pointer relative group"
                    >
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 z-[1000] transition-colors flex items-center justify-center">
                            <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full font-bold text-sm text-gray-800 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity translate-y-4 group-hover:translate-y-0 flex items-center gap-2">
                                <Maximize2 size={16} /> Click to Expand Map
                            </div>
                        </div>
                        <MapContainer 
                            key={mapKey}
                            center={[pLat, pLon]} 
                            zoom={13} 
                            style={{ height: '100%', width: '100%' }}
                            scrollWheelZoom={false}
                            zoomControl={false}
                            dragging={false}
                        >
                            <TileLayer
                                url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png"
                                attribution='&copy; OpenStreetMap contributors &copy; CARTO'
                            />
                            
                            <MapBoundsFit bounds={mapBounds} />

                            {!isTransit && (
                              <Marker position={[pLat, pLon]}>
                                  <Popup>
                                      <div className="font-bold">Pickup Location</div>
                                      {pickup.pickupAddress}
                                  </Popup>
                              </Marker>
                            )}

                            <Marker position={[lLat, lLon]}>
                                <Popup>
                                    <div className="font-bold">Your Garage</div>
                                    {pickup.lotAddress}
                                </Popup>
                            </Marker>

                            {isTransit && (displayCarPos || carPos) && (
                                <Marker position={displayCarPos || carPos} icon={carIcon}>
                                    <Popup><div className="font-bold text-xs">Vehicle in Transit</div></Popup>
                                </Marker>
                            )}

                            <Polyline 
                                positions={routeCoords.length > 0 ? routeCoords : [[pLat, pLon], [lLat, lLon]]} 
                                color="#2563eb" 
                                weight={5} 
                            />

                            {/* Road labels above polyline */}
                            <TileLayer
                              url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png"
                              pane="shadowPane"
                            />
                        </MapContainer>
                    </div>
                ) : (
                    <div className="h-[400px] w-full rounded-xl bg-gray-50 border border-gray-200 flex flex-col items-center justify-center text-gray-400">
                        <MapPin size={48} className="mb-4 opacity-20" />
                        <p>Location coordinates not available</p>
                    </div>
                )}
            </div>

            {/* Condition Reports */}
            {(pickup.pickupImages || pickup.arrivalImages) && (
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Vehicle Condition Verification</h3>
                
                {/* Departure Verification */}
                {pickup.pickupImages && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-gray-800">Departure Verification (At Pickup)</h4>
                      <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100">Live Uploaded</span>
                    </div>
                    {pickup.pickupImages.managerRemarks && (
                      <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-xl border-l-4 border-blue-500 italic">
                        "{pickup.pickupImages.managerRemarks}"
                      </p>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        { label: 'Front', img: pickup.pickupImages.frontImageUrl },
                        { label: 'Rear', img: pickup.pickupImages.rearImageUrl },
                        { label: 'Left Side', img: pickup.pickupImages.leftSideImageUrl },
                        { label: 'Right Side', img: pickup.pickupImages.rightSideImageUrl },
                        { label: 'Interior', img: pickup.pickupImages.interiorImageUrl },
                        { label: 'Odometer', img: pickup.pickupImages.odometerImageUrl },
                        { label: 'Live Selfie', img: pickup.pickupImages.selfieUrl }
                      ].map((item, idx) => item.img && (
                        <div key={idx} className="space-y-1">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.label}</p>
                          <div className="relative group cursor-pointer aspect-video bg-gray-50 rounded-lg overflow-hidden border border-gray-200" onClick={() => { setFullScreenImage(getImageUrl(item.img)); setIsImageExpanded(true); }}>
                            <img src={getImageUrl(item.img)} alt={item.label} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Maximize2 size={16} className="text-white" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Arrival Verification */}
                {pickup.arrivalImages && (
                  <div className="space-y-4 pt-6 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-gray-800">Arrival Verification (At Lot)</h4>
                      <span className="px-2.5 py-0.5 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-100">Live Stored</span>
                    </div>
                    {pickup.arrivalImages.managerRemarks && (
                      <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-xl border-l-4 border-green-500 italic">
                        "{pickup.arrivalImages.managerRemarks}"
                      </p>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        { label: 'Front', img: pickup.arrivalImages.frontImageUrl },
                        { label: 'Rear', img: pickup.arrivalImages.rearImageUrl },
                        { label: 'Left Side', img: pickup.arrivalImages.leftSideImageUrl },
                        { label: 'Right Side', img: pickup.arrivalImages.rightSideImageUrl },
                        { label: 'Interior', img: pickup.arrivalImages.interiorImageUrl },
                        { label: 'Odometer', img: pickup.arrivalImages.odometerImageUrl }
                      ].map((item, idx) => item.img && (
                        <div key={idx} className="space-y-1">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.label}</p>
                          <div className="relative group cursor-pointer aspect-video bg-gray-50 rounded-lg overflow-hidden border border-gray-200" onClick={() => { setFullScreenImage(getImageUrl(item.img)); setIsImageExpanded(true); }}>
                            <img src={getImageUrl(item.img)} alt={item.label} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Maximize2 size={16} className="text-white" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
        </div>
      </div>

      {/* Image Modal */}
      {isImageExpanded && fullScreenImage && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4" onClick={() => setIsImageExpanded(false)}>
            <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                <button className="absolute -top-12 right-0 text-white hover:text-gray-300" onClick={() => setIsImageExpanded(false)}>
                    <XCircle size={32} />
                </button>
                <img src={fullScreenImage} alt="Expanded view" className="rounded-2xl max-h-[80vh] object-contain shadow-2xl" />
            </div>
        </div>
      )}

      {/* Expanded Map Modal */}
      {isMapExpanded && !isNaN(pLat) && !isNaN(pLon) && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm p-4 md:p-8 flex items-center justify-center animate-fade-in" onClick={() => setIsMapExpanded(false)}>
          <div className="bg-white rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Route Map</h3>
                <p className="text-sm text-gray-500 mt-1">{pickup.pickupAddress}</p>
              </div>
              <button 
                onClick={() => setIsMapExpanded(false)}
                className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 hover:bg-gray-50 rounded-xl text-gray-600 hover:text-gray-900 transition-colors"
              >
                <XCircle size={24} />
              </button>
            </div>

            {/* Modal Map Body */}
            <div className="flex-1 w-full relative z-0">
              <MapContainer 
                  key={`modal-${mapKey}`}
                  center={[pLat, pLon]} 
                  zoom={13} 
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom={true}
              >
                  <TileLayer
                      url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png"
                      attribution='&copy; OpenStreetMap contributors &copy; CARTO'
                  />
                  
                  <MapBoundsFit bounds={mapBounds} />

                  {!isTransit && (
                    <Marker position={[pLat, pLon]}>
                        <Popup>
                            <div className="font-bold">Pickup Location</div>
                            {pickup.pickupAddress}
                        </Popup>
                    </Marker>
                  )}

                  {!isNaN(lLat) && !isNaN(lLon) && (
                    <Marker position={[lLat, lLon]}>
                        <Popup>
                            <div className="font-bold">Your Garage</div>
                            {pickup.lotAddress}
                        </Popup>
                    </Marker>
                  )}

                  {/* Live Moving Marker */}
                  {isActiveTracking && (displayCarPos || carPos) && (
                      <Marker position={displayCarPos || carPos} icon={carIcon}>
                          <Popup>
                            <div className="font-bold text-xs">{isTransit ? 'Vehicle in Transit' : 'Manager En-Route'}</div>
                            <p className="text-[10px] text-gray-500 mt-0.5">{isTransit ? 'Moving towards garage...' : 'Manager approaching vehicle...'}</p>
                          </Popup>
                      </Marker>
                  )}

                  <Polyline 
                      positions={routeCoords.length > 0 ? routeCoords : (!isNaN(lLat) && !isNaN(lLon) ? [[lLat, lLon], [pLat, pLon]] : [])} 
                      color="#2563eb" 
                      weight={5} 
                  />

                  {/* Road labels above polyline */}
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png"
                    pane="shadowPane"
                  />
              </MapContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
