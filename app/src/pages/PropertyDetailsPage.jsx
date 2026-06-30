import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getToken } from '../api/auth';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Navigation, Calendar, CheckCircle2, ChevronLeft, Info, Car, X, ShieldCheck, Clock } from "lucide-react";
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// Leaflet marker fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => { if (center) map.setView(center, map.getZoom()); }, [center, map]);
  return null;
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa'];
function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDayOfMonth(y, m) { return new Date(y, m, 1).getDay(); }
const formatDate = (d) => d ? `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}` : '';

function CalendarPopover({ value, onChange, onClose, minDate }) {
  const today = new Date();
  const [view, setView] = useState({ y: (value || today).getFullYear(), m: (value || today).getMonth() });

  const prev = () => setView(v => v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 });
  const next = () => setView(v => v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 });

  const days     = getDaysInMonth(view.y, view.m);
  const firstDay = getFirstDayOfMonth(view.y, view.m);
  const cells    = Array(firstDay).fill(null).concat(Array.from({ length: days }, (_, i) => i + 1));

  const isToday    = (d) => d === today.getDate() && view.m === today.getMonth() && view.y === today.getFullYear();
  const isSelected = (d) => { if (!value || !d) return false; return value.getDate() === d && value.getMonth() === view.m && value.getFullYear() === view.y; };
  const isPast     = (d) => { 
    if (!d) return false; 
    const cell = new Date(view.y, view.m, d); 
    cell.setHours(0,0,0,0); 
    const limit = minDate ? new Date(minDate) : new Date(); 
    limit.setHours(0,0,0,0); 
    return cell < limit; 
  };

  return (
    <div className="absolute top-full left-0 mt-2 z-[200] bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-black/[0.06] p-4 w-[280px]">
      <div className="flex items-center justify-between mb-3">
        <button onClick={prev} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <p className="text-[13px] font-semibold text-[#111]">{`${MONTHS[view.m]} ${view.y}`}</p>
        <button onClick={next} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => <div key={d} className="text-center text-[10px] font-bold text-[#aaa] py-1">{d}</div>)}
      </div>
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

