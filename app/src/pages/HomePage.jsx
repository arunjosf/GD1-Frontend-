import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ChatBot from '../components/ChatBot';
import { useAuth } from '../context/AuthContext';
import { getToken } from '../api/auth';

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
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 z-50 bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-black/[0.06] p-4 w-[280px]">
      {/* nav */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prev} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <p className="text-[13px] font-semibold text-[#111]">{MONTHS[view.m]} {view.y}</p>
        <button onClick={next} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
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

/* ────────────────────────────────────────
   GARAGE CARD
──────────────────────────────────────── */
const GARAGES = [
  { id: 1, name: 'Prestige Complex', subtitle: 'The magic of space at a surprising price.', location: 'Koramangala, Bengaluru', pricePerDay: '150.00', pricePerMo: '4500.00', rating: 4.9, reviews: 128, tag: 'New', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80' },
  { id: 2, name: 'Vault Space', subtitle: 'Secure your asset with 24/7 CCTV surveillance.', location: 'HSR Layout, Bengaluru', pricePerDay: '100.00', pricePerMo: '2800.00', rating: 4.7, reviews: 84, tag: 'Popular', img: 'https://images.unsplash.com/photo-1592853625511-ad0edcc69c07?w=400&q=80' },
  { id: 3, name: 'The Depot', subtitle: 'Premium biometric entry for ultimate safety.', location: 'Indiranagar, Bengaluru', pricePerDay: '120.00', pricePerMo: '3200.00', rating: 4.8, reviews: 96, tag: 'Premium', img: 'https://images.unsplash.com/photo-1580274455191-1c62238fa333?w=400&q=80' },
  { id: 4, name: 'Sovereign Bay', subtitle: 'A climate-controlled suite for your luxury ride.', location: 'Whitefield, Bengaluru', pricePerDay: '180.00', pricePerMo: '5100.00', rating: 5.0, reviews: 52, tag: 'Featured', img: 'https://images.unsplash.com/photo-1567459169668-a82c0a7ba843?w=400&q=80' },
];

function GarageCard({ g }) {
  const navigate = useNavigate();
  return (
    <div 
      onClick={() => navigate(`/garage/${g.id}`)}
      className="flex flex-col w-full min-w-[280px] max-w-[340px] flex-shrink-0 group cursor-pointer text-left items-start"
    >
      {/* Image Container */}
      <div className="w-full rounded-[13px] overflow-hidden flex justify-center mb-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-all duration-300 relative aspect-[4/3]">
        <img src={g.img || g.propertyImages?.[0] || g.slots?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80'} alt={g.name} className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-500" />
      </div>

      {/* Details */}
      <p className="text-[12px] font-semibold text-[#bf4800] mb-2">{g.tag || (g.city ? `Near ${g.city}` : 'Available')}</p>
      <h3 className="text-[28px] font-semibold text-[#1d1d1f] tracking-tight mb-2 truncate w-full">{g.name}</h3>
      <p className="text-[16px] text-[#1d1d1f] mb-3 truncate w-full">{g.location || g.city || 'Premium Storage'}</p>
      
      <p className="text-[14px] text-[#1d1d1f] mb-6 font-medium">
        From ₹{g.pricePerDay}** /day
      </p>
    </div>
  );
}

/* ────────────────────────────────────────
   HOW IT WORKS STEPS
──────────────────────────────────────── */
const STEPS = [
  { n: '01', title: 'Search & Discover', desc: 'Use your location or search by city to browse certified GD1 garages near you with real-time availability.' },
  { n: '02', title: 'Pick a Date & Book', desc: 'Choose your move-in date, review the facility, and confirm your booking hassle-free in under 2 minutes.' },
  { n: '03', title: 'Park & Relax', desc: 'Your vehicle is secured with 24/7 CCTV, biometric access, and climate control-fully tracked in your dashboard.' },
];

/* ────────────────────────────────────────
   STATS
──────────────────────────────────────── */
const STATS = [
  { value: '27,000+', label: 'Trusted Users' },
  { value: '500+', label: 'Certified Garages' },
  { value: '150+', label: 'Service Centers' },
  { value: '48h', label: 'Partner Onboarding' },
];

/* ────────────────────────────────────────
   HOME PAGE
──────────────────────────────────────── */
export default function HomePage() {
  const { user, logout, userVehicles, vehiclesLoading, fetchUserVehicles } = useAuth();
  const navigate = useNavigate();

  // Search state
  const [city, setCity] = useState('');
  const [date, setDate] = useState(null);
  const [locationLabel, setLocationLabel] = useState('');
  const [locLoading, setLocLoading] = useState(false);
  
  // Vehicle Selection Modal State
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [localUserVehicles, setLocalUserVehicles] = useState([]);
  const [isFetchingVehicles, setIsFetchingVehicles] = useState(false);
  
  // Properties state
  const [topGarages, setTopGarages] = useState([]);
  const [hasLocation, setHasLocation] = useState(false);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const isSelecting = useRef(false);
  const cityRef = useRef(null);
  
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Placeholder Typing Effect
  const fullPlaceholder = "City, area, or location...";
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  
  useEffect(() => {
    if (city.length > 0 || isSearchFocused) return;
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % (fullPlaceholder.length + 10)); // +10 for pause
    }, 150);
    return () => clearInterval(interval);
  }, [city, isSearchFocused]);
  
  const displayPlaceholder = city.length > 0 || isSearchFocused ? fullPlaceholder : fullPlaceholder.slice(0, Math.min(placeholderIndex, fullPlaceholder.length)) + "|";

  const [showCal, setShowCal] = useState(false);
  const calRef = useRef(null);
  
  const searchBarRef = useRef(null);
  const handleSearchFocus = () => {
    if (searchBarRef.current) {
      searchBarRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Intersection observer for steps animation
  const stepsRef = useRef(null);
  const [stepsVisible, setStepsVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setStepsVisible(true);
    }, { threshold: 0.2 });
    if (stepsRef.current) observer.observe(stepsRef.current);
    return () => observer.disconnect();
  }, []);

  // Close popovers on outside click
  useEffect(() => {
    const handler = (e) => { 
      if (calRef.current && !calRef.current.contains(e.target)) {
        // Only close on outside click if a date has already been selected
        if (date) setShowCal(false);
      }
      if (cityRef.current && !cityRef.current.contains(e.target)) setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [date]);

  // Fetch properties and handle location based on role
  useEffect(() => {
    let mounted = true;
    const fetchProps = async (lat, lon) => {
      try {
        let url = `https://gd1-grand-auto-depot-one-9ms1.onrender.com/api/LotBooking/partnered-lots?recommend=true`;
        if (lat && lon) url += `&lat=${lat}&lon=${lon}`;
        
        const token = getToken('AccessToken');
        const headers = token ? { "Authorization": `Bearer ${token}` } : {};
        
        const res = await fetch(url, { headers });
        if (res.ok) {
          const result = await res.json();
          const propsData = result.data || result;
          if (propsData && propsData.length > 0 && mounted) {
             setTopGarages(propsData.slice(0, 7));
          }
        }
      } catch (err) {
        console.error('Fetch properties error:', err);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!mounted) return;
          const l = pos.coords.latitude;
          const lg = pos.coords.longitude;
          setHasLocation(true);
          fetchProps(l, lg);
        },
        (err) => {
          if (!mounted) return;
          setHasLocation(false);
          // don't fetch if location is denied
        }
      );
    } else {
      setHasLocation(false);
    }
    
    return () => { mounted = false; };
  }, [user]);

  // Fetch Autocomplete Suggestions
  useEffect(() => {
    if (isSelecting.current) {
      isSelecting.current = false;
      return;
    }

    if (!city || city.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsTyping(true);
    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(city)}&limit=5`);
        const data = await res.json();
        
        const uniqueLabels = new Set();
        const formattedSuggestions = (data.features || [])
          .map(item => {
            const props = item.properties || {};
            // prioritize the primary name, then fallbacks
            const label = props.name || props.city || props.town || props.village || props.county || props.state;
            return label ? `${label}${props.state && props.state !== label ? `, ${props.state}` : ''}` : null;
          })
          .filter(label => {
            if (!label || uniqueLabels.has(label)) return false;
            uniqueLabels.add(label);
            return true;
          });
          
        setSuggestions(formattedSuggestions);
        setShowSuggestions(formattedSuggestions.length > 0);
      } catch (err) {
        console.error("Autocomplete error", err);
      } finally {
        setIsTyping(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [city]);

  const handleSelectCity = (suggestion) => {
    isSelecting.current = true;
    setCity(suggestion);
    setShowSuggestions(false);
    // Automatically open calendar after selecting location
    if (!date) setShowCal(true);
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) return;
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lon } = pos.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          const data = await res.json();
          const label = data.address?.city || data.address?.town || data.address?.village || data.address?.suburb || data.address?.county || data.address?.state_district || `${lat.toFixed(3)}, ${lon.toFixed(3)}`;
          setLocationLabel(label);
          isSelecting.current = true;
          setCity(label);
        } catch {
          setLocationLabel('Location detected');
        }
        setLocLoading(false);
        if (!date) setShowCal(true);
      },
      () => setLocLoading(false)
    );
  };

  const handleSearch = async () => {
    if (!city) {
      if (cityRef.current) cityRef.current.querySelector('input')?.focus();
      return;
    }
    if (!date) {
      setShowCal(true);
      return;
    }

    if (!user) {
      // Not logged in -> go to login
      navigate('/login');
      return;
    }

    setIsFetchingVehicles(true);
    try {
      let vehicles = userVehicles;
      
      // If vehicles haven't been loaded yet, load them now
      if (!vehicles) {
        if (!vehiclesLoading) {
          await fetchUserVehicles();
        }
        // Wait a tiny bit for the context state to catch up if needed, 
        // or just fetch directly as fallback
        const token = getToken('AccessToken');
        const res = await fetch('https://gd1-grand-auto-depot-one-9ms1.onrender.com/api/Vehicle/my-vehicle', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.status === 401) {
          await logout();
          navigate('/login');
          return;
        }
        const data = await res.json();
        vehicles = data.data || [];
      }
      
      const params = new URLSearchParams();
      const dateStr = date ? `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : '';
      if (city) {
        params.set('city', city);
        localStorage.setItem('gd1_search_city', city);
      }
      if (dateStr) {
        params.set('date', dateStr);
        localStorage.setItem('gd1_search_date', dateStr);
      }

      if (vehicles.length === 0) {
        // Redirect to Add Vehicle page
        navigate(`/add-vehicle?${params.toString()}`);
      } else if (vehicles.length === 1) {
        // Proceed directly with the only vehicle
        params.set('vehicleId', vehicles[0].id);
        navigate(`/search?${params.toString()}`);
      } else {
        // Show modal to pick a vehicle
        setLocalUserVehicles(vehicles); // We can just use the local state in HomePage
        setShowVehicleModal(true);
      }
    } catch (err) {
      console.error("Vehicle fetch error:", err);
      // Fallback
      const params = new URLSearchParams();
      const dateStr = date ? `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : '';
      if (city) params.set('city', city);
      if (dateStr) params.set('date', dateStr);
      navigate(`/add-vehicle?${params.toString()}`);
    } finally {
      setIsFetchingVehicles(false);
    }
  };

  const handleSelectVehicle = (vId) => {
    const params = new URLSearchParams();
    const dateStr = date ? `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : '';
    if (city) {
      params.set('city', city);
      localStorage.setItem('gd1_search_city', city);
    }
    if (dateStr) {
      params.set('date', dateStr);
      localStorage.setItem('gd1_search_date', dateStr);
    }
    params.set('vehicleId', vId);
    navigate(`/search?${params.toString()}`);
  };

  const handleAddNewVehicle = () => {
    const params = new URLSearchParams();
    const dateStr = date ? `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : '';
    if (city) {
      params.set('city', city);
      localStorage.setItem('gd1_search_city', city);
    }
    if (dateStr) {
      params.set('date', dateStr);
      localStorage.setItem('gd1_search_date', dateStr);
    }
    navigate(`/add-vehicle?${params.toString()}`);
  };

  const formatDate = (d) => d ? `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}` : '';

  return (
    <div className="min-h-screen bg-[#FFFFFE] font-sans">
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative w-full min-h-[90vh] bg-[#FFFFFE] pt:15 lg:pt-28 pb:18 lg:pb-12 px-[4vw] flex flex-col justify-between z-30">
        
        {/* Top Header Row */}
        <div className="relative z-20 flex flex-col lg:flex-row justify-between items-start w-full gap-8 lg:gap-0">
          
          {/* Top Left Text & Button */}
          <div className="max-w-[800px]">
            <h1 className="text-[22px] sm:text-[30px] lg:text-[32px] leading-[1.25] font-normal text-[#1a1a1a] tracking-loose mb-5">
              Find your perfect garage space where <br className="hidden md:block" />
              security, and maintenance come <br className="hidden md:block" />
              together for your vehicle.
            </h1>
            
            <div className="mt-6 flex flex-col items-start gap-4">
              <div className="flex items-center -space-x-3">
                <img src="/user1.png" alt="User" className="w-8 h-8 rounded-full border-2 border-[#FFFFFE] object-cover shadow-sm relative z-30" />
                <img src="/user2.png" alt="User" className="w-8 h-8 rounded-full border-2 border-[#FFFFFE] object-cover shadow-sm relative z-20" />
                <img src="/user3.png" alt="User" className="w-8 h-8 rounded-full border-2 border-[#FFFFFE] object-cover shadow-sm relative z-10" />
              </div>
              <p className="text-[13px] text-[#888] leading-relaxed max-w-[320px] font-medium">
                Over 27,000+ Users Count on Us for <br></br>
                Safe Vehicle Care & Storage
              </p>
            </div>
          </div>

          {/* Top Right Video */}
          <div className="hidden lg:flex flex-col items-start gap-3 mt-4 mr-10">
            <div className="relative w-48 h-28 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.12)] cursor-pointer group bg-gray-100 flex-shrink-0">
              <video src="/hero_video.mp4" className="w-full h-full object-cover" muted loop playsInline autoPlay />
              {/* Play Button Overlay */}
              <div className="absolute inset-0 bg-black/5 group-hover:bg-black/15 transition-colors flex items-center justify-center">
                <div className="w-8 h-8 lg:w-12 lg:h-12 rounded-full bg-white/70 backdrop-blur-md flex items-center justify-center shadow-lg">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none" className="ml-1 lg:hidden"><path d="M5 3l14 9-14 9V3z"/></svg>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="none" className="ml-1 hidden lg:block"><path d="M5 3l14 9-14 9V3z"/></svg>
                </div>
              </div>
            </div>
            <p className="text-[12px] lg:text-[13px] font-medium text-[#888] max-w-[150px] leading-snug">
              Your vehicle safe in our hands
            </p>
          </div>
        </div>

        {/* Centered Car Image Overlapping */}
        <div className="absolute top-[55%] lg:top-[45%] left-[4vw] lg:left-1/2 translate-x-0 lg:-translate-x-1/2 -translate-y-1/2 w-[85%] sm:w-[65%] md:w-[50%] max-w-[800px] z-10 pointer-events-none">
          <img src="/HeroCar.png" alt="Hero Car" className="w-full h-auto object-contain pt-10 pb-16 lg:pt-0 lg:pb-0" />
        </div>

        {/* Bottom Bar: Left Steps & Right Search */}
        <div className="relative z-20 flex flex-col lg:flex-row justify-between items-end gap-10 mt-auto pt:15 lg:pt-20">
          
          {/* Left Steps Box */}
          <div className="bg-white/60 backdrop-blur-xl rounded-[20px] p-5 w-full lg:w-[300px] shadow-sm border border-white/40 hidden lg:block">
            {STEPS.map((s, i) => (
              <div key={i} className={`flex gap-4 py-3 ${i !== STEPS.length - 1 ? 'border-b border-gray-200/50' : ''} ${i === 0 ? 'pt-0' : ''} ${i === STEPS.length - 1 ? 'pb-0' : ''}`}>
                <span className="text-[#888] text-[12px] font-medium mt-0.5">({s.n})</span>
                <div>
                  <h4 className={`text-[13px] font-medium ${i === 0 ? 'text-[#1a1a1a]' : 'text-[#666]'}`}>{s.title}</h4>
                  {i === 0 && (
                    <p className="text-[11px] text-[#666] mt-1.5 leading-[1.6] font-light">
                      {s.desc}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Right Search Bar */}
          <div className="flex flex-col items-end w-full lg:w-[700px] xl:w-[670px]">
            
          {/* ── SEARCH BAR ── */}
          <div ref={searchBarRef} className="w-full bg-white rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.15)] border border-black/[0.04] p-1 flex flex-col md:flex-row gap-2">

            {/* City Search */}
            <div ref={cityRef} className="flex-[1.5] flex items-center gap-3 px-1.5 py-1 rounded-xl hover:bg-gray-50 transition-colors relative">
              <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b3b3b" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              </div>
              <div className="text-left flex-1 min-w-0">
                <input
                  value={city}
                  onChange={e => { setCity(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => { 
                    setIsSearchFocused(true);
                    handleSearchFocus();
                    if (suggestions.length > 0) setShowSuggestions(true); 
                  }}
                  onBlur={() => setIsSearchFocused(false)}
                  placeholder={displayPlaceholder}
                  className="w-full text-[15px] font-medium text-[#333] bg-transparent outline-none placeholder-[#999]"
                />
              </div>
              <button 
                onClick={handleUseLocation}
                disabled={locLoading}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-[12px] font-semibold whitespace-nowrap"
                title="Use my precise location"
              >
                {locLoading ? (
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                )}
                Locate
              </button>

              {/* Autocomplete Dropdown */}
              {showSuggestions && (
                <div className="absolute top-[110%] left-0 w-full bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.1)] border border-black/[0.06] p-2 z-50 overflow-hidden">
                  {isTyping ? (
                    <div className="px-4 py-3 text-[13px] text-[#888] flex items-center gap-2 font-medium">
                      <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                      Searching locations...
                    </div>
                  ) : (
                    suggestions.map((sg, i) => (
                      <div 
                        key={i} 
                        onClick={() => handleSelectCity(sg)}
                        className="px-4 py-3 hover:bg-gray-50 rounded-xl cursor-pointer text-[14px] font-medium text-[#333] transition-colors flex items-center gap-3"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        {sg}
                      </div>
                    ))
                  )}
                </div>
              )}
              </div>

            <div className="w-px bg-gray-100 hidden md:block self-stretch my-2" />

            {/* Date */}
            <div ref={calRef} className="flex-1 relative">
                          <button onClick={() => { setShowCal(true); handleSearchFocus(); }} className="w-full text-left flex items-center gap-3 bg-transparent hover:bg-gray-50 rounded-xl px-1.5 py-0.5 transition-colors relative">
                  <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b3b3b" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[15px] font-medium truncate ${date ? 'text-[#333]' : 'text-[#999]'}`}>{date ? formatDate(date) : 'Move-in Date'}</p>
                  </div>
                  {showCal && (
                    <div ref={calRef} onClick={e => e.stopPropagation()}>
                      <CalendarPopover value={date} onChange={setDate} onClose={() => setShowCal(false)} />
                    </div>
                  )}
                </button>
              </div>

              {/* Search Button */}
              <button
                type="button"
                onClick={handleSearch}
                disabled={isFetchingVehicles}
                className="flex items-center justify-center gap-2 bg-[#2563eb] hover:bg-[#2d6df0] text-white text-[14px] font-semibold rounded-[23px] px-7 py-2 transition-colors duration-100 whitespace-nowrap disabled:opacity-70"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                {isFetchingVehicles ? 'Loading...' : 'Search'}
              </button>
            </div>

          {/* Quick chips */}
          <div className="flex flex-wrap justify-end gap-2 mt-5">
            {['Koramangala', 'HSR Layout', 'Indiranagar', 'Whitefield', 'MG Road'].map(place => (
              <button
                key={place}
                onClick={() => { setCity(place); if (!date) setShowCal(true); }}
                className="text-[12px] text-[#555] border border-[#111]/10 rounded-full px-4 py-1.5 hover:border-[#111]/30 hover:text-[#111] transition-all bg-white/50 backdrop-blur-sm"
              >
                {place}
              </button>
            ))}
          </div>
        </div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section className="relative w-full px-[6vw] pt-18 pb-10 md:pb-16 overflow-hidden z-20">
        <div className="relative z-10 max-w-[1200px] mx-auto py-4 px-4 md:py-6 md:px-8 rounded-2xl md:rounded-[32px] bg-gradient-to-r from-white/60 via-[#bae6fd]/40 to-white/60 backdrop-blur-2xl border border-white/60 shadow-[inset_0_1px_1px_rgba(255,255,255,1),inset_0_-1px_1px_rgba(255,255,255,0.4),0_4px_24px_rgba(0,0,0,0.03)] grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {STATS.map(s => (
            <div key={s.label} className="text-center">
              <p className="text-[clamp(2rem,3vw,3rem)] font-medium text-[#1d1d1f] tracking-tight mb-1">{s.value}</p>
              <p className="text-[12px] text-[#86868b] font-medium tracking-widest">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="w-full py-12 md:py-24 px-[5vw] bg-[#FFFFFE]">
        <div className="max-w-[1200px] mx-auto">
          {/* Header Row */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 md:mb-16 gap-6 md:gap-8">
            <h2 className="text-[clamp(2rem,3vw,3rem)] font-medium tracking-tight text-[#111] leading-[1.1] max-w-[650px]">
              Book a premium garage <span className="relative inline-block mt-2"> online in just 3 simple steps</span>
            </h2>
            <p className="text-[14px] text-[#666] leading-relaxed max-w-[450px]">
              Book secure vehicle storage effortlessly <br className="hidden md:block" />and manage everything from your fingertips, <br className="hidden md:block" /> anytime and anywhere.
            </p>
          </div>

          {/* Cards Grid */}
          <div ref={stepsRef} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((s, i) => (
              <div key={s.n} className="relative flex flex-col justify-end bg-[#fafafa] rounded-[25px] p-8 pt-32 overflow-hidden group border border-black/[0.04]">
                {/* Huge Watermark Number - Animated */}
                <div 
                  className={`absolute -top-4 md:-top-6 -right-2 text-[120px] md:text-[200px] font-bold text-black/[0.03] leading-none select-none pointer-events-none group-hover:scale-105 transition-all duration-1000 ${stepsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} 
                  style={{ transitionDelay: `${i * 300}ms` }}
                >
                  {parseInt(s.n)}
                </div>

                {/* Icon Box */}
                <div className="relative z-10 w-12 h-12 rounded-2xl bg-white border border-black/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center justify-center mb-6">
                  {i === 0 && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>}
                  {i === 1 && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>}
                  {i === 2 && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>}
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <h3 className="text-[17px] font-semibold text-[#111] mb-3 tracking-tight">Step {parseInt(s.n)}: {s.title}</h3>
                  <p className="text-[13px] text-[#666] leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── WHY GD1 ── */}
      <section className="w-full pt-12 md:pt-17 pb-16 md:pb-40 px-[6vw] bg-[#FFFFFE]">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-10 md:mb-12">
            <p className="text-[11px] font-bold tracking-[0.22em] uppercase text-[#888] mb-3">Why GD1</p>
            <h2 className="text-[clamp(1.8rem,2.8vw,2.8rem)] font-medium tracking-tight text-[#111]">Built for serious collectors</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[
              { 
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>, 
                title: 'Zero-Key Smart Access', 
                desc: 'Unlock and manage your personal bay straight from your smartphone using encrypted Bluetooth.' 
              },
              { 
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2"><path d="M15.6 11.6L22 7v10l-6.4-4.6v-1zM2 9a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9z"></path></svg>, 
                title: '24/7 Live Surveillance', 
                desc: 'High-definition cameras stream around the clock. Check in anytime from the app.' 
              },
              { 
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"></path></svg>, 
                title: 'Museum-Grade Preservation', 
                desc: 'Advanced climate and dust control systems maintain the perfect environment for exotics.' 
              },
              { 
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>, 
                title: 'On-Site Service Network', 
                desc: 'Certified mechanics for routine maintenance, detailing, and emergency repairs — on your schedule.' 
              },
              { 
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2"><circle cx="12" cy="10" r="3"></circle><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"></path></svg>, 
                title: 'Real-time Tracking', 
                desc: 'Know where your vehicle is and who accessed the bay, with instant push notifications.' 
              },
              { 
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>, 
                title: 'EV Charging Ready', 
                desc: 'Select bays equipped with Level 2 EV charging for electric and hybrid vehicles.' 
              },
            ].map(f => (
              <div key={f.title} className="p-6 rounded-2xl border border-black/[0.1] shadow-[0_8px_30px_rgba(0,0,0,0.06)] bg-[#fafafa]">
                <div className="w-12 h-12 rounded-2xl bg-white border border-black/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="text-[15px] font-semibold text-[#111] mb-2">{f.title}</h3>
                <p className="text-[13px] text-[#666] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vehicle Selection Modal */}
      {showVehicleModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-semibold mb-2">Select your vehicle</h3>
            <p className="text-gray-500 text-sm mb-5">Which vehicle will you be parking?</p>
            
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {localUserVehicles.map(v => (
                <div 
                  key={v.id} 
                  onClick={() => handleSelectVehicle(v.id)}
                  className="p-4 border border-gray-200 rounded-2xl hover:border-black cursor-pointer transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-black/5">
                      {v.profileImageUrl ? (
                        <img src={v.profileImageUrl} alt="Vehicle" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-[#111]">{v.brand} {v.model}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{v.registrationNo} • {v.year}</p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors shrink-0">
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
                onClick={handleAddNewVehicle}
                className="flex-1 py-3 px-4 rounded-xl font-medium text-sm text-white bg-[#111] hover:bg-black transition-colors"
              >
                Add New Vehicle
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
      <ChatBot />
    </div>
  );
}
