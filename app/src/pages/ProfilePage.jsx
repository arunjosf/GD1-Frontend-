import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getToken } from '../api/auth';
import {
  Mail, Phone, Car, ChevronRight, LogOut, Warehouse, Clock, CheckCircle, XCircle, Loader2, MapPin
} from 'lucide-react';

const API = 'https://gd1-grand-auto-depot-one-9ms1.onrender.com';

function StatusBadge({ status }) {
  const isApproved = status === 5 || status === 'Approved';
  const isRejected = status === 4 || status === 'Rejected' || status === 'Cancelled';
  if (isApproved) return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide bg-emerald-50 text-emerald-600 border border-emerald-100">
      <CheckCircle size={14} /> Approved
    </span>
  );
  if (isRejected) return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide bg-red-50 text-red-600 border border-red-100">
      <XCircle size={14} /> {status === 'Cancelled' ? 'Cancelled' : 'Rejected'}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide bg-blue-50 text-blue-600 border border-blue-100">
      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" /> In Progress
    </span>
  );
}

const getImageUrl = (url) => {
  if (!url) return "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&auto=format&fit=crop";
  if (url.startsWith('http')) return url;
  return `https://gd1-grand-auto-depot-one-9ms1.onrender.com${url.startsWith('/') ? url : `/${url}`}`;
};

