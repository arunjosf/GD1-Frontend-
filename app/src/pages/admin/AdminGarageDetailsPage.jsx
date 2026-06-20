import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getToken } from '../../api/auth';
import { toast } from 'react-hot-toast';
import { ArrowLeft, MapPin, Phone, Building2, Layers, CheckCircle, FileText, Image as ImageIcon, UserCircle } from 'lucide-react';

const api = {
  get: async (url) => {
    const res = await fetch(`https://localhost:7108/api${url}`, {
      headers: { Authorization: `Bearer ${getToken('AccessToken')}` }
    });
    if (!res.ok) throw new Error('API Error');
    return { data: await res.json() };
  }
};

export default function AdminGarageDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGarageDetails();
  }, [id]);

  const fetchGarageDetails = async () => {
    try {
      const res = await api.get(`/admin/partners/garages/${id}`);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to fetch garage details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
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
            <p className="text-gray-500 font-medium">Garage Partner Details</p>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <CheckCircle size={24} />
                </div>
                <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Total Bookings</p>
                    <p className="text-2xl font-black text-gray-900">{data.totalBookings}</p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Layers size={24} />
                </div>
                <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Total Slots</p>
                    <p className="text-2xl font-black text-gray-900">{data.totalSlots}</p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Phone size={24} />
                </div>
                <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Contact</p>
                    <p className="text-lg font-black text-gray-900">{data.phoneNumber}</p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
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
                
                {/* Agent Inspection Report */}
                {data.agentInspection ? (
                    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                                <FileText size={20} />
                            </div>
                            <h2 className="text-xl font-black text-gray-900">Agent Inspection Report</h2>
                        </div>
                        
                        <div className="mb-6 p-4 bg-orange-50/50 rounded-2xl border border-orange-100">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-gray-500 uppercase">Inspected By</span>
                                <span className="text-sm font-black text-gray-900 flex items-center gap-2">
                                    <UserCircle size={16} className="text-orange-600"/> {data.agentInspection.agentName}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-gray-500 uppercase">Agent Contact</span>
                                <span className="text-sm font-black text-gray-900">{data.agentInspection.agentContact}</span>
                            </div>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-sm font-bold text-gray-900 mb-2">Overall Remarks</h3>
                            <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                                {data.agentInspection.overallDescription || "No remarks provided."}
                            </p>
                        </div>

                        {data.agentInspection.agentImages?.length > 0 && (
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-3">Agent Uploaded Site Images</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {data.agentInspection.agentImages.map((img, idx) => (
                                        <div key={idx} className="aspect-video rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                                            <img src={img} alt={`Agent Site ${idx}`} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm text-center">
                         <div className="w-16 h-16 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center mx-auto mb-4">
                            <FileText size={24} />
                        </div>
                        <h2 className="text-lg font-black text-gray-900 mb-1">No Inspection Report</h2>
                        <p className="text-gray-500 text-sm">This garage was onboarded without an agent inspection report.</p>
                    </div>
                )}

                {/* Owner Uploaded Images */}
                <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <ImageIcon size={20} />
                        </div>
                        <h2 className="text-xl font-black text-gray-900">Owner Uploaded Images</h2>
                    </div>
                    {data.ownerUploadedImages?.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {data.ownerUploadedImages.map((img, idx) => (
                                <div key={idx} className="aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-200">
                                    <img src={img} alt={`Owner Upload ${idx}`} className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm italic">No images uploaded by owner.</p>
                    )}
                </div>

            </div>

            {/* Sidebar Content (Right) */}
            <div className="space-y-8">
                
                {/* Documents Section */}
                <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                    <h2 className="text-lg font-black text-gray-900 mb-6">Verification Documents</h2>
                    
                    <div className="space-y-4">
                        {[
                            { label: 'Business Image', url: data.businessRegistrationUrl },
                            { label: 'License Document', url: data.licenseDocumentUrl },
                            { label: 'Property Proof', url: data.propertyProofUrl },
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
