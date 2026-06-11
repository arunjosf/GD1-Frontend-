import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, Camera, Loader2, ArrowLeft, CheckCircle, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getToken } from '../../api/auth';

export default function ManagerSubmitOnDemandPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [notes, setNotes] = useState('');

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const tId = toast.loading('Uploading image...');
    try {
      const data = new FormData();
      data.append('file', file);
      
      const token = getToken('AccessToken');
      const res = await fetch('https://localhost:7108/api/file/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: data
      });

      if (!res.ok) throw new Error("Upload failed");
      const result = await res.json();
      setImages(prev => [...prev, result.url]);
      toast.success('Image uploaded', { id: tId });
    } catch (err) {
      toast.error(err.message, { id: tId });
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setImages(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (images.length === 0) {
      toast.error("Please upload at least one image.");
      return;
    }

    setLoading(true);
    try {
      const token = getToken('AccessToken');
      const res = await fetch('https://localhost:7108/api/lot-manager/submit-ondemand-images', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ taskId: parseInt(id), images, notes })
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || "Failed to submit images");
      
      toast.success("Images submitted successfully!");
      navigate('/lot-manager/tasks');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `https://localhost:7108${url.startsWith('/') ? url : `/${url}`}`;
  };

  return (
    <div className="w-full max-w-[800px] mx-auto space-y-6 animate-fade-in pb-10">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate('/lot-manager/tasks')}
          className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm shrink-0"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-[28px] font-black text-gray-900 tracking-tight">On-Demand Image Request</h2>
          <p className="text-gray-500 text-sm mt-1">Upload the requested images of the vehicle</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-8">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center justify-between">
            <span>Uploaded Images <span className="text-gray-400 font-normal text-sm">({images.length} added)</span></span>
            <label className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 text-sm font-bold rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
              <Camera size={16} /> Add Image
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
            </label>
          </h3>
          
          {images.length === 0 ? (
            <div className="h-40 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
              <Camera size={32} className="mb-2" />
              <p className="text-sm font-medium">No images uploaded yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {images.map((url, i) => (
                <div key={i} className="relative h-32 rounded-xl border border-gray-200 overflow-hidden group">
                  <img src={getImageUrl(url)} alt={`Upload ${i}`} className="w-full h-full object-cover" />
                  <button 
                    type="button"
                    onClick={() => handleRemoveImage(i)}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Notes (Optional)</h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any specific notes requested by the owner..."
            className="w-full rounded-2xl border-gray-200 p-4 min-h-[120px] focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-50">
          <button
            type="submit"
            disabled={loading || images.length === 0}
            className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm shadow-blue-200"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle size={20} />}
            Submit Images
          </button>
        </div>
      </form>
    </div>
  );
}
