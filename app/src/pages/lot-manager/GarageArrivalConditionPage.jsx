import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import { Camera, Image as ImageIcon, ArrowLeft, Loader2, X, AlertTriangle, SwitchCamera, Upload, Eye, Check, XCircle } from 'lucide-react';
import { getToken } from '../../api/auth';

const DB_NAME = 'PreRideDB';
const STORE_NAME = 'images';

const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const saveFile = async (key, file) => {
  if (!file) return;
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(file, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

const getFile = async (key) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const deleteFile = async (key) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

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
          facingMode="environment"
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

export default function GarageArrivalConditionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [frontFile, setFrontFile] = useState(null);
  const [rearFile, setRearFile] = useState(null);
  const [leftSideFile, setLeftSideFile] = useState(null);
  const [rightSideFile, setRightSideFile] = useState(null);
  const [interiorFile, setInteriorFile] = useState(null);
  const [odometerFile, setOdometerFile] = useState(null);
  const [rideDescription, setRideDescription] = useState('Arrived safely at the garage. Vehicle is securely parked.');
  const [submitting, setSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    if (previewImage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [previewImage]);

  useEffect(() => {
    getFile(`front-${id}`).then(f => f && setFrontFile(f));
    getFile(`rear-${id}`).then(f => f && setRearFile(f));
    getFile(`left-${id}`).then(f => f && setLeftSideFile(f));
    getFile(`right-${id}`).then(f => f && setRightSideFile(f));
    getFile(`interior-${id}`).then(f => f && setInteriorFile(f));
    getFile(`odometer-${id}`).then(f => f && setOdometerFile(f));
    const savedDesc = sessionStorage.getItem(`desc-${id}`);
    if (savedDesc) setRideDescription(savedDesc);
  }, [id]);

  useEffect(() => {
    if (frontFile) saveFile(`front-${id}`, frontFile);
  }, [frontFile, id]);

  useEffect(() => {
    if (rearFile) saveFile(`rear-${id}`, rearFile);
  }, [rearFile, id]);

  useEffect(() => {
    if (leftSideFile) saveFile(`left-${id}`, leftSideFile);
  }, [leftSideFile, id]);

  useEffect(() => {
    if (rightSideFile) saveFile(`right-${id}`, rightSideFile);
  }, [rightSideFile, id]);

  useEffect(() => {
    if (interiorFile) saveFile(`interior-${id}`, interiorFile);
  }, [interiorFile, id]);

  useEffect(() => {
    if (odometerFile) saveFile(`odometer-${id}`, odometerFile);
  }, [odometerFile, id]);

  useEffect(() => {
    sessionStorage.setItem(`desc-${id}`, rideDescription);
  }, [rideDescription, id]);

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

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!frontFile || !rearFile || !leftSideFile || !rightSideFile || !interiorFile || !odometerFile) {
      toast.error('Please upload all 6 arrival photos.');
      return;
    }
    if (!rideDescription.trim()) {
      toast.error('Please provide a short description.');
      return;
    }

    setSubmitting(true);
    try {
      toast.loading('Uploading images…', { id: 'upload' });
      const [frontUrl, rearUrl, leftUrl, rightUrl, interiorUrl, odometerUrl] = await Promise.all([
        uploadFile(frontFile),
        uploadFile(rearFile),
        uploadFile(leftSideFile),
        uploadFile(rightSideFile),
        uploadFile(interiorFile),
        uploadFile(odometerFile)
      ]);
      toast.dismiss('upload');

      const res = await fetch('https://gd1-grand-auto-depot-one-9ms1.onrender.com/api/Pickup/Manager-arrived/lot-submission', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken('AccessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          PickupRequestId: parseInt(id),
          FrontImageUrl: frontUrl,
          RearImageUrl: rearUrl,
          LeftSideImageUrl: leftUrl,
          RightSideImageUrl: rightUrl,
          InteriorImageUrl: interiorUrl,
          OdometerImageUrl: odometerUrl,
          ManagerRemarks: rideDescription
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Garage arrival condition submitted!');
        deleteFile(`front-${id}`);
        deleteFile(`rear-${id}`);
        deleteFile(`left-${id}`);
        deleteFile(`right-${id}`);
        deleteFile(`interior-${id}`);
        deleteFile(`odometer-${id}`);
        sessionStorage.removeItem(`desc-${id}`);
        navigate(`/lot-manager/pickup-details/${id}`);
      } else {
        toast.error(data.message || 'Failed to submit condition report.');
      }
    } catch (err) {
      toast.dismiss('upload');
      toast.error(err.message || 'Error uploading condition report.');
    } finally {
      setSubmitting(false);
    }
  };



  const allUploaded = frontFile && rearFile && leftSideFile && rightSideFile && interiorFile && odometerFile;

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
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Garage Arrival Condition</h2>
          <p className="text-gray-500 text-sm mt-0.5">Arrival condition report for Storing Pickup #{id}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-extrabold text-gray-900 text-xl">Arrival Photos</h3>
            <span className="text-xs text-gray-400 font-bold">
              {[frontFile, rearFile, leftSideFile, rightSideFile, interiorFile, odometerFile].filter(Boolean).length} / 6 photos
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <FileSlot label="Front Photo" icon={Camera} file={frontFile} onFile={setFrontFile} onPreview={setPreviewImage} />
            <FileSlot label="Rear Photo" icon={Camera} file={rearFile} onFile={setRearFile} onPreview={setPreviewImage} />
            <FileSlot label="Left Side" icon={Camera} file={leftSideFile} onFile={setLeftSideFile} onPreview={setPreviewImage} />
            <FileSlot label="Right Side" icon={Camera} file={rightSideFile} onFile={setRightSideFile} onPreview={setPreviewImage} />
            <FileSlot label="Interior Photo" icon={Camera} file={interiorFile} onFile={setInteriorFile} onPreview={setPreviewImage} />
            <FileSlot label="Odometer Photo" icon={ImageIcon} file={odometerFile} onFile={setOdometerFile} onPreview={setPreviewImage} />
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">Description / Remarks *</label>
          <textarea 
            rows="3"
            value={rideDescription}
            onChange={(e) => setRideDescription(e.target.value)}
            placeholder="E.g. Reached garage. Vehicle parked in slot securely."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all font-medium text-gray-900 resize-none outline-none"
          />
        </div>
        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={submitting || !allUploaded}
            className={`px-8 py-3.5 rounded-xl text-white font-bold transition-all shadow-md flex items-center gap-2 ${
              allUploaded && !submitting
                ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                : 'bg-gray-300 cursor-not-allowed shadow-none'
            }`}
          >
            {submitting ? (
              <><Loader2 size={18} className="animate-spin" /> Submitting…</>
            ) : (
              <><Check size={18} /> Submit & Continue</>
            )}
          </button>
        </div>
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
