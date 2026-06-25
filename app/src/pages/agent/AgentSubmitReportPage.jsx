import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Camera, X, MapPin, Loader2, CheckCircle, RefreshCcw } from 'lucide-react';
import toast from 'react-hot-toast';

const CameraCaptureModal = ({ onClose, onCapture }) => {
  const videoRef = useRef(null);
  const [facingMode, setFacingMode] = useState("environment");

  useEffect(() => {
    let stream = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: { ideal: facingMode } } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        toast.error("Camera access denied or unavailable.");
        onClose();
      }
    };
    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode, onClose]);

  const takePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (facingMode === 'user') {
      // Mirror the image context for front camera
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `photo_${Date.now()}.jpg`, { type: "image/jpeg" });
        onCapture(file);
      }
    }, 'image/jpeg', 0.8);
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === "environment" ? "user" : "environment");
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-black flex flex-col animate-fade-in">
      <div className="p-4 flex justify-between items-center text-white bg-black/50 absolute top-0 left-0 right-0 z-10">
        <span className="font-bold">Take Photo</span>
        <button type="button" onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={24} /></button>
      </div>
      <div className="flex-1 w-full bg-black flex items-center justify-center relative overflow-hidden">
        <video ref={videoRef} autoPlay playsInline className={`absolute inset-0 w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`} />
      </div>
      <div className="p-6 pb-12 bg-black/80 absolute bottom-0 left-0 right-0 flex items-center justify-between backdrop-blur-sm px-10">
        <div className="w-12 h-12"></div> {/* Spacer for center alignment */}
        <button 
          type="button" 
          onClick={takePhoto} 
          className="w-16 h-16 rounded-full border-4 border-white bg-white/30 active:bg-white active:scale-95 transition-all shadow-xl"
        ></button>
        <button 
          type="button" 
          onClick={toggleCamera}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
        >
          <RefreshCcw size={20} />
        </button>
      </div>
    </div>,
    document.body
  );
};

