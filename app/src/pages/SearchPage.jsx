import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getToken } from '../api/auth';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';

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

// Forces Leaflet to recalculate size after container changes (e.g. fullscreen)
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 50);
  }, [map]);
  return null;
}

// ── Calendar helpers ──────────────────────────────────────────────────────
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa'];
function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDayOfMonth(y, m) { return new Date(y, m, 1).getDay(); }

function CalendarPopover({ value, onChange, onClose }) {
  const today = new Date();
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() });

  const prev = () => setView(v => v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 });
  const next = () => setView(v => v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 });

  const days     = getDaysInMonth(view.y, view.m);
  const firstDay = getFirstDayOfMonth(view.y, view.m);
  const cells    = Array(firstDay).fill(null).concat(Array.from({ length: days }, (_, i) => i + 1));

  const isToday    = (d) => d === today.getDate() && view.m === today.getMonth() && view.y === today.getFullYear();
  const isSelected = (d) => { if (!value || !d) return false; return value.getDate() === d && value.getMonth() === view.m && value.getFullYear() === view.y; };
  const isPast     = (d) => { if (!d) return false; const cell = new Date(view.y, view.m, d); cell.setHours(0,0,0,0); const t = new Date(); t.setHours(0,0,0,0); return cell < t; };

  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0 mt-3 z-[200] bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-black/[0.06] p-4 w-[280px]">
      <div className="flex items-center justify-between mb-3">
        <button onClick={prev} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <p className="text-[13px] font-semibold text-[#111]">{MONTHS[view.m]} {view.y}</p>
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

      {/* Vehicle Selection Modal */}
      {showVehicleModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-semibold mb-2">Select your vehicle</h3>
            <p className="text-gray-500 text-sm mb-5">Which vehicle will you be parking?</p>
            
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {userVehicles.map(v => (
                <div 
                  key={v.id} 
                  onClick={() => {
                    setVehicleId(v.id.toString());
                    searchParams.set('vehicleId', v.id.toString());
                    setSearchParams(searchParams);
                    setShowVehicleModal(false);
                  }}
                  className={`p-4 border rounded-2xl cursor-pointer transition-colors flex items-center justify-between group ${activeVehicle?.id === v.id ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-black'}`}
                >
                  <div>
                    <h4 className="font-medium text-[#111]">{v.brand} {v.model}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">{v.registrationNo} • {v.year}</p>
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${activeVehicle?.id === v.id ? 'bg-black text-white' : 'bg-gray-50 group-hover:bg-black group-hover:text-white'}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-5 border-t border-gray-100 flex gap-3">
              <button 
                onClick={() => setShowVehicleModal(false)}
                className="flex-1 py-3 px-4 rounded-xl font-medium text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  const params = new URLSearchParams();
                  if (city) params.set('city', city);
                  if (date) params.set('date', date);
                  navigate(`/add-vehicle?${params.toString()}`);
                }}
                className="flex-1 py-3 px-4 rounded-xl font-medium text-sm text-white bg-[#111] hover:bg-black transition-colors"
              >
                Add New Vehicle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const formatDate = (d) => d ? `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}` : '';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const city = searchParams.get('city') || '';
  const date = searchParams.get('date') || '';
  const vehicleIdStr = searchParams.get('vehicleId');
  const [vehicleId, setVehicleId] = useState(vehicleIdStr);

  const [inputCity, setInputCity] = useState(city);
  // Parse date from URL string into a Date object for the calendar
  const parsedDate = date ? new Date(date) : null;
  const [inputDate, setInputDate] = useState(parsedDate);
  const [sortBy, setSortBy]       = useState('nearest'); // 'best' or 'nearest'
  const [showCal, setShowCal]     = useState(false);
  const calRef                    = useRef(null);

  const [properties, setProperties]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [mapCenter, setMapCenter]     = useState([12.9716, 77.5946]);
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  const [showFilter, setShowFilter]   = useState(false);
  const [filterTier, setFilterTier]   = useState([]);
  const [filterAmenities, setFilterAmenities] = useState([]);
  const [priceRange, setPriceRange]   = useState([0, 2000]);

  // Vehicle states
  const [userVehicles, setUserVehicles] = useState([]);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const activeVehicle = userVehicles.find(v => v.id.toString() === vehicleId?.toString());

  // Fetch user vehicles
  useEffect(() => {
    let mounted = true;
    const fetchVehicles = async () => {
      try {
        const token = getToken('AccessToken');
        if (!token) return;
        const res = await fetch('https://localhost:7108/api/Vehicle/my-vehicle', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (mounted && data.success && data.data) {
          setUserVehicles(data.data);
          // Auto-select if none selected
          if (!vehicleId && data.data.length > 0) {
            setVehicleId(data.data[0].id.toString());
          }
        }
      } catch (err) {
        console.error("Failed to fetch vehicles", err);
      }
    };
    fetchVehicles();
    return () => { mounted = false; };
  }, [vehicleId]);

  // Close calendar on outside click
  useEffect(() => {
    const handleClick = (e) => { if (calRef.current && !calRef.current.contains(e.target)) setShowCal(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchProps = async () => {
      setLoading(true);
      try {
        let lat = 12.9716;
        let lon = 77.5946;
        let apiCity = city;

        if (city) {
          const geoRes = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(city)}&limit=1`);
          const geoData = await geoRes.json();
          if (geoData.features && geoData.features.length > 0) {
            lon = geoData.features[0].geometry.coordinates[0];
            lat = geoData.features[0].geometry.coordinates[1];
            apiCity = geoData.features[0].properties.city || geoData.features[0].properties.name || city;
            if (mounted) setMapCenter([lat, lon]);
          }
        }

        const queryParams = new URLSearchParams();
        if (apiCity) queryParams.append('city', apiCity);
        queryParams.append('lat', lat);
        queryParams.append('lon', lon);
        queryParams.append('recommend', 'true');
        
        const url = `https://localhost:7108/api/LotBooking/partnered-lots?${queryParams.toString()}`;
        const token = getToken('AccessToken');
        const headers = token ? { "Authorization": `Bearer ${token}` } : {};
        
        try {
          const res = await fetch(url, { headers });
          if (res.ok) {
            const result = await res.json();
            const propsData = result.data || result || [];
            if (mounted) {
              const enhancedData = propsData.map(p => ({
                ...p,
                lat: p.latitude || (lat + (Math.random() - 0.5) * 0.1),
                lon: p.longitude || (lon + (Math.random() - 0.5) * 0.1)
              }));
              setProperties(enhancedData);
            }
          } else {
            if (mounted) setProperties([]);
          }
        } catch (err) {
          console.error("API Error", err);
          if (mounted) setProperties([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProps();
    return () => { mounted = false; };
  }, [city, date]);

  // Apply client-side filters
  const filteredProperties = properties.filter(p => {
    const price = parseFloat(p.pricePerDay) || 0;
    if (price < priceRange[0] || price > priceRange[1]) return false;
    if (filterTier.length > 0 && !filterTier.includes(p.tier)) return false;
    if (filterAmenities.includes('CCTV') && !p.propertyDetails?.hasCCTV) return false;
    if (filterAmenities.includes('Security') && !p.propertyDetails?.hasSecurity) return false;
    if (filterAmenities.includes('Workshop') && !p.propertyDetails?.hasWorkshop) return false;
    if (filterAmenities.includes('Washing') && !p.propertyDetails?.hasWashingArea) return false;
    if (filterAmenities.includes('EV Charging') && !p.propertyDetails?.extraFacilities?.includes('EV')) return false;
    return true;
  });

  const toggleTier = (t) => setFilterTier(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  const toggleAmenity = (a) => setFilterAmenities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);

  const TIERS   = ['Premium Private Garage', 'Standard Parking', 'Open Lot'];
  const AMENITIES = ['CCTV', 'Security', 'Workshop', 'Washing', 'EV Charging'];

  const sortedProperties = [...filteredProperties].sort((a, b) => {
    if (sortBy === 'best') {
      if (a.isRecommendedByAi && !b.isRecommendedByAi) return -1;
      if (!a.isRecommendedByAi && b.isRecommendedByAi) return 1;
    }
    return 0; // Default remains untouched (which is distance-sorted by backend)
  });

  return (
    <div className="h-screen bg-[#fafafa] font-sans flex flex-col overflow-hidden">
      <Navbar />

      {/* TOP FILTER BAR — same left margin as the list (pl-14 on md+) */}
      <div className="w-full bg-white border-b border-black/[0.06] z-40 pt-[62px] shrink-0">
        <div className="px-4 md:px-14 py-4 flex flex-col md:flex-row items-stretch md:items-center gap-4">

          {/* Search bar */}
          <div className="flex flex-1 md:flex-none items-center bg-white border border-black/[0.06] rounded-full p-1 shadow-sm w-full md:w-auto">
            <input 
              type="text"
              value={inputCity}
              onChange={e => setInputCity(e.target.value)}
              placeholder="Location..."
              className="px-4 py-2 flex-1 md:flex-none md:w-[160px] bg-transparent outline-none border-r border-black/[0.04] text-[14px] font-semibold text-[#111] placeholder:text-gray-400 min-w-0"
            />

            {/* Calendar date button */}
            <div className="relative" ref={calRef}>
              <button
                onClick={() => setShowCal(s => !s)}
                className="pl-4 pr-2 py-2 w-[140px] text-left bg-transparent outline-none text-[14px] font-medium text-[#666] flex items-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-[#999]">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span>{inputDate ? formatDate(inputDate) : 'Select Date'}</span>
              </button>
              {showCal && (
                <CalendarPopover
                  value={inputDate}
                  onChange={setInputDate}
                  onClose={() => setShowCal(false)}
                />
              )}
            </div>

            <button 
              onClick={() => {
                const params = new URLSearchParams();
                if (inputCity) params.set('city', inputCity);
                if (inputDate) params.set('date', inputDate.toISOString().split('T')[0]);
                setSearchParams(params);
              }} 
              className=" w-9 h-9 rounded-full bg-[#2563eb] flex items-center justify-center hover:bg-[#2d6df0] transition-colors shrink-0"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </button>
          </div>

          {/* Active Vehicle Chip */}
          {activeVehicle && (
            <div className="flex items-center bg-gray-50 border border-black/[0.08] rounded-full p-1 shrink-0 h-[46px]">
              <div className="w-9 h-9 rounded-full overflow-hidden bg-white border border-black/[0.04] flex items-center justify-center shrink-0">
                <img 
                  src={`https://logo.clearbit.com/${(activeVehicle.brand || 'car').toLowerCase().replace(/\s+/g, '')}.com`} 
                  onError={(e) => { 
                    e.target.onerror = null; 
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(activeVehicle.brand || 'Car')}&background=random&color=fff`; 
                  }}
                  alt="Car Logo" 
                  className="w-6 h-6 object-contain" 
                />
              </div>
              <div className="px-3 flex flex-col justify-center">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider leading-none mb-0.5">Parking</p>
                <p className="text-[13px] font-semibold text-[#111] leading-none">{activeVehicle.brand} {activeVehicle.model}</p>
              </div>
              <button 
                onClick={() => setShowVehicleModal(true)}
                className="h-full px-4 ml-1 text-[12px] font-semibold text-blue-600 bg-white border border-black/[0.04] rounded-full hover:bg-blue-50 transition-colors shadow-sm"
              >
                Change
              </button>
            </div>
          )}

          {/* Filter button */}
          <button
            onClick={() => setShowFilter(true)}
            className="flex items-center justify-center md:justify-start gap-2 px-4 py-2.5 border border-black/[0.1] rounded-full text-[13px] font-semibold text-[#111] hover:bg-gray-50 transition-colors shrink-0"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
            Filters
            {(filterTier.length + filterAmenities.length) > 0 && (
              <span className="bg-[#111] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {filterTier.length + filterAmenities.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA — flex-1 fills remaining height, map is sticky */}
      <div className="flex-1 flex w-full min-h-0">

        {/* LIST VIEW (Left Side) — scrollable only */}
        <div className={`no-scrollbar overflow-y-auto px-4 md:px-14 py-8 transition-all duration-500 ease-in-out ${isMapExpanded ? 'w-0 opacity-0 overflow-hidden px-0' : 'flex-1'}`}>
          <h1 className="text-[28px] font-semibold text-[#111] mb-2 tracking-tight">
             Properties in {city || 'your area'}
          </h1>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <p className="text-[15px] text-[#666]">
              {sortedProperties.length} secure facilities found.
            </p>
            
            <div className="flex items-center gap-1 bg-white border border-black/[0.08] p-1 rounded-full shadow-sm w-fit">
              <button 
                onClick={() => setSortBy('nearest')}
                className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors ${sortBy === 'nearest' ? 'bg-[#111] text-white' : 'text-[#666] hover:bg-gray-50'}`}
              >
                Nearest
              </button>
              <button 
                onClick={() => setSortBy('best')}
                className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors flex items-center gap-1 ${sortBy === 'best' ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' : 'text-[#666] hover:bg-gray-50'}`}
              >
                ★ Best (AI)
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-full h-[250px] bg-gray-200 animate-pulse rounded-3xl" />
              ))}
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center py-20 text-[#aaa]">
              <svg className="mx-auto mb-4 opacity-30" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <p className="text-[16px] font-medium">No properties found</p>
              <p className="text-[14px] mt-1">Try adjusting your filters or search a different location.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 pb-12">
              {sortedProperties.map(p => {
                // Amenities from backend only
                const amenities = [
                  p.propertyDetails?.hasCCTV        && { key: 'cctv',     label: 'CCTV' },
                  p.propertyDetails?.hasSecurity    && { key: 'security', label: 'Security' },
                  p.propertyDetails?.hasWorkshop    && { key: 'workshop', label: 'Workshop' },
                  p.propertyDetails?.hasWashingArea && { key: 'washing',  label: 'Washing' },
                  p.propertyDetails?.hasFireSafety  && { key: 'fire',     label: 'Fire Safety' },
                ].filter(Boolean);
                const extras = p.propertyDetails?.extraFacilities?.split(',').map(e => e.trim()).filter(Boolean) || [];
                const allChips = [...amenities.map(a => a.label), ...extras];

                const chipIcon = (key) => {
                  if (key === 'CCTV')        return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>;
                  if (key === 'Security')    return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
                  if (key === 'Workshop')    return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>;
                  if (key === 'Washing')     return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>;
                  if (key === 'Fire Safety') return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>;
                  return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>;
                };

                return (
                  <div key={p.id} className="group flex flex-col md:flex-row bg-white rounded-2xl overflow-hidden hover:shadow-[0_6px_24px_rgba(0,0,0,0.07)] transition-all duration-300 cursor-pointer border border-black/[0.05]">

                    {/* Image */}
                    <div className="w-full h-[200px] md:h-auto md:w-[320px] shrink-0 relative overflow-hidden">
                      <img
                        src={p.img || p.propertyImages?.[0] || p.slots?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80'}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                      {p.isRecommendedByAi && (
                        <div className="absolute top-3 left-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-[10px] font-bold tracking-wide shadow-md z-10 flex items-center gap-1">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                          Recommended for You
                        </div>
                      )}
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold text-[#111] shadow-sm">
                        &#9733; {p.rating || p.averageRating || 'New'} <span className="text-[#888] font-normal">({p.reviews || p.totalReviews || 0})</span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="px-5 py-4 flex flex-col flex-1 min-w-0 gap-1">

                      {/* Row 1: tag + price */}
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-semibold text-[#bf4800] tracking-widest uppercase">Secure Garage</p>
                        <span className="text-[16px] font-bold text-[#111]">&#8377;{p.pricePerDay || 150}<span className="text-[10px] text-[#999] font-normal ml-0.5">/day</span></span>
                      </div>

                      {/* Row 2: name */}
                      <h3 className="text-[15px] font-semibold text-[#111] truncate leading-snug">{p.name}</h3>

                      {/* Row 3: location */}
                      <p className="text-[11px] text-[#aaa] truncate">
                        {[p.city || city, p.state || 'Kerala', p.country || 'India'].filter(Boolean).join(', ')}
                      </p>

                      {/* Row 4: amenity chips — max 4, single row, no wrap */}
                      {allChips.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-1 overflow-hidden">
                          {allChips.slice(0, 4).map(label => (
                            <span key={label} className="flex items-center gap-1 shrink-0 text-[10px] font-medium text-[#555] bg-[#f4f4f4] border border-black/[0.04] px-2 py-0.5 rounded-full">
                              {chipIcon(label)}{label}
                            </span>
                          ))}
                          {allChips.length > 4 && (
                            <span className="text-[10px] text-[#aaa] shrink-0">+{allChips.length - 4} more</span>
                          )}
                        </div>
                      )}

                      {/* Row 5: View Details right-aligned (hidden on mobile) */}
                      <div className="hidden sm:flex justify-end mt-auto pt-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/garage/${p.id}`); }}
                          className="bg-[#2563eb] text-white px-4 py-1.5 rounded-lg text-[12px] font-semibold hover:bg-blue-600 transition-colors"
                        >
                          View Details
                        </button>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Floating Mobile Map Button */}
        <button
          onClick={() => setIsMapExpanded(true)}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] lg:hidden bg-[#111] text-white shadow-[0_8px_30px_rgba(0,0,0,0.4)] rounded-full px-5 py-3 flex items-center gap-2 hover:bg-gray-800 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
          <span className="text-[14px] font-semibold">Map View</span>
        </button>

        {/* MAP VIEW — fullscreen portal OR right-side panel */}
        {isMapExpanded ? (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 300 }}>
            <MapContainer center={mapCenter} zoom={12} scrollWheelZoom={true} style={{ width: '100%', height: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              />
              <MapUpdater center={mapCenter} />
              <MapResizer />
              <Circle center={mapCenter} radius={30000} pathOptions={{ color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.08, weight: 1.5 }} />
              {filteredProperties.map(p => (
                <Marker key={p.id} position={[p.lat, p.lon]}>
                  <Popup className="rounded-xl overflow-hidden shadow-xl p-0 custom-popup">
                    <div className="w-[200px]">
                      <img src={p.img || p.propertyImages?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'} className="w-full h-[120px] object-cover" />
                      <div className="p-3">
                        <h4 className="font-semibold text-[14px] text-[#111] mb-1 truncate">{p.name}</h4>
                        <p className="text-[14px] font-bold text-[#bf4800]">&#8377;{p.pricePerDay}/day</p>
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
          /* Normal right-side panel */
          <div className="relative bg-gray-100 border-l border-black/[0.06] shrink-0 sticky top-0 self-start hidden lg:flex lg:w-[35%]" style={{ height: '100%' }}>
            <MapContainer center={mapCenter} zoom={12} scrollWheelZoom={true} className="w-full h-full z-0">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              />
              <MapUpdater center={mapCenter} />
              <Circle center={mapCenter} radius={30000} pathOptions={{ color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.08, weight: 1.5 }} />
              {filteredProperties.map(p => (
                <Marker key={p.id} position={[p.lat, p.lon]}>
                  <Popup className="rounded-xl overflow-hidden shadow-xl p-0 custom-popup">
                    <div className="w-[200px]">
                      <img src={p.img || p.propertyImages?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'} className="w-full h-[120px] object-cover" />
                      <div className="p-3">
                        <h4 className="font-semibold text-[14px] text-[#111] mb-1 truncate">{p.name}</h4>
                        <p className="text-[14px] font-bold text-[#bf4800]">₹{p.pricePerDay}/day</p>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
            {/* Expand Map button — top-right corner, away from Leaflet +/- zoom top-left */}
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

      {/* FILTER SIDEBAR */}
      <AnimatePresence>
        {showFilter && (
          <div className="fixed inset-0 z-[2000] flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowFilter(false)} 
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-[85vw] md:w-[340px] max-w-full bg-white h-full shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-black/[0.06]">
                <h2 className="text-[18px] font-semibold text-[#111]">Filters</h2>
                <button onClick={() => setShowFilter(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-8">

                {/* Price Range — styled dual thumb */}
                <div>
                  <p className="text-[13px] font-semibold text-[#111] uppercase tracking-wider mb-5">Price Range / day</p>

                  {/* Dual range track */}
                  <div className="relative h-[2px] bg-gray-200 rounded-full mx-2 mt-6 mb-4">
                    {/* Active track fill */}
                    <div
                      className="absolute h-full bg-[#111] rounded-full"
                      style={{
                        left: `${(priceRange[0] / 5000) * 100}%`,
                        right: `${100 - (priceRange[1] / 5000) * 100}%`
                      }}
                    />
                    {/* Min thumb */}
                    <input
                      type="range" min="0" max="5000" step="50"
                      value={priceRange[0]}
                      onChange={e => { const v = parseInt(e.target.value); if (v < priceRange[1] - 100) setPriceRange([v, priceRange[1]]); }}
                      className="price-range-thumb absolute w-full"
                      style={{ zIndex: priceRange[0] > 4800 ? 5 : 3 }}
                    />
                    {/* Max thumb */}
                    <input
                      type="range" min="0" max="5000" step="50"
                      value={priceRange[1]}
                      onChange={e => { const v = parseInt(e.target.value); if (v > priceRange[0] + 100) setPriceRange([priceRange[0], v]); }}
                      className="price-range-thumb absolute w-full"
                      style={{ zIndex: 4 }}
                    />
                  </div>

                  {/* Values displayed below like reference image */}
                  <div className="flex items-center gap-1 mt-3">
                    <span className="text-[15px] font-bold text-[#111]">&#8377; {priceRange[0].toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    <span className="text-[13px] text-[#aaa] mx-1">-</span>
                    <span className="text-[15px] font-bold text-[#111]">&#8377; {priceRange[1].toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* Garage Tier */}
                <div>
                  <p className="text-[13px] font-semibold text-[#111] uppercase tracking-wider mb-4">Garage Type</p>
                  <div className="flex flex-col gap-2">
                    {TIERS.map(t => (
                      <label key={t} className="flex items-center gap-3 cursor-pointer group">
                        <div
                          onClick={() => toggleTier(t)}
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer ${filterTier.includes(t) ? 'bg-[#111] border-[#111]' : 'border-gray-300 group-hover:border-gray-500'}`}
                        >
                          {filterTier.includes(t) && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6 9 17l-5-5"/></svg>}
                        </div>
                        <span className="text-[14px] text-[#333]">{t}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Amenities */}
                <div>
                  <p className="text-[13px] font-semibold text-[#111] uppercase tracking-wider mb-4">Amenities</p>
                  <div className="flex flex-wrap gap-2">
                    {AMENITIES.map(a => (
                      <button
                        key={a}
                        onClick={() => toggleAmenity(a)}
                        className={`px-4 py-2 rounded-full text-[13px] font-medium border transition-all ${filterAmenities.includes(a) ? 'bg-[#111] text-white border-[#111]' : 'border-gray-200 text-[#555] hover:border-gray-400'}`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer actions */}
              <div className="px-6 py-5 border-t border-black/[0.06] flex gap-3">
                <button
                  onClick={() => { setFilterTier([]); setFilterAmenities([]); setPriceRange([0, 2000]); }}
                  className="flex-1 py-2.5 rounded-xl border border-black/[0.1] text-[14px] font-semibold text-[#111] hover:bg-gray-50 transition-colors"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowFilter(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#111] text-white text-[14px] font-semibold hover:bg-gray-800 transition-colors"
                >
                  Show Results
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating map button for mobile */}
      {!isMapExpanded && (
        <button 
          onClick={() => setIsMapExpanded(true)}
          className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-[#111] text-white px-6 py-3 rounded-full flex items-center gap-2 shadow-[0_8px_30px_rgba(0,0,0,0.2)] font-semibold text-[14px]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          Map View
        </button>
      )}

      {/* Custom CSS for Leaflet Popup + hide scrollbars + price range thumb */}
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

        .price-range-thumb {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          pointer-events: none;
          height: 0;
          top: 50%;
          transform: translateY(-50%);
          position: absolute;
          width: 100%;
          outline: none;
          margin: 0;
        }
        .price-range-thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #111;
          cursor: pointer;
          pointer-events: all;
          border: none;
          box-shadow: 0 1px 6px rgba(0,0,0,0.3);
        }
        .price-range-thumb::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #111;
          cursor: pointer;
          pointer-events: all;
          border: none;
          box-shadow: 0 1px 6px rgba(0,0,0,0.3);
        }
        .price-range-thumb::-webkit-slider-runnable-track { background: transparent; }
        .price-range-thumb::-moz-range-track { background: transparent; }
      `}</style>
    </div>
  );
}
