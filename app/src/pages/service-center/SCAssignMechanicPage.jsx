import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ChevronLeft, MapPin, Wrench, CheckCircle, User, Car, Calendar } from 'lucide-react';
import { getToken } from '../../api/auth';

/* ── tiny helpers ── */
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDayOfMonth(y, m) { return new Date(y, m, 1).getDay(); }

function CalendarPopover({ value, onChange, onClose, minDate }) {
  const effectiveMin = minDate ? (() => { const d = new Date(minDate); d.setHours(0,0,0,0); return d; })() : (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })();
  const [view, setView] = useState({ y: effectiveMin.getFullYear(), m: effectiveMin.getMonth() });

  const prev = () => setView(v => v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 });
  const next = () => setView(v => v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 });

  const days = getDaysInMonth(view.y, view.m);
  const firstDay = getFirstDayOfMonth(view.y, view.m);
  const cells = Array(firstDay).fill(null).concat(Array.from({ length: days }, (_, i) => i + 1));

  const today = new Date(); today.setHours(0,0,0,0);
  const isToday = (d) => d === today.getDate() && view.m === today.getMonth() && view.y === today.getFullYear();
  const isSelected = (d) => {
    if (!value || !d) return false;
    return value.getDate() === d && value.getMonth() === view.m && value.getFullYear() === view.y;
  };
  const isDisabled = (d) => {
    if (!d) return false;
    const cell = new Date(view.y, view.m, d);
    cell.setHours(0,0,0,0);
    return cell < effectiveMin;
  };

  return (
    <div className="absolute top-full left-0 mt-3 z-50 bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-black/[0.06] p-4 w-[280px]">
      <div className="flex items-center justify-between mb-3">
        <button onClick={prev} type="button" className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <p className="text-[13px] font-semibold text-[#111]">{MONTHS[view.m]} {view.y}</p>
        <button onClick={next} type="button" className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => <div key={d} className="text-center text-[10px] font-bold text-[#aaa] py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((d, i) => (
          <button
            key={i}
            type="button"
            disabled={!d || isDisabled(d)}
            onClick={() => { onChange(new Date(view.y, view.m, d)); onClose(); }}
            className={`h-8 w-full flex items-center justify-center text-[12px] rounded-full transition-all font-medium
              ${!d ? '' : isDisabled(d) ? 'text-[#ccc] cursor-not-allowed' : isSelected(d)
                ? 'bg-[#111] text-white'
                : isToday(d)
                  ? 'border border-[#111] text-[#111] hover:bg-[#111] hover:text-white'
                  : 'text-[#333] hover:bg-gray-100'}`}
          >
            {d || ''}
          </button>
        ))}
      </div>
    </div>
  );
}

