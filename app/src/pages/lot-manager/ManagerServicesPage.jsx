import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, MapPin, Wrench, ChevronRight, Car, X, ShieldCheck } from 'lucide-react';
import { getToken } from '../../api/auth';
import { toast } from 'react-hot-toast';

export default function ManagerServicesPage() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Upcoming'); // 'Upcoming' | 'Serviced'
  const [searchQuery, setSearchQuery] = useState('');

  const [otpModal, setOtpModal] = useState({ isOpen: false, step: 'confirm', serviceId: null, otp: '' });
  const [otpLoading, setOtpLoading] = useState(false);

  const handleGenerateOtp = async (serviceId) => {
    setOtpLoading(true);
    try {
      const token = getToken('AccessToken');
      const res = await fetch(`https://localhost:7108/api/lot-manager/bookings/${serviceId}/trigger-otp`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to generate OTP');
      toast.success('OTP generated and sent to mechanic');
      setOtpModal(prev => ({ ...prev, step: 'input' }));
      fetchServices();
    } catch (error) {
      toast.error('Failed to generate OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpModal.otp.length !== 6) return toast.error('Enter a valid 6-digit OTP');
    setOtpLoading(true);
    try {
      const token = getToken('AccessToken');
      const res = await fetch(`https://localhost:7108/api/lot-manager/bookings/${otpModal.serviceId}/verify-otp`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ otp: otpModal.otp })
      });
      if (!res.ok) throw new Error('Failed to verify OTP');
      toast.success('OTP Verified successfully');
      setOtpModal({ isOpen: false, step: 'confirm', serviceId: null, otp: '' });
      fetchServices();
    } catch (error) {
      toast.error('Failed to verify OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const token = getToken('AccessToken');
      const res = await fetch(`https://localhost:7108/api/lot-manager/my-services`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch services');
      const result = await res.json();
      setServices(result.data || []);
    } catch (error) {
      toast.error('Could not load services');
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = 
      (service.vehicleBrand?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (service.vehicleModel?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (service.vehicleRegistrationNo?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      
    const isCompletedOrCancelled = service.isCompleted === true || service.status === 'Cancelled' || service.status === 'Service Completed' || service.status === 'Completed';
    
    if (activeTab === 'Upcoming') return matchesSearch && !isCompletedOrCancelled;
    if (activeTab === 'Serviced') return matchesSearch && isCompletedOrCancelled;
    return false;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12 pt-6 px-4 md:px-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Services</h1>
          <p className="text-gray-500 mt-1">Track and manage vehicle services</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex p-1 bg-gray-50 rounded-xl w-full sm:w-auto">
          <button 
            onClick={() => setActiveTab('Upcoming')}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'Upcoming' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Upcoming Services
          </button>
          <button 
            onClick={() => setActiveTab('Serviced')}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'Serviced' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Serviced History
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search brand, model..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-medium outline-none transition-all"
          />
        </div>
      </div>

      {filteredServices.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Wrench className="text-gray-400" size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No {activeTab.toLowerCase()} services found</h3>
          <p className="text-gray-500">When vehicles require service, they will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredServices.map(service => (
            <div key={service.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all group flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-6">
                  <div 
                    className="flex items-center gap-4 cursor-pointer hover:bg-gray-50 p-2 -m-2 rounded-xl transition-colors"
                    onClick={() => navigate(`/lot-manager/vehicles/${service.vehicleId}`)}
                  >
                    {service.vehicleImage ? (
                      <div className="w-16 h-16 bg-gray-100 rounded-2xl overflow-hidden shadow-sm shrink-0">
                        <img 
                          src={service.vehicleImage} 
                          alt={service.vehicleBrand}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 border border-gray-100 shrink-0">
                        <Car size={24} />
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 leading-tight">{service.vehicleBrand} {service.vehicleModel}</h3>
                      <span className="inline-block mt-1 px-2.5 py-0.5 bg-gray-100 rounded text-xs font-mono font-bold text-gray-600">
                        {service.vehicleRegistrationNo}
                      </span>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    service.status === 'Service Completed' ? 'bg-green-50 text-green-700' :
                    service.status === 'Cancelled' ? 'bg-red-50 text-red-700' :
                    'bg-blue-50 text-blue-700'
                  }`}>
                    {service.status}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Wrench size={16} className="text-gray-400 shrink-0" />
                    <span className="font-medium line-clamp-1">{service.serviceCenter?.name || service.serviceCenterName || 'Pending Assignment'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Calendar size={16} className="text-gray-400 shrink-0" />
                    <span className="font-medium">{service.scheduledDate ? new Date(service.scheduledDate).toLocaleDateString() : 'Unscheduled'}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border-t border-gray-50 bg-gray-50/50 group-hover:bg-blue-50/30 transition-colors flex flex-col gap-3">
                {(service.status === 'Assigned Mechanic' || service.status === 'Approved') && (
                  <button 
                    onClick={() => setOtpModal({ isOpen: true, step: 'confirm', serviceId: service.id, otp: '' })}
                    className="w-full flex items-center justify-center gap-2 bg-white border-2 border-[#0071e3] text-[#0071e3] hover:bg-blue-50 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm"
                  >
                    <ShieldCheck size={16} />
                    <span>Generate Mechanic OTP</span>
                  </button>
                )}
                {(service.status === 'Mechanic Arrived Garage' || service.status === 'MechanicArrived') && (
                  <button 
                    onClick={() => setOtpModal({ isOpen: true, step: 'input', serviceId: service.id, otp: '' })}
                    className="w-full flex items-center justify-center gap-2 bg-orange-50 border-2 border-orange-500 text-orange-600 hover:bg-orange-100 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm"
                  >
                    <ShieldCheck size={16} />
                    <span>Verify Mechanic OTP</span>
                  </button>
                )}
                <button 
                  onClick={() => navigate(`/lot-manager/services/${service.id}`)}
                  className="w-full flex items-center justify-center gap-2 bg-[#0071e3] hover:bg-[#0077ED] text-white py-3 rounded-xl font-bold text-sm transition-colors shadow-sm"
                >
                  <span>Track Service Journey</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    {/* OTP Modal */}
    {otpModal.isOpen && createPortal(
      <div className="fixed top-0 right-0 bottom-0 left-0 lg:left-[240px] xl:left-[260px] z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
        <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-slide-up">
          <div className="p-6 flex items-center justify-between border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">
              {otpModal.step === 'confirm' ? 'Confirm Arrival' : 'Verify Mechanic OTP'}
            </h2>
            <button 
              onClick={() => !otpLoading && setOtpModal({ isOpen: false, step: 'confirm', serviceId: null, otp: '' })}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          
          <div className="p-6">
            {otpModal.step === 'confirm' ? (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                  <ShieldCheck size={32} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Mechanic Arrived?</h3>
                  <p className="text-gray-500 text-sm">Are you sure the assigned mechanic has reached the vehicle? This will generate a verification OTP and send it to their email.</p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setOtpModal({ isOpen: false, step: 'confirm', serviceId: null, otp: '' })}
                    disabled={otpLoading}
                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl font-bold transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => handleGenerateOtp(otpModal.serviceId)}
                    disabled={otpLoading}
                    className="flex-1 py-3 bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {otpLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Generate OTP'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Enter 6-digit OTP</label>
                  <input 
                    type="text" 
                    maxLength={6}
                    value={otpModal.otp}
                    onChange={(e) => setOtpModal(prev => ({ ...prev, otp: e.target.value.replace(/\D/g, '') }))}
                    placeholder="• • • • • •"
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 text-center text-2xl font-mono tracking-widest outline-none transition-all"
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleVerifyOtp}
                    disabled={otpLoading || otpModal.otp.length !== 6}
                    className="w-full py-3.5 bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {otpLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Submit OTP'}
                  </button>
                  <button 
                    onClick={() => handleGenerateOtp(otpModal.serviceId)}
                    disabled={otpLoading}
                    className="w-full py-2.5 text-blue-600 hover:bg-blue-50 rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
                  >
                    Resend OTP
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>,
      document.body
    )}

    </div>
  );
}
