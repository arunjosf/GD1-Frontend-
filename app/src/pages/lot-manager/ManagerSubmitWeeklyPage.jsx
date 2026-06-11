import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, Camera, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getToken } from '../../api/auth';

export default function ManagerSubmitWeeklyPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    frontViewUrl: '',
    rearViewUrl: '',
    leftSideUrl: '',
    rightSideUrl: '',
    odometerUrl: '',
    remarks: ''
  });

  const handleImageUpload = async (e, field) => {
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
      setFormData(prev => ({ ...prev, [field]: result.url }));
      toast.success('Image uploaded', { id: tId });
    } catch (err) {
      toast.error(err.message, { id: tId });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.frontViewUrl || !formData.rearViewUrl || !formData.leftSideUrl || !formData.rightSideUrl || !formData.odometerUrl) {
      toast.error("All 5 required images must be uploaded.");
      return;
    }

    setLoading(true);
    try {
      const token = getToken('AccessToken');
      const res = await fetch('https://localhost:7108/api/lot-manager/submit-weekly-check', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ taskId: parseInt(id), ...formData })
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || "Failed to submit report");
      
      toast.success("Weekly check submitted successfully!");
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

  const ImageUploadBox = ({ field, label }) => (
    <div className="relative h-40 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors group overflow-hidden">
      <input 
        type="file" 
        accept="image/*" 
        capture="environment"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
        onChange={(e) => handleImageUpload(e, field)}
      />
      {formData[field] ? (
        <>
          <img src={getImageUrl(formData[field])} alt={label} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-white font-bold flex items-center gap-2"><Upload size={18} /> Replace</span>
          </div>
          <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full shadow-sm">
            <CheckCircle size={14} />
          </div>
        </>
      ) : (
        <>
          <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 group-hover:text-blue-500 mb-2 transition-colors">
            <Camera size={20} />
          </div>
          <span className="text-sm font-bold text-gray-700">{label}</span>
        </>
      )}
    </div>
  );

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
          <h2 className="text-[28px] font-black text-gray-900 tracking-tight">Weekly Condition Check</h2>
          <p className="text-gray-500 text-sm mt-1">Capture and upload all required angles</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-8">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Required Images</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <ImageUploadBox field="frontViewUrl" label="Front View" />
            <ImageUploadBox field="rearViewUrl" label="Rear View" />
            <ImageUploadBox field="leftSideUrl" label="Left Side" />
            <ImageUploadBox field="rightSideUrl" label="Right Side" />
            <ImageUploadBox field="odometerUrl" label="Odometer" />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Remarks (Optional)</h3>
          <textarea
            value={formData.remarks}
            onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
            placeholder="Add any notes about scratches, dents, or other issues..."
            className="w-full rounded-2xl border-gray-200 p-4 min-h-[120px] focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-50">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm shadow-blue-200"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle size={20} />}
            Submit Report
          </button>
        </div>
      </form>
    </div>
  );
}
