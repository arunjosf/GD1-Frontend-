import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { MapPin, ArrowLeft, Phone, Building2, User, CheckCircle, Navigation, Maximize2, FileText, Image as ImageIcon, X, Map as MapIcon, Compass } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Icons for map
const agentCircleIcon = L.divIcon({
  html: `
    <div style="position: relative; display: flex; align-items: center; justify-content: center;">
      <div style="width: 24px; height: 24px; background-color: #2563eb; border-radius: 9999px; border: 4px solid #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);"></div>
    </div>
  `,
  className: 'custom-agent-icon',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const destinationIcon = L.divIcon({
  html: `
    <div style="display: flex; justify-content: center; align-items: center;">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: 40px; height: 40px; color: #ef4444; filter: drop-shadow(0 4px 3px rgb(0 0 0 / 0.07));">
        <path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.157-1.051c1.647-1.655 4.98-5.3 4.98-9.799C18.52 4.951 14.77 2 12 2s-6.52 2.951-6.52 7.498c0 4.498 3.333 8.144 4.98 9.799A16.977 16.977 0 0011.54 22.351zM12 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" clip-rule="evenodd" />
      </svg>
    </div>
  `,
  className: 'custom-destination-icon',
  iconSize: [40, 40],
  iconAnchor: [20, 40]
});

// A component to automatically fit the map bounds
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

export default function AgentPropertyDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [appData, setAppData] = useState(null);

  // Map routing state
  const [agentLocation, setAgentLocation] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [routeSteps, setRouteSteps] = useState([]);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  // Image Expand State
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchAssignment();
    // Get agent location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setAgentLocation([pos.coords.latitude, pos.coords.longitude]),
        (err) => console.warn("Agent location error:", err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }, [id]);

  useEffect(() => {
    if (agentLocation && appData?.latitude && appData?.longitude) {
      fetchRoute(agentLocation[0], agentLocation[1], appData.latitude, appData.longitude);
    }
  }, [agentLocation, appData]);

  const fetchAssignment = async () => {
    try {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; AccessToken=`);
      const token = parts.length === 2 ? parts.pop().split(';').shift() : null;

      const res = await fetch('https://localhost:7108/api/agents/my-inspections', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        const app = (result.data || []).find(a => 
          (a.assignments || []).some(assign => assign.id.toString() === id)
        );
        if (app) {
          setAppData(app);
        } else {
          toast.error("Assignment not found");
          navigate('/agent/assignments');
        }
      }
    } catch (err) {
      toast.error('Failed to load assignment data.');
    } finally {
      setLoading(false);
    }
  };

  const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const fetchRoute = async (sLat, sLon, eLat, eLon) => {
    try {
      // OSRM: /route/v1/driving/lon,lat;lon,lat
      const res = await fetch(`https://routing.openstreetmap.de/routed-car/route/v1/driving/${sLon},${sLat};${eLon},${eLat}?overview=full&geometries=geojson&steps=true`);
      if (res.ok) {
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coords = route.geometry.coordinates.map(coord => [coord[1], coord[0]]); // GeoJSON is lon,lat -> leaflet needs lat,lon
          setRouteCoords(coords);
          setDistance((route.distance / 1000).toFixed(1));
          setDuration(Math.round(route.duration / 60));
          
          if (route.legs && route.legs[0] && route.legs[0].steps) {
            setRouteSteps(route.legs[0].steps);
          }
          return;
        }
      }
    } catch (err) {
      console.warn("OSRM router failed, using Haversine fallback...", err);
    }
    // Fallback
    const dist = calculateHaversineDistance(sLat, sLon, eLat, eLon);
    setDistance(dist.toFixed(1));
    setDuration(Math.round((dist / 45) * 60)); // assume 45 km/h
    setRouteCoords([[sLat, sLon], [eLat, eLon]]);
    setRouteSteps([]);
  };

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center h-[50vh]">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!appData) return null;

  const currentAssignment = appData.assignments.find(a => a.id.toString() === id);

  const getBounds = () => {
    if (routeCoords.length > 0) return routeCoords;
    if (agentLocation && appData.latitude && appData.longitude) {
      return [agentLocation, [appData.latitude, appData.longitude]];
    }
    return null;
  };

  const documents = [
    { label: "OEM Certificate", url: appData.oemCertificateUrl },
    { label: "Business Registration", url: appData.businessRegistrationUrl },
    { label: "License Document", url: appData.licenseDocumentUrl },
    { label: "Owner ID Proof", url: appData.ownerIdProofUrl },
    { label: "Property Proof", url: appData.propertyProofUrl }
  ].filter(d => d.url);

  // Group images to show them nicely
  const allPropertyImages = [
    ...(appData.frontImageUrl ? [{ url: appData.frontImageUrl, label: 'Front Image' }] : []),
    ...(appData.propertyImages ? appData.propertyImages : [])
  ];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pt-4 pb-12 animate-fade-in px-4">
      
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/agent/assignments')} 
          className="hidden sm:block p-3 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div className="flex-1 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Property Details</h2>
            <p className="text-gray-500 font-medium mt-1">Review application details and navigate to the property.</p>
          </div>
          <button 
            onClick={() => navigate(`/agent/assignments/${id}/report`)}
            disabled={currentAssignment?.status === 'Completed'}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm whitespace-nowrap"
          >
            {currentAssignment?.status === 'Completed' ? (
              <><CheckCircle size={20} /> Report Submitted</>
            ) : (
              'Submit Inspection Report'
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
              <Building2 className="text-blue-600" size={24} /> Application Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User size={20} className="text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Owner</p>
                    <p className="text-sm font-medium text-gray-900">{appData.ownerName || appData.fullName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone size={20} className="text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Contact Phone</p>
                    <p className="text-sm font-medium text-gray-900">{appData.phoneNumber}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin size={20} className="text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Property Address</p>
                    <p className="text-sm font-medium text-gray-900">{appData.businessName}</p>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {[
                        appData.addressLine,
                        appData.addressLine?.includes(appData.city) ? null : appData.city,
                        appData.addressLine?.includes(appData.state) ? null : appData.state,
                        appData.postalCode
                      ].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="text-blue-600" size={24} /> Slots Required to Inspect
            </h3>
            {appData.slots && appData.slots.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {appData.slots.map((slot, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex justify-between items-center shadow-sm">
                    <div>
                      <p className="text-sm font-bold text-gray-900">Slot {slot.slotNumber}</p>
                      <p className="text-[12px] text-gray-500 font-medium mt-1">{slot.squareFeet} sq ft • {slot.heightFeet} ft height</p>
                    </div>
                    {slot.imageUrl && (
                      <button onClick={() => setSelectedImage(slot.imageUrl)} className="hover:opacity-80 transition-opacity">
                        <img src={slot.imageUrl} className="w-12 h-12 rounded-lg object-cover border border-gray-200" alt="Slot" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No slots provided.</p>
            )}
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ImageIcon className="text-blue-600" size={24} /> Property Images
            </h3>
            {allPropertyImages.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {allPropertyImages.map((img, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setSelectedImage(img.imageUrl || img.url)}
                    className="aspect-square bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 hover:ring-2 hover:ring-blue-500 transition-all relative group"
                  >
                     <img src={img.imageUrl || img.url} alt={`Property ${idx}`} className="w-full h-full object-cover" />
                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                       <Maximize2 size={24} className="text-white" />
                     </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-6 flex flex-col items-center justify-center bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
                <ImageIcon size={32} className="text-gray-300 mb-2" />
                <p className="text-sm text-gray-400 font-medium">No property images uploaded.</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="text-blue-600" size={24} /> Documents
            </h3>
            {documents.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {documents.map((doc, idx) => {
                  const isPdf = doc.url.toLowerCase().endsWith('.pdf');
                  return (
                    <div key={idx} className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden flex flex-col h-40 group cursor-pointer hover:border-blue-300 transition-colors"
                         onClick={() => setSelectedImage(doc.url)}>
                      <div className="flex-1 bg-gray-100 relative overflow-hidden flex items-center justify-center">
                        {!isPdf ? (
                          <img src={doc.url} alt={doc.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="text-gray-400 flex flex-col items-center">
                            <FileText size={32} className="mb-2" />
                            <span className="text-xs font-bold uppercase">PDF Document</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Maximize2 className="text-white" size={20} />
                        </div>
                      </div>
                      <div className="p-2.5 bg-white border-t border-gray-200 text-center">
                        <span className="text-xs font-bold text-gray-700 truncate block">{doc.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 flex flex-col items-center justify-center bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
                <FileText size={32} className="text-gray-300 mb-2" />
                <p className="text-sm text-gray-400 font-medium">No documents uploaded.</p>
              </div>
            )}
          </div>

            {/* Submitted Inspection Report */}
            {currentAssignment?.status === 'Completed' && (currentAssignment?.report || currentAssignment?.Report) && (
              <div className="bg-green-50 rounded-3xl p-6 border border-green-200 shadow-sm mt-6">
                <h3 className="text-xl font-bold text-green-800 mb-6 flex items-center gap-2">
                  <CheckCircle size={24} className="text-green-600" /> Submitted Inspection Report
                </h3>
                
                <div className="space-y-6">
                  {(currentAssignment.report || currentAssignment.Report).overallDescription && (
                    <div>
                      <h4 className="text-sm font-bold text-green-800 uppercase mb-2 tracking-wider">Overall Observation</h4>
                      <p className="text-sm text-green-900 bg-white p-4 rounded-xl border border-green-100 whitespace-pre-wrap">{(currentAssignment.report || currentAssignment.Report).overallDescription}</p>
                    </div>
                  )}

                  {(currentAssignment.report || currentAssignment.Report).siteImages?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-green-800 uppercase mb-2 tracking-wider">Site Images</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {(currentAssignment.report || currentAssignment.Report).siteImages.map((img, idx) => (
                          <button key={idx} onClick={() => setSelectedImage(img.imageUrl)} className="aspect-square bg-white rounded-xl overflow-hidden border border-green-200 hover:ring-2 hover:ring-green-500 transition-all cursor-zoom-in relative group">
                            <img src={img.imageUrl} alt="Site" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Maximize2 className="text-white" size={20} />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {(currentAssignment.report || currentAssignment.Report).slotVerifications?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-green-800 uppercase mb-2 tracking-wider">Slot Verifications</h4>
                      <div className="space-y-3">
                        {(currentAssignment.report || currentAssignment.Report).slotVerifications.map((slot, idx) => (
                          <div key={idx} className="bg-white p-4 rounded-xl border border-green-200 flex justify-between items-center gap-4">
                            <div>
                              <p className="text-sm font-bold text-green-900">Slot #{slot.slotNumber}</p>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${slot.isVerified ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {slot.isVerified ? 'Verified' : 'Verification Failed'}
                              </span>
                            </div>
                            {slot.imageUrl ? (
                              <button onClick={() => setSelectedImage(slot.imageUrl)} className="hover:opacity-80 transition-opacity shrink-0 cursor-zoom-in group relative overflow-hidden rounded-lg border border-green-200">
                                <img src={slot.imageUrl} alt="Slot" className="w-14 h-14 object-cover" />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Maximize2 className="text-white" size={12} />
                                </div>
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400 italic">No image</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

        {/* Right Column: Map Preview */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm sticky top-24">
            <div className="flex justify-between items-center mb-4 px-2">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <MapIcon size={20} className="text-blue-600" /> Map Overview
              </h3>
              {distance && (
                <div className="text-xs font-bold text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                  {distance} km
                </div>
              )}
            </div>

            <div className="w-full relative z-0 rounded-2xl overflow-hidden border border-gray-200 h-[320px] mb-4 bg-gray-100">
              {(appData.latitude && appData.longitude) ? (
                <MapContainer 
                  center={[appData.latitude, appData.longitude]} 
                  zoom={12} 
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={false}
                  dragging={false}
                  scrollWheelZoom={false}
                  doubleClickZoom={false}
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                  />
                  <MapBoundsFit bounds={getBounds()} />
                  
                  <Marker position={[appData.latitude, appData.longitude]} icon={destinationIcon} />
                  
                  {agentLocation && (
                    <Marker position={agentLocation} icon={agentCircleIcon} />
                  )}

                  {routeCoords.length > 0 && (
                    <Polyline positions={routeCoords} color="#3b82f6" weight={4} opacity={0.8} />
                  )}
                </MapContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center flex-col text-gray-400 bg-gray-50">
                  <MapPin size={32} className="mb-2 opacity-20" />
                  <p className="text-sm font-medium">Location unavailable</p>
                </div>
              )}
              
              {/* Overlay button to expand */}
              <div className="absolute inset-0 bg-transparent hover:bg-black/5 transition-colors z-[1000] cursor-pointer flex items-center justify-center group" onClick={() => setIsMapExpanded(true)}>
                 <div className="bg-white text-gray-900 px-4 py-2 rounded-full font-bold text-sm shadow-lg transform scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all flex items-center gap-2">
                   <Maximize2 size={16} /> Click to Expand Map
                 </div>
              </div>
            </div>

            <button 
              onClick={() => setIsMapExpanded(true)}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex justify-center items-center gap-2 shadow-sm"
            >
              <Navigation size={18} /> Start Navigation
            </button>
          </div>
        </div>

      </div>

      {/* Expanded Map Modal */}
      {isMapExpanded && createPortal(
        <div className="fixed inset-0 z-[9999] bg-white flex flex-col animate-fade-in">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center shadow-sm z-10 bg-white">
            <div>
              <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <Compass className="text-blue-600" /> Turn-by-Turn Navigation
              </h3>
              <p className="text-sm text-gray-500 font-medium">Routing to {appData.businessName}</p>
            </div>
            <div className="flex items-center gap-4">
              {distance && (
                <div className="hidden sm:flex items-center gap-4 text-sm font-bold bg-blue-50 text-blue-700 px-4 py-2 rounded-xl border border-blue-100">
                  <span>{distance} km</span>
                  <span className="w-1 h-1 rounded-full bg-blue-300"></span>
                  <span>{duration} mins</span>
                </div>
              )}
              <button 
                onClick={() => setIsMapExpanded(false)}
                className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 hover:text-red-500 transition-colors"
              >
                <X size={24} className="text-gray-600 hover:text-red-500" />
              </button>
            </div>
          </div>
          <div className="flex-1 w-full relative z-0 flex flex-col md:flex-row">
            
            {/* Navigation Steps Panel */}
            <div className="w-full md:w-80 bg-white border-r border-gray-100 shadow-xl z-10 flex flex-col h-1/3 md:h-full order-2 md:order-1">
              <div className="p-4 bg-gray-50 border-b border-gray-100">
                <h4 className="font-bold text-gray-900">Directions</h4>
                {distance && <p className="text-xs text-gray-500">{distance} km • {duration} mins</p>}
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {routeSteps.length > 0 ? (
                  routeSteps.map((step, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="mt-1 flex flex-col items-center">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-[10px]">
                          {idx + 1}
                        </div>
                        {idx !== routeSteps.length - 1 && <div className="w-0.5 h-full bg-blue-50 my-1"></div>}
                      </div>
                      <div className="pb-4">
                        <p className="text-sm font-bold text-gray-800 capitalize leading-tight">
                          {step.maneuver.type.replace('-', ' ')} {step.maneuver.modifier && `(${step.maneuver.modifier})`}
                        </p>
                        {step.name && <p className="text-xs text-gray-500 mt-1 font-medium">{step.name}</p>}
                        <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wider">{Math.round(step.distance)} m</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-sm text-gray-400">Loading route steps...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Full Map */}
            <div className="flex-1 w-full h-2/3 md:h-full relative order-1 md:order-2">
              {(appData.latitude && appData.longitude) ? (
                <MapContainer 
                  center={[appData.latitude, appData.longitude]} 
                  zoom={14} 
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                  />
                  <MapBoundsFit bounds={getBounds()} />
                  
                  <Marker position={[appData.latitude, appData.longitude]} icon={destinationIcon}>
                    <Popup>
                      <div className="font-bold text-sm">{appData.businessName}</div>
                      <p className="text-xs text-gray-500">{appData.addressLine}</p>
                    </Popup>
                  </Marker>
                  
                  {agentLocation && (
                    <Marker position={agentLocation} icon={agentCircleIcon}>
                      <Popup>
                        <div className="font-bold text-sm text-blue-600">Your Location</div>
                      </Popup>
                    </Marker>
                  )}

                  {routeCoords.length > 0 && (
                    <Polyline positions={routeCoords} color="#3b82f6" weight={6} opacity={0.8} />
                  )}
                </MapContainer>
              ) : (
                <div className="w-full h-full bg-gray-50 flex items-center justify-center flex-col text-gray-400">
                  <MapPin size={48} className="mb-4 opacity-20" />
                  <p className="text-lg font-medium">Property coordinates not available.</p>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Image Lightbox Modal */}
      {selectedImage && createPortal(
        <div className="fixed inset-0 z-[99999] bg-black/90 flex items-center justify-center animate-fade-in p-4 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
          <button 
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <X size={24} />
          </button>
          {selectedImage.toLowerCase().endsWith('.pdf') ? (
            <div className="w-full max-w-4xl h-[80vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
               <div className="bg-gray-100 p-4 border-b border-gray-200 flex justify-between items-center">
                 <h3 className="font-bold text-gray-800">PDF Document Viewer</h3>
                 <a href={selectedImage} target="_blank" rel="noreferrer" className="text-blue-600 text-sm font-bold hover:underline">Open in New Tab</a>
               </div>
               <iframe src={selectedImage} className="w-full flex-1" title="PDF Viewer" />
            </div>
          ) : (
            <img 
              src={selectedImage} 
              alt="Expanded" 
              className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl" 
              onClick={e => e.stopPropagation()} 
            />
          )}
        </div>,
        document.body
      )}

    </div>
  );
}
