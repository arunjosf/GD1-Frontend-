import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { getToken } from '../../api/auth';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

// Fix for default Leaflet icon paths in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
}

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 50);
  }, [map]);
  return null;
}


/* ── tiny helpers ── */
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDayOfMonth(y, m) { return new Date(y, m, 1).getDay(); }

function CalendarPopover({ value, onChange, onClose }) {
  const today = new Date();
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() });

  const prev = () => setView(v => v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 });
  const next = () => setView(v => v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 });

  const days = getDaysInMonth(view.y, view.m);
  const firstDay = getFirstDayOfMonth(view.y, view.m);
  const cells = Array(firstDay).fill(null).concat(Array.from({ length: days }, (_, i) => i + 1));

  const isToday = (d) => d === today.getDate() && view.m === today.getMonth() && view.y === today.getFullYear();
  const isSelected = (d) => {
    if (!value || !d) return false;
    return value.getDate() === d && value.getMonth() === view.m && value.getFullYear() === view.y;
  };
  const isPast = (d) => {
    if (!d) return false;
    const cell = new Date(view.y, view.m, d);
    cell.setHours(0,0,0,0);
    const t = new Date(); t.setHours(0,0,0,0);
    return cell < t;
  };

  return (
    <div className="absolute top-full left-0 mt-2 z-[9999] bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-black/[0.06] p-4 w-[280px]">
      {/* nav */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prev} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-black">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <p className="text-[13px] font-semibold text-[#111]">{MONTHS[view.m]} {view.y}</p>
        <button onClick={next} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-black">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>
      {/* day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => <div key={d} className="text-center text-[10px] font-bold text-[#aaa] py-1">{d}</div>)}
      </div>
      {/* cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((d, i) => (
          <button
            key={i}
            disabled={!d || isPast(d)}
            onClick={() => { onChange(new Date(view.y, view.m, d)); onClose(); }}
            className={`h-8 w-full flex items-center justify-center text-[12px] rounded-full transition-all font-medium
              ${!d ? '' : isPast(d) ? 'text-[#ccc] cursor-not-allowed' : isSelected(d)
                ? 'bg-[#111] text-white'
                : isToday(d)
                  ? 'border border-[#111] text-[#111] hover:bg-[#111] hover:text-white'
                  : 'text-[#333] hover:bg-gray-100'}`}
          >
            {d || ''}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function NearbyServiceCentersPage() {

  const { propertyId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { vehicleBrand, bookingId, vehicleId } = location.state || {};
  
  const [centers, setCenters] = useState([]);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [serviceNotes, setServiceNotes] = useState('');
  const [scheduledDate, setScheduledDate] = useState(null);
  const [showCal, setShowCal] = useState(false);
  const calRef = useRef(null);
  const formatDate = (d) => d ? `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}` : '';

  useEffect(() => {
    const handler = (e) => {
      if (calRef.current && !calRef.current.contains(e.target)) {
        if (scheduledDate) setShowCal(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [scheduledDate]);

  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState([11.1340, 75.8952]); // Default to Calicut University
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [property, setProperty] = useState(null);

  const handleConfirmBooking = async () => {
    if (!bookingId || !vehicleId) {
      toast.error('Missing booking information. Please go back to the dashboard and try again.');
      return;
    }
    if (!scheduledDate) {
      toast.error('Please select a service date.');
      return;
    }
    
    try {
      const token = getToken('AccessToken');
      const response = await fetch('https://localhost:7108/api/service-center/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bookingId: bookingId,
          serviceCenterId: selectedCenter.id,
          vehicleId: vehicleId,
          notes: serviceNotes,
          scheduledDate: scheduledDate ? `${scheduledDate.getFullYear()}-${String(scheduledDate.getMonth()+1).padStart(2, "0")}-${String(scheduledDate.getDate()).padStart(2, "0")}` : null
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Service requested at ${selectedCenter.name}`);
        setSelectedCenter(null);
        navigate(`/track-service/${data.serviceRequestId}`);
      } else {
        toast.error('Failed to request service. Please try again.');
      }
    } catch (error) {
      toast.error('Error requesting service');
    }
  };

  useEffect(() => {
    let mounted = true;
    
    const fetchPropertyAndCenters = async () => {
      setLoading(true);
      try {
        const token = getToken('AccessToken');
        const headers = token ? { "Authorization": `Bearer ${token}` } : {};
        
        const nearbyUrl = `https://localhost:7108/api/service-center/nearby/${propertyId}`;
        const res = await fetch(nearbyUrl, { headers });
        if (!res.ok) throw new Error('Failed to fetch nearby service centers');
        const result = await res.json();
        
        const centersData = result.data || result || [];
        const filteredCenters = centersData.filter(c => !vehicleBrand || (c.supportedBrands && c.supportedBrands.toLowerCase().includes(vehicleBrand.toLowerCase())));
        
        if (mounted) {
          setCenters(filteredCenters);
          if (filteredCenters.length > 0) {
            setMapCenter([filteredCenters[0].latitude, filteredCenters[0].longitude]);
          }
        }
      } catch (err) {
        if (mounted) {
          toast.error("Could not load service centers");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (propertyId) {
      fetchPropertyAndCenters();
    }
  }, [propertyId]);

  return (
    <div className="h-screen bg-[#fafafa] font-sans flex flex-col overflow-hidden">
      <Navbar />

      <div className="w-full bg-white border-b border-black/[0.06] z-40 pt-[62px] shrink-0">
        <div className="px-4 md:px-14 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-[22px] md:text-[24px] font-bold tracking-tight text-[#111]">Service Centers Nearby</h1>
            <p className="text-[#666] text-[14px] mt-1">Book maintenance for your {vehicleBrand || 'vehicle'} locally</p>
          </div>
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[#666] hover:text-[#111] transition-colors text-[14px] font-medium"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Back
          </button>
        </div>
      </div>

      <div className="flex-1 flex w-full min-h-0">
        <div className={`no-scrollbar overflow-y-auto px-4 md:px-14 py-8 transition-all duration-500 ease-in-out ${isMapExpanded ? 'w-0 opacity-0 overflow-hidden px-0' : 'flex-1'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <p className="text-[15px] text-[#666]">
              {centers.length} authorized service centers found.
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-full h-[160px] bg-gray-200 animate-pulse rounded-2xl mx-4 md:mx-0" />
              ))}
            </div>
          ) : centers.length === 0 ? (
            <div className="text-center py-20 text-[#aaa]">
              <svg className="mx-auto mb-4 opacity-30" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <p className="text-[16px] font-medium">No service centers found nearby</p>
              <p className="text-[14px] mt-1">Try expanding your search or contact support.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 pb-12">
              {centers.map(c => (
                <div key={c.id} className="mx-4 md:mx-0 group flex flex-col md:flex-row bg-white rounded-2xl overflow-hidden hover:shadow-[0_6px_24px_rgba(0,0,0,0.07)] transition-all duration-300 border border-black/[0.05]">
                  <div className="w-full h-[160px] md:h-auto md:w-[200px] shrink-0 relative overflow-hidden bg-gray-100 flex items-center justify-center">
                    {c.imageUrl ? (
                      <img src={c.imageUrl} alt={c.name} className="w-full h-full object-cover" />
                    ) : (
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                    )}
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold text-[#111] shadow-sm">
                      &#9733; {c.averageRating || 'New'}
                    </div>
                  </div>

                  <div className="px-6 py-5 flex flex-col flex-1 min-w-0 gap-1">
                    <div className="flex items-center justify-between">
                      <p className="text-[12px] font-medium text-[#666]">
                        {c.distanceKm ? `${c.distanceKm.toFixed(1)} km away` : ''}
                      </p>
                    </div>
                    <h3 className="text-[18px] font-semibold text-[#111] leading-snug">{c.name}</h3>
                    <div className="flex items-start gap-1.5 mb-4">
                      <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
                      <p className="text-[#666] text-[14px] leading-relaxed line-clamp-2">
                        {c.addressLine}, {c.city}, {c.state} - {c.postalCode}
                      </p>
                    </div>
                    
                    <div className="flex justify-end mt-auto pt-4">
                      <button
                        onClick={() => setSelectedCenter(c)}
                        className="w-full sm:w-auto bg-[#2563eb] text-white px-5 py-2.5 rounded-xl text-[13px] font-semibold hover:bg-blue-700 transition-colors"
                      >
                        Request Service
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setIsMapExpanded(true)}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] lg:hidden bg-[#111] text-white shadow-[0_8px_30px_rgba(0,0,0,0.4)] rounded-full px-5 py-3 flex items-center gap-2 hover:bg-gray-800 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
          <span className="text-[14px] font-semibold">Map View</span>
        </button>

        {isMapExpanded ? (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 300 }}>
            <MapContainer center={mapCenter} zoom={12} scrollWheelZoom={true} style={{ width: '100%', height: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              />
              <MapUpdater center={mapCenter} />
              <MapResizer />
              <Circle center={mapCenter} radius={25000} pathOptions={{ color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.08, weight: 1.5 }} />
              {centers.map(c => (
                <Marker key={c.id} position={[c.latitude, c.longitude]}>
                  <Popup className="rounded-xl overflow-hidden shadow-xl p-0 custom-popup">
                    <div className="w-[200px]">
                      <div className="p-4">
                        <h4 className="font-semibold text-[14px] text-[#111] mb-1">{c.name}</h4>
                        <p className="text-[12px] text-[#666] leading-tight">{c.addressLine}, {c.city}</p>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
            <button
              onClick={() => setIsMapExpanded(false)}
              style={{ position: 'absolute', top: 24, right: 24, zIndex: 1000 }}
              className="bg-[#2563eb] text-white shadow-[0_8px_30px_rgba(0,0,0,0.4)] px-4 py-1.5 rounded-lg text-[12px] font-semibold flex items-center gap-2 hover:bg-gray-800 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"/></svg>
              <span>Show List</span>
            </button>
          </div>
        ) : (
          <div className="relative bg-gray-100 border-l border-black/[0.06] shrink-0 sticky top-0 self-start hidden lg:flex lg:w-[40%]" style={{ height: '100%' }}>
            <MapContainer center={mapCenter} zoom={12} scrollWheelZoom={true} className="w-full h-full z-0">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              />
              <MapUpdater center={mapCenter} />
              <Circle center={mapCenter} radius={25000} pathOptions={{ color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.08, weight: 1.5 }} />
              {centers.map(c => (
                <Marker key={c.id} position={[c.latitude, c.longitude]}>
                  <Popup className="rounded-xl overflow-hidden shadow-xl p-0 custom-popup">
                    <div className="w-[200px]">
                      <div className="p-4">
                        <h4 className="font-semibold text-[14px] text-[#111] mb-1">{c.name}</h4>
                        <p className="text-[12px] text-[#666] leading-tight">{c.addressLine}, {c.city}</p>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
            <button
              onClick={() => setIsMapExpanded(true)}
              className="absolute top-6 right-6 z-[1000] bg-white border border-black/[0.08] shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-full px-4 py-2 flex items-center gap-2 hover:bg-gray-50 transition-colors"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
              <span className="text-[13px] font-semibold text-[#111]">Expand Map</span>
            </button>
          </div>
        )}
      </div>


      <AnimatePresence>
        {showDisclaimer && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl mx-4 md:mx-0"
            >
              <div className="p-8">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                </div>
                <h3 className="text-[22px] font-bold text-[#111] mb-3">Service Disclaimer</h3>
                <p className="text-[14px] text-[#666] leading-relaxed mb-8">
                  GD1 Garage owners are not responsible for any service issues. We are not directly connected with the service centers listed here. The service agreement and deal are strictly between you and the selected service center.
                </p>
                <div className="flex gap-3">
                  <button onClick={() => navigate(-1)} className="flex-1 py-3.5 px-4 bg-gray-100 hover:bg-gray-200 text-[#111] rounded-xl text-[14px] font-semibold transition-colors">
                    Cancel
                  </button>
                  <button onClick={() => setShowDisclaimer(false)} className="flex-1 py-3.5 px-4 bg-[#2563eb] hover:bg-blue-700 text-white rounded-xl text-[14px] font-semibold transition-colors shadow-lg shadow-blue-500/30">
                    I Understand
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {selectedCenter && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl mx-4 md:mx-0"
            >
              <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                  </div>
                  <div>
                    <h3 className="text-[18px] font-bold text-[#111]">{selectedCenter.name}</h3>
                    <p className="text-[13px] text-[#666]">Requesting Service</p>
                  </div>
                </div>

                
                <div className="space-y-2 mb-4 relative" ref={calRef}>
                  <label className="text-[13px] font-semibold text-[#111]">Service Date <span className="text-red-500">*</span></label>
                  <button type="button" onClick={() => setShowCal(!showCal)} className="w-full text-left flex items-center justify-between bg-gray-50 hover:bg-gray-100 border border-black/[0.08] rounded-xl p-4 transition-colors relative focus:outline-none focus:ring-1 focus:ring-blue-500">
                    <span className={`text-[14px] font-medium ${scheduledDate ? 'text-[#111]' : 'text-[#999]'}`}>
                      {scheduledDate ? formatDate(scheduledDate) : 'Select Service Date'}
                    </span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b3b3b" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  </button>
                  {showCal && (
                    <div onClick={e => e.stopPropagation()}>
                      <CalendarPopover value={scheduledDate} onChange={setScheduledDate} onClose={() => setShowCal(false)} />
                    </div>
                  )}
                </div>
                
                <div className="space-y-2 mb-8">
                  <label className="text-[13px] font-semibold text-[#111]">Optional Notes</label>
                  <textarea

                    value={serviceNotes}
                    onChange={(e) => setServiceNotes(e.target.value)}
                    placeholder="Describe the issue or service needed..."
                    className="w-full bg-gray-50 border border-black/[0.08] rounded-xl p-4 text-[14px] text-[#111] placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                    rows="4"
                  />
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setSelectedCenter(null)} className="flex-1 py-3.5 px-4 bg-gray-100 hover:bg-gray-200 text-[#111] rounded-xl text-[14px] font-semibold transition-colors">
                    Cancel
                  </button>
                  <button 
                    onClick={handleConfirmBooking}
                    className="flex-1 py-3.5 px-4 bg-[#2563eb] hover:bg-blue-700 text-white rounded-xl text-[14px] font-semibold transition-colors shadow-lg shadow-blue-500/30"
                  >
                    Confirm Booking
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-popup .leaflet-popup-content-wrapper {
          padding: 0;
          overflow: hidden;
          border-radius: 16px;
        }
        .custom-popup .leaflet-popup-content {
          margin: 0;
          width: 200px !important;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
