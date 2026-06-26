import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getToken } from '../api/auth';
import { Truck, Navigation, MapPin, Building, ChevronLeft, CheckCircle2, Navigation2, LocateFixed, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRazorpay } from 'react-razorpay';
import { useAuth } from '../context/AuthContext';

export default function PickupOptionsPage() {
  const { id } = useParams(); // bookingId
  const navigate = useNavigate();
  const { user } = useAuth();

  const [selectedOption, setSelectedOption] = useState(null); // 'pickup' | 'self'
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  
  // Custom Time State
  const [hour, setHour] = useState('');
  const [minute, setMinute] = useState('');
  const [period, setPeriod] = useState('AM');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const { Razorpay } = useRazorpay();
  const [razorpayKeyId, setRazorpayKeyId] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Fetch Razorpay Config
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('https://localhost:7108/api/Payment/config');
        const data = await res.json();
        setRazorpayKeyId(data.keyId);
      } catch (err) {
        console.error('Failed to fetch Razorpay config', err);
      }
    };
    fetchConfig();
  }, []);

  // Autocomplete state for City
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const isSelecting = useRef(false);
  const cityRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handler = (e) => {
      if (cityRef.current && !cityRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    const loadingToast = toast.loading('Fetching your precise location...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude: lat, longitude: lon } = position.coords;
          setLatitude(lat);
          setLongitude(lon);
          // Reverse geocoding using Nominatim
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          const data = await res.json();
          
          if (data && data.address) {
            const fetchedCity = data.address.city || data.address.town || data.address.state_district || '';
            const fetchedPincode = data.address.postcode || '';
            const road = data.address.road || '';
            const suburb = data.address.suburb || '';
            const fetchedAddress = [road, suburb].filter(Boolean).join(', ');

            if (fetchedCity) {
              isSelecting.current = true;
              setCity(fetchedCity);
            }
            if (fetchedPincode) setPincode(fetchedPincode);
            if (fetchedAddress) setAddress(data.display_name || fetchedAddress);
            
            toast.success('Location detected successfully!', { id: loadingToast });
          } else {
            toast.error('Could not resolve address. Please type it manually.', { id: loadingToast });
          }
        } catch (error) {
          toast.error('Failed to get address. Please type manually.', { id: loadingToast });
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        let errorMsg = 'Failed to get location';
        if (error.code === 1) errorMsg = 'Location permission denied. Please enable it in browser settings.';
        toast.error(errorMsg, { id: loadingToast });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOption) {
      toast.error('Please select an option to continue.');
      return;
    }

    if (selectedOption === 'pickup') {
      if (!city || !address) {
        toast.error('Please fill in your complete address and city.');
        return;
      }

      if (pincode && !/^[1-9][0-9]{5}$/.test(pincode)) {
        toast.error('Please enter a valid 6-digit Indian Pincode.');
        return;
      }
    }

    let finalTime = null;
    if (hour && minute) {
      let h = parseInt(hour, 10);
      let m = parseInt(minute, 10);
      
      if (isNaN(h)) h = 0;
      if (isNaN(m)) m = 0;

      if (period === 'PM' && h !== 12) h += 12;
      if (period === 'AM' && h === 12) h = 0;

      const dateObj = new Date();
      dateObj.setHours(h, m, 0, 0);
      
      // If the selected time has already passed today, assume they mean tomorrow
      if (dateObj < new Date()) {
        dateObj.setDate(dateObj.getDate() + 1);
      }
      finalTime = dateObj.toISOString();
    }

    setIsSubmitting(true);

    let finalLatitude = latitude;
    let finalLongitude = longitude;

    if (selectedOption === 'pickup' && (!finalLatitude || !finalLongitude)) {
      try {
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + ', ' + city)}&limit=1`);
        const geoData = await geoRes.json();
        if (geoData && geoData.length > 0) {
          finalLatitude = parseFloat(geoData[0].lat);
          finalLongitude = parseFloat(geoData[0].lon);
        } else {
          const geoCityRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1`);
          const geoCityData = await geoCityRes.json();
          if (geoCityData && geoCityData.length > 0) {
            finalLatitude = parseFloat(geoCityData[0].lat);
            finalLongitude = parseFloat(geoCityData[0].lon);
          }
        }
      } catch (err) {
        console.error("Geocoding failed", err);
      }
    }

    try {
      const token = getToken('AccessToken');
      const payload = {
        bookingId: parseInt(id, 10),
        isPickupRequested: selectedOption === 'pickup',
        city: city,
        pincode: pincode,
        pickupAddress: address,
        requestedPickupTime: finalTime,
        pickupLatitude: finalLatitude,
        pickupLongitude: finalLongitude
      };

      // 1. Call Create Order
      const res = await fetch('https://localhost:7108/api/Payment/create-order', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'Failed to create payment order.');
        setIsSubmitting(false);
        return;
      }

      // 2. Open Razorpay Checkout Modal
      const options = {
        key: razorpayKeyId,
        amount: data.totalAmountToPay * 100, // paise
        currency: data.currency || 'INR',
        name: 'Grand Auto Depot',
        description: 'Advance Booking Payment',
        order_id: data.razorpayOrderId,
        handler: async (response) => {
          // 3. Verify Payment
          try {
            const verifyRes = await fetch('https://localhost:7108/api/Payment/verify', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                bookingId: parseInt(id, 10),
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.success) {
              toast.success('Payment successful! Booking confirmed.');
              if (selectedOption === 'self') {
                navigate('/my-bookings');
              } else {
                setIsSuccess(true);
              }
            } else {
              toast.error('Payment verification failed.');
            }
          } catch (err) {
            toast.error('Error verifying payment.');
          }
        },
        prefill: {
          name: user?.fullName || 'Test User',
          email: user?.email || 'test@example.com',
          contact: user?.phoneNumber || '9999999999'
        },
        theme: {
          color: '#2563EB',
        },
      };

      const rzp = new Razorpay(options);
      rzp.on('payment.failed', function (response) {
        toast.error('Payment failed: ' + response.error.description);
      });
      rzp.open();

    } catch (err) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl text-center animate-in zoom-in duration-500">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
          
          <div className="bg-gray-50 rounded-2xl p-5 mb-8 text-left border border-gray-100">
            {selectedOption === 'pickup' ? (
              <p className="text-gray-600 leading-relaxed text-center">
                <span className="font-semibold text-gray-900 block mb-1">Valet Pickup Scheduled</span>
                The lot owner will assign an agent to pick up your vehicle from your specified location.
              </p>
            ) : (
              <p className="text-gray-600 leading-relaxed text-center">
                <span className="font-semibold text-gray-900 block mb-1">Self Drop-off Confirmed</span>
                You can drop off your vehicle at the parking lot at your convenience.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate(`/track-pickup/${id}`)}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
            >
              Track Application
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-gray-100 text-gray-900 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans pb-24 pt-6 md:pt-12 px-4 flex flex-col items-center">
      <div className="w-full max-w-3xl flex items-center justify-between mb-8">
        <button 
          onClick={() => navigate('/track-application')} 
          className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-black transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Go to Dashboard
        </button>
        <span className="text-[11px] font-bold tracking-widest text-blue-600 uppercase bg-blue-50 px-3 py-1 rounded-full">
          Step 2 of 2
        </span>
      </div>

      <div className="w-full max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold text-[#111] mb-2 tracking-tight">How will your vehicle arrive?</h1>
        <p className="text-gray-500 text-sm md:text-base mb-10">
          Choose whether you want our professional drivers to pick up your vehicle from your location, or if you prefer to drop it off yourself.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            
            {/* Pickup Option */}
            <label 
              className={`order-1 relative flex flex-col p-6 rounded-3xl border-2 cursor-pointer transition-all duration-300 ${
                selectedOption === 'pickup' 
                  ? 'border-blue-600 bg-blue-50/30 shadow-[0_10px_40px_rgba(37,99,235,0.12)] -translate-y-1' 
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/10 hover:shadow-md'
              }`}
            >
              <input 
                type="radio" 
                name="arrival_method" 
                value="pickup" 
                className="hidden" 
                onChange={() => setSelectedOption('pickup')}
              />
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                  selectedOption === 'pickup' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-gray-100 text-gray-500'
                }`}>
                  <Truck className="w-6 h-6" />
                </div>
                {selectedOption === 'pickup' ? (
                  <CheckCircle2 className="w-6 h-6 text-blue-600" />
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
                )}
              </div>
              <h3 className={`text-lg font-bold mb-2 ${selectedOption === 'pickup' ? 'text-blue-900' : 'text-gray-900'}`}>Request Pickup</h3>
              <p className="text-sm text-gray-500 leading-relaxed flex-1">
                Our professional drivers will securely pick up your vehicle from your location and drive it to the storage facility.
              </p>
              
              <div className="mt-6 pt-4 border-t border-gray-100 space-y-2">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-gray-500 font-medium">Base Charge</span>
                  <span className="font-bold text-gray-900">&#8377;200</span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-gray-500 font-medium">Fuel Cost</span>
                  <span className="font-bold text-gray-900">Actuals</span>
                </div>
                <div className="flex items-start gap-1.5 mt-3 bg-blue-100/50 text-blue-800 p-2.5 rounded-lg text-[11px] font-semibold">
                  <Navigation className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  Available within a 25km radius of the property.
                </div>
              </div>
            </label>

            {/* Self Delivery Option */}
            <label 
              className={`order-3 md:order-2 relative flex flex-col p-6 rounded-3xl border-2 cursor-pointer transition-all duration-300 ${
                selectedOption === 'self' 
                  ? 'border-gray-900 bg-gray-50 shadow-[0_10px_40px_rgba(0,0,0,0.08)] -translate-y-1' 
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50 hover:shadow-md'
              }`}
            >
              <input 
                type="radio" 
                name="arrival_method" 
                value="self" 
                className="hidden" 
                onChange={() => setSelectedOption('self')}
              />
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                  selectedOption === 'self' ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/30' : 'bg-gray-100 text-gray-500'
                }`}>
                  <Building className="w-6 h-6" />
                </div>
                {selectedOption === 'self' ? (
                  <CheckCircle2 className="w-6 h-6 text-gray-900" />
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
                )}
              </div>
              <h3 className={`text-lg font-bold mb-2 ${selectedOption === 'self' ? 'text-gray-900' : 'text-gray-900'}`}>Self Drop-off</h3>
              <p className="text-sm text-gray-500 leading-relaxed flex-1">
                I will drive and deliver the vehicle to the storage property myself at the scheduled move-in time.
              </p>
              
              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-gray-500 font-medium">Cost</span>
                  <span className="font-bold text-green-600">Free</span>
                </div>
              </div>
            </label>

          {/* Conditional Address Form for Pickup */}
          <div className={`order-2 md:order-3 md:col-span-2 transition-all duration-500 ease-in-out overflow-hidden ${
            selectedOption === 'pickup' ? 'max-h-[800px] opacity-100 md:mt-4' : 'max-h-0 opacity-0 mt-0'
          }`}>
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-200 shadow-sm relative">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-3">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" /> Where should we pick it up?
                </h3>
                <button 
                  type="button" 
                  onClick={handleLocateMe}
                  disabled={isLocating}
                  className="flex items-center justify-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors"
                >
                  <LocateFixed className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} /> 
                  {isLocating ? 'Locating...' : 'Use my precise location'}
                </button>
              </div>
              
              <div className="grid md:grid-cols-2 gap-5 mb-5">
                <div ref={cityRef} className="relative">
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">City <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={city}
                    onChange={(e) => { setCity(e.target.value); setShowSuggestions(true); }}
                    onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                    placeholder="e.g. Bangalore" 
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-900 placeholder:font-normal placeholder:text-gray-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
                  />
                  {/* Autocomplete Dropdown */}
                  {showSuggestions && (
                    <div className="absolute top-[100%] mt-1 left-0 w-full bg-white rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.1)] border border-gray-200 p-2 z-50 overflow-hidden">
                      {isTyping ? (
                        <div className="px-4 py-3 text-[13px] text-[#888] flex items-center gap-2 font-medium">
                          <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                          Searching...
                        </div>
                      ) : (
                        suggestions.map((sg, i) => (
                          <div 
                            key={i} 
                            onClick={() => handleSelectCity(sg)}
                            className="px-4 py-3 hover:bg-blue-50 rounded-lg cursor-pointer text-[13px] font-medium text-gray-700 transition-colors flex items-center gap-3"
                          >
                            <Search className="w-3.5 h-3.5 text-gray-400" />
                            {sg}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Pincode <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={pincode}
                    maxLength={6}
                    onChange={(e) => setPincode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="e.g. 560001" 
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-900 placeholder:font-normal placeholder:text-gray-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
                  />
                </div>
              </div>
              
              <div className="mb-5">
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Complete Address <span className="text-red-500">*</span></label>
                <textarea 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House/Flat No, Street, Landmark..." 
                  rows="3"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-900 placeholder:font-normal placeholder:text-gray-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Requested Pickup Time <span className="text-gray-400 font-normal lowercase">(optional)</span></label>
                <div className="flex items-start gap-2">
                  <div className="flex flex-col w-20">
                    <input 
                      type="text" 
                      placeholder="HH" 
                      maxLength={2}
                      value={hour}
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, '');
                        if (val.length === 2 && parseInt(val, 10) > 12) val = '12';
                        setHour(val);
                      }}
                      onBlur={() => {
                        if (hour && hour.length === 1 && hour !== '0') setHour('0' + hour);
                        if (hour === '00') setHour('12');
                      }}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-center text-gray-900 placeholder:font-normal placeholder:text-gray-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
                    />
                    <span className="text-[10px] text-gray-400 font-medium text-center mt-1.5 uppercase">Hour</span>
                  </div>
                  <span className="text-xl font-bold text-gray-300 mt-2">:</span>
                  <div className="flex flex-col w-20">
                    <input 
                      type="text" 
                      placeholder="MM" 
                      maxLength={2}
                      value={minute}
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, '');
                        if (val.length === 2 && parseInt(val, 10) > 59) val = '59';
                        setMinute(val);
                      }}
                      onBlur={() => {
                        if (minute && minute.length === 1) setMinute('0' + minute);
                      }}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-center text-gray-900 placeholder:font-normal placeholder:text-gray-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
                    />
                    <span className="text-[10px] text-gray-400 font-medium text-center mt-1.5 uppercase">Minute</span>
                  </div>
                  <div className="flex flex-col w-28 ml-2">
                    <div className="flex bg-gray-100 border border-gray-200 rounded-xl p-1 h-[46px]">
                      <button 
                        type="button" 
                        onClick={() => setPeriod('AM')} 
                        className={`flex-1 flex items-center justify-center text-xs font-bold rounded-lg transition-all ${period === 'AM' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'}`}
                      >
                        AM
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setPeriod('PM')} 
                        className={`flex-1 flex items-center justify-center text-xs font-bold rounded-lg transition-all ${period === 'PM' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'}`}
                      >
                        PM
                      </button>
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium text-center mt-1.5 uppercase">Format</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>

          <div className="pt-6">
            <button 
              type="submit" 
              disabled={isSubmitting || !selectedOption}
              className={`w-full py-4 rounded-xl text-sm md:text-base font-bold text-white transition-all flex items-center justify-center gap-2 ${
                isSubmitting || !selectedOption 
                  ? 'bg-gray-300 cursor-not-allowed text-gray-500' 
                  : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer'
              }`}
            >
              {isSubmitting ? 'Processing...' : (
                <>Pay Advance & Complete Booking <Navigation2 className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
