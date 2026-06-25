import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getToken } from '../../api/auth';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import {
  ArrowLeft, Calendar, Clock, Image as ImageIcon,
  CheckCircle2, Wrench, Camera, Truck, ShieldCheck,
  Star, AlertTriangle, MapPin, ChevronDown, ChevronUp,
  Car, Package, Activity, FileText, StopCircle
} from 'lucide-react';

// ─── Event type config ──────────────────────────────────────────
const EVENT_CONFIG = {
  'Vehicle Added':          { icon: <Car size={16}/>,          color: '#2563eb', bg: '#dbeafe', label: 'Vehicle Added' },
  'Booking Created':        { icon: <Calendar size={16}/>,     color: '#3b82f6', bg: '#eff6ff', label: 'Booking Created' },
  'Vehicle Stored':         { icon: <Package size={16}/>,      color: '#8b5cf6', bg: '#f5f3ff', label: 'Vehicle Stored' },
  'Pickup Requested':       { icon: <Truck size={16}/>,        color: '#f59e0b', bg: '#fffbeb', label: 'Pickup Requested' },
  'Pickup Started':         { icon: <Truck size={16}/>,        color: '#f97316', bg: '#fff7ed', label: 'Pickup Started' },
  'Arrived at Garage':      { icon: <MapPin size={16}/>,       color: '#10b981', bg: '#ecfdf5', label: 'Arrived at Garage' },
  'Pre-Ride Condition':     { icon: <Camera size={16}/>,       color: '#6366f1', bg: '#eef2ff', label: 'Pre-Ride Inspection' },
  'Lot Arrival Condition':  { icon: <ShieldCheck size={16}/>,  color: '#059669', bg: '#ecfdf5', label: 'Lot Arrival Condition' },
  'Weekly Check':           { icon: <Activity size={16}/>,     color: '#0ea5e9', bg: '#f0f9ff', label: 'Weekly Check' },
  'WeeklyUpdate':           { icon: <Activity size={16}/>,     color: '#0ea5e9', bg: '#f0f9ff', label: 'Weekly Condition Submitted' },
  'AdHocMaintenanceUpdate': { icon: <Activity size={16}/>,     color: '#0ea5e9', bg: '#f0f9ff', label: 'Weekly Condition Submitted' },
  'After Service Condition':{ icon: <ShieldCheck size={16}/>,  color: '#059669', bg: '#ecfdf5', label: 'After Service Condition' },
  'On-Demand Check':        { icon: <Camera size={16}/>,       color: '#7c3aed', bg: '#f5f3ff', label: 'On-Demand Images' },
  'Service Request':        { icon: <Wrench size={16}/>,       color: '#dc2626', bg: '#fef2f2', label: 'Service Requested' },
  'Service Booked':         { icon: <Wrench size={16}/>,       color: '#dc2626', bg: '#fef2f2', label: 'Service Booked' },
  'Service Completed':      { icon: <CheckCircle2 size={16}/>, color: '#16a34a', bg: '#f0fdf4', label: 'Service Completed' },
  'Inspection':             { icon: <FileText size={16}/>,     color: '#b45309', bg: '#fffbeb', label: 'Inspection' },
  'Vehicle Storage Stopped':{ icon: <StopCircle size={16}/>,   color: '#dc2626', bg: '#fef2f2', label: 'Storage Stopped' },
  'Released':               { icon: <Star size={16}/>,         color: '#f59e0b', bg: '#fffbeb', label: 'Vehicle Released' },
};

function getEventConfig(eventType) {
  // fuzzy match
  for (const [key, val] of Object.entries(EVENT_CONFIG)) {
    if (eventType?.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(eventType?.toLowerCase())) {
      return val;
    }
  }
  return { icon: <Activity size={16}/>, color: '#6b7280', bg: '#f9fafb', label: eventType };
}

