import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock, Wrench, Phone, Calendar, MapPin, XCircle, MessageCircle } from 'lucide-react';
import { getToken } from '../../api/auth';
import { toast } from 'react-hot-toast';

import { useCall } from '../../context/CallContext';

export default function LotOwnerServiceTrackingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [serviceRequest, setServiceRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [expandImage, setExpandImage] = useState(null);
  
  const { startCall } = useCall();

  useEffect(() => {
    const fetchServiceRequest = async () => {
      try {
        const token = getToken('AccessToken');
        const res = await fetch(`https://localhost:7108/api/service-center/request/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch service request details');
        const result = await res.json();
        setServiceRequest(result.data);
      } catch (err) {
        toast.error("Error loading service request tracking details.");
      } finally {
        setLoading(false);
      }
    };
    fetchServiceRequest();
    
    const interval = setInterval(fetchServiceRequest, 30000);
    return () => clearInterval(interval);
  }, [id]);



  const handleCallSC = () => {
    if (serviceRequest?.serviceCenter?.ownerId) {
      startCall(serviceRequest.serviceCenter.ownerId, 'service-center', serviceRequest.serviceCenter.name);
    } else {
      toast.error('Service Center contact not available');
    }
  };

  const handleMessageSC = () => {
    if (serviceRequest?.serviceCenter?.ownerId) {
      navigate('/messages', {
        state: {
          preselect: {
            category: 'service-center',
            referenceId: serviceRequest.serviceCenter.ownerId,
            name: serviceRequest.serviceCenter.name
          }
        }
      });
    } else {
      toast.error('Service Center contact not available');
    }
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!serviceRequest) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-4">
        <p className="text-gray-500 mb-4">Service request not found or access denied.</p>
        <button onClick={() => navigate(-1)} className="px-6 py-2 bg-blue-600 text-white rounded-xl">Go Back</button>
      </div>
    );
  }

  const statusOrder = [
    'Pending',
    'Requested',
    'Confirmed',
    'Assigned Mechanic',
    'Mechanic Reached Garage',
    'OTP Verified',
    'Service Completed',
    'Payment'
  ];

  let currentStatusIndex = statusOrder.indexOf(serviceRequest.status);
  if (currentStatusIndex === -1) {
    if (serviceRequest.status === 'Completed') {
      currentStatusIndex = 7;
    } else {
      currentStatusIndex = 0;
    }
  }
  if (serviceRequest.isPaid) {
    currentStatusIndex = 7;
  }

  const steps = [
    {
      id: 1,
      title: 'Service Requested',
      description: 'Your request is submitted and waiting for confirmation.',
      isActive: currentStatusIndex >= 1 || currentStatusIndex === 0,
      isCompleted: currentStatusIndex >= 2
    },
    {
      id: 2,
      title: 'Confirmed',
      description: 'Service center has confirmed your request.',
      isActive: currentStatusIndex >= 2,
      isCompleted: currentStatusIndex >= 3
    },
    {
      id: 3,
      title: 'Assigned Mechanic',
      description: 'A mechanic has been assigned to your vehicle.',
      isActive: currentStatusIndex >= 3,
      isCompleted: currentStatusIndex >= 4,
      details: currentStatusIndex >= 3 && serviceRequest.mechanicName && (
        <div className="mt-4 bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center gap-4">
          <div 
            className="w-16 h-16 rounded-xl bg-blue-200 overflow-hidden shrink-0 shadow-sm cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
            onClick={() => serviceRequest.mechanicImage && setExpandImage(serviceRequest.mechanicImage)}
          >
            {serviceRequest.mechanicImage ? (
              <img src={serviceRequest.mechanicImage} alt={serviceRequest.mechanicName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center"><User className="text-blue-500" /></div>
            )}
          </div>
          <div>
            <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">Assigned Mechanic</p>
            <p className="font-bold text-blue-900">{serviceRequest.mechanicName}</p>
            {serviceRequest.mechanicImage && <p className="text-[10px] text-blue-600 mt-1 cursor-pointer" onClick={() => setExpandImage(serviceRequest.mechanicImage)}>Click to expand image</p>}
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: 'Mechanic Reached Garage',
      description: 'Mechanic has arrived at the storage facility.',
      isActive: currentStatusIndex >= 4,
      isCompleted: currentStatusIndex >= 5
    },
    {
      id: 5,
      title: 'OTP Verified',
      description: 'Identity verified. Service has started.',
      isActive: currentStatusIndex >= 5,
      isCompleted: currentStatusIndex >= 6
    },
    {
      id: 6,
      title: 'Service Completed',
      description: 'Vehicle maintenance has been completed.',
      isActive: currentStatusIndex >= 6,
      isCompleted: currentStatusIndex >= 7,
      details: serviceRequest.completionNotes && currentStatusIndex >= 6 && (
        <div className="mt-4 bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-3 text-[13px] text-gray-700">
          <p><strong>Notes:</strong> {serviceRequest.completionNotes}</p>
        </div>
      )
    },
    {
      id: 7,
      title: (serviceRequest.status === 'Completed' || serviceRequest.isPaid) ? 'Payment Completed' : 'Payment',
      description: (serviceRequest.status === 'Completed' || serviceRequest.isPaid) 
        ? 'Payment for the service has been successfully completed.' 
        : 'Payment for the service is pending/completed.',
      isActive: currentStatusIndex >= 7 || serviceRequest.status === 'Completed' || serviceRequest.isPaid,
      isCompleted: currentStatusIndex >= 7 || serviceRequest.status === 'Completed' || serviceRequest.isPaid,
      details: (serviceRequest.status === 'Completed' || serviceRequest.isPaid) && (
        <div className="mt-4 w-full bg-green-50 text-green-700 font-bold py-3 px-4 rounded-xl border border-green-200 flex items-center justify-center gap-2">
          <CheckCircle2 size={18} />
          Payment Completed
        </div>
      )
    }
  ];

  const isCancelled = serviceRequest.status === 'Cancelled';
  
  return (
    <div className="w-full flex flex-col font-sans">
      

      <main className="flex-grow py-8 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-100 hover:text-gray-900 transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Track Service Request</h1>
              <p className="text-sm text-gray-500 mt-1">Request #{serviceRequest.id.toString().padStart(6, '0')}</p>
            </div>
            {isCancelled ? (
               <div className="px-4 py-2 bg-red-50 text-red-600 rounded-full text-sm font-bold flex items-center gap-2 border border-red-100">
                 <XCircle size={16} />
                 Cancelled
               </div>
            ) : (
              <div className="px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-bold flex items-center gap-2 border border-blue-100">
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                {serviceRequest.status}
              </div>
            )}
          </div>

          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8 items-start">
            
            {/* Left Column: Vertical Timeline */}
            <div className="order-2 lg:order-1 lg:col-span-2 w-full flex flex-col gap-8">
              <div className="bg-white rounded-[2rem] p-6 md:p-8 border border-gray-100 shadow-sm space-y-8 relative overflow-hidden">
              
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Live Status Timeline</h3>
                {serviceRequest.scheduledDate && (
                  <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-100 flex items-center gap-1.5 shadow-sm">
                    <Calendar size={14} /> Scheduled: {new Date(serviceRequest.scheduledDate).toLocaleDateString()}
                  </div>
                )}
              </div>
              
              {/* Thin vertical line spanning all steps */}
              <div className="absolute left-[39px] top-[90px] bottom-[60px] w-0.5 bg-gray-100 z-0"></div>

              {isCancelled ? (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center text-red-800 relative z-10">
                  <XCircle className="mx-auto mb-2 text-red-400" size={32} />
                  <h3 className="text-lg font-bold">Service Request Cancelled</h3>
                  <p className="text-sm opacity-80 mt-1">Reason: {serviceRequest.cancellationReason || "Cancelled by owner"}</p>
                </div>
              ) : (
                <div className="space-y-10 relative z-10">
                  {steps.map((step) => {
                    return (
                      <div 
                        key={step.id} 
                        className={`flex gap-6 transition-all duration-300 ${
                          step.isActive ? 'scale-[1.01] opacity-100' : step.isCompleted ? 'opacity-85' : 'opacity-40'
                        }`}
                      >
                        {/* Step Indicator */}
                        <div className="relative shrink-0">
                          {step.isActive ? (
                            <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center relative">
                              <div className="w-3.5 h-3.5 rounded-full bg-blue-600 animate-ping absolute"></div>
                              <div className="w-3 h-3 rounded-full bg-blue-600 relative z-10"></div>
                            </div>
                          ) : step.isCompleted ? (
                            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white border border-green-600">
                              <CheckCircle2 size={16} strokeWidth={3} />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                            </div>
                          )}
                        </div>

                        {/* Step Contents */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className={`text-base font-extrabold tracking-tight ${
                              step.isActive ? 'text-blue-600' : step.isCompleted ? 'text-gray-900' : 'text-gray-400'
                            }`}>
                              {step.title}
                            </h4>
                            {step.isActive && (
                              <span className="px-2 py-0.5 text-[9px] bg-blue-100 text-blue-700 font-bold uppercase rounded tracking-wider animate-pulse">
                                Active
                              </span>
                            )}
                          </div>
                          <p className={`text-xs font-semibold mt-0.5 ${step.isActive ? 'text-gray-800' : 'text-gray-500'}`}>
                            {step.description}
                          </p>
                          {step.details && <div className="mt-2">{step.details}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            

            
            </div>

            {/* Right Column: Service Center Details */}
            <div className="order-1 lg:order-2 lg:col-span-1 space-y-6 w-full">
              
              <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Service Center</h3>
                
                {serviceRequest.serviceCenterImage && (
                  <img src={serviceRequest.serviceCenterImage.startsWith('http') ? serviceRequest.serviceCenterImage : `https://localhost:7108${serviceRequest.serviceCenterImage}`} alt={serviceRequest.serviceCenterName} className="w-full h-32 object-cover rounded-xl mb-4 border border-gray-100" />
                )}
                
                <h4 className="font-bold text-gray-900 mb-1">{serviceRequest.serviceCenterName}</h4>
                <p className="text-sm text-gray-500 flex items-start gap-1 mb-2">
                  <MapPin size={16} className="mt-0.5 shrink-0" />
                  <span>{serviceRequest.serviceCenterAddress || 'Address unavailable'}, {serviceRequest.serviceCenterCity}</span>
                </p>
                                <div className="flex gap-2 mt-4">
                    <button onClick={() => {
                        navigator.clipboard.writeText(serviceRequest.serviceCenterPhone || '');
                        toast.success('Phone number copied to clipboard!');
                    }} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold text-sm transition-colors">
                      <Phone size={16} />
                      Call
                    </button>
                    {serviceRequest.serviceCenterAdminId > 0 && (
                      <button onClick={() => navigate(`/lot-owner/messages?userId=${serviceRequest.serviceCenterAdminId}`)} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md transition-colors">
                        <MessageCircle size={16} />
                        Message
                      </button>
                    )}
                  </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Vehicle Details</h3>
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 border border-gray-200">
                    <Wrench size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{serviceRequest.vehicleBrand} {serviceRequest.vehicleModel}</h4>
                    <span className="inline-block mt-1 px-2.5 py-0.5 bg-gray-100 rounded text-xs font-mono font-bold text-gray-600">
                      {serviceRequest.vehicleRegistrationNo}
                    </span>
                  </div>
                </div>
              </div>
              


            </div>

          </div>
        </div>
      </main>

      {/* Expand Image Modal */}
      {expandImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setExpandImage(null)}>
          <div className="relative max-w-2xl w-full">
            <button className="absolute -top-12 right-0 text-white hover:text-gray-300">
              <XCircle size={32} />
            </button>
            <img src={expandImage} className="w-full h-auto rounded-2xl" alt="Expanded view" />
          </div>
        </div>
      )}
    </div>
  );
}
