import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getToken } from '../../api/auth';
import { toast } from 'react-hot-toast';
import { ArrowLeft, MapPin, Phone, CheckCircle, Image as ImageIcon, Wrench } from 'lucide-react';

const api = {
  get: async (url) => {
    const res = await fetch(`https://localhost:7108/api${url}`, {
      headers: { Authorization: `Bearer ${getToken('AccessToken')}` }
    });
    if (!res.ok) throw new Error('API Error');
    return { data: await res.json() };
  }
};

export default function AdminServiceCenterDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServiceCenterDetails();
  }, [id]);

  const fetchServiceCenterDetails = async () => {
    try {
      const res = await api.get(`/admin/partners/service-centers/${id}`);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to fetch service center details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/partners')} className="p-3 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">{data.name}</h1>
            <p className="text-gray-500 font-medium">Service Center Partner Details</p>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <CheckCircle size={24} />
                </div>
                <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Total Bookings</p>
                    <p className="text-2xl font-black text-gray-900">{data.totalBookings}</p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Phone size={24} />
                </div>
                <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Contact</p>
                    <p className="text-lg font-black text-gray-900">{data.phoneNumber}</p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <MapPin size={24} />
                </div>
                <div className="overflow-hidden">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Location</p>
                    <p className="text-sm font-black text-gray-900 truncate">{data.city}, {data.state}</p>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content (Left) */}
            <div className="lg:col-span-2 space-y-8">
                
                {/* Property Image & Supported Brands */}
                <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                            <ImageIcon size={20} />
                        </div>
                        <h2 className="text-xl font-black text-gray-900">Property Image</h2>
                    </div>
                    {data.imageUrl ? (
                        <div className="aspect-[21/9] rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 mb-8">
                            <img src={data.imageUrl} alt={data.name} className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="aspect-[21/9] rounded-2xl bg-gray-50 border border-gray-100 flex flex-col items-center justify-center mb-8">
                            <Wrench size={40} className="text-gray-300 mb-2" />
                            <p className="text-gray-400 font-medium text-sm">No Property Image</p>
                        </div>
                    )}

                    <div className="pt-6 border-t border-gray-100">
                        <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Supported Brands</h3>
                        <div className="flex flex-wrap gap-2">
                            {data.supportedBrands ? data.supportedBrands.split(',').map((brand, idx) => (
                                <span key={idx} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-bold rounded-lg border border-gray-200">
                                    {brand.trim()}
                                </span>
                            )) : (
                                <p className="text-gray-500 italic text-sm">No brands specified.</p>
                            )}
                        </div>
                    </div>
                </div>

            </div>

            {/* Sidebar Content (Right) */}
            <div className="space-y-8">
                
                {/* Documents Section */}
                <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                    <h2 className="text-lg font-black text-gray-900 mb-6">Verification Documents</h2>
                    
                    <div className="space-y-4">
                        {[
                            { label: 'OEM Certificate', url: data.oemCertificateUrl },
                            { label: 'Owner ID Proof', url: data.ownerIdProofUrl }
                        ].map((doc, idx) => (
                            <div key={idx} className="p-4 rounded-2xl border border-gray-100 bg-gray-50">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">{doc.label}</p>
                                {doc.url ? (
                                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="block aspect-video rounded-xl overflow-hidden bg-gray-200 hover:opacity-90 transition-opacity">
                                        <img src={doc.url} alt={doc.label} className="w-full h-full object-cover" />
                                    </a>
                                ) : (
                                    <div className="aspect-video rounded-xl bg-gray-200 flex items-center justify-center">
                                        <span className="text-xs text-gray-400 font-medium">Not Provided</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>

      </div>
    </div>
  );
}