export default function AgentSubmitReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [appData, setAppData] = useState(null);

  const [overallDescription, setOverallDescription] = useState('');
  const [siteImages, setSiteImages] = useState([]);
  
  // slots state: array of { slotNumber, isVerified, squareFeet, heightFeet, imageUrl, imageFile }
  const [slotsState, setSlotsState] = useState([]);

  // Camera State
  const [activeCameraTarget, setActiveCameraTarget] = useState(null);

  useEffect(() => {
    fetchAssignment();
  }, [id]);

  const fetchAssignment = async () => {
    try {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; AccessToken=`);
      const token = parts.length === 2 ? parts.pop().split(';').shift() : null;

      const res = await fetch('https://localhost:7108/api/agents/my-inspections', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        // find the app that contains the assignment id
        const app = (result.data || []).find(a => 
          (a.assignments || []).some(assign => assign.id.toString() === id)
        );
        if (app) {
          setAppData(app);
          // init slots
          const initialSlots = (app.slots || []).map(s => ({
            slotNumber: s.slotNumber,
            isVerified: true,
            squareFeet: 0,
            heightFeet: 0,
            imageUrl: '',
            imageFile: null
          }));
          setSlotsState(initialSlots);
        } else {
          toast.error("Assignment not found");
          navigate('/agent/assignments');
        }
      }
    } catch (err) {
      toast.error('Failed to load assignment data.');
    } finally {
      setLoading(false);
    }
  };

  const handleCameraCapture = (file) => {
    const preview = URL.createObjectURL(file);
    if (activeCameraTarget === 'site') {
      setSiteImages(prev => [...prev, { file, preview, uploadedUrl: '' }]);
    } else if (typeof activeCameraTarget === 'number') {
      setSlotsState(prev => {
        const nw = [...prev];
        nw[activeCameraTarget].imageFile = file;
        nw[activeCameraTarget].imageUrl = preview;
        return nw;
      });
    }
    setActiveCameraTarget(null);
  };

  const removeSiteImage = (idx) => {
    setSiteImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSlotChange = (idx, field, val) => {
    setSlotsState(prev => {
      const nw = [...prev];
      nw[idx][field] = val;
      return nw;
    });
  };

  const uploadFileToServer = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch('https://localhost:7108/api/upload/upload-file', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        return data.url;
      }
    } catch (err) {
      console.error(err);
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // 1. Upload site images
      const uploadedSiteImages = [];
      for (const imgObj of siteImages) {
        const url = await uploadFileToServer(imgObj.file);
        if (url) uploadedSiteImages.push(url);
      }

      // 2. Upload slot images
      const finalizedSlots = [];
      for (const s of slotsState) {
        let url = s.imageUrl;
        if (s.imageFile) {
          const up = await uploadFileToServer(s.imageFile);
          if (up) url = up;
        }
        finalizedSlots.push({
          slotNumber: s.slotNumber,
          isVerified: s.isVerified, squareFeet: 0, heightFeet: 0, imageUrl: url
        });
      }

      // 3. Submit
      const value = `; ${document.cookie}`;
      const parts = value.split(`; AccessToken=`);
      const token = parts.length === 2 ? parts.pop().split(';').shift() : null;

      const payload = {
        overallDescription,
        siteImages: uploadedSiteImages,
        slots: finalizedSlots
      };

      const res = await fetch(`https://localhost:7108/api/agents/assignments/${id}/submit-inspection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to submit inspection");

      toast.success("Inspection submitted successfully!");
      navigate('/agent/assignments');
    } catch (err) {
      toast.error(err.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-100px)]">
         <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!appData) return null;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-fade-in pt-4 pb-20">
      
      {activeCameraTarget !== null && (
        <CameraCaptureModal 
          onClose={() => setActiveCameraTarget(null)} 
          onCapture={handleCameraCapture} 
        />
      )}

      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <p className="text-sm font-bold text-gray-400 tracking-wider uppercase mb-1">Submit Inspection Report</p>
          <h2 className="text-3xl font-bold text-[#111]">{appData.businessName}</h2>
          <div className="flex items-center gap-2 text-gray-500 mt-2">
            <MapPin size={16} />
            <span className="text-sm font-medium">{appData.city}, {appData.state}</span>
          </div>
        </div>
        <button onClick={() => navigate('/agent/assignments')} className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors">
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Overall Observations */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
          <h3 className="text-xl font-bold text-[#111] mb-6">Overall Observations</h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Detailed Report Description</label>
              <textarea 
                required
                rows="4"
                value={overallDescription}
                onChange={e => setOverallDescription(e.target.value)}
                placeholder="Describe the overall condition, facilities, security, and general findings..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none resize-none"
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">General Site Images</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {siteImages.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-200 group">
                    <img src={img.preview} alt="preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeSiteImage(idx)} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-red-500 transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button 
                  type="button" 
                  onClick={() => setActiveCameraTarget('site')}
                  className="flex flex-col items-center justify-center aspect-square rounded-2xl border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors w-full"
                >
                  <Camera size={24} className="text-gray-400 mb-2" />
                  <span className="text-xs font-bold text-gray-500">Take Photo</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Slot Verifications */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
          <h3 className="text-xl font-bold text-[#111] border-b border-gray-100 pb-4">Slot Verification</h3>
          
          <div className="space-y-6">
            {slotsState.map((slot, idx) => (
              <div key={idx} className="p-6 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col gap-4">
                
                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-bold text-[#111]">Slot #{slot.slotNumber}</h4>
                  <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm hover:border-blue-300 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={slot.isVerified}
                      onChange={e => handleSlotChange(idx, 'isVerified', e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className={`text-sm font-bold ${slot.isVerified ? 'text-green-600' : 'text-gray-500'}`}>
                      {slot.isVerified ? 'Verified' : 'Verification Failed'}
                    </span>
                  </label>
                </div>

                {/* Image Upload Area */}
                <div className="w-full sm:w-48 shrink-0">
                  <button 
                    type="button" 
                    onClick={() => setActiveCameraTarget(idx)}
                    className="block w-full aspect-square rounded-xl border border-gray-300 overflow-hidden relative group bg-white hover:border-blue-500 transition-colors"
                  >
                    {slot.imageUrl ? (
                      <>
                        <img src={slot.imageUrl} alt="Slot" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-white text-xs font-bold">Change Image</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400 group-hover:text-blue-500 transition-colors">
                        <Camera size={24} className="mb-2" />
                        <span className="text-xs font-bold">Take Photo</span>
                      </div>
                    )}
                  </button>
                </div>

              </div>
            ))}
            {slotsState.length === 0 && (
              <p className="text-gray-500 italic text-sm">No slots available for this property.</p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <button 
            type="submit" 
            disabled={submitting}
            className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-50"
          >
            {submitting ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle size={20} />}
            {submitting ? 'Submitting Report...' : 'Submit Final Report'}
          </button>
        </div>

      </form>
    </div>
  );
}