export default function PropertyDetailsPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();

  const property = state?.property;
    const { userVehicles, fetchUserVehicles, vehiclesLoading } = useAuth();
    useEffect(() => { if (!vehiclesLoading && userVehicles === null) fetchUserVehicles(); }, [vehiclesLoading, userVehicles, fetchUserVehicles]);
    const [localFetchedVehicle, setLocalFetchedVehicle] = useState(null);
    const activeVehicle = state?.activeVehicle || localFetchedVehicle || (userVehicles?.length > 0 ? userVehicles[0] : null);

  const [activeImage, setActiveImage] = useState(0);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  
  const savedDateStr = localStorage.getItem('gd1_search_date');
  const initialStartDate = savedDateStr ? new Date(savedDateStr) : new Date();
  
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(null);
  
  const [showStartCal, setShowStartCal] = useState(false);
  const [showEndCal, setShowEndCal] = useState(false);
  const startCalRef = useRef(null);
  const endCalRef = useRef(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    if (!property) {
      toast.error('Property not found');
      navigate('/search');
    }
    const handleClick = (e) => {
      if (startCalRef.current && !startCalRef.current.contains(e.target)) setShowStartCal(false);
      if (endCalRef.current && !endCalRef.current.contains(e.target)) setShowEndCal(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [property, navigate]);

  if (!property) return null;

  const allImages = property.propertyImages?.length > 0 
    ? property.propertyImages 
    : [property.img || property.slots?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'];
  
  const amenities = [
    property.propertyDetails?.hasCCTV        && 'CCTV',
    property.propertyDetails?.hasSecurity    && 'Security Personnel',
    property.propertyDetails?.hasWorkshop    && 'Workshop Bay',
    property.propertyDetails?.hasWashingArea && 'Washing Area',
    property.propertyDetails?.hasFireSafety  && 'Fire Safety',
  ].filter(Boolean);

  const extras = property.propertyDetails?.extraFacilities?.split(',').map(e => e.trim()).filter(Boolean) || [];
  const allChips = [...amenities, ...extras];

  const days = endDate ? Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))) : 0;
  const totalCost = days * (property.pricePerDay || 0);

  const selectedSlot = property.slots?.find(s => s.id === selectedSlotId);

    const [showVehicleLoading, setShowVehicleLoading] = useState(false);
    
    const openBookingModal = async () => {
      if (!activeVehicle) {
        setShowVehicleLoading(true);
        try {
          const token = getToken('AccessToken');
          const res = await fetch('https://gd1-grand-auto-depot-one-9ms1.onrender.com/api/Vehicle/my-vehicle', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok && data.success && data.data && data.data.length > 0) {
            setLocalFetchedVehicle(data.data[0]);
            setShowVehicleLoading(false);
            if (!endDate) {
              toast.error('Please select a Move-out date first.');
              return;
            }
            const diffTime = endDate - startDate;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays < 3) {
              toast.error('Move-out date must be at least 3 days after move-in date.');
              return;
            }
            setIsModalOpen(true);
            return;
          }
        } catch (err) {
          console.error(err);
        }
        setShowVehicleLoading(false);
        toast.error('No vehicles found. Please add a vehicle first.');
        navigate('/add-vehicle');
        return;
      }

      if (!endDate) {
        toast.error('Please select a Move-out date first.');
        return;
      }
      const diffTime = endDate - startDate;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < 3) {
        toast.error('Move-out date must be at least 3 days after move-in date.');
        return;
      }
      setIsModalOpen(true);
    };

  const submitBooking = async () => {
    if (!selectedSlotId) {
      toast.error('Please select a slot from the map.');
      return;
    }
    if (!endDate) {
      toast.error('Please select a Move-out date.');
      return;
    }
    const diffTime = endDate - startDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 3) {
      toast.error('Move-out date must be at least 3 days after move-in date.');
      return;
    }
    
    setIsBooking(true);
    try {
      const token = getToken('AccessToken');
      const formatLocalISO = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();
      const formData = new FormData();
      formData.append('vehicleId', activeVehicle.id);
      formData.append('propertyId', id);
      formData.append('slotId', selectedSlotId);
      formData.append('startDate', formatLocalISO(startDate));
      formData.append('endDate', formatLocalISO(endDate));

      const res = await fetch('https://gd1-grand-auto-depot-one-9ms1.onrender.com/api/LotBooking/Create-Booking', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (data.success && data.data?.bookingId) {
        setIsModalOpen(false);
        navigate('/my-bookings');
      } else {
        toast.error(data.message || 'Failed to create booking.');
      }
    } catch (err) {
      toast.error('Network error during booking.');
    } finally {
      setIsBooking(false);
    }
  };

  // Add state for the success popup
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans pb-24">
      {/* <Navbar /> */}
      
      <div className="pt-[45px] px-4 md:px-14 max-w-7xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[14px] font-medium text-[#666] hover:text-[#111] transition-colors mb-6">
          <ChevronLeft className="w-4 h-4" /> Back to Search
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
          <div className="lg:col-span-2 space-y-8">
            
            {/* Image Gallery */}
            <div className="bg-white rounded-3xl p-2 border border-black/[0.04] shadow-sm">
              <div className="w-full h-[300px] md:h-[400px] rounded-2xl overflow-hidden mb-2">
                <img src={allImages[activeImage]} alt="Property" className="w-full h-full object-cover" />
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {allImages.map((img, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setActiveImage(idx)}
                    className={`w-20 h-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${activeImage === idx ? 'border-black' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Title & Info */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
                  {property.tier || 'Premium Storage'}
                </span>
                {property.isRecommendedByAi && (
                  <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
                    AI Recommended
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-[#111] mb-2">{property.name}</h1>
              <p className="flex items-center gap-1.5 text-[15px] text-[#666] mb-6">
                <MapPin className="w-4 h-4 text-[#aaa]" />
                {property.propertyDetails?.addressLine || [property.city, property.state].filter(Boolean).join(', ')}
              </p>
              
              <h2 className="text-xl font-bold text-[#111] mb-4">Amenities & Features</h2>
              <div className="flex flex-wrap gap-2 mb-8">
                {allChips.map((chip, idx) => (
                  <span key={idx} className="bg-white border border-gray-200 text-[#333] text-[13px] font-medium px-4 py-2 rounded-full flex items-center gap-2 shadow-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    {chip}
                  </span>
                ))}
              </div>
            </div>

            {/* Map Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[#111]">Location</h2>
                <button onClick={() => setIsMapExpanded(!isMapExpanded)} className="text-[13px] font-semibold text-blue-600 hover:underline">
                  {isMapExpanded ? 'Collapse Map' : 'Expand Map'}
                </button>
              </div>
              <div className={`w-full rounded-3xl overflow-hidden border border-black/[0.04] transition-all duration-500 ${isMapExpanded ? 'h-[500px]' : 'h-[250px]'}`}>
                <MapContainer center={[property.latitude || 12.97, property.longitude || 77.59]} zoom={14} scrollWheelZoom={false} className="w-full h-full">
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                  <Marker position={[property.latitude || 12.97, property.longitude || 77.59]}>
                    <Popup>{property.name}</Popup>
                  </Marker>
                  <MapUpdater center={[property.latitude || 12.97, property.longitude || 77.59]} />
                </MapContainer>
              </div>
            </div>

          </div>

          {/* Sticky Booking Widget */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xl sticky top-[80px]">
              <div className="flex items-end gap-1 mb-6 border-b border-gray-100 pb-4">
                <span className="text-3xl font-bold text-[#111]">&#8377;{property.pricePerDay || 150}</span>
                <span className="text-[14px] text-[#666] mb-1">/ day</span>
              </div>

              <div className="space-y-3 mb-6">
                <div className="relative" ref={startCalRef}>
                  <label className="block text-[11px] font-bold text-[#888] uppercase mb-1">Move-in</label>
                  <button onClick={() => { setShowStartCal(!showStartCal); setShowEndCal(false); }} className="w-full text-left px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between hover:bg-gray-100 transition-colors">
                    <span className="text-[14px] font-semibold text-[#111]">{formatDate(startDate)}</span>
                    <Calendar className="w-4 h-4 text-[#888]" />
                  </button>
                  {showStartCal && (
                    <CalendarPopover 
                      value={startDate} 
                      onChange={(d) => { 
                        setStartDate(d); 
                        if (endDate) {
                          const minReq = new Date(d);
                          minReq.setDate(minReq.getDate() + 3);
                          if (endDate < minReq) setEndDate(minReq);
                        }
                      }} 
                      onClose={() => setShowStartCal(false)} 
                    />
                  )}
                </div>

                <div className="relative" ref={endCalRef}>
                  <label className="block text-[11px] font-bold text-[#888] uppercase mb-1">Move-out</label>
                  <button onClick={() => { setShowEndCal(!showEndCal); setShowStartCal(false); }} className="w-full text-left px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between hover:bg-gray-100 transition-colors">
                    <span className={`text-[14px] font-semibold ${endDate ? 'text-[#111]' : 'text-gray-400'}`}>
                      {endDate ? formatDate(endDate) : 'Select date'}
                    </span>
                    <Calendar className="w-4 h-4 text-[#888]" />
                  </button>
                  {showEndCal && (
                    <CalendarPopover 
                      value={endDate} 
                      minDate={new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000)}
                      onChange={(d) => setEndDate(d)} 
                      onClose={() => setShowEndCal(false)} 
                    />
                  )}
                </div>
              </div>

              {activeVehicle && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-white shrink-0">
                    {activeVehicle.profileImageUrl ? (
                      <img src={activeVehicle.profileImageUrl} alt="Car" className="w-full h-full object-cover" />
                    ) : (
                      <Car className="w-full h-full p-2 text-blue-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-blue-400 uppercase">Parking Vehicle</p>
                    <p className="text-[13px] font-semibold text-blue-900">{activeVehicle.brand} {activeVehicle.model}</p>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-2xl mb-6 space-y-3">
                <div className="flex justify-between text-[14px]">
                  <span className="text-[#666]">&#8377;{property.pricePerDay} x {days} days</span>
                  <span className="font-semibold text-[#111]">&#8377;{totalCost}</span>
                </div>
                <div className="flex justify-between text-[14px]">
                  <span className="text-[#666]">Platform Fee</span>
                  <span className="font-semibold text-green-600">Free</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between text-[16px] font-bold">
                  <span className="text-[#111]">Total</span>
                  <span className="text-[#111]">&#8377;{totalCost}</span>
                </div>
              </div>

              <button
                onClick={openBookingModal}
                disabled={showVehicleLoading}
                className={`w-full py-4 rounded-xl text-[15px] font-bold text-white transition-all bg-[#2563eb] hover:bg-blue-600 shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 ${showVehicleLoading ? 'opacity-80 cursor-not-allowed' : ''}`}
              >
                {showVehicleLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Loading Vehicle...
                  </>
                ) : (
                  "Choose Slot & Book"
                )}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Booking Selection Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[90vh]"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 z-10 w-8 h-8 bg-white/80 backdrop-blur border border-black/10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4 text-[#111]" />
              </button>

              {/* Left Side: Slot Grid */}
              <div className="flex-1 p-6 md:p-8 bg-gray-50 border-r border-gray-200 overflow-y-auto no-scrollbar">
                <h3 className="text-xl font-bold text-[#111] mb-2">Select Your Slot</h3>
                <p className="text-[13px] text-gray-500 mb-8">Green slots are available for your vehicle size.</p>

                <div className="w-full h-8 bg-gray-200 rounded-full mb-8 flex items-center justify-center text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  Entrance / Driveway
                </div>
                
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {(property.slots || []).map((slot, idx) => {
                    const isOccupied = slot.isOccupied;
                    const isSelected = selectedSlotId === slot.id;
                    return (
                      <button
                        key={slot.id}
                        disabled={isOccupied}
                        onClick={() => setSelectedSlotId(slot.id)}
                        className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center transition-all duration-300
                          ${isOccupied 
                            ? 'bg-gray-200 border border-gray-300 cursor-not-allowed opacity-50' 
                            : isSelected 
                              ? 'bg-blue-600 border-2 border-blue-700 shadow-[0_0_20px_rgba(37,99,235,0.4)] scale-110 z-10' 
                              : 'bg-green-50 border border-green-200 hover:border-green-400 hover:bg-green-100 cursor-pointer'}`}
                      >
                        {isOccupied ? (
                          <Car className="w-6 h-6 text-gray-400 mb-1" />
                        ) : (
                          <div className={`w-6 h-10 rounded-[4px] border-2 border-dashed mb-1 ${isSelected ? 'border-white/50 bg-white/20' : 'border-green-300 bg-white/50'}`}></div>
                        )}
                        <span className={`text-[11px] font-bold ${isSelected ? 'text-white' : 'text-[#111]'}`}>
                          {slot.slotNumber || `S-${idx + 1}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
                
                <div className="flex flex-wrap items-center justify-center gap-4 mt-8 pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-50 border border-green-200 rounded-sm"></div><span className="text-[11px] font-medium text-gray-600">Available</span></div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-gray-200 border border-gray-300 rounded-sm"></div><span className="text-[11px] font-medium text-gray-600">Occupied</span></div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-600 rounded-sm"></div><span className="text-[11px] font-medium text-gray-600">Selected</span></div>
                </div>
              </div>

              {/* Right Side: Slot Details & Action */}
              <div className="w-full md:w-[360px] bg-white p-6 md:p-8 flex flex-col">
                <h3 className="text-lg font-bold text-[#111] mb-6">Slot Details</h3>
                
                {selectedSlot ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col flex-1"
                  >
                    <div className="w-full aspect-video rounded-2xl overflow-hidden bg-gray-100 mb-6 border border-gray-100 shadow-sm relative">
                      {selectedSlot.imageUrl ? (
                        <img src={selectedSlot.imageUrl} alt="Slot" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                          <Car className="w-8 h-8 mb-2 opacity-50" />
                          <span className="text-[11px] font-medium uppercase tracking-wider">No Image</span>
                        </div>
                      )}
                      <div className="absolute top-2 left-2 bg-black/70 backdrop-blur text-white px-2.5 py-1 rounded-full text-[10px] font-bold">
                        {selectedSlot.slotNumber || 'Selected Slot'}
                      </div>
                    </div>

                    <div className="space-y-4 mb-8">
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-[13px] text-gray-500">Dimensions</span>
                        <span className="text-[13px] font-bold text-[#111]">{selectedSlot.squareFeet} sq ft</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-[13px] text-gray-500">Clearance</span>
                        <span className="text-[13px] font-bold text-[#111]">{selectedSlot.heightFeet} ft</span>
                      </div>
                      <div className="flex items-center gap-2 text-[12px] text-green-600 font-medium bg-green-50 px-3 py-2 rounded-lg">
                        <CheckCircle2 className="w-4 h-4" />
                        Guaranteed to fit your {activeVehicle.brand}
                      </div>
                    </div>

                    <div className="mt-auto">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[14px] font-medium text-gray-600">Total for {days} days</span>
                        <span className="text-[20px] font-bold text-[#111]">&#8377;{totalCost}</span>
                      </div>
                      <button
                        onClick={submitBooking}
                        disabled={isBooking}
                        className={`w-full py-4 rounded-xl text-[15px] font-bold text-white transition-all
                          ${isBooking ? 'bg-blue-400 cursor-wait' : 'bg-[#2563eb] hover:bg-blue-600 shadow-[0_8px_20px_rgba(37,99,235,0.25)] hover:shadow-[0_8px_25px_rgba(37,99,235,0.35)] hover:-translate-y-0.5'}`}
                      >
                        {isBooking ? 'Processing...' : 'Submit Booking Request'}
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                      <ShieldCheck className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-[15px] font-medium text-[#111] mb-2">No slot selected</p>
                    <p className="text-[13px] text-gray-500">Please select an available green slot from the map to view its details and continue booking.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}




