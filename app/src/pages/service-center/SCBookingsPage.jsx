import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken } from '../../api/auth';

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
  },
  put: async (url, body) => {
    const res = await fetch(`https://localhost:7108/api${url}`, {
      method: 'PUT',
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

import { toast } from 'react-hot-toast';
import { MapPin, Calendar, Clock, Car, ChevronRight, Wrench } from 'lucide-react';

export default function SCBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Pending');
  const navigate = useNavigate();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      // Reusing the dashboard endpoint for pending bookings since we haven't created a dedicated bookings query yet
      const response = await api.get('/service-center/bookings');
      setBookings(response.data.data);
    } catch (error) {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Active Bookings</h1>
        <p className="text-gray-500">Manage and assign mechanics to incoming service requests.</p>
      </div>

      
      <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
        <button 
          onClick={() => setFilter('Pending')}
          className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${filter === 'Pending' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
        >
          Pending ({bookings.filter(b => b.status === 'Pending' || b.status === 'Requested').length})
        </button>
        <button 
          onClick={() => setFilter('Assigned Mechanic')}
          className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${filter === 'Assigned Mechanic' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
        >
          Assigned ({bookings.filter(b => ['Assigned', 'Assigned Mechanic', 'Approved', 'Mechanic Arrived Garage', 'OTP Verified'].includes(b.status)).length})
        </button>
        <button 
          onClick={() => setFilter('Service Completed')}
          className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${filter === 'Service Completed' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
        >
          Completed ({bookings.filter(b => b.status === 'Service Completed' || b.status === 'Completed').length})
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {bookings.filter(b => (filter === 'Assigned Mechanic' && ['Assigned', 'Assigned Mechanic', 'Approved', 'Mechanic Arrived Garage', 'OTP Verified'].includes(b.status)) || (filter === 'Service Completed' && (b.status === 'Completed' || b.status === 'Service Completed')) || (filter === 'Pending' && (b.status === 'Pending' || b.status === 'Requested')) || b.status === filter).length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-[2rem] border border-gray-100">
            No active bookings at the moment.
          </div>
        ) : (
          bookings.filter(b => (filter === 'Assigned Mechanic' && ['Assigned', 'Assigned Mechanic', 'Approved', 'Mechanic Arrived Garage', 'OTP Verified'].includes(b.status)) || (filter === 'Service Completed' && (b.status === 'Completed' || b.status === 'Service Completed')) || (filter === 'Pending' && (b.status === 'Pending' || b.status === 'Requested')) || b.status === filter).map((booking) => (
            <div key={booking.id} className="bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col">
              
              <div className="h-40 bg-gray-100 relative">
                {booking.serviceCenterImage ? (
                  <img src={booking.serviceCenterImage ? (booking.serviceCenterImage.startsWith('http') ? booking.serviceCenterImage : `https://localhost:7108${booking.serviceCenterImage}`) : 'https://placehold.co/400x300/e2e8f0/64748b?text=No+Image'} className="w-full h-full object-cover" alt="Vehicle" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Car size={48} />
                  </div>
                )}
                <div className="absolute top-4 right-4 px-3 py-1 bg-blue-500 text-white text-xs font-black uppercase tracking-wider rounded-full shadow-sm">
                  {booking.status}
                </div>
              </div>
              
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-black text-gray-900 text-lg leading-tight">{booking.vehicleBrand} {booking.vehicleModel}</h3>
                    <p className="text-sm font-mono font-bold text-gray-500 mt-1">{booking.vehicleRegistrationNo}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Wrench size={20} />
                  </div>
                </div>
                
                <div className="space-y-3 mb-6 flex-1">
                  <div className="flex items-start gap-3 text-sm text-gray-600">
                    <MapPin size={16} className="mt-0.5 shrink-0 text-gray-400" />
                    <span>{booking.propertyAddress ? `${booking.propertyAddress}, ${booking.propertyCity}` : booking.propertyCity || 'No Location'}</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-gray-600">
                    <Calendar size={16} className="mt-0.5 shrink-0 text-gray-400" />
                    <span>{new Date(booking.scheduledDate || booking.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <span className="font-medium">{booking.notes || "No additional notes provided."}</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => navigate(`/service-center/bookings/${booking.id}`)}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors mt-auto"
                >
                  {(booking.status === 'Pending' || booking.status === 'Requested') ? 'View Map & Assign' : 'View Details'} <ChevronRight size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
