import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getToken } from '../../api/auth';
import {
  ArrowLeft, Upload, Camera, Check, X, Loader2,
  AlertTriangle, SwitchCamera, Eye, XCircle, Image as ImageIcon
} from 'lucide-react';

const WebcamModal = ({ onClose, onCapture, facingMode = 'environment' }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState(null);
  const [currentFacingMode, setCurrentFacingMode] = useState(facingMode);

  useEffect(() => {
    let mounted = true;
    const initCamera = async () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: currentFacingMode } 
        });
        if (!mounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera access error:", err);
        setError("Could not access camera. Please check permissions or connect a webcam.");
      }
    };
    initCamera();
    
    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
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

  const toggleCamera = () => {
    setCurrentFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  return createPortal(
    <div className="fixed inset-0 lg:left-[240px] xl:left-[260px] z-[100] bg-black flex flex-col items-center justify-center animate-fade-in" onClick={(e) => e.stopPropagation()}>
      <button 
        className="absolute top-6 right-6 text-white z-20 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors" 
        onClick={onClose}
      >
        <X size={28} />
      </button>

      {!error && (
        <button 
          className="absolute top-6 left-6 text-white z-20 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors" 
          onClick={toggleCamera}
          title="Switch Camera"
        >
          <SwitchCamera size={24} />
        </button>
      )}
      
      {error ? (
        <div className="text-white text-center p-8 max-w-sm">
          <AlertTriangle size={64} className="mx-auto mb-6 text-red-500 opacity-80" />
          <p className="font-bold text-lg">{error}</p>
          <button 
            onClick={onClose}
            className="mt-6 px-6 py-3 bg-white/20 rounded-xl font-bold hover:bg-white/30 transition-colors"
          >
            Go Back
          </button>
        </div>
      ) : (
        <div className="relative w-full h-full sm:max-h-[85vh] sm:max-w-4xl flex items-center justify-center overflow-hidden sm:rounded-3xl sm:shadow-2xl bg-gray-900">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className={`w-full h-full object-cover transition-transform duration-300 ${currentFacingMode === 'user' ? 'scale-x-[-1]' : ''}`}
          />
          <div className="absolute inset-0 border-[3px] border-dashed border-white/40 pointer-events-none m-8 sm:m-12 rounded-3xl" />
        </div>
      )}
      
      {!error && (
        <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center pb-[env(safe-area-inset-bottom)]">
          <button 
            onClick={capturePhoto}
            className="w-20 h-20 bg-white/30 hover:bg-white/40 rounded-full flex items-center justify-center p-2 backdrop-blur-md transition-all active:scale-95"
          >
            <div className="w-full h-full bg-white rounded-full shadow-lg" />
          </button>
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

  useEffect(() => {
    if (showOptions || showWebcam) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [showOptions, showWebcam]);

  return (
    <div className="space-y-2">
      <p className="text-xs font-black text-gray-400 uppercase tracking-wider">{label}</p>
      <div
        onClick={() => setShowOptions(true)}
        className={`relative group block aspect-[4/3] rounded-2xl border-2 border-dashed overflow-hidden cursor-pointer transition-all duration-200 ${
          file ? 'border-blue-400 bg-blue-50/30' : 'border-gray-200 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/30'
        }`}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt={label}
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2"
            >
              <Camera size={20} className="text-white" />
              <span className="text-white text-[10px] font-bold">Change Photo</span>
            </div>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPreview(preview); }}
              className="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center shadow text-gray-700 hover:text-blue-600 transition-colors"
            >
              <Eye size={13} />
            </button>
            <div className="absolute bottom-2 left-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow">
              <Check size={12} className="text-white" strokeWidth={3} />
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-400">
            {Icon && <Icon size={28} className="opacity-50" />}
            <span className="text-[11px] font-bold">Tap to upload</span>
          </div>
        )}
      </div>

      {showOptions && createPortal(
        <div className="fixed inset-0 lg:left-[240px] xl:left-[260px] z-[100] flex items-center justify-center bg-black/50 p-4 animate-fade-in" onClick={() => setShowOptions(false)}>
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 space-y-4 animate-scale-up shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-black text-gray-900 text-lg">Add Photo</h3>
              <button onClick={() => setShowOptions(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 w-8 h-8 rounded-full flex items-center justify-center transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <button 
              onClick={() => {
                setShowOptions(false);
                setShowWebcam(true);
              }}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-blue-50 border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shrink-0 shadow-md">
                <Camera size={20} />
              </div>
              <div>
                <span className="block font-bold text-blue-900">Take Photo</span>
                <span className="text-xs text-blue-700/70">Use device camera</span>
              </div>
            </button>

            <label className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
              <div className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-600 shrink-0 shadow-sm">
                <Upload size={18} />
              </div>
              <div>
                <span className="block font-bold text-gray-900">Upload from Gallery</span>
                <span className="text-xs text-gray-500">Choose an existing photo</span>
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files[0]) onFile(e.target.files[0]);
                  setShowOptions(false);
                }}
              />
            </label>
          </div>
        </div>,
        document.body
      )}

      {showWebcam && (
        <WebcamModal 
          facingMode={label === 'Live Selfie' ? 'user' : 'environment'}
          onClose={() => setShowWebcam(false)}
          onCapture={(capturedFile) => {
            onFile(capturedFile);
            setShowWebcam(false);
          }}
        />
      )}
    </div>
  );
};

export default function ManagerSubmitOnDemandPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const STORAGE_KEY = `ondemand_draft_${id}`;
  
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {
      frontFile: null,
      rearFile: null,
      leftFile: null,
      rightFile: null,
      interiorFile: null,
      odometerFile: null
    };
  });

  const [previewImage, setPreviewImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData, id]);

  useEffect(() => {
    if (previewImage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [previewImage]);

  const handleFileUpload = async (file, field) => {
    if (!file) return;
    const tid = toast.loading('Uploading image...');
    try {
      const token = getToken('AccessToken');
      const data = new FormData();
      data.append('file', file);
      const res = await fetch('https://localhost:7108/api/Upload/upload-file', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: data
      });
      if (!res.ok) throw new Error('Upload failed');
      const result = await res.json();
      setFormData(prev => ({ ...prev, [field]: result.url }));
      toast.success('Image uploaded', { id: tid });
    } catch (err) {
      toast.error(err.message, { id: tid });
    }
  };

  const handleSubmit = async () => {
    const { frontFile, rearFile, leftFile, rightFile, interiorFile, odometerFile } = formData;
    if (!frontFile || !rearFile || !leftFile || !rightFile || !interiorFile || !odometerFile) {
      toast.error('All 6 photos are required.');
      return;
    }
    setSubmitting(true);
    try {
      const token = getToken('AccessToken');
      const res = await fetch('https://localhost:7108/api/lot-manager/submit-ondemand-images', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          taskId: parseInt(id),
          frontImageUrl: frontFile,
          rearImageUrl: rearFile,
          leftSideImageUrl: leftFile,
          rightSideImageUrl: rightFile,
          interiorImageUrl: interiorFile,
          odometerImageUrl: odometerFile,
        })
      });
      
      const result = await res.json();
      if (result.success) {
        toast.success('On-Demand Images submitted successfully!');
        localStorage.removeItem(STORAGE_KEY);
        navigate('/lot-manager/tasks');
      } else {
        toast.error(result.message || 'Submission failed.');
      }
    } catch (err) {
      toast.error(err.message || 'An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const allUploaded = formData.frontFile && formData.rearFile && formData.leftFile && formData.rightFile && formData.interiorFile && formData.odometerFile;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-24 animate-fade-in p-4 sm:p-6 lg:p-8">

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center bg-white border border-gray-100 text-gray-600 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">On-Demand Image Request</h2>
          <p className="text-gray-500 text-sm mt-0.5">Upload the requested 6 images of the vehicle</p>
        </div>
      </div>

      {/* Photo Grid */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-gray-900 text-lg">Vehicle Condition Photos</h3>
          <span className="text-xs text-gray-400 font-bold">
            {Object.values(formData).filter(Boolean).length} / 6 photos
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <FileSlot label="Front" icon={Camera} file={formData.frontFile} onFile={(f) => handleFileUpload(f, 'frontFile')} onPreview={setPreviewImage} />
          <FileSlot label="Rear" icon={Camera} file={formData.rearFile} onFile={(f) => handleFileUpload(f, 'rearFile')} onPreview={setPreviewImage} />
          <FileSlot label="Left Side" icon={Camera} file={formData.leftFile} onFile={(f) => handleFileUpload(f, 'leftFile')} onPreview={setPreviewImage} />
          <FileSlot label="Right Side" icon={Camera} file={formData.rightFile} onFile={(f) => handleFileUpload(f, 'rightFile')} onPreview={setPreviewImage} />
          <FileSlot label="Interior" icon={Camera} file={formData.interiorFile} onFile={(f) => handleFileUpload(f, 'interiorFile')} onPreview={setPreviewImage} />
          <FileSlot label="Odometer" icon={ImageIcon} file={formData.odometerFile} onFile={(f) => handleFileUpload(f, 'odometerFile')} onPreview={setPreviewImage} />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 lg:left-[240px] xl:left-[260px] right-0 p-4 bg-white border-t border-gray-100 flex items-center justify-end z-10">
        <button
          onClick={handleSubmit}
          disabled={submitting || !allUploaded}
          className={`flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl text-white font-bold text-sm transition-all shadow-md ${
            allUploaded && !submitting
              ? 'bg-[#0071e3] hover:bg-[#0077ED] shadow-blue-500/20'
              : 'bg-gray-300 cursor-not-allowed shadow-none'
          }`}
        >
          {submitting ? (
            <><Loader2 size={16} className="animate-spin" /> Uploading & Submitting…</>
          ) : (
            <><Check size={16} /> Submit Report</>
          )}
        </button>
      </div>

      {previewImage && createPortal(
        <div
          className="fixed inset-0 lg:left-[240px] xl:left-[260px] z-[100] bg-black/95 flex items-center justify-center"
          onClick={() => setPreviewImage(null)}
        >
          <button
            className="fixed top-4 right-4 z-[100] w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-sm"
            onClick={() => setPreviewImage(null)}
          >
            <XCircle size={28} />
          </button>
          <div
            className="w-full h-full flex flex-col items-center justify-center gap-3 px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-[85vh] w-auto h-auto object-contain rounded-2xl shadow-2xl select-none"
              draggable={false}
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
