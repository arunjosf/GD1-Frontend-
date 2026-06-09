import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { toast } from 'react-hot-toast';
import { MapPin, Navigation, ArrowLeft, Phone, Calendar, Clock, Car, FileText, CheckCircle2, AlertCircle, Maximize2, XCircle, Shield, Mail, PhoneCall, Check } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Re-configure leaflet icon defaults
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Car Icon for Leaflet
const carIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/744/744465.png',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

function MapBoundsFit({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds[0] && bounds[1]) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  return null;
}

export default function TrackPickupPage() {
  const { id } = useParams(); // Booking ID
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Image zoom state
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState(null);
  
  // Route and Live tracking states
  const [routeCoords, setRouteCoords] = useState([]);
  const [carPos, setCarPos] = useState(null);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [isRouteOffline, setIsRouteOffline] = useState(false);

  // Refs for auto scrolling
  const stepRefs = {
    1: useRef(null),
    2: useRef(null),
    3: useRef(null),
    4: useRef(null),
    5: useRef(null)
  };

  useEffect(() => {
    fetchBookingDetails();
  }, [id]);

  const fetchBookingDetails = async () => {
    try {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; AccessToken=`);
      const token = parts.length === 2 ? parts.pop().split(';').shift() : null;

      if (!token) return;

      const res = await fetch(`https://localhost:7108/${id}booking-By-Id`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setBooking(data.data);
        const b = data.data;
        if (b.pickupLatitude && b.pickupLongitude && b.lotLatitude && b.lotLongitude) {
          fetchRoute(b.lotLatitude, b.lotLongitude, b.pickupLatitude, b.pickupLongitude);
        }
      } else {
        toast.error("Failed to load tracking details");
        navigate('/my-bookings');
      }
    } catch (err) {
      toast.error("Network error while loading tracking details");
    } finally {
      setLoading(false);
    }
  };

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

  const getStepIndex = (status) => {
    switch (status) {
      case 'Requested': return 1;
      case 'Assigned': return 2;
      case 'ManagerScheduled': return 2;
      case 'Approved': return 2;
      case 'OtpSent': return 3;
      case 'OwnerOtpSubmitted': return 3;
      case 'Verified': return 3;
      case 'VehiclePicked': return 4;
      case 'InTransit': return 4;
      case 'Stored': return 5;
      default: return 0;
    }
  };

  const statusIndex = booking ? getStepIndex(booking.pickupStatus) : 0;

  // Live location animation simulation
  useEffect(() => {
    if (booking?.pickupStatus === 'InTransit' && routeCoords.length > 0) {
      let index = 0;
      const interval = setInterval(() => {
        setCarPos(routeCoords[index]);
        index = (index + 1) % routeCoords.length;
      }, 1200);
      return () => clearInterval(interval);
    } else {
      setCarPos(null);
    }
  }, [booking?.pickupStatus, routeCoords]);

  // Auto-scroll to latest active step on load
  useEffect(() => {
    if (statusIndex > 0) {
      const activeRef = stepRefs[statusIndex];
      if (activeRef?.current) {
        setTimeout(() => {
          activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 800);
      }
    }
  }, [statusIndex]);

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `https://localhost:7108${cleanUrl}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex justify-center items-center py-40">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!booking) return null;

  const steps = [
    {
      id: 1,
      title: 'Pickup Requested',
      description: 'Your request is submitted and waiting for assignment.',
      longDesc: 'Your request for vehicle pickup has been recorded. The lot owner is matching your request with an available lot manager.'
    },
    {
      id: 2,
      title: 'Manager Assigned',
      description: booking.managerName ? `Manager ${booking.managerName} is assigned.` : 'Lot manager assignment pending.',
      longDesc: 'A professional lot manager has been assigned. They will arrive at your pickup location shortly.',
      details: booking.managerName ? (
        <div className="mt-4 bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            {booking.managerSelfieUrl ? (
              <img src={getImageUrl(booking.managerSelfieUrl)} alt={booking.managerName} className="w-12 h-12 rounded-full object-cover border border-gray-200" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                {booking.managerName[0]}
              </div>
            )}
            <div>
              <p className="font-bold text-gray-900">{booking.managerName}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1"><Mail size={12} /> {booking.managerEmail}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1"><PhoneCall size={12} /> {booking.managerPhone}</p>
            </div>
          </div>
          {booking.managerIdProofUrl && (
            <div className="mt-1">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">ID Proof</p>
              <div className="relative group cursor-pointer w-full max-w-sm aspect-video bg-white rounded-lg overflow-hidden border border-gray-200" onClick={() => { setFullScreenImage(getImageUrl(booking.managerIdProofUrl)); setIsImageExpanded(true); }}>
                <img src={getImageUrl(booking.managerIdProofUrl)} alt="ID Proof" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize2 size={20} className="text-white" />
                </div>
              </div>
            </div>
          )}
          {booking.managerArrivalTime && (
            <div className="mt-1 text-xs text-blue-600 font-semibold flex items-center gap-1">
              <Clock size={14} />
              <span>Estimated Arrival: {new Date(booking.managerArrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}
        </div>
      ) : null
    },
    {
      id: 3,
      title: 'Departure Verification',
      description: 'Vehicle condition check at your location.',
      longDesc: 'The manager checks and records your vehicle condition before starting the trip. Live condition details are visible below.',
      details: booking.pickupImages ? (
        <div className="mt-4 bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
          {booking.pickupImages.managerRemarks && (
            <p className="text-sm text-gray-600 italic bg-white p-3 rounded-lg border-l-4 border-blue-500">
              "{booking.pickupImages.managerRemarks}"
            </p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { label: 'Front', img: booking.pickupImages.frontImageUrl },
              { label: 'Rear', img: booking.pickupImages.rearImageUrl },
              { label: 'Left Side', img: booking.pickupImages.leftSideImageUrl },
              { label: 'Right Side', img: booking.pickupImages.rightSideImageUrl },
              { label: 'Interior', img: booking.pickupImages.interiorImageUrl },
              { label: 'Odometer', img: booking.pickupImages.odometerImageUrl },
              { label: 'Live Selfie', img: booking.pickupImages.selfieUrl }
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
      ) : null
    },
    {
      id: 4,
      title: 'In Transit',
      description: 'Vehicle is on the way to the storage garage.',
      longDesc: 'Your vehicle is carefully being navigated to its parking slot. You can monitor the path on the map below.',
      details: booking.pickupStatus === 'InTransit' ? (
        <div className="mt-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></div>
          <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Live location tracking active</span>
        </div>
      ) : null
    },
    {
      id: 5,
      title: 'Stored Securely',
      description: 'Vehicle safely stored in the designated slot.',
      longDesc: 'The vehicle is parked in its assigned slot. Arrival condition and final photographs are stored here.',
      details: booking.arrivalImages ? (
        <div className="mt-4 bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
          {booking.arrivalImages.managerRemarks && (
            <p className="text-sm text-gray-600 italic bg-white p-3 rounded-lg border-l-4 border-green-500">
              "{booking.arrivalImages.managerRemarks}"
            </p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { label: 'Front', img: booking.arrivalImages.frontImageUrl },
              { label: 'Rear', img: booking.arrivalImages.rearImageUrl },
              { label: 'Left Side', img: booking.arrivalImages.leftSideImageUrl },
              { label: 'Right Side', img: booking.arrivalImages.rightSideImageUrl },
              { label: 'Interior', img: booking.arrivalImages.interiorImageUrl },
              { label: 'Odometer', img: booking.arrivalImages.odometerImageUrl }
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
      ) : null
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow pt-[140px] pb-20 px-[6vw]">
        <div className="max-w-4xl mx-auto">
          
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-100 hover:text-gray-900 transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Track Pickup</h1>
              <p className="text-sm text-gray-500 mt-1">Real-time tracking for Booking #{booking.id}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Left Column: Vertical Timeline */}
            <div className="lg:col-span-2 bg-white rounded-[2rem] p-6 md:p-8 border border-gray-100 shadow-sm space-y-8 relative overflow-hidden">
              
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6">Live Status Timeline</h3>
              
              {/* Thin vertical line spanning all steps */}
              <div className="absolute left-[39px] top-[90px] bottom-[60px] w-0.5 bg-gray-100 z-0"></div>

              <div className="space-y-10 relative z-10">
                {steps.map(step => {
                  const isCompleted = step.id < statusIndex || (step.id === statusIndex && booking.pickupStatus === 'Stored');
                  const isActive = step.id === statusIndex && booking.pickupStatus !== 'Stored';
                  
                  return (
                    <div 
                      key={step.id} 
                      ref={stepRefs[step.id]}
                      className={`flex gap-6 transition-all duration-300 ${
                        isActive ? 'scale-[1.01] opacity-100' : isCompleted ? 'opacity-85' : 'opacity-40'
                      }`}
                    >
                      {/* Step Indicator */}
                      <div className="relative shrink-0">
                        {isActive ? (
                          <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center relative">
                            {/* Moving circle pulse effect */}
                            <div className="w-3.5 h-3.5 rounded-full bg-blue-600 animate-ping absolute"></div>
                            <div className="w-3 h-3 rounded-full bg-blue-600 relative z-10"></div>
                          </div>
                        ) : isCompleted ? (
                          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white border border-green-600">
                            <Check size={16} strokeWidth={3} />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                          </div>
                        )}
                      </div>

                      {/* Step Contents */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className={`text-base font-extrabold tracking-tight ${
                            isActive ? 'text-blue-600' : isCompleted ? 'text-gray-900' : 'text-gray-400'
                          }`}>
                            {step.title}
                          </h4>
                          {isActive && (
                            <span className="px-2 py-0.5 text-[9px] bg-blue-100 text-blue-700 font-bold uppercase rounded tracking-wider animate-pulse">
                              Active
                            </span>
                          )}
                        </div>
                        <p className={`text-xs font-semibold mt-0.5 ${isActive ? 'text-gray-800' : 'text-gray-500'}`}>
                          {step.description}
                        </p>
                        <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                          {step.longDesc}
                        </p>

                        {/* Expandable Step details (manager, images, etc.) */}
                        {step.details}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Live Map Location */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Vehicle Detail Card */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Vehicle Details</h3>
                <div className="flex gap-4 items-center">
                  {booking.vehicleImageUrl ? (
                    <img src={getImageUrl(booking.vehicleImageUrl)} alt="Vehicle" className="w-16 h-16 rounded-xl object-cover border border-gray-100" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 border border-gray-200">
                      <Car size={24} />
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-gray-900">{booking.vehicleBrand} {booking.vehicleModel}</h4>
                    <span className="inline-block mt-1 px-2.5 py-0.5 bg-gray-100 rounded text-xs font-mono font-bold text-gray-600">
                      {booking.registrationNo}
                    </span>
                  </div>
                </div>
              </div>

              {/* Map Container */}
              {booking.pickupLatitude != null && booking.pickupLongitude != null && booking.lotLatitude != null && booking.lotLongitude != null ? (
                <div className="bg-white rounded-[2rem] p-5 border border-gray-100 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Live Route Map</h3>
                    {distance && duration && (
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-lg flex flex-col items-end gap-0.5 border border-blue-100/40 shadow-sm leading-tight text-right animate-fade-in">
                        <span>{distance} km • {duration} mins</span>
                        {isRouteOffline && <span className="text-[9px] text-orange-600 font-bold tracking-wide">⚠️ Routing Offline</span>}
                      </span>
                    )}
                  </div>
                  
                  <div className="h-[320px] rounded-xl overflow-hidden border border-gray-200 z-0">
                    <MapContainer 
                      center={carPos || [booking.pickupLatitude, booking.pickupLongitude]} 
                      zoom={13} 
                      style={{ height: '100%', width: '100%' }}
                      scrollWheelZoom={false}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; OpenStreetMap contributors'
                      />
                      
                      <MapBoundsFit bounds={[
                        [booking.pickupLatitude, booking.pickupLongitude],
                        [booking.lotLatitude, booking.lotLongitude]
                      ]} />

                      {/* Origin Marker */}
                      <Marker position={[booking.pickupLatitude, booking.pickupLongitude]}>
                        <Popup>
                          <div className="font-bold text-xs">Pickup Origin</div>
                          <p className="text-xs text-gray-500 mt-1">{booking.propertyAddress}</p>
                        </Popup>
                      </Marker>

                      {/* Destination Marker */}
                      <Marker position={[booking.lotLatitude, booking.lotLongitude]}>
                        <Popup>
                          <div className="font-bold text-xs">Destination Lot</div>
                          <p className="text-xs text-gray-500 mt-1">{booking.propertyName}</p>
                        </Popup>
                      </Marker>

                      {/* Simulated Live Car Marker */}
                      {booking.pickupStatus === 'InTransit' && carPos && (
                        <Marker position={carPos} icon={carIcon}>
                          <Popup>
                            <div className="font-bold text-xs">Vehicle In Transit</div>
                            <p className="text-[10px] text-gray-500 mt-0.5">Moving towards garage...</p>
                          </Popup>
                        </Marker>
                      )}

                      {/* Map Route Polyline */}
                      <Polyline 
                        positions={routeCoords.length > 0 ? routeCoords : [[booking.pickupLatitude, booking.pickupLongitude], [booking.lotLatitude, booking.lotLongitude]]} 
                        color="#2563eb" 
                        weight={4} 
                      />
                    </MapContainer>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-gray-400 py-12">
                  <MapPin size={32} className="opacity-20 mb-2" />
                  <p className="text-xs">Location tracking unavailable</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>

      {/* Image Modal for zoom/expand */}
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

      <Footer />
    </div>
  );
}