// ─── Image lightbox ──────────────────────────────────────────────
function Lightbox({ images, startIndex, onClose }) {
  const [current, setCurrent] = useState(startIndex);
  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="relative max-w-4xl w-full mx-4" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-10 right-0 text-white/70 hover:text-white text-sm font-medium">✕ Close</button>
        <img src={images[current]?.imageUrl} alt={images[current]?.label} className="w-full max-h-[80vh] object-contain rounded-2xl" />
        {images[current]?.label && (
          <p className="text-white/70 text-center mt-3 text-sm">{images[current].label}</p>
        )}
        {images.length > 1 && (
          <div className="flex justify-center gap-3 mt-4">
            {images.map((img, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-white scale-125' : 'bg-white/40'}`}
              />
            ))}
          </div>
        )}
        {images.length > 1 && (
          <>
            <button onClick={() => setCurrent(p => Math.max(0, p - 1))}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            >‹</button>
            <button onClick={() => setCurrent(p => Math.min(images.length - 1, p + 1))}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            >›</button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Single event card ───────────────────────────────────────────
function EventCard({ event, isLast }) {
  const [expanded, setExpanded] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const cfg = getEventConfig(event.eventType);
  const hasImages = event.images?.length > 0;
  const hasDescription = !!event.description;

  return (
    <div className="relative flex gap-4">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gray-100" style={{ height: 'calc(100% + 24px)' }}></div>
      )}

      {/* Icon dot */}
      <div className="relative z-10 flex-shrink-0">
        <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-white shadow-sm"
          style={{ backgroundColor: cfg.bg, color: cfg.color }}>
          {cfg.icon}
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 text-sm">{cfg.label}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                  style={{ color: cfg.color, borderColor: `${cfg.color}30`, backgroundColor: cfg.bg }}>
                  {event.eventType}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Calendar size={11} />
                  {new Date(event.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock size={11} />
                  {new Date(event.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
          {(hasDescription || hasImages || event.actionUrl || event.managerName) && (
            <button onClick={() => setExpanded(p => !p)}
              className="w-7 h-7 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
              {expanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
            </button>
          )}
        </div>

        {/* Body (expandable) */}
        {(hasDescription || hasImages || event.actionUrl || event.managerName) && expanded && (
          <div className="border-t border-gray-50 px-5 py-4 space-y-4">
            {event.managerName && (
              <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-100 flex items-start gap-3">
                {event.managerAvatarUrl ? (
                  <img src={event.managerAvatarUrl} alt={event.managerName} className="w-10 h-10 rounded-full border border-blue-200 object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                    {event.managerName.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-gray-900">{event.managerName}</p>
                  <p className="text-xs text-blue-600 font-medium">Assigned Manager</p>
                  {event.verifiedAt && (
                    <p className="text-[10px] text-gray-500 mt-0.5">Verified on {new Date(event.verifiedAt).toLocaleString('en-IN')}</p>
                  )}
                  {event.managerRemarks && (
                    <p className="text-xs text-gray-700 mt-1 italic">"{event.managerRemarks}"</p>
                  )}
                </div>
              </div>
            )}
            {hasDescription && (
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{event.description}</p>
            )}
            {hasImages && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Captured Images ({event.images.length})
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {event.images.map((img, i) => (
                    <button key={i} onClick={() => setLightbox(i)} className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-100 hover:border-blue-300 transition-all shadow-sm">
                      <img src={img.imageUrl} alt={img.label || `Image ${i+1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      {img.label && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5">
                          <p className="text-white text-[10px] truncate font-medium">{img.label}</p>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <ImageIcon size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {event.actionUrl && (
              <div className="pt-2">
                <a href={event.actionUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-colors shadow-sm">
                  <FileText size={16} /> {event.actionLabel || "Download Agreement"}
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <Lightbox images={event.images} startIndex={lightbox} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────
export default function VehicleJourneyPage() {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const bookingId = location.state?.bookingId || searchParams.get('bookingId');

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vehicleInfo, setVehicleInfo] = useState(null);

  // Determine role from token
  const token = getToken('AccessToken');
  const role = (() => {
    try { return parseInt(JSON.parse(atob(token.split('.')[1])).roleId, 10); }
    catch { return 1; }
  })();

  const isOwner = role === 1;
  const isLotOwner = role === 2;
  const isManager = role === 4;

  const queryParams = bookingId ? `?bookingId=${bookingId}` : '';
  const journeyEndpoint = isOwner
    ? `https://localhost:7108/api/vehicle/${vehicleId}/vehicle-owner/vehicle-journey${queryParams}`
    : `https://localhost:7108/api/vehicle/${vehicleId}/lot-owner/manager/vehicle-journey${queryParams}`;

    useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Fetch Journey Events
        const res = await fetch(journeyEndpoint, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to load journey events.');
        const result = await res.json();
        let fetchedEvents = result.data || result || [];

        // 2. Fetch Booking Data to inject missing Service events
        if (bookingId) {
          try {
             const bRes = await fetch(`https://localhost:7108/${bookingId}booking-By-Id`, {
               headers: { 'Authorization': `Bearer ${token}` }
             });
             if (bRes.ok) {
                const bResult = await bRes.json();
                const bData = bResult.data || bResult;
                
                // Inject 'Service Recommended' if the manager recommended it
                if (bData.hasServiceRecommendation) {
                   fetchedEvents.push({
                     eventId: 'srv-rec-' + Date.now(),
                     eventType: 'Service Recommended',
                     createdAt: bData.updatedAt || new Date().toISOString(),
                     managerRemarks: bData.managerServiceRemarks,
                     description: 'A vehicle service has been recommended by the manager.'
                   });
                }
                
                // Inject 'Service Completed' if there is a last service report
                if (bData.lastServiceReportDate) {
                   fetchedEvents.push({
                     eventId: 'srv-done-' + Date.now(),
                     eventType: 'Service Completed',
                     createdAt: bData.lastServiceReportDate,
                     description: `Garage: ${bData.lastServiceCenterName || 'Unknown'}\nCost: ₹${bData.lastServiceCost || 0}\nNotes: ${bData.lastServiceNotes || 'None'}`
                   });
                }
             }
          } catch(e) { 
             console.error("Failed to fetch booking for service details", e); 
          }
        }

        // 3. Sort all events chronologically (oldest first) so the injected ones fit perfectly
        fetchedEvents.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        
        setEvents(fetchedEvents);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (vehicleId) fetchData();
  }, [journeyEndpoint, bookingId, token, vehicleId]);

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Inter', sans-serif" }}>
      {isOwner && <Navbar />}

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Back button */}
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back
        </button>

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Car size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Vehicle Journey</h1>
              <p className="text-sm text-gray-500">Complete event timeline for Vehicle #{vehicleId}</p>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-400 text-sm">Loading journey events...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <AlertTriangle size={32} className="text-red-400 mx-auto mb-3" />
            <p className="text-red-700 font-medium">{error}</p>
            <button onClick={() => navigate(-1)}
              className="mt-4 text-sm text-red-600 hover:text-red-800 font-medium underline">
              Go Back
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && events.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <Activity size={40} className="text-gray-200 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-700 mb-1">No Events Yet</h3>
            <p className="text-gray-400 text-sm">Journey events will appear here as your vehicle is tracked.</p>
          </div>
        )}

        {/* Timeline */}
        {!loading && !error && events.length > 0 && (
          <div className="relative">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-px flex-1 bg-gray-100"></div>
              <span className="text-xs text-gray-400 font-medium px-3 py-1 bg-white border border-gray-100 rounded-full">
                {events.length} event{events.length !== 1 ? 's' : ''} · oldest first
              </span>
              <div className="h-px flex-1 bg-gray-100"></div>
            </div>

            <div>
              {events.map((event, i) => (
                <EventCard key={event.eventId} event={event} isLast={i === events.length - 1} />
              ))}
            </div>

            {/* End marker */}
            <div className="flex items-center gap-3 mt-2">
              <div className="w-10 h-10 rounded-full bg-gray-100 border-2 border-white shadow-sm flex items-center justify-center">
                <CheckCircle2 size={16} className="text-gray-400" />
              </div>
              <span className="text-sm text-gray-400 font-medium">End of journey timeline</span>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
