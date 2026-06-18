import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useCall } from '../../context/CallContext';
import { getToken } from '../../api/auth';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { 
  ArrowLeft, Phone, MessageCircle, Calendar, Clock, User, 
  MapPin, Shield, CheckCircle2, Navigation, AlertTriangle, 
  Play, Eye, Image as ImageIcon, Check, Upload, Loader2, XCircle, Crosshair, X, Maximize2,
  Car, Camera
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useNavigation } from '../../context/NavigationContext';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const vehicleLocationIcon = L.divIcon({
  html: `
    <div style="position: relative; display: flex; align-items: center; justify-content: center;">
      <div style="width: 40px; height: 40px; background-color: #ef4444; border-radius: 9999px; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border: 2px solid #ffffff; transform: translateY(-4px);">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 20px; height: 20px; color: #ffffff;">
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
          <circle cx="7" cy="17" r="2"/>
          <path d="M9 17h6"/>
          <circle cx="17" cy="17" r="2"/>
        </svg>
      </div>
      <div style="position: absolute; bottom: -8px; left: 15px; width: 10px; height: 10px; background-color: #ef4444; transform: rotate(45deg); border-right: 2px solid #ffffff; border-bottom: 2px solid #ffffff;"></div>
    </div>
  `,
  className: 'custom-vehicle-icon',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const managerIcon = L.divIcon({
  html: `
    <div style="width: 24px; height: 24px; background-color: #6b7280; border-radius: 9999px; border: 4px solid #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center;">
      <div style="width: 8px; height: 8px; background-color: #ffffff; border-radius: 9999px;"></div>
    </div>
  `,
  className: 'custom-manager-icon',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const destinationIcon = L.divIcon({
  html: `
    <div style="display: flex; justify-content: center; align-items: center;">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: 32px; height: 32px; color: #2563eb;">
        <path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.157-1.051c1.647-1.655 4.98-5.3 4.98-9.799C18.52 4.951 14.77 2 12 2s-6.52 2.951-6.52 7.498c0 4.498 3.333 8.144 4.98 9.799A16.977 16.977 0 0011.54 22.351zM12 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" clip-rule="evenodd" />
      </svg>
    </div>
  `,
  className: 'custom-destination-icon',
  iconSize: [32, 32],
  iconAnchor: [16, 32]
});

// A component to automatically fit the map bounds to the polyline or follow the position
function MapBoundsFit({ bounds, center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom(), { animate: true });
    } else if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, center, zoom, map]);
  return null;
}

export default function ManagerPickupDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startCall } = useCall();

  const [pickup, setPickup] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Local route preview states (when not navigating)
  const [previewRouteCoords, setPreviewRouteCoords] = useState([]);
  const [previewDistance, setPreviewDistance] = useState(null);
  const [previewDuration, setPreviewDuration] = useState(null);

  // Global navigation context
  const { 
    navigationMode, 
    setNavigationMode, 
    pickup: navPickup, 
    routeCoords: navRouteCoords, 
    distance: navDistance, 
    duration: navDuration, 
    currentGpsPos, 
    startNavigation, 
    stopNavigation,
    startBackgroundTracking
  } = useNavigation();

  // Image lightbox modal
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const [expandedImage, setExpandedImage] = useState(null);
  const [expandedTitle, setExpandedTitle] = useState('');

  // Start Ride dialog state
  const [rideSubmitting, setRideSubmitting] = useState(false);

  const [managerPos, setManagerPos] = useState(null);

  useEffect(() => {
    fetchPickupDetails();
    let watchId;
    if ("geolocation" in navigator) {
      // Get immediate fix
      navigator.geolocation.getCurrentPosition(
        (pos) => setManagerPos([pos.coords.latitude, pos.coords.longitude]),
        (err) => console.warn("Manager location quick fetch error", err),
        { enableHighAccuracy: false, maximumAge: Infinity, timeout: 5000 }
      );

      // Start continuous watching
      watchId = navigator.geolocation.watchPosition(
        (pos) => setManagerPos([pos.coords.latitude, pos.coords.longitude]),
        (err) => console.warn("Manager location watch error", err),
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 30000 }
      );
    }
    return () => {
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
    };
  }, [id]);

  const managerPosRef = useRef(null);
  useEffect(() => {
      managerPosRef.current = managerPos;
  }, [managerPos]);

  const lastFetchedPosRef = useRef(null);

  useEffect(() => {
    if (pickup) {
      const isTransit = ['InTransit', 'INTRANSIT', 9, '9'].includes(pickup.status);
      if (managerPos) {
        // Only fetch route if manager moved more than ~50 meters to avoid API rate limits
        const lastPos = lastFetchedPosRef.current;
        const distMoved = lastPos ? calculateHaversineDistance(lastPos[0], lastPos[1], managerPos[0], managerPos[1]) : 1;
        
        if (distMoved > 0.05) { // 50 meters
          lastFetchedPosRef.current = managerPos;
          if (isTransit && pickup.lotLatitude && pickup.lotLongitude) {
            fetchRoute(managerPos[0], managerPos[1], pickup.lotLatitude, pickup.lotLongitude);
          } else if (!isTransit && pickup.pickupLatitude && pickup.pickupLongitude) {
            fetchRoute(managerPos[0], managerPos[1], pickup.pickupLatitude, pickup.pickupLongitude);
          }
        }
      } else if (pickup.pickupLatitude && pickup.pickupLongitude && pickup.lotLatitude && pickup.lotLongitude) {
        fetchRoute(pickup.pickupLatitude, pickup.pickupLongitude, pickup.lotLatitude, pickup.lotLongitude);
      }
    }
  }, [pickup, managerPos]);

  const trackingConnectionRef = useRef(null);
  const isTrackingConnectedRef = useRef(false);

  useEffect(() => {
    if (!pickup) return;
    const isCompleted = ['Stored', 'Completed', 'Cancelled', 'Declined', '10', '11', '12', '4'].includes(String(pickup.status));
    if (isCompleted) return;

    const token = getToken('AccessToken');
    if (!token) return;

    console.log('[Manager] Connecting to TrackingHub for bookingId:', pickup.bookingId);

    const connection = new HubConnectionBuilder()
      .withUrl("https://localhost:7108/hubs/tracking", { accessTokenFactory: () => token })
      .configureLogging(LogLevel.Warning)
      .withAutomaticReconnect()
      .build();

    // Assign ref immediately so location updates can use it
    trackingConnectionRef.current = connection;
    isTrackingConnectedRef.current = false;

    connection.start()
      .then(() => {
        console.log('[Manager] TrackingHub connected for bookingId:', pickup.bookingId);
        isTrackingConnectedRef.current = true;
        // Send current position immediately on connect — use any available GPS source
        const pos = managerPosRef.current || currentGpsPos;
        if (pos) {
          const [lat, lng] = pos;
          console.log('[Manager] Sending initial location:', lat, lng, 'for bookingId:', pickup.bookingId);
          connection.invoke("UpdateLocation", Number(pickup.bookingId), lat, lng)
            .catch(err => console.error('[Manager] Error sending initial location:', err));
        } else {
          console.warn('[Manager] No GPS position available on connect yet — waiting for GPS fix');
        }
      })
      .catch(err => console.error('[Manager] TrackingHub connection failed:', err));

    // Interval to send location every 3 seconds regardless of movement
    const sendInterval = setInterval(() => {
      if (isTrackingConnectedRef.current && pickup?.bookingId) {
        // Use manager's own watchPosition result first, then NavigationContext GPS as fallback
        const pos = managerPosRef.current || currentGpsPos;
        if (pos) {
          const [lat, lng] = pos;
          connection.invoke("UpdateLocation", Number(pickup.bookingId), lat, lng)
            .catch(err => console.error('[Manager] Interval send error:', err));
        }
      }
    }, 3000);

    // Also start background GPS tracking via NavigationContext so it connects its own hub
    if (startBackgroundTracking && (!navigationMode || navigationMode === 'none')) {
      startBackgroundTracking(pickup);
    }

    return () => {
      clearInterval(sendInterval);
      connection.stop();
      trackingConnectionRef.current = null;
      isTrackingConnectedRef.current = false;
    };
  }, [pickup?.bookingId]);

  // Also send on every GPS position change (in addition to interval)
  useEffect(() => {
    const pos = managerPos || currentGpsPos;
    if (isTrackingConnectedRef.current && trackingConnectionRef.current && pos && pickup?.bookingId) {
      console.log('[Manager] Sending location update on GPS change:', pos, 'bookingId:', pickup.bookingId);
      trackingConnectionRef.current.invoke("UpdateLocation", Number(pickup.bookingId), pos[0], pos[1])
        .catch(err => console.error('[Manager] Error sending location on GPS change:', err));
    }
  }, [managerPos, currentGpsPos, pickup?.bookingId]);


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

    try {
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${sLon},${sLat};${eLon},${eLat}?overview=full&geometries=geojson`);
      if (res.ok) {
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coords = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
          setPreviewRouteCoords(coords);
          setPreviewDistance((route.distance / 1000).toFixed(1));
          setPreviewDuration(Math.round(route.duration / 60));
          return;
        }
      }
    } catch (err) {
      console.warn("Project OSRM router failed, using backup...", err);
    }

    // Fallback
    const dist = calculateHaversineDistance(sLat, sLon, eLat, eLon);
    setPreviewDistance(dist.toFixed(1));
    setPreviewDuration(Math.round((dist / 40) * 60));
    setPreviewRouteCoords([[sLat, sLon], [eLat, eLon]]);
  };

  const fetchPickupDetails = async () => {
    try {
      const token = getToken('AccessToken');
      if (!token) return;

      const res = await fetch(`https://localhost:7108/api/Pickup/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch pickup details");
      const result = await res.json();
      if (result.success) {
        setPickup(result.data);
        setPickup(result.data);
      } else {
        toast.error("Pickup details could not be resolved.");
        navigate('/lot-manager/pickups');
      }
    } catch (err) {
      toast.error(err.message || "Error fetching details");
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file) => {
    const token = getToken('AccessToken');
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('https://localhost:7108/api/Upload/upload-file', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    if (!res.ok) throw new Error("File upload failed");
    const data = await res.json();
    return data.url;
  };

  const handleStartRide = async () => {
    if (!pickup.pickupImages?.interiorImageUrl || !pickup.pickupImages?.odometerImageUrl) {
      toast.error("Please submit pre-ride condition photos (interior & odometer) first.");
      navigate(`/lot-manager/pre-ride-condition/${pickup.pickupRequestId}`);
      return;
    }

    if (pickup.status === 'VehiclePicked' || pickup.status === 8) {
      if (!("geolocation" in navigator)) {
        toast.error("Geolocation is not supported by your device. Cannot start ride.");
        return;
      }

      setRideSubmitting(true);
      
      // Force manager to allow location BEFORE hitting API
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const token = getToken('AccessToken');

            const res = await fetch('https://localhost:7108/api/Pickup/manager/start-pickup-ride', {
              method: 'POST',
              headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                PickupRequestId: pickup.pickupRequestId,
                Description: 'Transit started to garage.'
              })
            });

            const result = await res.json();
            if (result.success) {
              toast.success("Transit started successfully. Drive safely!");
              fetchPickupDetails();
              startNavigation(pickup);
            } else {
              toast.error(result.message || "Failed to start ride.");
            }
          } catch (err) {
            toast.error(err.message || "Error starting transit ride.");
          } finally {
            setRideSubmitting(false);
          }
        },
        (error) => {
          setRideSubmitting(false);
          toast.error("You must allow location tracking to start the ride.");
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      startNavigation(pickup);
    }
  };
  const handleCall = () => {
    if (pickup?.customerId && pickup?.customerName) {
      startCall(pickup.customerId, 'garage', pickup.customerName);
    } else {
      toast.error("Contact phone number or user not resolved.");
    }
  };

  const handleMessage = () => {
    if (pickup?.bookingId && pickup?.customerName) {
      navigate('/lot-manager/messages', { 
        state: { 
          preselect: { 
            referenceId: pickup.bookingId, 
            category: 'garage', 
            name: pickup.customerName 
          } 
        } 
      });
    }
  };

  const handleImageExpand = (url, title) => {
    if (!url) return;
    setExpandedImage(url);
    setExpandedTitle(title);
    setIsImageExpanded(true);
  };

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `https://localhost:7108${url.startsWith('/') ? url : `/${url}`}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!pickup) return null;

  const pLat = parseFloat(pickup.pickupLatitude);
  const pLon = parseFloat(pickup.pickupLongitude);
  const lLat = parseFloat(pickup.lotLatitude);
  const lLon = parseFloat(pickup.lotLongitude);
  const hasValidCoords = !isNaN(pLat) && !isNaN(pLon) && !isNaN(lLat) && !isNaN(lLon);

  // Proximity checks — has manager reached the vehicle or garage?
  const distToVehicle = currentGpsPos && hasValidCoords
    ? calculateHaversineDistance(currentGpsPos[0], currentGpsPos[1], pLat, pLon)
    : null;
  const distToGarage = currentGpsPos && hasValidCoords
    ? calculateHaversineDistance(currentGpsPos[0], currentGpsPos[1], lLat, lLon)
    : null;

  // Within 300 m = "arrived"
  const isNearVehicle = distToVehicle !== null && distToVehicle <= 0.3;
  const isNearGarage  = distToGarage  !== null && distToGarage  <= 0.3;

  // Which arrival action to show (vehicle first, then garage after OTP verified)
  const vehiclePicked = pickup?.status === 'VehiclePicked' || pickup?.status === 8;
  const showArrivalAtVehicle = isNearVehicle && !vehiclePicked;
  const showArrivalAtGarage  = isNearGarage  &&  vehiclePicked;

  // ETA calculation for fullscreen overlay
  const getEtaTime = () => {
    const activeDuration = navDuration || previewDuration;
    if (!activeDuration) return "--:--";
    const date = new Date();
    date.setMinutes(date.getMinutes() + parseInt(activeDuration, 10));
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTurnInstruction = (dist) => {
    const d = parseFloat(dist);
    if (isNaN(d)) return { text: "Proceed to destination", icon: "straight" };
    if (d > 10) return { text: "In 2.4 km, keep left to merge onto highway", icon: "left" };
    if (d > 5) return { text: "In 1.2 km, take exit towards garage", icon: "right" };
    if (d > 2) return { text: "In 600m, turn right onto main street", icon: "right" };
    if (d > 0.8) return { text: "In 300m, enter the roundabout", icon: "roundabout" };
    if (d > 0.3) return { text: "In 150m, turn left", icon: "left" };
    return { text: "In 50m, destination will be on the right", icon: "destination" };
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 pb-12 animate-fade-in relative">
      
      {/* 1. Fullscreen Google Maps Navigation Mode Overlay */}
      {navigationMode === 'fullscreen' && hasValidCoords && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900 flex flex-col">
          {/* Top header floating */}
          {/* 1. Left Back Button */}
          <div className="absolute top-4 left-4 z-[1000]">
            <button 
              onClick={() => setNavigationMode('floating')}
              className="w-12 h-12 rounded-full bg-white text-gray-700 shadow-xl border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-all transform active:scale-95"
              title="Shrink Navigation to Floating window"
            >
              <ArrowLeft size={22} />
            </button>
          </div>

          {/* 2. Center Turn-by-Turn HUD */}
          <div className="absolute top-4 left-16 right-16 sm:left-20 sm:right-44 md:left-1/2 md:transform md:-translate-x-1/2 md:w-full md:max-w-md z-[1000]">
            <div className="bg-white text-gray-900 px-3 sm:px-5 py-2.5 sm:py-3.5 rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 flex items-center gap-2 sm:gap-4">
              <div className="w-9 h-9 sm:w-11 sm:h-11 bg-blue-50 text-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600">
                  <line x1="19" y1="12" x2="5" y2="12"/>
                  <polyline points="12 19 5 12 12 5"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5 sm:gap-2">
                  <span className="text-blue-600 font-black text-base sm:text-xl leading-none">2.4 km</span>
                  <span className="text-gray-700 font-extrabold text-xs sm:text-[15px] leading-none">turn left</span>
                </div>
                <p className="hidden sm:block text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-1">Next turn direction</p>
              </div>
            </div>
          </div>

          {/* 3. Right GPS Status Badge */}
          <div className="absolute top-4 right-4 z-[1000]">
            <div className="bg-slate-900/90 backdrop-blur text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs border border-white/10">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping"></div>
              <span className="font-extrabold tracking-wide uppercase">
                Device GPS Active
              </span>
            </div>
          </div>

          {/* Fullscreen Map Canvas */}
          <div className="absolute inset-0 w-full h-full z-0">
            <MapContainer 
              key={`fullscreen-${currentGpsPos ? currentGpsPos.join('-') : 'gps'}`}
              center={currentGpsPos || [pLat, pLon]} 
              zoom={16} 
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors &copy; CARTO'
              />
              
              <MapBoundsFit 
                bounds={navRouteCoords.length > 0 ? navRouteCoords : [[pLat, pLon], [lLat, lLon]]} 
                center={currentGpsPos} 
                zoom={16}
              />

              {/* Vehicle Location: Red location icon with car */}
              <Marker position={[pLat, pLon]} icon={vehicleLocationIcon}>
                <Popup><div className="font-bold text-xs">Vehicle Location (Pickup Point)</div></Popup>
              </Marker>

              {/* Destination Garage: Sleek upright marker */}
              <Marker position={[lLat, lLon]} icon={destinationIcon}>
                <Popup><div className="font-bold text-xs">Destination Garage</div></Popup>
              </Marker>

              {/* Manager Location: Gray circle */}
              {currentGpsPos && (
                <Marker position={currentGpsPos} icon={managerIcon}>
                  <Popup><div className="font-bold text-xs">Your Location</div></Popup>
                </Marker>
              )}

              <Polyline 
                positions={navRouteCoords.length > 0 ? navRouteCoords : [[pLat, pLon], [lLat, lLon]]} 
                color="#3b82f6" 
                weight={6} 
              />

              {/* Road Labels Layer on Top of Polyline */}
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png"
                pane="shadowPane"
              />
            </MapContainer>
          </div>

          {/* Arrival banner bottom offset: clear the full nav bar height + safe area */}
          {(showArrivalAtVehicle || showArrivalAtGarage) && (
            <div className="absolute bottom-[130px] sm:bottom-[120px] md:bottom-[100px] left-2 right-2 sm:left-4 sm:right-4 z-[1001] animate-fade-in">
              <div className={`flex items-center gap-3 sm:gap-4 px-3 sm:px-5 py-3 sm:py-4 rounded-2xl sm:rounded-3xl shadow-2xl border ${
                showArrivalAtVehicle
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-green-50 border-green-200'
              }`}>
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 animate-ping ${
                  showArrivalAtVehicle ? 'bg-amber-500' : 'bg-green-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className={`font-black text-xs sm:text-sm ${
                    showArrivalAtVehicle ? 'text-amber-800' : 'text-green-800'
                  }`}>
                    {showArrivalAtVehicle
                      ? '📍 You\'ve reached the vehicle location!'
                      : '🏠 You\'ve reached the garage!'}
                  </p>
                  <p className={`text-[10px] sm:text-xs mt-0.5 font-semibold ${
                    showArrivalAtVehicle ? 'text-amber-600' : 'text-green-600'
                  }`}>
                    {showArrivalAtVehicle
                      ? `${Math.round(distToVehicle * 1000)} m away · Tap to submit`
                      : `${Math.round(distToGarage  * 1000)} m away · Tap to submit`}
                  </p>
                </div>
                <button
                    onClick={() => {
                      if (showArrivalAtVehicle) {
                        if (pickup.status === 'VehiclePicked' || pickup.status === 8) {
                          navigate(`/lot-manager/pre-ride-condition/${pickup.pickupRequestId}`);
                        } else {
                          navigate(`/lot-manager/manager-arrived/${pickup.pickupRequestId}`);
                        }
                      } else if (showArrivalAtGarage) {
                        navigate(`/lot-manager/garage-arrival-condition/${pickup.pickupRequestId}`);
                      }
                    }}
                    className={`shrink-0 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl font-black text-white text-[11px] sm:text-xs transition-all active:scale-95 ${
                    showArrivalAtVehicle
                      ? 'bg-amber-500 hover:bg-amber-600'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  Submit Arrival
                </button>
              </div>
            </div>
          )}

          {/* Bottom Google Maps navigation bar — responsive + safe area */}
          <div className="absolute bottom-0 left-0 right-0 z-[1000] bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-2xl px-3 pt-3 pb-4 sm:px-5 sm:pt-4 sm:pb-6 md:px-6 md:pb-8" style={{paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))'}}>
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              {/* ETA info */}
              <div className="flex items-center gap-2 sm:gap-5 min-w-0">
                <div className="w-9 h-9 sm:w-12 sm:h-12 bg-blue-50 text-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                  <Navigation size={18} className="animate-pulse sm:hidden" />
                  <Navigation size={24} className="animate-pulse hidden sm:block" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-gray-400 font-extrabold text-[8px] sm:text-[9px] uppercase tracking-wider">Estimated Transit</h4>
                  <div className="flex items-baseline gap-1 sm:gap-1.5 mt-0.5">
                    <span className="text-lg sm:text-2xl font-black text-blue-600">{navDuration || '--'}</span>
                    <span className="text-xs sm:text-sm font-bold text-blue-600">min</span>
                    <span className="text-gray-300 font-semibold mx-0.5 sm:mx-1 text-xs">•</span>
                    <span className="text-sm sm:text-lg font-bold text-gray-700">{navDistance || '--'} km</span>
                  </div>
                  <p className="hidden sm:block text-[10px] text-gray-400 font-semibold mt-0.5">ETA: {getEtaTime()}</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 shrink-0">
                {showArrivalAtVehicle && (
                  <button
                    onClick={() => {
                      if (pickup.status === 'VehiclePicked' || pickup.status === 8 || pickup.status === 'InTransit' || pickup.status === 9) {
                        navigate(`/lot-manager/pre-ride-condition/${pickup.pickupRequestId}`);
                      } else {
                        navigate(`/lot-manager/manager-arrived/${pickup.pickupRequestId}`);
                      }
                    }}
                    className="flex items-center justify-center gap-1.5 px-3 sm:px-5 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold rounded-xl sm:rounded-2xl transition-all text-[11px] sm:text-sm shadow-lg shadow-blue-600/30 ring-2 ring-blue-400/40 whitespace-nowrap"
                  >
                    <MapPin size={13} fill="currentColor" className="shrink-0" />
                    Submit Arrival at Vehicle
                  </button>
                )}
                {showArrivalAtGarage && (
                  <button
                    onClick={() => navigate(`/lot-manager/garage-arrival-condition/${pickup.pickupRequestId}`)}
                    className="px-3 sm:px-5 py-2.5 sm:py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl sm:rounded-2xl transition-colors text-[11px] sm:text-sm whitespace-nowrap"
                  >
                    Submit Arrival at Garage
                  </button>
                )}
                <button 
                  onClick={stopNavigation}
                  className="px-3 sm:px-5 py-2.5 sm:py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl sm:rounded-2xl transition-colors text-[11px] sm:text-sm shadow-md shadow-red-500/20 whitespace-nowrap"
                >
                  Exit Nav
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Main Operations Detail Screen */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-white border border-gray-100 text-gray-600 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm shrink-0"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Pickup Operations</h2>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5 hidden sm:block">Control live navigation transit and document verification</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        
        {/* LEFT COLUMN: Map & Images */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Map Preview Container */}
          {hasValidCoords ? (
            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-extrabold text-gray-900 text-lg flex items-center gap-2">
                    <Navigation size={18} className="text-blue-600" />
                    Pickup Route Directions
                  </h3>
                  <p className="text-gray-400 text-xs mt-0.5">Route mapping from pickup spot to lot garage</p>
                </div>
                {previewDistance && previewDuration && (
                  <div className="bg-blue-50 text-blue-700 font-bold px-3 py-1.5 rounded-xl text-xs flex gap-2 items-center">
                    <span>{previewDistance} km</span>
                    <span>•</span>
                    <span>{previewDuration} mins</span>
                  </div>
                )}
              </div>

              {/* Map Preview Canvas (Visible when navigation is not active/fullscreen) */}
              <div className="h-[400px] w-full rounded-2xl overflow-hidden border border-gray-100 z-0">
                <MapContainer 
                  center={[pLat, pLon]} 
                  zoom={13} 
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors &copy; CARTO'
                  />
                  
                  <MapBoundsFit bounds={previewRouteCoords.length > 0 ? previewRouteCoords : [[pLat, pLon], [lLat, lLon]]} />

                  {managerPos && (
                    <Marker position={managerPos} icon={managerIcon}>
                      <Popup><div className="font-bold text-xs text-blue-600">Your Current Location</div></Popup>
                    </Marker>
                  )}

                  {!['InTransit', 'INTRANSIT', 9, '9'].includes(pickup.status) && (
                    <Marker position={[pLat, pLon]}>
                      <Popup><div className="font-bold text-xs">Pickup Address (Destination)</div></Popup>
                    </Marker>
                  )}

                  {['InTransit', 'INTRANSIT', 9, '9'].includes(pickup.status) && (
                    <Marker position={[lLat, lLon]}>
                      <Popup><div className="font-bold text-xs">Lot Garage (Destination)</div></Popup>
                    </Marker>
                  )}

                  <Polyline 
                    positions={previewRouteCoords.length > 0 ? previewRouteCoords : (managerPos ? [managerPos, ['InTransit', 'INTRANSIT', 9, '9'].includes(pickup.status) ? [lLat, lLon] : [pLat, pLon]] : [[pLat, pLon], [lLat, lLon]])} 
                    color="#2563eb" 
                    weight={4.5} 
                  />

                  {/* Road Labels Layer on Top of Polyline */}
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png"
                    pane="shadowPane"
                  />
                </MapContainer>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-10 border border-gray-100 shadow-sm text-center flex flex-col items-center justify-center">
              <AlertTriangle className="text-amber-500 w-12 h-12 mb-3" />
              <h4 className="font-bold text-gray-900">Map Coordinates Unresolved</h4>
              <p className="text-gray-400 text-sm max-w-sm mt-1">Latitude and longitude are missing for this pickup request booking.</p>
            </div>
          )}

          {/* Vehicle Images and Verification Documents */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
            <h3 className="font-extrabold text-gray-900 text-lg">Documents & Condition Reports</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Vehicle Image */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Vehicle Image</span>
                <div 
                  onClick={() => handleImageExpand(getImageUrl(pickup.vehicleImage), "Vehicle Image")}
                  className="aspect-video bg-gray-50 border border-gray-100 rounded-xl overflow-hidden cursor-pointer group relative shadow-sm"
                >
                  {pickup.vehicleImage ? (
                    <>
                      <img src={getImageUrl(pickup.vehicleImage)} alt="Vehicle" className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-200" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye size={18} className="text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                      <Car size={24} />
                      <span className="text-[10px] mt-1">No Image Available</span>
                    </div>
                  )}
                </div>
              </div>

              {/* RC image */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Vehicle RC Document</span>
                <div 
                  onClick={() => handleImageExpand(getImageUrl(pickup.vehicleRcUrl), "Vehicle Registration Certificate (RC)")}
                  className="aspect-video bg-gray-50 border border-gray-100 rounded-xl overflow-hidden cursor-pointer group relative shadow-sm"
                >
                  {pickup.vehicleRcUrl ? (
                    <>
                      <img src={getImageUrl(pickup.vehicleRcUrl)} alt="RC Doc" className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-200" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye size={18} className="text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                      <ImageIcon size={24} />
                      <span className="text-[10px] mt-1">No RC File</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Owner ID Proof */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Owner ID Proof</span>
                <div 
                  onClick={() => handleImageExpand(getImageUrl(pickup.ownerIdProofUrl), "Owner Identity Verification Document")}
                  className="aspect-video bg-gray-50 border border-gray-100 rounded-xl overflow-hidden cursor-pointer group relative shadow-sm"
                >
                  {pickup.ownerIdProofUrl ? (
                    <>
                      <img src={getImageUrl(pickup.ownerIdProofUrl)} alt="ID Proof" className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-200" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye size={18} className="text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                      <User size={24} />
                      <span className="text-[10px] mt-1">No ID File</span>
                    </div>
                  )}
                </div>
              </div>
              
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Contact card & Status Controls */}
        <div className="space-y-6">
          
          {/* Owner Profile / Contact card */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
            <h3 className="font-extrabold text-gray-900 text-lg">Vehicle Owner Information</h3>
            
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-bold text-xl border border-blue-100 shadow-sm shrink-0">
                {pickup.customerName ? pickup.customerName[0] : 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-gray-900 truncate text-base">{pickup.customerName}</h4>
                <p className="text-xs text-gray-400 mt-0.5">{pickup.customerPhone}</p>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold mt-1.5">
                  <Shield size={10} /> Verified User
                </div>
              </div>
            </div>

            {/* Calling and Messaging Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={handleCall}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 font-bold transition-colors text-sm shadow-sm"
              >
                <Phone size={16} /> Call Owner
              </button>
              <button 
                onClick={handleMessage}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold transition-colors text-sm shadow-sm"
              >
                <MessageCircle size={16} /> Message
              </button>
            </div>
          </div>

          {/* Operation Status controls */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-5">
            <h3 className="font-extrabold text-gray-900 text-lg text-left">Ride Action Operations</h3>
            
            <div className="bg-gray-50 p-4 rounded-2xl space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-gray-400">PICKUP ASSIGNMENT</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  pickup.status === 'Stored' || pickup.status === 10 ? 'bg-green-100 text-green-700' :
                  pickup.status === 'InTransit' || pickup.status === 9 ? 'bg-blue-100 text-blue-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {pickup.status}
                </span>
              </div>
              
              <div className="pt-2 border-t border-gray-100 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400 font-medium">Pickup Point:</span>
                  <span className="font-bold text-gray-900 text-right max-w-[180px] truncate">{pickup.pickupAddress || 'Unspecified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 font-medium">Lot Address:</span>
                  <span className="font-bold text-gray-900 text-right max-w-[180px] truncate">{pickup.lotAddress || 'Unspecified'}</span>
                </div>
              </div>
            </div>



            <div className="flex flex-col gap-3">
              {/* Proximity arrival banner — shown when GPS is near vehicle or garage */}
              {(showArrivalAtVehicle || showArrivalAtGarage) && (
                <div className={`rounded-2xl border p-4 flex items-start gap-3 animate-fade-in ${
                  showArrivalAtVehicle
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-green-50 border-green-200'
                }`}>
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 animate-ping ${
                    showArrivalAtVehicle ? 'bg-amber-500' : 'bg-green-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className={`font-extrabold text-sm ${
                      showArrivalAtVehicle ? 'text-amber-800' : 'text-green-800'
                    }`}>
                      {showArrivalAtVehicle
                        ? '📍 You\'ve reached the vehicle location!'
                        : '🏠 You\'ve reached the garage!'}
                    </p>
                    <p className={`text-xs mt-0.5 font-semibold ${
                      showArrivalAtVehicle ? 'text-amber-600' : 'text-green-600'
                    }`}>
                      {showArrivalAtVehicle
                        ? `${Math.round(distToVehicle * 1000)} m away · Submit your arrival`
                        : `${Math.round(distToGarage  * 1000)} m away · Submit your arrival`}
                    </p>
                  </div>
                </div>
              )}

              {(() => {
                const status = String(pickup.status).toUpperCase();
                const isPreRideCompleted = !!(pickup.pickupImages?.interiorImageUrl && pickup.pickupImages?.odometerImageUrl);

                if (status === 'ASSIGNED' || status === '1' || status === 'MANAGERSCHEDULED' || status === '2' || status === 'APPROVED' || status === '3' || status === 'OTPSENT' || status === '5') {
                  return (
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => navigate(`/lot-manager/manager-arrived/${pickup.pickupRequestId}`)}
                        className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md text-sm"
                      >
                        <MapPin size={16} fill="currentColor" />
                        Manager Arrived at Vehicle / Verify OTP
                      </button>
                      <button
                        onClick={() => startNavigation(pickup)}
                        className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-gray-100 hover:bg-gray-200 border-2 border-gray-900 text-gray-900 font-bold transition-all text-base shadow-sm"
                      >
                        <Play size={18} fill="currentColor" />
                        Start/Continue Navigation (GPS)
                      </button>
                    </div>
                  );
                }

                if (status === 'VEHICLEPICKED' || status === '8' || status === 'VERIFIED' || status === '7') {
                  return (
                    <div className="flex flex-col gap-3">
                      {!isPreRideCompleted ? (
                        <>
                          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex gap-3 text-xs text-left">
                            <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={16} />
                            <div>
                              <p className="font-bold text-amber-800">Pre-Ride Check Required</p>
                              <p className="text-amber-700 mt-0.5 leading-relaxed">Please upload the odometer reading, interior photo, and write a description to proceed.</p>
                            </div>
                          </div>
                          <button
                            onClick={() => navigate(`/lot-manager/pre-ride-condition/${pickup.pickupRequestId}`)}
                            className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md text-sm scale-[1.01] ring-2 ring-blue-400/30"
                          >
                            <Camera size={16} />
                            Submit Pre-Ride Condition
                          </button>
                          <button
                            onClick={() => startNavigation(pickup)}
                            className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-gray-100 hover:bg-gray-200 border-2 border-gray-900 text-gray-900 font-bold transition-all text-base shadow-sm"
                          >
                            <Play size={18} fill="currentColor" />
                            Start/Continue Navigation (GPS)
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => navigate(`/lot-manager/garage-arrival-condition/${pickup.pickupRequestId}`)}
                            className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors text-base shadow-lg shadow-blue-500/30"
                          >
                            <MapPin size={18} fill="currentColor" />
                            Arrived at Garage
                          </button>
                          <button
                            onClick={() => startNavigation({ ...pickup, status: 'INTRANSIT' })}
                            className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-gray-100 hover:bg-gray-200 border-2 border-gray-900 text-gray-900 font-bold transition-all text-base shadow-sm"
                          >
                            <Play size={18} fill="currentColor" />
                            Start/Continue Navigation (GPS)
                          </button>
                        </>
                      )}
                    </div>
                  );
                }

                if (status === 'INTRANSIT' || status === '9') {
                  return (
                    <div className="flex flex-col gap-3">
                      <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex gap-3 text-xs text-left">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping mt-0.5 shrink-0" />
                        <div>
                          <p className="font-bold text-blue-800">Vehicle in Transit</p>
                          <p className="text-blue-700 mt-0.5 leading-relaxed">You are currently navigating to the garage. Submit arrival once you park in the slot.</p>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/lot-manager/garage-arrival-condition/${pickup.pickupRequestId}`)}
                        className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-bold transition-colors text-base"
                      >
                        <MapPin size={18} fill="currentColor" />
                        Submit Arrival at Garage
                      </button>
                      <button
                        onClick={() => startNavigation(pickup)}
                        className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-gray-100 hover:bg-gray-200 border-2 border-gray-900 text-gray-900 font-bold transition-all text-base shadow-sm"
                      >
                        <Play size={18} fill="currentColor" />
                        Start/Continue Navigation (GPS)
                      </button>
                    </div>
                  );
                }

                if (status === 'STORED' || status === '10') {
                  return (
                    <div className="bg-green-50 border border-green-200 p-4 rounded-2xl flex gap-3 text-xs text-green-800 text-left">
                      <CheckCircle2 className="text-green-600 shrink-0 mt-0.5" size={16} />
                      <div>
                        <p className="font-bold">Vehicle Stored Securely</p>
                        <p className="mt-0.5 leading-relaxed">This pickup assignment has been completed and the vehicle is stored in the slot.</p>
                      </div>
                    </div>
                  );
                }

                return null;
              })()}
            </div>
          </div>

        </div>

      </div>

      {/* Image Modal Lightbox — fixed X button, no scroll, zoom only */}
      {isImageExpanded && expandedImage && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center"
          onClick={() => setIsImageExpanded(false)}
        >
          {/* Fixed X button — always visible top-right */}
          <button
            className="fixed top-4 right-4 z-[10000] w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-sm"
            onClick={() => setIsImageExpanded(false)}
          >
            <XCircle size={28} />
          </button>

          {/* Image container — fills viewport, no scroll, pinch/scroll zoom only */}
          <div
            className="w-full h-full flex flex-col items-center justify-center gap-3 px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={expandedImage}
              alt={expandedTitle}
              className="max-w-full max-h-[85vh] w-auto h-auto object-contain rounded-2xl shadow-2xl select-none"
              draggable={false}
            />
            {/* Fixed caption at bottom */}
            <p className="text-white/70 text-sm font-bold tracking-wide text-center">{expandedTitle}</p>
          </div>
        </div>
      )}

    </div>
  );
}
