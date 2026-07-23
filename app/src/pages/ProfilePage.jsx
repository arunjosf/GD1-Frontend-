import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getToken } from '../api/auth';
import {
  Mail, Phone, Car, ChevronRight, LogOut, Warehouse, Clock, CheckCircle, XCircle, Loader2
} from 'lucide-react';

const API = 'https://gd1-grand-auto-depot-one-9ms1.onrender.com';

function StatusBadge({ status }) {
  const isApproved = status === 5 || status === 'Approved';
  const isRejected = status === 4 || status === 'Rejected' || status === 'Cancelled';
  if (isApproved) return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-50 text-emerald-600 border border-emerald-100">
      <CheckCircle size={12} strokeWidth={3} /> Approved
    </span>
  );
  if (isRejected) return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-red-50 text-red-600 border border-red-100">
      <XCircle size={12} strokeWidth={3} /> {status === 'Cancelled' ? 'Cancelled' : 'Rejected'}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-blue-50 text-blue-600 border border-blue-100">
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
    <div className="min-h-screen bg-white font-['Inter',sans-serif] flex flex-col selection:bg-gray-900 selection:text-white">
      <Navbar />

      <main className="flex-1 pt-36 pb-24 px-6 md:px-12 max-w-7xl mx-auto w-full">
        
        {/* Minimal Hero Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 pb-12 border-b border-gray-100">
          <div className="flex items-center gap-8">
            <div className="w-28 h-28 rounded-full bg-gray-50 flex items-center justify-center text-3xl font-bold tracking-tight text-gray-900 border border-gray-100">
              {initials}
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-3">{fullName}</h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-sm text-gray-500 font-medium">
                <span className="flex items-center gap-2"><Mail size={16} /> {email}</span>
                {phone && <span className="flex items-center gap-2"><Phone size={16} /> {phone}</span>}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors w-full md:w-auto"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          
          {/* My Garage */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Garage</h2>
              {regularVehicles.length > 0 && (
                <button onClick={() => navigate('/my-vehicles')} className="text-sm font-bold text-gray-400 hover:text-gray-900 transition-colors">
                  View all
                </button>
              )}
            </div>

            {vehiclesLoading ? (
              <div className="flex items-center justify-center h-48 bg-gray-50 rounded-3xl">
                <Loader2 size={32} className="animate-spin text-gray-300" />
              </div>
            ) : regularVehicles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center bg-gray-50 rounded-3xl border border-gray-100 px-6">
                <Car size={32} className="text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium mb-4">Your garage is empty.</p>
                <button onClick={() => navigate('/add-vehicle')} className="px-6 py-2 bg-gray-900 text-white rounded-full text-sm font-bold hover:bg-gray-800 transition-colors">
                  Add Vehicle
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {regularVehicles.slice(0, 4).map(v => (
                  <div key={v.id} className="group bg-gray-50 rounded-3xl overflow-hidden hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => navigate('/my-vehicles')}>
                    <div className="aspect-[4/3] bg-gray-200 w-full relative overflow-hidden">
                      <img 
                        src={getImageUrl(v.profileImageUrl)} 
                        alt={v.model} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        onError={(e) => { e.target.onerror = null; e.target.src="https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&auto=format&fit=crop"; }}
                      />
                    </div>
                    <div className="p-5">
                      <p className="font-bold text-gray-900 text-lg truncate mb-1">{v.brand} {v.model}</p>
                      <p className="text-xs font-semibold tracking-wider uppercase text-gray-400">{v.registrationNo || 'NO REG'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stored Vehicles */}
          <div className="flex flex-col">
             <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Storage</h2>
            </div>
            
            {vehiclesLoading ? (
              <div className="flex items-center justify-center h-48 bg-gray-50 rounded-3xl">
                <Loader2 size={32} className="animate-spin text-gray-300" />
              </div>
            ) : storedVehicles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center bg-gray-50 rounded-3xl border border-gray-100 px-6">
                <Warehouse size={32} className="text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium">No vehicles in storage.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5">
                {storedVehicles.map(v => (
                  <div 
                    key={v.id} 
                    onClick={() => navigate(`/stored-vehicle/${v.id}`)}
                    className="group bg-white rounded-3xl border border-gray-100 p-4 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer flex items-center gap-5"
                  >
                    <div className="w-24 h-24 rounded-2xl bg-gray-100 overflow-hidden shrink-0 relative">
                      <img 
                        src={getImageUrl(v.profileImageUrl)} 
                        alt={v.model} 
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.onerror = null; e.target.src="https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&auto=format&fit=crop"; }}
                      />
                      <div className="absolute inset-0 border border-black/5 rounded-2xl" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 text-[10px] font-bold tracking-widest uppercase rounded-full mb-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Stored
                      </div>
                      <p className="font-bold text-gray-900 text-lg truncate mb-1">{v.brand} {v.model}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1 font-medium">
                        Manage vehicle <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Applications */}
        <div className="mt-20 pt-16 border-t border-gray-100 flex flex-col">
          <div className="flex items-center justify-between mb-8">
             <h2 className="text-2xl font-bold text-gray-900">Partner Applications</h2>
              <button onClick={() => navigate('/add-garage')} className="text-sm font-bold text-gray-400 hover:text-gray-900 transition-colors">
                New Application
              </button>
          </div>
          
          {appsLoading ? (
            <div className="flex items-center justify-center h-32 bg-gray-50 rounded-3xl">
              <Loader2 size={32} className="animate-spin text-gray-300" />
            </div>
          ) : applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center bg-gray-50 rounded-3xl border border-gray-100">
              <p className="text-gray-500 font-medium mb-3">No applications submitted yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {applications.map(app => {
                const isSC = app.applicationType === 2 || app.applicationType === 'ServiceCenter';
                return (
                  <div
                    key={`${app.id}-${app.applicationType}`}
                    onClick={() => navigate('/track-application')}
                    className="group bg-white border border-gray-100 rounded-3xl p-6 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                        {isSC ? <Clock size={20} className="text-gray-900" /> : <Warehouse size={20} className="text-gray-900" />}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-lg mb-1">{app.businessName}</p>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                          {isSC ? 'Service Center' : 'Garage'} • {new Date(app.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <StatusBadge status={app.status} />
                      <ChevronRight size={20} className="text-gray-300 group-hover:text-gray-900 transition-colors" />
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