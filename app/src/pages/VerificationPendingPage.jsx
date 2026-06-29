import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getToken } from '../api/auth';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, Car, ArrowRight, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VerificationPendingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const token = getToken('AccessToken');
        const res = await fetch(`https://gd1-grand-auto-depot-one-9ms1.onrender.com/api/LotBooking/${id}booking-By-Id`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (data.success) {
          setBooking(data.data);
          // If status is not PendingVerification, maybe redirect them
          if (data.data.status === 'VerifiedPendingPayment' || data.data.status === 15) {
             toast.success('Your booking has been verified! Redirecting to agreement...');
             // navigate to track application or agreement?
          } else if (data.data.status === 'AdminRejected' || data.data.status === 14) {
             toast.error('This booking was rejected by the lot admin.');
          }
        } else {
          toast.error(data.message || 'Failed to load booking');
        }
      } catch (err) {
        toast.error('Network error loading booking');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <p className="text-xl text-slate-600">Booking not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col font-sans">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="bg-white rounded-[2rem] shadow-xl border border-black/5 p-8 md:p-12 max-w-lg w-full text-center relative overflow-hidden"
        >
          {/* Background decoration */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-blue-600"></div>

          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
            className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 relative"
          >
            <Clock className="w-10 h-10 text-blue-600" />
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
              className="absolute inset-0 border-[3px] border-blue-200 border-t-blue-600 rounded-full"
            ></motion.div>
          </motion.div>

          <h1 className="text-2xl md:text-3xl font-bold text-[#111] mb-3 tracking-tight">Booking Under Verification</h1>
          <p className="text-[#666] text-[15px] mb-8 leading-relaxed">
            Your booking request for <strong className="text-[#111]">{booking.property?.name}</strong> has been sent to the Lot Admin. You will receive an email and notification once it has been verified.
          </p>

          <div className="bg-gray-50 rounded-2xl p-4 mb-8 text-left border border-gray-100">
             <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-200">
               <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                 <Car className="w-5 h-5 text-gray-700" />
               </div>
               <div>
                 <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Vehicle</p>
                 <p className="text-[14px] font-semibold text-[#111]">{booking.vehicle?.brand} {booking.vehicle?.model}</p>
               </div>
             </div>
             <div className="flex justify-between items-center px-1">
                <div>
                   <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Dates</p>
                   <p className="text-[13px] font-medium text-[#333]">
                     {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                   </p>
                </div>
                <div className="text-right">
                   <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Ref ID</p>
                   <p className="text-[13px] font-mono font-medium text-[#333]">#{booking.id}</p>
                </div>
             </div>
          </div>

          <div className="flex flex-col gap-3">
             <button 
               onClick={() => navigate('/my-applications')}
               className="w-full py-4 bg-[#111] hover:bg-black text-white rounded-xl text-[15px] font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
             >
               Track Status in Dashboard
               <ArrowRight className="w-4 h-4" />
             </button>
             <button 
               onClick={() => navigate('/')}
               className="w-full py-4 bg-white border border-gray-200 hover:bg-gray-50 text-[#333] rounded-xl text-[15px] font-bold transition-all"
             >
               Return to Home
             </button>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
