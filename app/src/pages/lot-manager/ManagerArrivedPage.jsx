import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getToken } from '../../api/auth';
import {
  ArrowLeft, Upload, Camera, Check, X, Loader2, ShieldCheck,
  RefreshCw, Car, AlertTriangle, CheckCircle2, Eye, SwitchCamera
} from 'lucide-react';
import { XCircle } from 'lucide-react';

const WebcamModal = ({ onClose, onCapture, facingMode = 'environment' }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState(null);
  const [currentFacingMode, setCurrentFacingMode] = useState(facingMode);

  useEffect(() => {
    let mounted = true;
    const initCamera = async () => {
      // Stop existing stream before requesting a new one
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
    
    // If selfie mode, mirror the drawing
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
          {/* Camera Frame Guide */}
          <div className="absolute inset-0 border-[3px] border-dashed border-white/40 pointer-events-none m-8 sm:m-12 rounded-3xl" />
        </div>
      )}
      
      {/* Shutter Button */}
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

// File picker helper
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
            {/* Eye preview button */}
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

      {/* Upload Options Modal */}
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

      {/* Webcam Capture Modal */}
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

export default function ManagerArrivedPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pickup, setPickup] = useState(null);
  const [loading, setLoading] = useState(true);

  // Image files & preview URLs
  const [frontFile, setFrontFile] = useState(null);
  const [rearFile, setRearFile] = useState(null);
  const [leftFile, setLeftFile] = useState(null);
  const [rightFile, setRightFile] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);

  // Preview
  const [previewImage, setPreviewImage] = useState(null);

  // Submission state
  const [submitting, setSubmitting] = useState(false);

  // OTP Popup state (shown after successful image submission)
  const [otpPopupOpen, setOtpPopupOpen] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpResending, setOtpResending] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState(false);

  const otpInputRefs = useRef([]);

  const handleOtpChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d+$/.test(value)) return;

    // Handle pasting multiple digits
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, '').slice(0, 6);
      setOtpValue(pasted);
      if (pasted.length === 6 && otpInputRefs.current[5]) {
        otpInputRefs.current[5].focus();
      } else if (pasted.length > 0 && otpInputRefs.current[pasted.length]) {
        otpInputRefs.current[pasted.length].focus();
      }
      return;
    }

    const newOtp = otpValue.split('');
    newOtp[index] = value;
    const finalOtp = newOtp.join('').slice(0, 6);
    setOtpValue(finalOtp);

    // Auto advance
    if (value && index < 5 && otpInputRefs.current[index + 1]) {
      otpInputRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpValue[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
      const newOtp = otpValue.split('');
      newOtp[index - 1] = '';
      setOtpValue(newOtp.join(''));
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Disable body scroll when modals are open
  useEffect(() => {
    if (previewImage || otpPopupOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [previewImage, otpPopupOpen]);

  useEffect(() => {
    fetchPickup();
  }, [id]);

  const fetchPickup = async () => {
    try {
      const token = getToken('AccessToken');
      if (!token) return;
      const res = await fetch(`https://gd1-grand-auto-depot-one-9ms1.onrender.com/api/Pickup/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) {
        setPickup(result.data);
        
        // Restore images if they were already submitted and saved in the DB
        if (result.data.pickupImages) {
          setFrontFile(result.data.pickupImages.frontImageUrl);
          setRearFile(result.data.pickupImages.rearImageUrl);
          setLeftFile(result.data.pickupImages.leftSideImageUrl);
          setRightFile(result.data.pickupImages.rightSideImageUrl);
          setSelfieFile(result.data.pickupImages.selfieUrl);
        }

        if (result.data.status === 'OtpSent') {
          setOtpPopupOpen(true);
        }
      } else {
        toast.error('Could not load pickup details.');
        navigate(-1);
      }
    } catch {
      toast.error('Network error loading pickup.');
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file) => {
    if (typeof file === 'string') return file;
    const token = getToken('AccessToken');
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('https://gd1-grand-auto-depot-one-9ms1.onrender.com/api/Upload/upload-file', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();
    return data.url;
  };

  const handleSubmit = async () => {
    if (!frontFile || !rearFile || !leftFile || !rightFile || !selfieFile) {
      toast.error('All 5 photos are required before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      toast.loading('Uploading images…', { id: 'upload' });
      const [frontUrl, rearUrl, leftUrl, rightUrl, selfieUrl] = await Promise.all([
        uploadFile(frontFile),
        uploadFile(rearFile),
        uploadFile(leftFile),
        uploadFile(rightFile),
        uploadFile(selfieFile),
      ]);
      toast.dismiss('upload');

      const token = getToken('AccessToken');
      const res = await fetch('https://gd1-grand-auto-depot-one-9ms1.onrender.com/api/Pickup/Manager-arrived/pickup-submission', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          PickupRequestId: parseInt(id),
          FrontImageUrl: frontUrl,
          RearImageUrl: rearUrl,
          LeftSideImageUrl: leftUrl,
          RightSideImageUrl: rightUrl,
          SelfieUrl: selfieUrl,
        })
      });
      const result = await res.json();
      if (result.success) {
        toast.success('Images submitted! OTP has been sent to the vehicle owner.');
        setOtpPopupOpen(true);
      } else {
        toast.error(result.message || 'Submission failed.');
      }
    } catch (err) {
      toast.dismiss('upload');
      toast.error(err.message || 'An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpValue.trim()) {
      toast.error('Please enter the OTP.');
      return;
    }
    setOtpVerifying(true);
    try {
      const token = getToken('AccessToken');
      const res = await fetch('https://gd1-grand-auto-depot-one-9ms1.onrender.com/api/Pickup/manager/verify-otp', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          PickupRequestId: parseInt(id),
          Otp: otpValue.trim()
        })
      });
      const result = await res.json();
      if (result.success) {
        setOtpSuccess(true);
        toast.success('OTP verified! Vehicle handover authorized.');
        setTimeout(() => {
          navigate(`/lot-manager/pre-ride-condition/${id}`);
        }, 1800);
      } else {
        toast.error(result.message || 'Invalid OTP. Please try again.');
      }
    } catch {
      toast.error('Network error verifying OTP.');
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    setOtpResending(true);
    try {
      // Re-submit images to trigger a fresh OTP resend
      toast.loading('Resending OTP to vehicle owner…', { id: 'resend' });
      const token = getToken('AccessToken');
      // Re-use the already-submitted pickup — we call the same endpoint but images 
      // are already stored. For simplicity we call a no-op re-trigger by re-submitting.
      // The backend will regenerate the OTP and re-email the owner.
      const res = await fetch('https://gd1-grand-auto-depot-one-9ms1.onrender.com/api/Pickup/Manager-arrived/pickup-submission', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          PickupRequestId: parseInt(id),
          // Send dummy non-empty strings — server validates readability so we try
          // the last uploaded images from state. We fall back gracefully.
          FrontImageUrl: pickup?.pickupImages?.frontImageUrl || '',
          RearImageUrl: pickup?.pickupImages?.rearImageUrl || '',
          LeftSideImageUrl: pickup?.pickupImages?.leftSideImageUrl || '',
          RightSideImageUrl: pickup?.pickupImages?.rightSideImageUrl || '',
          SelfieUrl: pickup?.pickupImages?.selfieUrl || '',
        })
      });
      toast.dismiss('resend');
      const result = await res.json();
      if (result.success) {
        toast.success('OTP resent to vehicle owner.');
        setOtpValue('');
      } else {
        toast.error(result.message || 'Could not resend OTP.');
      }
    } catch {
      toast.dismiss('resend');
      toast.error('Network error resending OTP.');
    } finally {
      setOtpResending(false);
    }
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  const allUploaded = frontFile && rearFile && leftFile && rightFile && selfieFile;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-16 animate-fade-in">

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center bg-white border border-gray-100 text-gray-600 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Manager Arrived</h2>
          <p className="text-gray-500 text-sm mt-0.5">Document vehicle condition and initiate owner verification</p>
        </div>
      </div>

      {/* Vehicle quick info banner */}
      {pickup && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0">
            <Car size={22} className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-extrabold text-gray-900">{pickup.vehicleBrand} {pickup.vehicleModel}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{pickup.registrationNo} · Owner: {pickup.customerName}</p>
          </div>
          <div className="ml-auto">
            <span className="px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-black rounded-xl border border-amber-100 uppercase tracking-wider">
              Arrived at Vehicle
            </span>
          </div>
        </div>
      )}

      {/* Instructions Banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex gap-4">
        <AlertTriangle size={20} className="text-blue-500 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-extrabold mb-1">Before handing over the vehicle:</p>
          <ul className="space-y-0.5 text-blue-700 font-medium list-disc list-inside">
            <li>Take clear photos of all 4 exterior sides of the vehicle</li>
            <li>Take a live selfie with the vehicle in the background</li>
            <li>After submission, an OTP will be sent to the owner's email</li>
            <li>Enter the OTP shared by the owner to complete the handover</li>
          </ul>
        </div>
      </div>

      {/* Photo Grid */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-gray-900 text-lg">Vehicle Condition Photos</h3>
          <span className="text-xs text-gray-400 font-bold">
            {[frontFile, rearFile, leftFile, rightFile, selfieFile].filter(Boolean).length} / 5 photos
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <FileSlot label="Front" icon={Camera} file={frontFile} onFile={setFrontFile} onPreview={setPreviewImage} />
          <FileSlot label="Rear" icon={Camera} file={rearFile} onFile={setRearFile} onPreview={setPreviewImage} />
          <FileSlot label="Left Side" icon={Camera} file={leftFile} onFile={setLeftFile} onPreview={setPreviewImage} />
          <FileSlot label="Right Side" icon={Camera} file={rightFile} onFile={setRightFile} onPreview={setPreviewImage} />
          <FileSlot label="Live Selfie" icon={Camera} file={selfieFile} onFile={setSelfieFile} onPreview={setPreviewImage} />
          {/* Progress summary tile */}
          <div className="space-y-2">
            <p className="text-xs font-black text-transparent uppercase tracking-wider select-none" aria-hidden="true">Status</p>
            <div className={`aspect-[4/3] rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all duration-300 ${
              allUploaded ? 'border-green-300 bg-green-50' : 'border-gray-100 bg-gray-50'
            }`}>
              {allUploaded ? (
                <>
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                    <Check size={24} className="text-white" strokeWidth={3} />
                  </div>
                  <p className="text-xs font-black text-green-700 text-center">All Photos<br/>Ready!</p>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <Upload size={22} className="text-gray-400" />
                  </div>
                  <p className="text-xs font-bold text-gray-400 text-center">
                    {5 - [frontFile, rearFile, leftFile, rightFile, selfieFile].filter(Boolean).length} more<br/>needed
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

        <div className="fixed bottom-0 left-0 lg:left-[240px] xl:left-[260px] right-0 p-4 bg-white border-t border-gray-100 flex items-center justify-between z-10">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3.5 border border-gray-200 rounded-2xl text-gray-600 font-bold hover:bg-gray-50 transition-colors text-sm"
          >
            Cancel
          </button>
          {pickup?.status === 'OtpSent' ? (
            <button
              onClick={() => setOtpPopupOpen(true)}
              className="flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl text-white font-bold text-sm transition-all shadow-md bg-blue-600 hover:bg-blue-700 shadow-blue-500/20"
            >
              <ShieldCheck size={16} /> Enter Owner OTP
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || !allUploaded}
              className={`flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl text-white font-bold text-sm transition-all shadow-md ${
                allUploaded && !submitting
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                  : 'bg-gray-300 cursor-not-allowed shadow-none'
              }`}
            >
              {submitting ? (
                <><Loader2 size={16} className="animate-spin" /> Uploading & Submitting…</>
              ) : (
                <><ShieldCheck size={16} /> Submit & Send OTP to Owner</>
              )}
            </button>
          )}
        </div>

      {/* ── OTP Verification Popup ── */}
      {otpPopupOpen && createPortal(
        <div className="fixed inset-0 lg:left-[240px] xl:left-[260px] z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 space-y-6 animate-scale-up">

            {otpSuccess ? (
              /* Success state */
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center shadow-inner">
                  <CheckCircle2 size={44} className="text-green-500" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 text-center">Handover Verified!</h3>
                <p className="text-gray-500 text-sm text-center">
                  The vehicle handover is now authorized. You can start the ride to the garage.
                </p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-black text-gray-900">Enter Owner OTP</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      An OTP has been sent to the vehicle owner's email. Ask them to share it with you.
                    </p>
                  </div>
                  <button
                    onClick={() => setOtpPopupOpen(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors ml-4 mt-0.5"
                  >
                    <X size={22} />
                  </button>
                </div>

                {/* Owner notification info */}
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
                  <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-800">
                    <p className="font-extrabold">Owner has been notified!</p>
                    <p className="mt-0.5 font-medium">
                      An OTP valid for <strong>10 minutes</strong> has been emailed to the vehicle owner.
                      The owner will also be notified in the app that the manager has arrived and will call or message shortly.
                    </p>
                  </div>
                </div>

                {/* OTP Input */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-wider">
                    OTP (shared by vehicle owner)
                  </label>
                  <div className="flex justify-between gap-2">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <input
                        key={index}
                        ref={(el) => (otpInputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={otpValue[index] || ''}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className={`w-full aspect-square text-center text-2xl sm:text-3xl font-black rounded-2xl border-2 transition-all outline-none ${
                          otpValue[index] 
                            ? 'border-blue-500 bg-blue-50/30 text-blue-900 shadow-sm' 
                            : 'border-gray-200 bg-gray-50 text-gray-900 focus:border-blue-400 focus:bg-white'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 text-center mt-2">Ask the vehicle owner to check their email for the OTP</p>
                </div>

                {/* Buttons */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleVerifyOtp}
                    disabled={otpVerifying || otpValue.length < 4}
                    className={`w-full py-3.5 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all ${
                      otpValue.length >= 4 && !otpVerifying
                        ? 'bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {otpVerifying ? (
                      <><Loader2 size={16} className="animate-spin" /> Verifying…</>
                    ) : (
                      <><ShieldCheck size={16} /> Verify & Complete Handover</>
                    )}
                  </button>

                  <button
                    onClick={handleResendOtp}
                    disabled={otpResending}
                    className="w-full py-3 rounded-2xl border border-gray-200 font-bold text-gray-600 text-sm hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors"
                  >
                    {otpResending ? (
                      <><Loader2 size={14} className="animate-spin" /> Resending…</>
                    ) : (
                      <><RefreshCw size={14} /> Resend OTP to Owner</>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Image Preview Lightbox — fixed X button, no scroll, zoom only */}
      {previewImage && createPortal(
        <div
          className="fixed inset-0 lg:left-[240px] xl:left-[260px] z-[100] bg-black/95 flex items-center justify-center"
          onClick={() => setPreviewImage(null)}
        >
          {/* Fixed X button */}
          <button
            className="fixed top-4 right-4 z-[100] w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-sm"
            onClick={() => setPreviewImage(null)}
          >
            <XCircle size={28} />
          </button>

          {/* Image container */}
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
