import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, Video, Camera, MapPin, Calendar, Phone, MessageSquare, ArrowRight, Wrench, Maximize, Check, X, AlertTriangle, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getToken } from '../api/auth';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function StoredVehicleDashboardPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [afterServiceEvent, setAfterServiceEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeDisplay, setActiveDisplay] = useState('CCTV');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const viewerRef = useRef(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      viewerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const cctvVideos = ['/cctv.mp4', '/cctv2.mp4', '/cctv3.mp4', '/cctv4.mp4', '/cctv5.mp4', '/cctv6.mp4'];

  const handleVideoEnded = () => {
    setCurrentVideoIndex((prevIndex) => (prevIndex + 1) % cctvVideos.length);
  };

  useEffect(() => {
    fetchBookingDetail();
  }, [id]);

  usePolling(() => {
    if (id) fetchBookingDetail(true); // pass true to indicate silent poll
  }, 15000, !!id);

  const fetchBookingDetail = async (isSilent = false) => {
    try {
      setAfterServiceEvent(null);
      const token = getToken('AccessToken');
      const res = await fetch(`https://gd1-grand-auto-depot-one-9ms1.onrender.com/${id}booking-By-Id`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch vehicle details");
      const result = await res.json();
      setBooking(result.data);

      if (result.data?.vehicleId) {
        const journeyRes = await fetch(`hhttps://gd1-grand-auto-depot-one-9ms1.onrender.com/api/Vehicle/${result.data.vehicleId}/vehicle-owner/vehicle-journey?bookingId=${result.data.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (journeyRes.ok) {
          const journeyData = await journeyRes.json();
          const eventsArray = journeyData.data || journeyData || [];
          if (Array.isArray(eventsArray)) {
            const afterService = eventsArray.filter(e => e.eventType === 'After Service Condition').sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
            setAfterServiceEvent(afterService || null);
          }
        }
      }
    } catch (err) {
      toast.error(err.message || "Error fetching details");
    } finally {
      setLoading(false);
    }
  };

   

  const handleRequestImage = async () => {
    try {
      if (!booking?.vehicleId) return;
      const token = getToken('AccessToken');
      const res = await fetch(`https://gd1-grand-auto-depot-one-9ms1.onrender.com/api/Vehicle/${booking.vehicleId}/vehicle-owner/request-images`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || "Failed to request image");
      toast.success("demanted image to manager it will submit shortly");
    } catch (err) {
      toast.error(err.message || "Error requesting image");
    }
  };

  const getNextUpdateDate = () => {
    if (!booking?.startDate) return null;
    const startDate = new Date(booking.startDate);
    startDate.setDate(startDate.getDate() + 7);
    return startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-[#0071e3] animate-spin" />
          <p className="text-gray-500 font-medium">Loading your vehicle dashboard...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex flex-col font-sans bg-[#f5f5f7]">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <p className="text-gray-500 font-medium text-lg">Vehicle not found.</p>
        </div>
        <Footer />
      </div>
    );
  }

  const isInLot = booking?.status === 'InLot' || booking?.status == 2;
  const isMoveOutReached = !isInLot && booking?.endDate && new Date(booking.endDate) <= new Date();

  if (booking.status === 'Completed' || booking.status == 3 || isMoveOutReached) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex flex-col font-sans">
        <Navbar />
        <main className="flex-grow pt-[140px] pb-24 px-[6vw] flex flex-col items-center justify-center">
          <div className="bg-white/80 backdrop-blur-xl px-10 py-12 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col items-center max-w-md text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-6">
              <AlertTriangle size={32} />
            </div>
            <h1 className="text-2xl font-black text-[#1d1d1f] mb-3">Move Out Date Reached</h1>
            <p className="text-gray-500 font-medium mb-8">
              Your vehicle storage has been marked as completed. The live dashboard is no longer active.
            </p>
            <button
              onClick={() => navigate(`/vehicle-journey/${booking.vehicleId}`, { state: { bookingId: booking.id } })}
              className="w-full px-6 py-4 bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2"
            >
              <MapPin size={18} />
              View Vehicle Journey
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const latestImages = booking.weeklyUpdate || booking.recentOnDemandImages || booking.arrivalImages || booking.pickupImages;
  const imageList = [];
  if (latestImages) {
    if (latestImages.frontImageUrl) imageList.push({ label: 'Front', url: latestImages.frontImageUrl });
    if (latestImages.rearImageUrl) imageList.push({ label: 'Rear', url: latestImages.rearImageUrl });
    if (latestImages.leftSideImageUrl) imageList.push({ label: 'Left', url: latestImages.leftSideImageUrl });
    if (latestImages.rightSideImageUrl) imageList.push({ label: 'Right', url: latestImages.rightSideImageUrl });
    if (latestImages.interiorImageUrl) imageList.push({ label: 'Interior', url: latestImages.interiorImageUrl });
    if (latestImages.odometerImageUrl) imageList.push({ label: 'Odometer', url: latestImages.odometerImageUrl });
  }

  const daysRemaining = (() => {
    if (!booking?.endDate) return null;
    const end = new Date(booking.endDate);
    const start = new Date();
    end.setHours(0,0,0,0);
    start.setHours(0,0,0,0);
    const diff = end.getTime() - start.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  })();
  const showMoveOutWarning = daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 2;

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow pt-[110px] pb-24 px-[6vw]">

          <div className="max-w-[1400px] mx-auto flex flex-col gap-6 lg:gap-8">
            {showMoveOutWarning && (
              <div className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-2.5 px-4 flex items-center justify-center gap-2.5 shadow-sm">
                <AlertTriangle size={15} className="text-gray-500 shrink-0" />
                <span className="text-[13px] font-medium text-gray-700 text-center">
                  <strong className="font-extrabold text-gray-900">Move out date reaching in {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}.</strong> Prepare for vehicle checkout.
                </span>
              </div>
            )}
            <div className="flex flex-col gap-3 lg:gap-4">
              {booking?.hasServiceRecommendation && (
                <div className="flex items-center self-start gap-2 text-[12px] md:text-[12px] font-semibold text-orange-700 bg-orange-500/10 backdrop-blur-xl px-4 py-1.5 rounded-full border border-orange-500/20">
                  <Wrench size={14} className="text-orange-500" />
                  <span>Service recommended by manager. Scroll down for details.</span>
                </div>
              )}

              {/* TOP SECTION: Viewer & Details horizontally aligned */}
              <div className="flex flex-col lg:flex-row lg:flex-wrap items-stretch gap-6 lg:gap-8">
            
            {/* 1. Big Viewer */}
            <div className="w-full lg:w-[calc(65%-1rem)] order-1 flex flex-col">

              {/* Big Center Aligned Square for CCTV / Selected Image */}
              <div ref={viewerRef} className={`w-full bg-black shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden relative transition-all group aspect-video lg:aspect-auto flex-1 ${isFullscreen ? 'border-0 rounded-none' : 'border-[4px] border-white rounded-[2rem]'}`}>
                {/* Fullscreen Button */}
                <button 
                  onClick={toggleFullScreen}
                  className="absolute top-6 right-6 z-10 w-10 h-10 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 transition-all opacity-0 group-hover:opacity-100"
                  title="Toggle Fullscreen"
                >
                  <Maximize size={18} />
                </button>

                {activeDisplay === 'CCTV' ? (
                  <video 
                    src={cctvVideos[currentVideoIndex]} 
                    autoPlay muted playsInline
                    onEnded={handleVideoEnded}
                    className="absolute inset-0 w-full h-full object-cover opacity-90"
                  />
                ) : (
                  <img src={activeDisplay} className="absolute inset-0 w-full h-full object-cover" alt="Selected View" />
                )}

                {/* Top Left Badges */}
                <div className="absolute top-6 left-6 flex flex-col items-start gap-2 z-10 pointer-events-none">
                  {activeDisplay === 'CCTV' ? (
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold tracking-widest text-red-500 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm border border-white/10 uppercase pointer-events-auto">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> LIVE CCTV
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold tracking-widest text-white bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm border border-white/10 uppercase pointer-events-auto">
                      LATEST CAPTURE
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Thumbnails ROW */}
            <div className="w-full lg:w-[calc(65%-1rem)] order-2 lg:order-3 -mt-3 lg:-mt-5">
              <div className="flex items-center gap-4 overflow-x-auto overflow-y-hidden pt-1 pb-4 w-full justify-start md:justify-center px-4 scrollbar-hide">
                <button 
                    onClick={() => setActiveDisplay('CCTV')}
                    className={`relative w-15 h-15 md:w-18 md:h-18 rounded-[1.25rem] overflow-hidden transition-all shrink-0 ${activeDisplay === 'CCTV' ? 'ring-2 ring-[#0071e3] ring-offset-2 scale-[1.03] shadow-md' : 'ring-1 ring-black/5 shadow-sm hover:scale-[1.02]'}`}
                  >
                     <div className="w-full h-full bg-[#1d1d1f] flex flex-col items-center justify-center text-white">
                        <Video size={20} className="mb-1 text-[#ff3b30]" />
                        <span className="text-[9px] font-bold tracking-widest uppercase">Live</span>
                     </div>
                  </button>

                  {imageList.map((img, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setActiveDisplay(img.url)}
                      className={`relative w-15 h-15 md:w-18 md:h-18 rounded-[1.25rem] overflow-hidden transition-all shrink-0 ${activeDisplay === img.url ? 'ring-2 ring-[#0071e3] ring-offset-2 scale-[1.03] shadow-md' : 'ring-1 ring-black/5 shadow-sm hover:scale-[1.02]'}`}
                    >
                      <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

            {/* 3. RIGHT SIDE: Vehicle details & lot owner */}
            <div className="w-full lg:w-[calc(35%-1rem)] order-3 lg:order-2 flex flex-col gap-4">
              
              {/* Vehicle Info */}
              <div className="bg-white/80 backdrop-blur-xl px-6 py-5 lg:px-8 lg:py-6 rounded-[2rem] shadow-[0_2px_20px_rgb(0,0,0,0.04)] border border-gray-100/50 flex flex-col flex-1">
                 <div className="mb-4 lg:mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-semibold uppercase tracking-widest rounded-md flex items-center gap-1.5">
                        <ShieldCheck size={14}/> STORED
                      </span>
                    </div>


                    <h1 className="text-3xl lg:text-[29px] font-semibold text-[#1d1d1f] leading-tight mb-3 tracking-tight">
                      {booking.vehicleBrand} <span> </span>
                      {booking.vehicleModel}
                    </h1>
                    <span className="text-[13px] font-semibold text-[#86868b] uppercase tracking-widest bg-gray-50/80 px-4 py-1.5 rounded-lg border border-gray-100 inline-block mb-4">
                      {booking.registrationNo}
                    </span>
                    
                    <div className="flex items-center gap-2 text-[13px] font-medium text-[#86868b]">
                      <MapPin size={16} className="text-[#0071e3]" /> 
                      {booking.propertyName}
                    </div>
                 </div>

                 <div className="flex flex-col gap-3 mt-auto">
                   <button 
                      onClick={() => navigate(`/vehicle-journey/${booking.vehicleId}`, { state: { bookingId: booking.id } })}
                     className="w-full py-3.5 bg-gray-100 hover:bg-gray-200 text-[#1d1d1f] rounded-[1rem] font-semibold flex items-center justify-center gap-2 transition-colors border border-transparent text-sm"
                   >
                     View Vehicle Journey <ArrowRight size={18} />
                   </button>
                   <button 
                     onClick={handleRequestImage}
                     disabled={booking?.hasPendingOnDemandRequest}
                     className={`w-full py-3.5 ${booking?.hasPendingOnDemandRequest ? 'bg-gray-400 text-white cursor-not-allowed shadow-none' : 'bg-[#0071e3] hover:bg-[#0077ED] text-white shadow-[0_4px_14px_rgba(0,113,227,0.25)]'} rounded-[1rem] font-semibold flex items-center justify-center gap-2 transition-all text-sm`}
                   >
                     <Camera size={18} /> {booking?.hasPendingOnDemandRequest ? 'Requested Vehicle Image' : 'Demand Vehicle Image'}
                   </button>

                 </div>
              </div>

              {/* Lot Owner Info */}
              <div className="bg-white/80 backdrop-blur-xl px-6 py-5 lg:px-8 lg:py-6 rounded-[2rem] shadow-[0_2px_20px_rgb(0,0,0,0.04)] border border-gray-100/50 flex flex-col items-center justify-center text-center transition-shadow flex-1">
                  <div className="w-full flex justify-start mb-1">
                    <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-semibold uppercase tracking-widest rounded-md flex items-center gap-1.5">
                      LOT OWNER
                    </span>
                  </div>
                  <p className="text-[19px] font-semibold text-[#1d1d1f] tracking-tight mb-1">{booking.lotOwnerName || "Lot Owner"}</p>
                  <p className="text-[13px] font-medium text-[#86868b] mb-2">{booking.lotOwnerPhone || "Contact Not Available"}</p>
                  
                  <div className="flex items-center justify-center gap-3 w-full mt-auto">
                      <button 
                      className="flex-1 py-3 rounded-[1rem] bg-gray-100 hover:bg-gray-200 text-[#1d1d1f] font-semibold flex items-center justify-center transition-colors text-sm gap-2">
                          <Phone size={16} /> Call
                      </button>
                      <button 
                      className="flex-1 py-3 rounded-[1rem] bg-gray-100 hover:bg-gray-200 text-[#1d1d1f] font-semibold flex items-center justify-center transition-colors text-sm gap-2">
                          <MessageSquare size={16} /> Chat  
                      </button>
                  </div>
              </div>
            </div>

          </div>
          </div>

          {/* BOTTOM SECTION: Submissions Stacked Full Width */}
          <div className="flex flex-col gap-6 w-full mt-2">
            
            {/* Service & Maintenance */}
            <div className="bg-white/80 backdrop-blur-xl w-full rounded-[2rem] p-5 md:p-6 shadow-[0_2px_20px_rgb(0,0,0,0.04)] border border-gray-100/50 flex flex-col justify-between text-center md:text-left transition-all duration-300 gap-4">
              <div className="flex flex-col md:flex-row w-full items-center justify-between gap-4">
                <div className="flex flex-col pl-5 md:flex-row items-center gap-4">
                  <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-2xl flex shrink-0 items-center justify-center border border-orange-100 shadow-sm">
                    <Wrench size={20} />
                  </div>
                  <div>
                    <h3 className="text-[18px] md:text-[22px] font-semibold text-[#1d1d1f] mb-1 tracking-tight">Service & Maintenance</h3>
                    {booking?.hasServiceRecommendation ? (
                      <div className="text-[12px] font-medium max-w-[450px] leading-relaxed mb-2">
                        <div className="flex flex-col md:flex-row md:items-center gap-2">
                          <span className="font-bold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-md text-[10px] uppercase tracking-wider shrink-0 border border-orange-100">Manager Remark</span>
                          <span className="text-[#1d1d1f] italic">"{booking.managerServiceRemarks}"</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[#86868b] text-[14px] font-medium max-w-[400px] leading-relaxed mb-1">
                        No notification of service recommendation
                      </p>
                    )}
                    <p className="text-[#86868b] text-[12px] font-medium max-w-[400px] leading-relaxed flex items-center justify-center md:justify-start gap-1.5">
                      Last Service: <span className="font-semibold text-[#1d1d1f]">{booking?.lastServiceReportDate ? new Date(booking.lastServiceReportDate).toLocaleDateString() : 'No service done yet'}</span>
                    </p>
                  </div>
                </div>
                <div className="w-full md:w-auto shrink-0 mt-2 md:mt-0">
                  <button 
                    onClick={() => booking?.hasActiveServiceRequest && booking?.activeServiceRequestId 
                      ? navigate(`/track-service/${booking.activeServiceRequestId}`) 
                      : navigate(`/owner/nearby-services/${booking?.propertyId}`, { state: { vehicleBrand: booking?.vehicleBrand, vehicleId: booking?.vehicleId, bookingId: booking?.id } })}
                    className="w-full md:w-auto px-6 py-3 mr-3.5 bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-1.5"
                  >
                    {booking?.hasActiveServiceRequest ? "Track Service Request" : "Book Service"} <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* Garage Service Report Section */}
              {booking?.lastServiceReportDate && (
                <div className="w-full mt-2 pt-4 border-t border-gray-100 flex flex-col gap-3 text-left">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[15px] font-bold text-[#1d1d1f] tracking-tight flex items-center gap-2">
                      <Wrench className="text-blue-600" size={16} /> Last Service Details
                    </h4>
                    <span className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100 shadow-sm">
                      {new Date(booking.lastServiceReportDate).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50/30 p-4 rounded-[1.25rem] border border-blue-100 flex flex-col gap-2">
                      <p className="text-[11px] font-bold tracking-widest text-blue-600 uppercase">Service Details</p>
                      <div className="text-sm font-medium text-gray-800 space-y-1">
                        {booking.lastServiceCenterName && <p><strong>Garage:</strong> {booking.lastServiceCenterName}</p>}
                        {booking.lastServiceCost && <p><strong>Cost:</strong> ₹{booking.lastServiceCost.toLocaleString()}</p>}
                        {booking.lastServiceNotes && <p><strong>Completion Notes:</strong> {booking.lastServiceNotes}</p>}
                      </div>
                    </div>


                  </div>
                </div>
              )}

              {/* After Service Condition Report Section */}
              {afterServiceEvent && (
                <div className="w-full mt-2 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-[15px] font-bold text-[#1d1d1f] tracking-tight flex items-center gap-2">
                      <Check className="text-green-600" size={16} /> Manager after service condition report
                    </h4>
                    <span className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100 shadow-sm">
                      {new Date(afterServiceEvent.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {afterServiceEvent.description && (
                    <div className="bg-green-50/50 p-3 rounded-[1.25rem] border border-green-100 text-left mb-3">
                      <p className="text-xs font-semibold tracking-widest text-green-600 uppercase mb-1">Manager's Remark</p>
                      <p className="text-[#111] font-medium text-[12px] leading-relaxed">"{afterServiceEvent.description}"</p>
                    </div>
                  )}
                  {afterServiceEvent.images && afterServiceEvent.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-start">
                      {afterServiceEvent.images.map((img, i) => (
                        <div key={i} className="group relative w-16 h-16 rounded-xl overflow-hidden cursor-pointer border border-gray-100 shadow-sm shrink-0" onClick={() => setSelectedImage({ label: img.label, url: img.imageUrl })}>
                          <img src={img.imageUrl.startsWith('http') ? img.imageUrl : `https://gd1-grand-auto-depot-one-9ms1.onrender.com${img.imageUrl}`} alt={img.label} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white font-bold text-[8px] uppercase tracking-widest text-center px-0.5">{img.label}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* On-Demand Submission */}
            <div className="bg-white/80 backdrop-blur-xl w-full rounded-[2rem] p-8 md:p-10 shadow-[0_2px_20px_rgb(0,0,0,0.04)] border border-gray-100/50 flex flex-col gap-6 transition-all duration-300">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-gray-50 text-[#1d1d1f] rounded-2xl flex shrink-0 items-center justify-center border border-gray-200/60 shadow-sm">
                    <Camera size={28} />
                  </div>
                  <div>
                    <h3 className="text-[22px] font-semibold text-[#1d1d1f] mb-1.5 tracking-tight">On-Demand Images</h3>
                    <p className="text-[#86868b] text-[13px] font-medium max-w-[320px] leading-relaxed">Request real-time photos of your vehicle at any given moment.</p>
                  </div>
                </div>
                <div className="w-full md:w-auto flex items-center justify-center md:justify-end gap-3">
                  {booking?.hasPendingOnDemandRequest ? (
                    <div className="bg-gray-50/80 px-6 py-4 rounded-[1.25rem] border border-gray-200 flex flex-col items-center justify-center min-w-[180px]">
                      <span className="text-[12px] font-semibold text-gray-600 uppercase tracking-wider mb-1">Requested</span>
                      <span className="text-[14px] font-bold text-[#1d1d1f] tracking-tight">{booking.pendingOnDemandRequestDate ? new Date(booking.pendingOnDemandRequestDate).toLocaleDateString() : 'Pending'}</span>
                    </div>
                  ) : !booking?.recentOnDemandImages ? (
                    <div className="bg-[#f5f5f7] px-6 py-4 rounded-[1.25rem] border border-gray-200/50 flex items-center justify-center min-w-[180px]">
                      <span className="text-[12px] font-semibold text-[#86868b] uppercase tracking-wider">No Active Request</span>
                    </div>
                  ) : null}
                </div>
              </div>
              {booking?.recentOnDemandImages && (
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {[
                    { label: 'Front', url: booking.recentOnDemandImages.frontImageUrl },
                    { label: 'Rear', url: booking.recentOnDemandImages.rearImageUrl },
                    { label: 'Left', url: booking.recentOnDemandImages.leftSideImageUrl },
                    { label: 'Right', url: booking.recentOnDemandImages.rightSideImageUrl },
                    { label: 'Interior', url: booking.recentOnDemandImages.interiorImageUrl },
                    { label: 'Odometer', url: booking.recentOnDemandImages.odometerImageUrl },
                  ].filter(img => img.url).map((img, i) => (
                    <div
                      key={i}
                      className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer border border-gray-100 shadow-sm"
                      onClick={() => setSelectedImage(img)}
                    >
                      <img
                        src={img.url.startsWith('http') ? img.url : `https://gd1-grand-auto-depot-one-9ms1.onrender.com${img.url}`}
                        alt={img.label}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                        <span className="text-white font-bold text-[10px] uppercase tracking-widest">{img.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Weekly Submission */}
            <div className="bg-white rounded-[2rem] shadow-[0_4px_24px_rgb(0,0,0,0.06)] border border-gray-100 overflow-hidden flex flex-col transition-all duration-300">
              <div className="p-8 md:px-10 md:py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-gray-50 rounded-2xl flex shrink-0 items-center justify-center text-[#1d1d1f] border border-gray-200/60 shadow-sm">
                    <Calendar size={26} />
                  </div>
                  <div>
                    <h3 className="text-[22px] font-bold text-[#1d1d1f] tracking-tight mb-1">Weekly Update</h3>
                    <p className="text-[#86868b] text-[13px] font-medium max-w-[320px] leading-relaxed">Detailed weekly inspection report and media from the Lot Manager.</p>
                  </div>
                </div>
                {!booking?.weeklyUpdate && (
                  <div className="bg-[#f5f5f7] px-6 py-4 rounded-2xl border border-gray-200/50 flex flex-col items-center justify-center min-w-[160px] shadow-sm">
                    <span className="text-[10px] font-bold text-[#86868b] uppercase tracking-widest mb-1.5">Next Update</span>
                    <span className="text-[15px] font-bold text-[#1d1d1f] tracking-tight">{getNextUpdateDate() || "Pending"}</span>
                  </div>
                )}
              </div>

              <div className="p-8 md:p-10 flex flex-col gap-6">
              
              
              {booking?.weeklyUpdate && (
                <div className="w-full mt-4 space-y-6">
                  {booking.weeklyUpdate.managerRemarks && (
                    <div className="bg-orange-50/50 p-6 rounded-[1.5rem] border border-orange-100 text-left">
                      <p className="text-xs font-semibold tracking-widest text-orange-400 uppercase mb-2">Manager's Remark</p>
                      <p className="text-[#111] font-medium text-[13px] leading-relaxed">"{booking.weeklyUpdate.managerRemarks}"</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className={`p-4 rounded-[1.5rem] border ${booking.weeklyUpdate.carWashCompleted ? 'bg-green-50/50 border-green-100 text-green-700' : 'bg-red-50/50 border-red-100 text-red-700'} flex items-center justify-between`}>
                      <span className="text-sm font-bold tracking-tight">Car Wash</span>
                      {booking.weeklyUpdate.carWashCompleted ? <Check size={20} /> : <X size={20} />}
                    </div>
                    <div className={`p-4 rounded-[1.5rem] border ${booking.weeklyUpdate.tyrePressureChecked ? 'bg-green-50/50 border-green-100 text-green-700' : 'bg-red-50/50 border-red-100 text-red-700'} flex items-center justify-between`}>
                      <span className="text-sm font-bold tracking-tight">Tyre Pressure</span>
                      {booking.weeklyUpdate.tyrePressureChecked ? <Check size={20} /> : <X size={20} />}
                    </div>
                    <div className={`p-4 rounded-[1.5rem] border ${booking.weeklyUpdate.dailyStartupsCompleted ? 'bg-green-50/50 border-green-100 text-green-700' : 'bg-red-50/50 border-red-100 text-red-700'} flex items-center justify-between`}>
                      <span className="text-sm font-bold tracking-tight">Daily Startups</span>
                      {booking.weeklyUpdate.dailyStartupsCompleted ? <Check size={20} /> : <X size={20} />}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    {[
                      { label: 'Front', url: booking.weeklyUpdate.frontImageUrl },
                      { label: 'Rear', url: booking.weeklyUpdate.rearImageUrl },
                      { label: 'Left', url: booking.weeklyUpdate.leftSideImageUrl },
                      { label: 'Right', url: booking.weeklyUpdate.rightSideImageUrl },
                      { label: 'Interior', url: booking.weeklyUpdate.interiorImageUrl },
                      { label: 'Odometer', url: booking.weeklyUpdate.odometerImageUrl },
                    ].filter(img => img.url).map((img, i) => (
                      <div key={i} className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer border border-gray-100/50 shadow-sm" onClick={() => setSelectedImage(img)}>
                        <img src={img.url.startsWith('http') ? img.url : `https://gd1-grand-auto-depot-one-9ms1.onrender.com${img.url}`} alt={img.label} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-transparent flex items-end p-2.5">
                          <span className="text-white font-bold text-[10px] uppercase tracking-widest">{img.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              </div>
            </div>

          </div>

        </div>
      </main>
      <Footer />
      {selectedImage && (
        <div
          className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-5 right-5 w-11 h-11 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            ✕
          </button>
          <img
            src={selectedImage.url.startsWith('http') ? selectedImage.url : `https://gd1-grand-auto-depot-one-9ms1.onrender.com${selectedImage.url}`}
            alt={selectedImage.label}
            className="max-w-[90vw] max-h-[80vh] object-contain rounded-2xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
          <p className="text-white font-bold text-base mt-5 tracking-wide uppercase">{selectedImage.label}</p>
        </div>
      )}
    </div>
  );
}

