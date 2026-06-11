import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, Video, Camera, MapPin, Calendar, ChevronLeft, Phone, MessageSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getToken } from '../api/auth';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function StoredVehicleDashboardPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeDisplay, setActiveDisplay] = useState('CCTV');

  useEffect(() => {
    fetchBookingDetail();
  }, [id]);

  const fetchBookingDetail = async () => {
    try {
      const token = getToken('AccessToken');
      const res = await fetch(`https://localhost:7108/${id}booking-By-Id`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch vehicle details");
      const result = await res.json();
      setBooking(result.data);
    } catch (err) {
      toast.error(err.message || "Error fetching details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
          <p className="text-gray-500 font-medium">Loading your vehicle dashboard...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex flex-col font-sans bg-[#f8f9fa]">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <p className="text-gray-500 font-medium text-lg">Vehicle not found.</p>
        </div>
        <Footer />
      </div>
    );
  }

  const latestImages = booking.arrivalImages || booking.pickupImages;
  const imageList = [];
  if (latestImages) {
    if (latestImages.frontImageUrl) imageList.push({ label: 'Front', url: latestImages.frontImageUrl });
    if (latestImages.rearImageUrl) imageList.push({ label: 'Rear', url: latestImages.rearImageUrl });
    if (latestImages.leftSideImageUrl) imageList.push({ label: 'Left', url: latestImages.leftSideImageUrl });
    if (latestImages.rightSideImageUrl) imageList.push({ label: 'Right', url: latestImages.rightSideImageUrl });
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow pt-[140px] pb-20 px-[6vw]">
        
        {/* Back Button */}
        <div className="max-w-[1400px] mx-auto mb-6">
           <button onClick={() => navigate('/my-vehicles')} className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-full text-sm font-semibold text-gray-600 transition-colors shadow-sm">
             <ChevronLeft size={16} /> Back to Vehicles
           </button>
        </div>

        <div className="max-w-[1400px] mx-auto flex flex-col gap-8 lg:gap-12">
          
          {/* TOP SECTION: Two columns */}
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            
            {/* LEFT SIDE: Big viewer & thumbs */}
            <div className="w-full lg:w-[65%] flex flex-col items-center">
              {/* Big Center Aligned Square for CCTV / Selected Image */}
              <div className="w-full aspect-video md:aspect-[4/2.5] bg-black rounded-[2.5rem] shadow-2xl overflow-hidden relative border-[6px] border-white mb-6 transition-all group">
                {activeDisplay === 'CCTV' ? (
                  <>
                    <video 
                      src="/cctv.mp4" 
                      autoPlay loop muted playsInline
                      className="w-full h-full object-cover opacity-90"
                    />
                    <div className="absolute top-6 left-6 flex items-center gap-2">
                      <span className="flex items-center gap-1.5 text-[11px] font-semibold tracking-widest text-red-500 bg-red-50/90 backdrop-blur px-3 py-1.5 rounded-full shadow-sm border border-red-100 uppercase">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> LIVE CCTV
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <img src={activeDisplay} className="w-full h-full object-cover" alt="Selected View" />
                    <div className="absolute top-6 left-6 flex items-center gap-2">
                      <span className="text-[11px] font-semibold tracking-widest text-gray-700 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow-sm border border-gray-200 uppercase">
                        LATEST CAPTURE
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Latest Images Thumbnails */}
              {imageList.length > 0 && (
                <div className="flex items-center gap-4 overflow-x-auto pb-4 w-full justify-start md:justify-center px-4">
                  <button 
                    onClick={() => setActiveDisplay('CCTV')}
                    className={`relative w-15 h-15 md:w-18 md:h-18 rounded-2xl overflow-hidden border-2 transition-all shrink-0 ${activeDisplay === 'CCTV' ? 'border-blue-500 scale-105 shadow-xl' : 'border-white shadow-md hover:scale-105'}`}
                  >
                     <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center text-white">
                        <Video size={20} className="mb-1 text-red-400" />
                        <span className="text-[10px] font-semibold tracking-widest">LIVE</span>
                     </div>
                  </button>

                  {imageList.map((img, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setActiveDisplay(img.url)}
                      className={`relative w-15 h-15 md:w-18 md:h-18 rounded-2xl overflow-hidden border-2 transition-all shrink-0 ${activeDisplay === img.url ? 'border-blue-500 scale-105 shadow-xl' : 'border-white shadow-md hover:scale-105'}`}
                    >
                      <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT SIDE: Vehicle details, actions, lot owner */}
            <div className="w-full lg:w-[35%] flex flex-col gap-6">
              
              {/* Vehicle Info & Actions */}
              <div className="bg-white p-8 lg:p-10 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col flex-grow">
                 <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="px-2.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-semibold uppercase tracking-widest rounded-md flex items-center gap-1.5">
                        <ShieldCheck size={14}/> STORED
                      </span>
                    </div>
                    <h1 className="text-3xl lg:text-[29px] font-semibold text-[#111] leading-tight mb-3">
                      {booking.vehicleBrand} <span> </span>
                      {booking.vehicleModel}
                    </h1>
                    <span className="text-sm font-semibold text-gray-600 uppercase tracking-widest bg-gray-100 px-4 py-1.5 rounded-lg border border-gray-200 inline-block mb-4">
                      {booking.registrationNo}
                    </span>
                    
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-500">
                      <MapPin size={16} className="text-blue-500" /> 
                      {booking.propertyName}
                    </div>
                 </div>

                 <div className="flex flex-col gap-4 mt-auto">
                   <button 
                     onClick={() => navigate(`/track-pickup/${booking.id}`)}
                     className="w-full py-3 bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-800 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-sm text-sm"
                   >
                     <MapPin size={18} /> View Vehicle Journey
                   </button>
                   <button 
                     className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-blue-500/25 text-sm"
                   >
                     <Camera size={18} /> Demand Vehicle Image
                   </button>
                 </div>
              </div>

              {/* Lot Owner Info */}
              <div className="bg-white p-8 lg:p-10 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                  <p className="text-xl font-semibold text-[#111] tracking-tight mb-1">{booking.lotOwnerName || "Assigned Lot Owner"}</p>
                  <p className="text-sm font-semibold text-gray-500 mb-8">{booking.lotOwnerPhone || "Contact Not Available"}</p>
                  
                  <div className="flex items-center justify-center gap-4 w-full">
                      <button className="flex-1 py-2 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 font-semibold flex items-center justify-center transition-colors shadow-sm gap-2">
                          <Phone size={18} /> Call
                      </button>
                      <button className="flex-1 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold flex items-center justify-center transition-colors shadow-sm gap-2">
                          <MessageSquare size={18} /> Chat
                      </button>
                  </div>
              </div>
            </div>

          </div>

          {/* BOTTOM SECTION: Submissions Full Width Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full mt-4">
            
            {/* On-Demand Submission */}
            <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between text-center md:text-left hover:shadow-lg transition-shadow duration-300 gap-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex shrink-0 items-center justify-center border-4 border-white shadow-inner">
                  <Camera size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-[#111] mb-2 tracking-tight">On-Demand Images</h3>
                  <p className="text-gray-500 text-sm font-medium max-w-[280px] leading-relaxed">Request real-time photos of your vehicle at any given moment.</p>
                </div>
              </div>
              {/* On Demand Info (Left space for future dynamic content) */}
              <div className="w-full md:w-auto bg-gray-50 px-6 py-4 rounded-2xl border border-gray-100 flex items-center justify-center">
                <span className="text-sm font-semibold text-gray-400 uppercase tracking-widest">No Active Request</span>
              </div>
            </div>

            {/* Weekly Submission */}
            <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border border-gray-100 flex flex-col justify-center text-center hover:shadow-lg transition-shadow duration-300 gap-6">
              <div className="flex flex-col md:flex-row items-center gap-6 text-left">
                <div className="w-20 h-20 bg-purple-50 text-purple-600 rounded-full flex shrink-0 items-center justify-center border-4 border-white shadow-inner">
                  <Calendar size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-[#111] mb-2 tracking-tight">Weekly Update</h3>
                  <p className="text-gray-500 text-sm font-medium max-w-[280px] leading-relaxed">Detailed weekly inspection report and media from the Lot Manager.</p>
                </div>
              </div>
              
              {/* Weekly Update Info & Remarks */}
              {latestImages?.managerRemarks ? (
                <div className="w-full bg-orange-50/50 p-6 rounded-[1.5rem] border border-orange-100 text-left mt-2">
                  <p className="text-xs font-semibold tracking-widest text-orange-400 uppercase mb-2">Manager's Remark</p>
                  <p className="text-[#111] font-medium text-sm leading-relaxed">"{latestImages.managerRemarks}"</p>
                </div>
              ) : (
                <div className="w-full bg-gray-50 px-6 py-4 rounded-2xl border border-gray-100 flex items-center justify-center mt-2">
                  <span className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Awaiting Check</span>
                </div>
              )}
            </div>

          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}
