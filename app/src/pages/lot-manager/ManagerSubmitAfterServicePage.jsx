import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import { getToken } from '../../api/auth';
import { X, Camera, Check, Eye, SwitchCamera, AlertTriangle, Loader2, Image as ImageIcon, Upload, ArrowLeft, CheckCircle } from 'lucide-react';

const WebcamModal = ({ onClose, onCapture, facingMode = 'environment' }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState(null);
  const [currentFacingMode, setCurrentFacingMode] = useState(facingMode);

  useEffect(() => {
    let mounted = true;
    const initCamera = async () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: currentFacingMode } });
        if (!mounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        setError("Could not access camera. Please check permissions.");
      }
    };
    initCamera();
    return () => {
      mounted = false;
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, [currentFacingMode]);

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (currentFacingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
      onCapture(file);
    }, 'image/jpeg', 0.9);
  };

  return createPortal(
    <div className="fixed inset-0 lg:left-[240px] xl:left-[260px] z-[100] bg-black flex flex-col items-center justify-center animate-fade-in">
      <button className="absolute top-6 right-6 text-white z-20 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors" onClick={onClose}><X size={28} /></button>
      {!error && (
        <button className="absolute top-6 left-6 text-white z-20 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors" onClick={() => setCurrentFacingMode(prev => prev === 'user' ? 'environment' : 'user')}><SwitchCamera size={24} /></button>
      )}
      {error ? (
        <div className="text-white text-center p-8 max-w-sm">
          <AlertTriangle size={64} className="mx-auto mb-6 text-red-500 opacity-80" />
          <p className="font-bold text-lg">{error}</p>
          <button onClick={onClose} className="mt-6 px-6 py-3 bg-white/20 rounded-xl font-bold hover:bg-white/30 transition-colors">Go Back</button>
        </div>
      ) : (
        <div className="relative w-full h-full sm:max-h-[85vh] sm:max-w-4xl flex items-center justify-center overflow-hidden sm:rounded-3xl sm:shadow-2xl bg-gray-900">
          <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-cover transition-transform duration-300 ${currentFacingMode === 'user' ? 'scale-x-[-1]' : ''}`} />
          <div className="absolute inset-0 border-[3px] border-dashed border-white/40 pointer-events-none m-8 sm:m-12 rounded-3xl" />
        </div>
      )}
      {!error && (
        <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center pb-[env(safe-area-inset-bottom)]">
          <button onClick={capturePhoto} className="w-20 h-20 bg-white/30 hover:bg-white/40 rounded-full flex items-center justify-center p-2 backdrop-blur-md transition-all active:scale-95"><div className="w-full h-full bg-white rounded-full shadow-lg" /></button>
          <p className="text-white/70 text-xs font-bold uppercase tracking-widest mt-4">Take Photo</p>
        </div>
      )}
    </div>,
    document.body
  );
};

const FileSlot = ({ label, icon: Icon, file, onFile, onPreview }) => {
  const preview = typeof file === 'string' ? file : (file ? URL.createObjectURL(file) : null);
  const [showOptions, setShowOptions] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider">{label}</p>
      <div onClick={() => setShowOptions(true)} className={`relative group block aspect-square rounded-2xl border-2 border-dashed overflow-hidden cursor-pointer transition-all duration-200 ${file ? 'border-blue-400 bg-blue-50/30' : 'border-gray-200 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/30'}`}>
        {preview ? (
          <>
            <img src={preview} alt={label} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2"><Camera size={20} className="text-white" /><span className="text-white text-[10px] font-bold">Change</span></div>
            <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPreview(preview); }} className="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center shadow text-gray-700 hover:text-blue-600 transition-colors"><Eye size={13} /></button>
            <div className="absolute bottom-2 left-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow"><Check size={12} className="text-white" strokeWidth={3} /></div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-gray-400">{Icon && <Icon size={22} className="opacity-50" />}<span className="text-[10px] font-bold uppercase text-center leading-tight px-1">Upload</span></div>
        )}
      </div>

      {showOptions && createPortal(
        <div className="fixed inset-0 lg:left-[240px] xl:left-[260px] z-[110] flex items-center justify-center bg-black/50 p-4 animate-fade-in" onClick={() => setShowOptions(false)}>
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 space-y-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-black text-gray-900 text-lg">Add {label}</h3>
              <button onClick={() => setShowOptions(false)} className="text-gray-400 hover:bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center"><X size={18} /></button>
            </div>
            <button onClick={() => { setShowOptions(false); setShowWebcam(true); }} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors text-left"><div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm text-blue-600"><Camera size={24} /></div><div><p className="font-bold text-gray-900">Take Photo</p><p className="text-xs text-gray-500 font-medium">Use your device camera</p></div></button>
            <label className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors text-left"><div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm text-gray-600"><ImageIcon size={24} /></div><div><p className="font-bold text-gray-900">Upload from Gallery</p><p className="text-xs text-gray-500 font-medium">Choose an existing photo</p></div><input type="file" accept="image/*" className="hidden" onChange={(e) => { if(e.target.files?.[0]) { onFile(e.target.files[0]); setShowOptions(false); } }} /></label>
          </div>
        </div>, document.body
      )}
      {showWebcam && <WebcamModal facingMode="environment" onClose={() => setShowWebcam(false)} onCapture={(file) => { onFile(file); setShowWebcam(false); }} />}
    </div>
  );
};

export default function ManagerSubmitAfterServicePage() {
  const { id, vehicleId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId');

  const parsedTaskId = (id && id !== 'adhoc') ? parseInt(id) : null;
  const parsedVehicleId = vehicleId ? parseInt(vehicleId) : null;

  const STORAGE_KEY = `weekly_draft_${parsedTaskId ?? 'adhoc'}_${parsedVehicleId ?? 0}`;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedImage, setExpandedImage] = useState(null);
  const [form, setForm] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_form');
    return saved ? JSON.parse(saved) : {
      carWashCompleted: true,
      tyrePressureChecked: true,
      dailyStartupsCompleted: true,
      managerRemarks: ''
    };
  });
  
  const [images, setImages] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_images');
    return saved ? JSON.parse(saved) : {
      frontImageUrl: null,
      rearImageUrl: null,
      leftSideImageUrl: null,
      rightSideImageUrl: null,
      interiorImageUrl: null,
      odometerImageUrl: null
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_form', JSON.stringify(form));
  }, [form, STORAGE_KEY]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_images', JSON.stringify(images));
  }, [images, STORAGE_KEY]);

  const handleCheckboxChange = (field) => {
    setForm(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleImageUpload = async (file, field) => {
    if (!file) return;
    const tid = toast.loading('Uploading image...');
    try {
      const token = getToken('AccessToken');
      const data = new FormData();
      data.append('file', file);
      const res = await fetch('https://gd1-grand-auto-depot-one-9ms1.onrender.com/api/Upload/upload-file', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: data
      });
      const text = await res.text();
      const result = text ? JSON.parse(text) : {};
      if (!res.ok) throw new Error(result?.message || result?.errors?.[0] || "Upload failed");
      setImages(prev => ({ ...prev, [field]: result.url }));
      toast.success('Image uploaded', { id: tid });
    } catch (err) {
      toast.error(err.message, { id: tid });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const missingImages = Object.values(images).some(img => !img);
    if (missingImages) {
      toast.error("Please provide all 6 required images.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const payload = {
        taskId: parsedTaskId ?? null,
        vehicleId: parsedVehicleId ?? null,
        managerRemarks: form.managerRemarks,
        ...images
      };
      console.log('Submitting weekly payload:', payload);

      const token = getToken('AccessToken');
      const res = await fetch('https://gd1-grand-auto-depot-one-9ms1.onrender.com/api/lot-manager/submit-afterservice', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const text = await res.text();
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch { /* ignore parse error */ }
      if (!res.ok || !data.success) throw new Error(data.message || `Server error ${res.status}`);

      toast.success("Weekly Report submitted successfully!");
      localStorage.removeItem(STORAGE_KEY + '_form');
      localStorage.removeItem(STORAGE_KEY + '_images');
      if (parsedVehicleId > 0) {
        navigate(`/lot-manager/vehicle-details/${parsedVehicleId}?bookingId=${bookingId || ''}`, { state: { bookingId } });
      } else {
        navigate('/lot-manager/tasks');
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto space-y-6 animate-fade-in pb-10">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm shrink-0"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-[28px] font-black text-gray-900 tracking-tight">Submit After Service Condition</h2>
          <p className="text-gray-500 text-sm mt-1">Capture photos and provide remarks for the after-service condition</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-6 lg:p-8">
        <form onSubmit={handleSubmit} className="space-y-10">
          
                    <div className="space-y-4 border-t border-gray-100 pt-8">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Camera size={20} className="text-blue-500" /> Required Images
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              <FileSlot label="Front" icon={Camera} file={images.frontImageUrl} onFile={(f) => handleImageUpload(f, 'frontImageUrl')} onPreview={setExpandedImage} />
              <FileSlot label="Rear" icon={Camera} file={images.rearImageUrl} onFile={(f) => handleImageUpload(f, 'rearImageUrl')} onPreview={setExpandedImage} />
              <FileSlot label="Left Side" icon={Camera} file={images.leftSideImageUrl} onFile={(f) => handleImageUpload(f, 'leftSideImageUrl')} onPreview={setExpandedImage} />
              <FileSlot label="Right Side" icon={Camera} file={images.rightSideImageUrl} onFile={(f) => handleImageUpload(f, 'rightSideImageUrl')} onPreview={setExpandedImage} />
              <FileSlot label="Interior" icon={Camera} file={images.interiorImageUrl} onFile={(f) => handleImageUpload(f, 'interiorImageUrl')} onPreview={setExpandedImage} />
              <FileSlot label="Odometer" icon={Camera} file={images.odometerImageUrl} onFile={(f) => handleImageUpload(f, 'odometerImageUrl')} onPreview={setExpandedImage} />
            </div>
          </div>

          <div className="space-y-4 border-t border-gray-100 pt-8">
            <h3 className="text-lg font-bold text-gray-900">Manager Remarks</h3>
            <textarea 
              value={form.managerRemarks}
              onChange={(e) => setForm(p => ({ ...p, managerRemarks: e.target.value }))}
              placeholder="Enter any additional remarks, observations, or condition details..."
              className="w-full p-5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none h-32 font-medium"
              required
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto px-8 py-4 bg-[#0071e3] text-white font-bold rounded-xl hover:bg-[#0077ED] transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-200 disabled:opacity-70 disabled:cursor-not-allowed">
              {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <><Upload size={20} /> Submit Report</>}
            </button>
          </div>
        </form>
      </div>

      {expandedImage && createPortal(
        <div className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center animate-fade-in" onClick={() => setExpandedImage(null)}>
          <button className="absolute top-6 right-6 text-white w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"><X size={24} /></button>
          <img src={expandedImage} className="max-w-[95vw] max-h-[90vh] object-contain rounded-lg shadow-2xl" alt="Preview" />
        </div>, document.body
      )}
    </div>
  );
}