export default function ProfilePage() {
  const { user, logout, userVehicles, vehiclesLoading } = useAuth();
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);
  const [appsLoading, setAppsLoading] = useState(true);

  const fullName = typeof user === 'object' && user?.fullName ? user.fullName : 'User';
  const email = typeof user === 'object' && user?.email ? user.email : '—';
  const phone = typeof user === 'object' && user?.phone ? user.phone : null;
  const initials = fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const vehicles = userVehicles || [];
  const storedVehicles = vehicles.filter(v => v.isStored);
  const regularVehicles = vehicles.filter(v => !v.isStored);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const token = getToken('AccessToken');
        if (!token) return;
        const [franchiseRes, scRes] = await Promise.all([
          fetch(`${API}/api/Franchise/my-applications`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
          fetch(`${API}/api/service-center/my-applications`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
        ]);
        let all = [];
        if (franchiseRes?.ok) { const d = await franchiseRes.json(); all = [...all, ...(d.data || [])]; }
        if (scRes?.ok) { const d = await scRes.json(); all = [...all, ...(d.data || [])]; }
        all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setApplications(all);
      } finally {
        setAppsLoading(false);
      }
    };
    fetchApplications();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50/50 font-['Inter',sans-serif] flex flex-col selection:bg-gray-900 selection:text-white">
      <Navbar />

      <main className="flex-1 pt-32 pb-24 px-4 sm:px-6 md:px-8 max-w-[1400px] mx-auto w-full">
        
        {/* Profile Card Header */}
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
          <div className="flex items-center gap-6 md:gap-8">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gray-900 flex items-center justify-center text-3xl md:text-5xl font-black text-white shadow-lg shrink-0">
              {initials}
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-2 md:mb-4">{fullName}</h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-sm text-gray-500 font-medium">
                <span className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100"><Mail size={16} className="text-gray-400" /> {email}</span>
                {phone && <span className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100"><Phone size={16} className="text-gray-400" /> {phone}</span>}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors w-full md:w-auto shrink-0"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 md:gap-12">
          
          {/* Active / Stored Vehicles */}
          <div className="flex flex-col bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-10">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 border-b border-gray-50 pb-6">
              <div>
                <h2 className="text-2xl font-black text-gray-900 mb-1">Stored Vehicles</h2>
                <p className="text-sm text-gray-500 font-medium">Vehicles currently parked in a lot</p>
              </div>
            </div>
            
            {vehiclesLoading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 size={32} className="animate-spin text-gray-300" />
              </div>
            ) : storedVehicles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <Warehouse size={40} className="text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium">No vehicles currently stored.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {storedVehicles.map(v => (
                  <div 
                    key={v.id} 
                    onClick={() => navigate(`/stored-vehicle/${v.id}`)}
                    className="group bg-white rounded-2xl border border-gray-200 hover:border-gray-900 hover:shadow-lg transition-all cursor-pointer flex flex-col sm:flex-row overflow-hidden"
                  >
                    <div className="h-48 sm:h-auto sm:w-48 bg-gray-100 relative shrink-0">
                      <img 
                        src={getImageUrl(v.profileImageUrl)} 
                        alt={v.model} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        onError={(e) => { e.target.onerror = null; e.target.src="https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&auto=format&fit=crop"; }}
                      />
                      <div className="absolute top-3 left-3 bg-green-500 text-white text-[10px] font-black tracking-widest px-2.5 py-1 rounded shadow-md uppercase">
                        Stored
                      </div>
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-center">
                      <h3 className="font-black text-gray-900 text-xl md:text-2xl mb-2">{v.brand} {v.model}</h3>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded text-xs font-bold uppercase tracking-widest">
                          {v.registrationNo || 'NO REG'}
                        </span>
                      </div>
                      <div className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 mt-auto group-hover:text-blue-800 transition-colors">
                        View Storage Details <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* All Vehicles (Garage) */}
          <div className="flex flex-col bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 border-b border-gray-50 pb-6">
              <div>
                <h2 className="text-2xl font-black text-gray-900 mb-1">My Garage</h2>
                <p className="text-sm text-gray-500 font-medium">All registered vehicles</p>
              </div>
              <button onClick={() => navigate('/my-vehicles')} className="px-5 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-colors shrink-0">
                View All
              </button>
            </div>

            {vehiclesLoading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 size={32} className="animate-spin text-gray-300" />
              </div>
            ) : regularVehicles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <Car size={40} className="text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium mb-4">Your garage is empty.</p>
                <button onClick={() => navigate('/add-vehicle')} className="px-6 py-2 bg-gray-900 text-white rounded-full text-sm font-bold hover:bg-gray-800 transition-colors">
                  Add a Vehicle
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {regularVehicles.slice(0, 4).map(v => (
                  <div key={v.id} className="group flex flex-col bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden cursor-pointer hover:border-gray-300 hover:shadow-md transition-all" onClick={() => navigate('/my-vehicles')}>
                    <div className="h-40 bg-gray-200 relative overflow-hidden">
                      <img 
                        src={getImageUrl(v.profileImageUrl)} 
                        alt={v.model} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        onError={(e) => { e.target.onerror = null; e.target.src="https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&auto=format&fit=crop"; }}
                      />
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1">{v.brand} {v.model}</h3>
                        <p className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-3">{v.registrationNo || 'NO REG'}</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                        <MapPin size={12} /> Idle / Not Stored
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Applications Section */}
        <div className="mt-12 bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-10 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 border-b border-gray-50 pb-6">
             <div>
                <h2 className="text-2xl font-black text-gray-900 mb-1">Partner Applications</h2>
                <p className="text-sm text-gray-500 font-medium">Track your submitted property applications</p>
             </div>
              <button onClick={() => navigate('/add-garage')} className="px-5 py-2.5 bg-blue-50 text-blue-700 text-sm font-bold rounded-xl hover:bg-blue-100 transition-colors shrink-0">
                Submit New Application
              </button>
          </div>
          
          {appsLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 size={32} className="animate-spin text-gray-300" />
            </div>
          ) : applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <p className="text-gray-500 font-medium mb-3">No applications submitted yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {applications.map(app => {
                const isSC = app.applicationType === 2 || app.applicationType === 'ServiceCenter';
                return (
                  <div
                    key={`${app.id}-${app.applicationType}`}
                    onClick={() => navigate('/track-application')}
                    className="group bg-gray-50 border border-gray-100 rounded-2xl p-6 hover:bg-white hover:border-gray-300 hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-6"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm shrink-0">
                        {isSC ? <Clock size={24} className="text-blue-600" /> : <Warehouse size={24} className="text-blue-600" />}
                      </div>
                      <div>
                        <p className="font-black text-gray-900 text-lg mb-1">{app.businessName}</p>
                        <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">
                          {isSC ? 'Service Center' : 'Garage'} • {new Date(app.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                      <StatusBadge status={app.status} />
                      <ChevronRight size={20} className="text-gray-400 group-hover:text-gray-900 transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </main>

      <Footer />
    </div>
  );
}