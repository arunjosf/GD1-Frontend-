import { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Maximize2, Loader2, X } from 'lucide-react';

export default function AddGaragePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [expandedImage, setExpandedImage] = useState(null);
  const [isAppTypeOpen, setIsAppTypeOpen] = useState(false);
  const [form, setForm] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    applicationType: 'Standard',
    pricePerDay: '',
    preferredInspectionDate: '',
    hasCCTV: false,
    hasSecurity: false,
    hasFireSafety: false,
    hasWorkshop: false,
    hasWashingArea: false,
    frontImageUrl: '',
    otherImageUrls: [],
    businessRegistrationUrl: '',
    licenseDocumentUrl: '',
    ownerIdProofUrl: '',
    propertyProofUrl: '',
    slots: [{ slotNumber: '1', squareFeet: '', heightFeet: '', imageUrl: '' }]
  });
  
  const [uploading, setUploading] = useState({});
  const [showTerms, setShowTerms] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

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
      const res = await fetch('https://localhost:7108/api/Upload/upload-file', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        
        if (fieldName === 'otherImageUrls') {
           setForm(f => ({ ...f, otherImageUrls: [...f.otherImageUrls, data.url] }));
        } else if (fieldName.startsWith('slotImage_')) {
           const idx = parseInt(fieldName.split('_')[1], 10);
           setForm(f => {
             const newSlots = [...f.slots];
             newSlots[idx].imageUrl = data.url;
             return { ...f, slots: newSlots };
           });
        } else {
           setForm(f => ({ ...f, [fieldName]: data.url }));
        }
        toast.success('File uploaded successfully!');
      } else {
        try {
          const errData = await res.json();
          toast.error(errData.message || 'File upload failed.');
        } catch {
          toast.error('File upload failed.');
        }
      }
    } catch (err) {
      toast.error('Network error: ' + err.message);
    } finally {
      setUploading(prev => ({ ...prev, [fieldName]: false }));
    }
  };

  const addSlot = () => {
    setForm(f => ({
      ...f, 
      slots: [...f.slots, { slotNumber: String(f.slots.length + 1), squareFeet: '', heightFeet: '', imageUrl: '' }]
    }));
  };

  const updateSlot = (index, field, value) => {
    setForm(f => {
      const newSlots = [...f.slots];
      newSlots[index] = { ...newSlots[index], [field]: value };
      return { ...f, slots: newSlots };
    });
  };

  const removeSlot = (index) => {
    setForm(f => ({ ...f, slots: f.slots.filter((_, i) => i !== index) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.businessName || !form.ownerName || !form.email || !form.frontImageUrl) {
      toast.error('Please fill in all required fields and upload the front image.');
      return;
    }
    
    // Show terms modal instead of submitting immediately
    setShowTerms(true);
  };

 const confirmAndSubmit = async () => {
  if (!termsAccepted) {
    toast.error('You must accept the Terms and Conditions to proceed.');
    return;
  }

  try {
    setLoading(true);

    // Map frontend state to backend DTO property names
    const payload = {
      ...form,
      contactEmail: form.email,
      phoneNumber: form.phone,
      addressLine: form.address,
      postalCode: form.zip,
      country: 'India'
    };

    const tokenCookie = document.cookie.split('; ').find(row => row.startsWith('AccessToken='));
    const token = tokenCookie ? tokenCookie.split('=')[1] : null;

    const response = await fetch(
      'https://localhost:7108/api/Franchise/apply',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      }
    );

    let data = {};
    const text = await response.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        // Not JSON
      }
    }

    if (!response.ok) {
      // Try to parse validation errors if any
      let errorMsg = data.message || 'Submission failed';
      if (data.errors) {
         errorMsg = Object.values(data.errors).flat().join(', ');
      } else if (response.status === 401) {
         errorMsg = 'Unauthorized: Please log in again.';
      } else if (response.status === 403) {
         errorMsg = 'Forbidden: You do not have permission.';
      }
      throw new Error(errorMsg);
    }

    toast((t) => (
      <div className="flex flex-col gap-3 min-w-[240px]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
          </div>
          <span className="font-semibold text-[14px] text-gray-900">Application submitted!</span>
        </div>
        <button
          onClick={() => {
            toast.dismiss(t.id);
            navigate('/track-application');
          }}
          className="w-full px-4 py-2 mt-1 bg-[#111] hover:bg-[#222] text-white rounded-lg text-[12px] font-bold tracking-widest uppercase transition-all shadow-md"
        >
          Track Application
        </button>
      </div>
    ), { duration: 8000 });

    navigate('/');
  } catch (err) {
    toast.error(err.message);
  } finally {
    setLoading(false);
    setShowTerms(false);
  }
};

  return (
    <div className="min-h-screen bg-[#ebeced] font-sans">
      <Navbar />
      
      <div className="pt-28 pb-20 px-[6vw]">
        <div className="max-w-[800px] mx-auto">
          
          <div className="mb-10">
            <p className="text-[11px] font-bold tracking-[0.22em] uppercase text-[#888] mb-3">Partner with GD1</p>
            <h1 className="text-[clamp(2.2rem,3.5vw,3.5rem)] font-medium leading-[1.1] tracking-tight text-[#111] mb-4">
            Join the elite network.
            </h1>
            <p className="text-[15px] text-[#555] leading-relaxed max-w-xl">
              Turn your premium parking space into a certified GD1 facility. Submit your application and our team will schedule an on-site inspection within 48 hours.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.04)] border border-black/[0.04] p-5 sm:p-8 md:p-12">
            
            {/* Section 1: Personal Details */}
            <div className="mb-10">
              <h2 className="text-[18px] font-semibold text-[#111] mb-6 tracking-tight">1. Applicant Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-bold tracking-widest text-[#111] mb-2 uppercase">Owner Name *</label>
                  <input required name="ownerName" value={form.ownerName} onChange={handleChange} placeholder="John Doe" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[13px] outline-none focus:border-[#111] focus:ring-1 focus:ring-[#111] transition-all" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold tracking-widest text-[#111] mb-2 uppercase">Contact Email *</label>
                  <input required type="email" name="email" value={form.email} onChange={handleChange} placeholder="john@example.com" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[13px] outline-none focus:border-[#111] focus:ring-1 focus:ring-[#111] transition-all" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold tracking-widest text-[#111] mb-2 uppercase">Phone Number *</label>
                  <input required name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[13px] outline-none focus:border-[#111] focus:ring-1 focus:ring-[#111] transition-all" />
                </div>
              </div>
            </div>

            <div className="w-full h-px bg-gray-100 mb-10" />

            {/* Section 2: Facility Details */}
            <div className="mb-10">
              <h2 className="text-[18px] font-semibold text-[#111] mb-6 tracking-tight">2. Facility Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold tracking-widest text-[#111] mb-2 uppercase">Business / Facility Name *</label>
                  <input required name="businessName" value={form.businessName} onChange={handleChange} placeholder="Elite Auto Vault" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[13px] outline-none focus:border-[#111] focus:ring-1 focus:ring-[#111] transition-all" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold tracking-widest text-[#111] mb-2 uppercase">Address Line *</label>
                  <input required name="address" value={form.address} onChange={handleChange} placeholder="123 Luxury Lane" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[13px] outline-none focus:border-[#111] focus:ring-1 focus:ring-[#111] transition-all" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold tracking-widest text-[#111] mb-2 uppercase">City *</label>
                  <input required name="city" value={form.city} onChange={handleChange} placeholder="Bengaluru" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[13px] outline-none focus:border-[#111] focus:ring-1 focus:ring-[#111] transition-all" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-bold tracking-widest text-[#111] mb-2 uppercase">State</label>
                    <input name="state" value={form.state} onChange={handleChange} placeholder="Karnataka" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[13px] outline-none focus:border-[#111] focus:ring-1 focus:ring-[#111] transition-all" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold tracking-widest text-[#111] mb-2 uppercase">Zip Code</label>
                    <input name="zip" value={form.zip} onChange={handleChange} placeholder="560001" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[13px] outline-none focus:border-[#111] focus:ring-1 focus:ring-[#111] transition-all" />
                  </div>
                </div>
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-[11px] font-bold tracking-widest text-[#111] mb-2 uppercase">Application Type</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsAppTypeOpen(!isAppTypeOpen)}
                        className="w-full flex items-center justify-between bg-white border border-gray-200 hover:border-gray-300 rounded-xl px-4 py-3 text-[13px] text-left outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] transition-all shadow-sm"
                      >
                        <span className="font-medium text-[#111]">{form.applicationType}</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform duration-200 text-[#555] ${isAppTypeOpen ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6"/></svg>
                      </button>

                      {isAppTypeOpen && (
                        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] py-2 animate-in fade-in zoom-in-95 duration-100">
                          {['Standard', 'Premium'].map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => {
                                setForm(f => ({ ...f, applicationType: type }));
                                setIsAppTypeOpen(false);
                              }}
                              className={`w-full text-left px-5 py-2.5 text-[13px] font-medium transition-colors hover:bg-gray-50 flex items-center justify-between ${form.applicationType === type ? 'text-[#2563eb] bg-blue-50/50' : 'text-[#333]'}`}
                            >
                              {type}
                              {form.applicationType === type && (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#2563eb]"><path d="M20 6L9 17l-5-5"/></svg>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold tracking-widest text-[#111] mb-2 uppercase">Price Per Day (₹) *</label>
                    <input required type="number" name="pricePerDay" value={form.pricePerDay} onChange={handleChange} placeholder="2500" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[13px] outline-none focus:border-[#111] focus:ring-1 focus:ring-[#111] transition-all" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold tracking-widest text-[#111] mb-2 uppercase">Preferred Inspection</label>
                    <input type="date" min={new Date().toISOString().split('T')[0]} name="preferredInspectionDate" value={form.preferredInspectionDate} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[13px] outline-none focus:border-[#111] focus:ring-1 focus:ring-[#111] transition-all" />
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full h-px bg-gray-100 mb-10" />

            {/* Section 2.5: Garage Slots */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[18px] font-semibold text-[#111] tracking-tight">Garage Slots</h2>
                <button type="button" onClick={addSlot} className="flex items-center gap-1 text-[12px] font-bold text-[#2563eb] hover:text-blue-700 uppercase tracking-widest transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                  Add Slot
                </button>
              </div>
              <div className="flex flex-col gap-4">
                {form.slots.map((slot, idx) => (
                  <div key={idx} className="p-5 border border-gray-200 rounded-2xl bg-gray-50 relative group">
                    {idx > 0 && (
                      <button type="button" onClick={() => removeSlot(idx)} className="absolute -top-3 -right-3 bg-white border border-gray-200 text-gray-400 hover:text-gray-700 w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/></svg>
                      </button>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold tracking-widest text-[#555] mb-1.5 uppercase">Slot Number</label>
                        <input value={slot.slotNumber} onChange={e => updateSlot(idx, 'slotNumber', e.target.value)} placeholder="A-1" className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#111]" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold tracking-widest text-[#555] mb-1.5 uppercase">Square Feet</label>
                        <input type="number" value={slot.squareFeet} onChange={e => updateSlot(idx, 'squareFeet', e.target.value)} placeholder="200" className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#111]" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold tracking-widest text-[#555] mb-1.5 uppercase">Height (ft)</label>
                        <input type="number" value={slot.heightFeet} onChange={e => updateSlot(idx, 'heightFeet', e.target.value)} placeholder="10" className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#111]" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold tracking-widest text-[#555] mb-1.5 uppercase">Slot Image</label>
                        {slot.imageUrl ? (
                          <div className="flex items-center justify-between bg-white px-2 py-2 rounded-lg border border-gray-300 shadow-sm truncate">
                            <span className="text-[11px] font-medium text-gray-700 truncate">Attached</span>
                            <div className="flex items-center gap-2 ml-2">
                              <button type="button" onClick={() => setExpandedImage(slot.imageUrl)} className="text-gray-400 hover:text-black transition-colors" title="Preview">
                                <Maximize2 size={13} />
                              </button>
                              <button type="button" onClick={() => updateSlot(idx, 'imageUrl', '')} className="text-gray-400 hover:text-red-500 transition-colors" title="Remove">
                                <X size={13} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="relative h-[34px]">
                            <input type="file" accept="image/*" onChange={e => handleFileUpload(e, `slotImage_${idx}`)} disabled={uploading[`slotImage_${idx}`]} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                            <div className="h-full bg-white border border-gray-200 rounded-lg flex items-center justify-center text-[12px] text-[#555] hover:bg-gray-50 transition-colors">
                              {uploading[`slotImage_${idx}`] ? (
                                <Loader2 size={14} className="animate-spin text-gray-400" />
                              ) : 'Upload Image'}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full h-px bg-gray-100 mb-10" />

            {/* Section 3: Amenities */}
            <div className="mb-10">
              <h2 className="text-[18px] font-semibold text-[#111] mb-2 tracking-tight">3. Amenities & Security</h2>
              <p className="text-[13px] text-[#666] mb-6">Select all the features currently available at your facility.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: 'hasCCTV', label: '24/7 CCTV Surveillance' },
                  { name: 'hasSecurity', label: 'On-site Security Guards' },
                  { name: 'hasFireSafety', label: 'Fire Safety / Sprinklers'},
                  { name: 'hasWorkshop', label: 'Maintenance Workshop'},
                  { name: 'hasWashingArea', label: 'Washing / Detailing Area'},
                ].map((item) => (
                  <label key={item.name} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${form[item.name] ? 'border-[#2563eb] bg-blue-50/50' : 'border-gray-200 bg-gray-50 hover:border-gray-300'}`}>
                    <input type="checkbox" name={item.name} checked={form[item.name]} onChange={handleChange} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 accent-[#2563eb]" />
                    <span className="text-[13px] font-medium text-[#111]">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="w-full h-px bg-gray-100 mb-10" />

            {/* Section 4: Documents & Images */}
            <div className="mb-10">
              <h2 className="text-[18px] font-semibold text-[#111] mb-2 tracking-tight">4. Documents & Images</h2>
              <p className="text-[13px] text-[#666] mb-6">Please upload clear photos and valid PDF documents to speed up your verification.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[
                  { name: 'frontImageUrl', label: 'Garage Front Image (JPG/PNG)', accept: 'image/*' },
                  { name: 'businessRegistrationUrl', label: 'Business Registration (PDF/IMG)', accept: '.pdf,image/*' },
                  { name: 'licenseDocumentUrl', label: 'Operating License (PDF/IMG)', accept: '.pdf,image/*' },
                  { name: 'ownerIdProofUrl', label: 'Owner ID Proof (PDF/IMG)', accept: '.pdf,image/*' },
                  { name: 'propertyProofUrl', label: 'Property Ownership Proof (PDF/IMG)', accept: '.pdf,image/*' },
                ].map((doc) => (
                  <div key={doc.name} className="flex flex-col gap-2 p-4 rounded-xl border border-gray-200 bg-gray-50">
                    <label className="text-[11px] font-bold tracking-widest text-[#111] uppercase">{doc.label} *</label>
                    
                    {form[doc.name] ? (
                      <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg text-[12px] font-medium border border-gray-300 shadow-sm mt-1">
                        <div className="flex items-center gap-2 truncate min-w-0">
                          <span className="truncate text-gray-700">File attached</span>
                          <button type="button" onClick={() => setExpandedImage(form[doc.name])} className="text-gray-400 hover:text-black transition-colors shrink-0" title="Preview">
                            <Maximize2 size={14} />
                          </button>
                        </div>
                        <button type="button" onClick={() => setForm(f => ({ ...f, [doc.name]: '' }))} className="text-gray-400 hover:text-red-500 font-bold ml-2 shrink-0 transition-colors" title="Remove">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="relative mt-1">
                        <input 
                          type="file" 
                          accept={doc.accept}
                          onChange={(e) => handleFileUpload(e, doc.name)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          disabled={uploading[doc.name]}
                        />
                        <div className={`flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg px-4 py-6 text-center transition-colors ${uploading[doc.name] ? 'bg-gray-50' : 'hover:bg-gray-50 hover:border-black'}`}>
                          {uploading[doc.name] ? (
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 size={18} className="animate-spin text-gray-400" />
                              <div className="w-24 h-1 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-black rounded-full animate-pulse"></div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[12px] font-medium text-[#555]">Click or drag file to upload</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Extra Images Upload Area */}
                <div className="flex flex-col gap-2 p-4 rounded-xl border border-gray-200 bg-gray-50">
                  <label className="flex items-center justify-between text-[11px] font-bold tracking-widest text-[#111] uppercase">
                    Other Images (Optional)
                    {form.otherImageUrls.length > 0 && <span className="text-[#2563eb]">{form.otherImageUrls.length} uploaded</span>}
                  </label>
                  <div className="relative mt-1">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'otherImageUrls')}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={uploading['otherImageUrls']}
                    />
                    <div className={`flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg px-4 py-6 text-center transition-colors ${uploading['otherImageUrls'] ? 'bg-gray-50' : 'hover:bg-gray-50 hover:border-black'}`}>
                      {uploading['otherImageUrls'] ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 size={18} className="animate-spin text-gray-400" />
                          <div className="w-24 h-1 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-black rounded-full animate-pulse"></div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[12px] font-medium text-[#555]">Click or drag file to upload</span>
                      )}
                    </div>
                  </div>
                  {form.otherImageUrls.length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {form.otherImageUrls.map((url, i) => (
                         <div key={i} className="w-12 h-12 rounded bg-gray-200 overflow-hidden border border-gray-300 relative group cursor-pointer" onClick={() => setExpandedImage(url)}>
                           <img src={url} alt={`Extra ${i}`} className="w-full h-full object-cover" />
                           <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <span className="text-white text-[9px] font-semibold">View</span>
                           </div>
                           <button type="button" onClick={(e) => { e.stopPropagation(); setForm(f => ({...f, otherImageUrls: f.otherImageUrls.filter((_, idx) => idx !== i)})); }} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-[10px]"><X size={10}/></button>
                         </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>

            <div className="w-full h-px bg-gray-100 mb-10" />

            {/* Submit */}
            <div className="flex flex-col items-center">
              <p className="text-[12px] text-[#888] mb-6 text-center max-w-md leading-relaxed">
                By submitting this application, you agree to the GD1 Franchise Terms & Conditions. An application fee of ₹2,000 will be collected during the physical inspection.
              </p>
              <button
                disabled={loading}
                className="w-full sm:w-auto px-8 md:px-67 py-3.5 bg-[#2563eb] hover:bg-[#2d6df0] text-white rounded-full text-[13px] font-bold tracking-widest uppercase transition-all disabled:opacity-50 whitespace-nowrap"
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>

          </form>
        </div>
      </div>
      
      <Footer />

      {/* Terms and Conditions Modal */}
      {showTerms && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-[600px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.3)] animate-in fade-in zoom-in-95 duration-300">
            <div className="p-6 md:p-8">
              <h3 className="text-[20px] font-bold text-[#111] mb-2 tracking-tight">Terms and Conditions</h3>
              <p className="text-[13px] text-[#555] mb-6">Please read and accept our partner terms before submitting your application.</p>
              
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6 h-[200px] overflow-y-auto text-[13px] text-[#444] leading-relaxed scrollbar-thin">
                <p className="mb-3"><strong>1. Physical Agreement Requirement</strong><br/>
                By submitting this application, you acknowledge that this online submission is only the first step in the verification process. <strong>There will be a mandatory, binding physical agreement signed between the franchise property owner and Grand Auto Depot One (GD1)</strong> before any operations commence or any vehicles are stored at your facility.</p>
                
                <p className="mb-3"><strong>2. Inspection & Verification</strong><br/>
                GD1 reserves the right to conduct a comprehensive on-site physical inspection of the premises. An application fee of ₹2,000 will be collected during this physical inspection to cover administrative and vetting costs.</p>

                <p className="mb-3"><strong>3. Quality Standards</strong><br/>
                You agree to maintain all declared facilities (CCTV, Security, Fire Safety, etc.) at operational capacity 24/7. Failure to maintain these standards will result in immediate termination of the franchise agreement.</p>
              </div>

              <label className="flex items-start gap-3 cursor-pointer group mb-8">
                <input 
                  type="checkbox" 
                  checked={termsAccepted} 
                  onChange={(e) => setTermsAccepted(e.target.checked)} 
                  className="mt-1 w-4 h-4 rounded text-[#2563eb] focus:ring-[#2563eb] border-gray-300 transition-all"
                />
                <span className="text-[13px] text-[#111] font-medium leading-snug">
                  I have read, understood, and accept the Terms and Conditions, and I acknowledge the requirement for a physical agreement with GD1.
                </span>
              </label>

              <div className="flex items-center gap-3 justify-end">
                <button 
                  onClick={() => setShowTerms(false)}
                  className="px-6 py-2.5 text-[13px] font-bold text-[#555] hover:text-[#111] transition-colors uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmAndSubmit}
                  disabled={!termsAccepted || loading}
                  className="px-8 py-2.5 bg-[#111] hover:bg-[#222] disabled:opacity-50 text-white rounded-full text-[13px] font-bold tracking-widest uppercase transition-all"
                >
                  {loading ? 'Submitting...' : 'Accept & Submit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setPreviewUrl(null)}>
          <div className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreviewUrl(null)} className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors">
              <X size={24} />
            </button>
            {previewUrl.toLowerCase().includes('.pdf') ? (
              <iframe src={previewUrl} className="w-full h-[80vh] bg-white rounded-xl shadow-2xl" title="Document Preview" />
            ) : (
              <img src={previewUrl} className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl" alt="Preview" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