const api = {
  get: async (url) => {
    const res = await fetch(`https://localhost:7108/api${url}`, {
      headers: { Authorization: `Bearer ${getToken('AccessToken')}` }
    });
    if (!res.ok) throw new Error('API Error');
    return { data: await res.json() };
  },
  post: async (url, body) => {
    const res = await fetch(`https://localhost:7108/api${url}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken('AccessToken')}` 
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('API Error');
    return { data: await res.json() };
  }
};

export default function SCAssignMechanicPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [mechanics, setMechanics] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedMechanic, setSelectedMechanic] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [showCal, setShowCal] = useState(false);
  const calRef = useRef(null);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    function handleClickOutside(e) {
      if (calRef.current && !calRef.current.contains(e.target)) setShowCal(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bookingRes, mechanicsRes] = await Promise.all([
        api.get(`/service-center/request/${id}`),
        api.get('/service-center/mechanics')
      ]);
      setBooking(bookingRes.data.data);
      setMechanics(mechanicsRes.data.data);
    } catch (error) {
      toast.error('Failed to load data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedMechanic) {
      toast.error('Please select a mechanic');
      return;
    }
    
    setAssigning(true);
    try {
      await api.post('/service-center/assign-mechanic', {
        serviceRequestId: booking.id,
        mechanicId: parseInt(selectedMechanic),
        scheduledDate: scheduledDate ? (() => {
          const d = new Date(scheduledDate);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T00:00:00`;
        })() : null,
        adminNotes: adminNotes
      });
      toast.success('Mechanic assigned and notified successfully!');
      navigate('/service-center/bookings');
    } catch (error) {
      toast.error('Failed to assign mechanic');
    } finally {
      setAssigning(false);
    }
  };

  if (loading) return <div className="flex h-[70vh] items-center justify-center">Loading...</div>;
  if (!booking) return <div className="flex h-[70vh] items-center justify-center text-gray-500">Booking not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(`/service-center/bookings/${id}`)}
          className="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Assign Mechanic</h1>
          <p className="text-gray-500">Select a mechanic to handle this service request.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Booking Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 text-lg">Service Details</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                  <Car size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{booking.vehicleBrand} {booking.vehicleModel}</p>
                  <p className="text-xs font-mono font-bold text-gray-500">{booking.vehicleRegistrationNo}</p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Service Type</p>
                <p className="font-medium text-gray-900">{booking.serviceType}</p>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Location</p>
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
                  <p className="text-sm font-medium text-gray-900">{booking.propertyAddress || booking.propertyCity}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Assignment Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
            
            <div className="space-y-6">
              {/* Mechanic Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">Select Available Mechanic</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {mechanics.length === 0 ? (
                    <div className="col-span-full text-sm text-gray-500 py-4 bg-gray-50 rounded-xl text-center border border-gray-100">
                      No mechanics available. Please add them in the Mechanics tab.
                    </div>
                  ) : (
                    mechanics.map(m => (
                      <div 
                        key={m.id}
                        onClick={() => setSelectedMechanic(m.id)}
                        className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          selectedMechanic === m.id 
                            ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm' 
                            : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden shadow-sm shrink-0">
                            {m.imageUrl ? (
                              <img src={m.imageUrl} alt={m.fullName} className="w-full h-full object-cover" />
                            ) : (
                              <User size={20} className="text-gray-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-sm">{m.fullName}</div>
                            <div className="text-xs opacity-75">{m.email}</div>
                          </div>
                        </div>
                        {selectedMechanic === m.id && <CheckCircle size={20} className="text-blue-600 shrink-0" />}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Scheduled Date */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Scheduled Date (Optional)</label>
                <div className="relative w-full" ref={calRef}>
                  <button
                    type="button"
                    onClick={() => setShowCal(!showCal)}
                    className="w-full px-4 py-3 pl-11 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-sm font-medium text-left"
                  >
                    {scheduledDate ? new Date(scheduledDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Select Date (Optional)'}
                  </button>
                  <Calendar size={18} className="absolute left-4 top-3.5 text-gray-400 pointer-events-none" />
                  {showCal && (
                    <CalendarPopover 
                      value={scheduledDate ? new Date(scheduledDate) : null} 
                      onChange={(d) => setScheduledDate(d.toISOString())} 
                      onClose={() => setShowCal(false)}
                      minDate={booking?.scheduledDate}
                    />
                  )}
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Instructions for Mechanic</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Enter any specific instructions or tools to carry..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-sm min-h-[120px] resize-none"
                />
              </div>

              {/* Notification Banner */}
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                <div className="text-blue-600 mt-0.5"><MapPin size={18} /></div>
                <p className="text-sm font-medium text-blue-800 leading-relaxed">
                  An email will be sent to the mechanic with the vehicle details, instructions, and a navigable Google Maps link to the location.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={() => navigate(`/service-center/bookings/${id}`)}
                  className="flex-1 px-4 py-4 font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAssign}
                  disabled={assigning || !selectedMechanic}
                  className="flex-1 px-4 py-4 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                >
                  <Wrench size={18} />
                  {assigning ? 'Assigning...' : 'Assign & Notify Mechanic'}
                </button>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
