import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getToken } from '../api/auth';
import { toast } from 'react-hot-toast';
import { Loader2, X, Check, Search, Upload, Info } from 'lucide-react';

export default function AddVehiclePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialCity = queryParams.get('city') || localStorage.getItem('gd1_search_city') || '';
  const initialDate = queryParams.get('date') || localStorage.getItem('gd1_search_date') || '';

  // Wizard state
  const [step, setStep] = useState(0); // 0 = VIN Popup, 1 = Specs, 2 = Docs, 3 = Photos
  
  // Form State matching DTO
  const [form, setForm] = useState({
    brand: '',
    model: '',
    category: '',
    year: 2024,
    registrationNo: '',
    ownerIdProofUrl: '',
    vehicleRcUrl: '',
    color: '',
    fuelType: 'Petrol',
    isHybrid: false,
    images: [] // array of { label, imageUrl }
  });
  
  const [vin, setVin] = useState('');
  const [isDecoding, setIsDecoding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState({});
  
  // Catalog Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedVehicleName, setSelectedVehicleName] = useState('');
  const [selectedValidYearsCsv, setSelectedValidYearsCsv] = useState('');
  const [isFuelTypeOpen, setIsFuelTypeOpen] = useState(false);

  // Auto-decode VIN
  const handleDecodeVin = async (e) => {
    e?.preventDefault();
    if (!vin.trim()) {
      toast.error('Please enter a VIN');
      return;
    }
    
    setIsDecoding(true);
    try {
      const res = await fetch(`https://gd1-grand-auto-depot-one-9ms1.onrender.com/api/Vehicle/decode-vin?vin=${encodeURIComponent(vin)}`);
      if (res.ok) {
        const data = await res.json();
        const vInfo = data.data; // VehicleLookupDto
        
        setForm(f => ({
          ...f,
          year: vInfo.year || f.year,
          fuelType: vInfo.fuelType || f.fuelType
        }));
        
        if (vInfo.brand && vInfo.model) {
           setSelectedVehicleName(`${vInfo.brand} ${vInfo.model}`);
           setSearchTerm(`${vInfo.brand} ${vInfo.model}`);
           setForm(f => ({ ...f, brand: vInfo.brand, model: vInfo.model, category: vInfo.category || 'Standard' }));
        }
        
        toast.success('VIN Decoded Successfully!');
        setStep(1); // Move to manual entry with prefilled data
      } else {
        const err = await res.json();
        toast.error(err.message || 'Failed to decode VIN');
      }
    } catch (err) {
      toast.error('Network error during VIN decoding');
    } finally {
      setIsDecoding(false);
    }
  };

  // Catalog search debounce
  useEffect(() => {
    if (!searchTerm || searchTerm === selectedVehicleName) {
      setSearchResults([]);
      return;
    }
    const delay = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`https://gd1-grand-auto-depot-one-9ms1.onrender.com/api/Vehicle/search-vehicle?model=${encodeURIComponent(searchTerm)}`);
        if (res.ok) {
          const data = await res.json();
          // Assuming data is an array or data.data is an array of VehicleCatalogItem
          const results = Array.isArray(data) ? data : (data.data || []);
          setSearchResults(results);
          setShowDropdown(true);
        }
      } catch (e) {
        console.error('Catalog search error', e);
      } finally {
        setIsSearching(false);
      }
    }, 500);
    return () => clearTimeout(delay);
  }, [searchTerm, selectedVehicleName]);

  const selectCatalogVehicle = (v) => {
    setForm(f => ({ ...f, brand: v.brand, model: v.model, category: v.category }));
    const name = `${v.brand} ${v.model}`;
    setSelectedVehicleName(name);
    setSearchTerm(name);
    setSelectedValidYearsCsv(v.validYearsCsv || '');
    setShowDropdown(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFileUpload = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(prev => ({ ...prev, [fieldName]: true }));
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('https://gd1-grand-auto-depot-one-9ms1.onrender.com/api/Upload/upload-file', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        
        if (fieldName.startsWith('vehicleImage_')) {
           const label = fieldName.split('_')[1]; // e.g., Exterior, Interior
           setForm(f => ({
             ...f, 
             images: [...f.images, { label, imageUrl: data.url }]
           }));
        } else {
           setForm(f => ({ ...f, [fieldName]: data.url }));
        }
        toast.success('File uploaded successfully!');
      } else {
        toast.error('File upload failed.');
      }
    } catch (err) {
      toast.error('Network error during upload');
    } finally {
      setUploading(prev => ({ ...prev, [fieldName]: false }));
    }
  };

  const removeImage = (index) => {
    setForm(f => ({
      ...f,
      images: f.images.filter((_, i) => i !== index)
    }));
  };

  const handleNext = async () => {
    if (step === 1) {
      const yearInt = parseInt(form.year, 10);
      
      if (!form.brand || !form.model) return toast.error('Please select a vehicle from the catalog search');
      if (!form.year) return toast.error('Year is required');
      
      // Simple year range validation
      if (yearInt > 2026) return toast.error('Vehicle model year cannot be greater than 2026.');

      if (!form.color) return toast.error('Color is required');
      if (form.color.length > 50) return toast.error('Color must be 50 characters or less');
      if (!form.registrationNo) return toast.error('Registration number is required');
      if (form.registrationNo.length < 5) return toast.error('Registration number must be at least 5 characters');
      if (form.registrationNo.length > 20) return toast.error('Registration number must be 20 characters or less');
      if (!/^[a-zA-Z0-9-\s]+$/.test(form.registrationNo)) return toast.error('Registration number can only contain letters, numbers, hyphens, and spaces');
      
      setStep(2);
    } else if (step === 2) {
      if (!form.ownerIdProofUrl) return toast.error('Owner ID Proof is required for AI Verification');
      if (!form.vehicleRcUrl) return toast.error('Vehicle RC is required for AI Verification');
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    if (form.images.length === 0) {
      return toast.error('At least one exterior vehicle photo is required');
    }

    setIsSubmitting(true);
    try {
      const token = getToken('AccessToken');
      const res = await fetch('https://gd1-grand-auto-depot-one-9ms1.onrender.com/api/Vehicle/add-vehicle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Vehicle added successfully!');
        const params = new URLSearchParams();
        if (initialCity) params.set('city', initialCity);
        if (initialDate) params.set('date', initialDate);
        params.set('vehicleId', data.data || form.vehicleId);
        navigate(`/search?${params.toString()}`);
      } else {
        toast.error(data.message || 'Failed to add vehicle');
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#ebeced] font-sans flex flex-col">
      <Navbar />
      
      <div className="flex-1 pt-28 pb-20 px-[6vw] flex flex-col items-center justify-center">
        
        {/* PROGRESS BAR */}
        {step > 0 && (
          <div className="w-full max-w-2xl mb-8">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full z-0">
                <div 
                  className="h-full bg-[#111] rounded-full transition-all duration-500"
                  style={{ width: `${((step - 1) / 2) * 100}%` }}
                />
              </div>
              {[1, 2, 3].map(s => (
                <div 
                  key={s} 
                  className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center font-bold text-[13px] transition-colors duration-300 ${step >= s ? 'bg-[#111] text-white shadow-md' : 'bg-white border-2 border-gray-200 text-gray-400'}`}
                >
                  {step > s ? <Check size={16} /> : s}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 px-1">
              <span className={`text-[11px] font-bold tracking-widest uppercase ${step >= 1 ? 'text-[#111]' : 'text-gray-400'}`}>Vehicle</span>
              <span className={`text-[11px] font-bold tracking-widest uppercase ${step >= 2 ? 'text-[#111]' : 'text-gray-400'}`}>Documents</span>
              <span className={`text-[11px] font-bold tracking-widest uppercase ${step >= 3 ? 'text-[#111]' : 'text-gray-400'}`}>Photos</span>
            </div>
          </div>
        )}

        {/* WIZARD CONTAINER */}
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-black/[0.04] p-8 md:p-12 relative overflow-hidden">
          
          {/* STEP 0: VIN POPUP (Full takeover of the card) */}
          {step === 0 && (
            <div className="flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
                <Search size={32} />
              </div>
              <h1 className="text-[28px] font-semibold text-[#111] mb-2 tracking-tight">Got a VIN?</h1>
              <p className="text-[14px] text-[#666] mb-8 max-w-md">
                Enter your Vehicle Identification Number and we'll magically auto-fill your car's details.
              </p>
              
              <form onSubmit={handleDecodeVin} className="w-full max-w-sm mb-6">
                <div className="relative">
                  <input
                    value={vin}
                    onChange={e => setVin(e.target.value.toUpperCase())}
                    placeholder="ENTER 17-DIGIT VIN"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-center text-[16px] font-medium tracking-[0.1em] uppercase outline-none focus:border-[#111] focus:ring-1 focus:ring-[#111] transition-all"
                    maxLength={17}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isDecoding || vin.length < 5}
                  className="w-full mt-4 bg-[#2563eb] hover:bg-[#2d6df0] disabled:opacity-50 text-white rounded-xl py-4 text-[14px] font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2"
                >
                  {isDecoding ? <Loader2 size={18} className="animate-spin" /> : 'Decode VIN'}
                </button>
              </form>
              
              <button 
                onClick={() => setStep(1)}
                className="text-[13px] font-semibold text-[#555] hover:text-[#111] transition-colors underline underline-offset-4 decoration-gray-300 hover:decoration-[#111]"
              >
                Or add vehicle manually
              </button>
            </div>
          )}

          {/* STEP 1: Specs */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-[22px] font-semibold text-[#111] tracking-tight">Vehicle Specifications</h2>
                  <p className="text-[13px] text-[#666] mt-1">Select your exact model from our catalog.</p>
                </div>
                {vin && <span className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-[11px] font-bold tracking-wider">VIN: {vin}</span>}
              </div>

              <div className="space-y-6">
                {/* Catalog Search */}
                <div className="relative">
                  <label className="block text-[11px] font-bold tracking-widest text-[#111] mb-2 uppercase">Vehicle Catalog Search *</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); setSelectedVehicleName(''); setForm(f => ({...f, brand: '', model: ''})) }}
                      placeholder="Search Brand or Model (e.g. 'Ford MPV', 'BMW Passenger Car')..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3.5 text-[14px] font-medium outline-none focus:border-[#111] focus:ring-1 focus:ring-[#111] transition-all"
                    />
                  </div>
                  {isSearching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" size={18} />}
                  
                  {searchResults.length > 0 && (
                    <div className="absolute z-20 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] max-h-60 overflow-y-auto">
                      {searchResults.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => selectCatalogVehicle(v)}
                          className="w-full text-left px-4 py-3 text-[13px] font-medium text-[#333] hover:bg-gray-50 border-b border-gray-50 last:border-0 flex items-center justify-between"
                        >
                          <span>{v.brand} {v.model} <span className="text-gray-400 font-normal ml-1">({v.category})</span></span>
                          <span className="text-[11px] text-gray-400">{v.validYearsCsv}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-bold tracking-widest text-[#111] mb-2 uppercase">Year *</label>
                    <input type="number" name="year" value={form.year} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-[#111] focus:ring-1 focus:ring-[#111] transition-all" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold tracking-widest text-[#111] mb-2 uppercase">Color *</label>
                    <input name="color" value={form.color} onChange={handleChange} placeholder="e.g. Midnight Black" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-[#111] focus:ring-1 focus:ring-[#111] transition-all" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold tracking-widest text-[#111] mb-2 uppercase">Registration No. *</label>
                  <input name="registrationNo" value={form.registrationNo} onChange={e => setForm(f => ({...f, registrationNo: e.target.value.toUpperCase()}))} placeholder="e.g. KA 01 AB 1234" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] font-medium tracking-wide uppercase outline-none focus:border-[#111] focus:ring-1 focus:ring-[#111] transition-all" />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-bold tracking-widest text-[#111] mb-2 uppercase">Fuel Type</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsFuelTypeOpen(!isFuelTypeOpen)}
                        className="w-full flex items-center justify-between bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-xl px-4 py-3 text-[14px] text-left outline-none focus:border-[#111] focus:ring-1 focus:ring-[#111] transition-all"
                      >
                        <span className="font-medium text-[#111]">{form.fuelType}</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform duration-200 text-[#555] ${isFuelTypeOpen ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6"/></svg>
                      </button>

                      {isFuelTypeOpen && (
                        <div className="absolute z-20 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] py-2">
                          {['Petrol', 'Diesel', 'Electric', 'CNG'].map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => {
                                setForm(f => ({ ...f, fuelType: type }));
                                setIsFuelTypeOpen(false);
                              }}
                              className={`w-full text-left px-5 py-2.5 text-[13px] font-medium transition-colors hover:bg-gray-50 flex items-center justify-between ${form.fuelType === type ? 'text-[#2563eb] bg-blue-50/50' : 'text-[#333]'}`}
                            >
                              {type}
                              {form.fuelType === type && (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#2563eb]"><path d="M20 6L9 17l-5-5"/></svg>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center pt-8">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox" name="isHybrid" checked={form.isHybrid} onChange={handleChange} className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 accent-[#111]" />
                      <span className="text-[13px] font-bold text-[#111] tracking-wide">Hybrid Vehicle</span>
                    </label>
                  </div>
                </div>

                <div className="pt-6">
                  <button onClick={handleNext} className="w-full py-4 bg-[#2563eb] hover:bg-[#2d6df0] text-white rounded-xl text-[13px] font-bold tracking-widest uppercase transition-all shadow-md">
                    Continue to Documents
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Documents */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="mb-8">
                <h2 className="text-[22px] font-semibold text-[#111] tracking-tight">AI Verification</h2>
                <p className="text-[13px] text-[#666] mt-1">Upload your documents. Our AI will instantly verify ownership.</p>
              </div>

              <div className="space-y-5 mb-8">
                {/* ID PROOF */}
                <div className="p-5 rounded-2xl border border-gray-200 bg-gray-50/50">
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-[12px] font-bold tracking-widest text-[#111] uppercase">Owner ID Proof *</label>
                    {form.ownerIdProofUrl && <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-md text-[10px] font-bold tracking-widest uppercase">Uploaded</span>}
                  </div>
                  
                  {form.ownerIdProofUrl ? (
                     <div className="relative h-[120px] rounded-xl overflow-hidden group border border-gray-200">
                       <img src={form.ownerIdProofUrl} alt="ID" className="w-full h-full object-cover" />
                       <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => setForm(f => ({...f, ownerIdProofUrl: ''}))} className="px-4 py-2 bg-red-500 text-white text-[11px] font-bold rounded-lg shadow-sm">Remove</button>
                       </div>
                     </div>
                  ) : (
                    <div className="relative h-[120px]">
                      <input type="file" accept="image/*,.pdf" onChange={e => handleFileUpload(e, 'ownerIdProofUrl')} disabled={uploading['ownerIdProofUrl']} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                      <div className={`w-full h-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-colors ${uploading['ownerIdProofUrl'] ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-white group-hover:border-[#111]'}`}>
                         {uploading['ownerIdProofUrl'] ? (
                           <div className="flex flex-col items-center gap-2">
                             <Loader2 size={20} className="animate-spin text-blue-500" />
                             <span className="text-[11px] font-semibold text-blue-600">Extracting data...</span>
                           </div>
                         ) : (
                           <>
                             <Upload size={20} className="text-gray-400 mb-2" />
                             <span className="block w-full text-[12px] font-medium text-gray-500 text-center px-4">Tap to upload ID (Driving License/Aadhaar)</span>
                           </>
                         )}
                      </div>
                    </div>
                  )}
                </div>

                {/* RC PROOF */}
                <div className="p-5 rounded-2xl border border-gray-200 bg-gray-50/50">
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-[12px] font-bold tracking-widest text-[#111] uppercase">Vehicle RC *</label>
                    {form.vehicleRcUrl && <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-md text-[10px] font-bold tracking-widest uppercase">Uploaded</span>}
                  </div>
                  
                  {form.vehicleRcUrl ? (
                     <div className="relative h-[120px] rounded-xl overflow-hidden group border border-gray-200">
                       <img src={form.vehicleRcUrl} alt="RC" className="w-full h-full object-cover" />
                       <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => setForm(f => ({...f, vehicleRcUrl: ''}))} className="px-4 py-2 bg-red-500 text-white text-[11px] font-bold rounded-lg shadow-sm">Remove</button>
                       </div>
                     </div>
                  ) : (
                    <div className="relative h-[120px]">
                      <input type="file" accept="image/*,.pdf" onChange={e => handleFileUpload(e, 'vehicleRcUrl')} disabled={uploading['vehicleRcUrl']} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                      <div className={`w-full h-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-colors ${uploading['vehicleRcUrl'] ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-white group-hover:border-[#111]'}`}>
                         {uploading['vehicleRcUrl'] ? (
                           <div className="flex flex-col items-center gap-2">
                             <Loader2 size={20} className="animate-spin text-blue-500" />
                             <span className="text-[11px] font-semibold text-blue-600">Verifying RC...</span>
                           </div>
                         ) : (
                           <>
                             <Upload size={20} className="text-gray-400 mb-2" />
                             <span className="block w-full text-[12px] font-medium text-gray-500 text-center px-4">Tap to upload Registration Certificate</span>
                           </>
                         )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={() => setStep(1)} className="px-6 py-4 rounded-xl text-[13px] font-bold text-[#555] hover:bg-gray-100 transition-colors uppercase tracking-widest">
                  Back
                </button>
                <button onClick={handleNext} className="flex-1 py-4 bg-[#2563eb] hover:bg-[#2d6df0] text-white rounded-xl text-[13px] font-bold tracking-widest uppercase transition-all shadow-md">
                  Continue to Photos
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Photos & Submit */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="mb-8">
                <h2 className="text-[22px] font-semibold text-[#111] tracking-tight">Vehicle Photos</h2>
                <p className="text-[13px] text-[#666] mt-1">Add at least one clear exterior photo of your vehicle.</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                {form.images.map((img, idx) => (
                  <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-gray-200 group">
                    <img src={img.imageUrl} alt="Vehicle" className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md text-white text-[10px] font-bold uppercase tracking-wider">
                      {img.label}
                    </div>
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => removeImage(idx)} className="w-8 h-8 bg-red-500 rounded-full text-white flex items-center justify-center">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                
                {/* Add Photo Button */}
                <div className="relative aspect-video">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={e => handleFileUpload(e, `vehicleImage_Exterior`)} 
                    disabled={uploading['vehicleImage_Exterior']} 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                  />
                  <div className={`w-full h-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-colors ${uploading['vehicleImage_Exterior'] ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50 group-hover:border-[#111]'}`}>
                     {uploading['vehicleImage_Exterior'] ? (
                       <Loader2 size={24} className="animate-spin text-blue-500" />
                     ) : (
                       <>
                         <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm mb-2 text-[#111]">
                           <Upload size={18} />
                         </div>
                         <span className="text-[11px] font-bold uppercase tracking-widest text-[#555]">Add Photo</span>
                       </>
                     )}
                  </div>
                </div>
              </div>

              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 mb-8 flex gap-3">
                <Info size={20} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[12px] text-blue-800 leading-relaxed">
                  Your application will be instantly verified by our AI engine. Ensure all documents and photos are clear and legible to prevent rejection.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={() => setStep(2)} className="px-6 py-4 rounded-xl text-[13px] font-bold text-[#555] hover:bg-gray-100 transition-colors uppercase tracking-widest">
                  Back
                </button>
                <button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 py-4 bg-[#2563eb] hover:bg-[#2d6df0] text-white rounded-xl text-[13px] font-bold tracking-widest uppercase transition-all shadow-lg shadow-blue-500/20 disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <><Loader2 size={16} className="animate-spin" /> Verifying...</>
                  ) : 'Complete Application'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
      
      <Footer />
    </div>
  );
}
