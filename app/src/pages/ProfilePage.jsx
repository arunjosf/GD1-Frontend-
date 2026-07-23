import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getToken } from '../api/auth';
import {
  Mail, Phone, Car, MapPin, ChevronRight,
  LogOut, Warehouse, Clock, CheckCircle, XCircle, Loader2
} from 'lucide-react';

const API = 'https://gd1-grand-auto-depot-one-9ms1.onrender.com';

function StatusBadge({ status }) {
  const isApproved = status === 5 || status === 'Approved';
  const isRejected = status === 4 || status === 'Rejected' || status === 'Cancelled';
  if (isApproved) return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
      <CheckCircle size={14} /> Approved
    </span>
  );
  if (isRejected) return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
      <XCircle size={14} /> {status === 'Cancelled' ? 'Cancelled' : 'Rejected'}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
      <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" /> In Progress
    </span>
  );
}

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

  const getVehicleImage = (v) => {
    if (v.images && v.images.length > 0) return v.images[0].url;
    if (v.imageUrl) return v.imageUrl;
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 font-['Inter',sans-serif] flex flex-col">
      <Navbar />

      <main className="flex-1 pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        
        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-10 mb-8 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
            <div className="w-24 h-24 rounded-full bg-gray-900 text-white flex items-center justify-center text-3xl font-bold shadow-md">
              {initials}
            </div>
            <div className="mt-2">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{fullName}</h1>
              <div className="flex flex-col md:flex-row items-center gap-3 md:gap-6 text-sm text-gray-600">
                <span className="flex items-center gap-2"><Mail size={16} /> {email}</span>
                {phone && <span className="flex items-center gap-2"><Phone size={16} /> {phone}</span>}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors w-full md:w-auto"
          >
            <LogOut size={16} /> Log Out
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* My Garage */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Car className="text-blue-600" size={20} /> My Garage
              </h2>
              <button onClick={() => navigate('/my-vehicles')} className="text-sm font-bold text-blue-600 hover:underline">
                View all
              </button>
            </div>
            <div className="p-6 flex-1">
              {vehiclesLoading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 size={32} className="animate-spin text-gray-400" />
                </div>
              ) : regularVehicles.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <Car size={40} className="text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium mb-3">Your garage is empty</p>
                  <button onClick={() => navigate('/add-vehicle')} className="px-5 py-2 bg-gray-900 text-white rounded-lg text-sm font-bold hover:bg-gray-800">
                    Add Vehicle
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {regularVehicles.slice(0, 4).map(v => {
                    const img = getVehicleImage(v);
                    return (
                      <div key={v.id} className="group border border-gray-200 rounded-xl overflow-hidden hover:border-blue-300 hover:shadow-md transition-all bg-white flex flex-col">
                        <div className="aspect-video bg-gray-100 w-full relative overflow-hidden flex items-center justify-center">
                          {img ? (
                            <img src={img} alt={v.model} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <Car size={32} className="text-gray-400" />
                          )}
                        </div>
                        <div className="p-4">
                          <p className="font-bold text-gray-900 truncate">{v.brand} {v.model}</p>
                          <p className="text-xs text-gray-500 mt-1">{v.registrationNo || 'No Reg'}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Stored Vehicles */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
             <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Warehouse className="text-indigo-600" size={20} /> Stored Vehicles
              </h2>
            </div>
            <div className="p-6 flex-1">
              {vehiclesLoading ? (
                 <div className="flex items-center justify-center h-40">
                  <Loader2 size={32} className="animate-spin text-gray-400" />
                </div>
              ) : storedVehicles.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <Warehouse size={40} className="text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium">No vehicles currently stored</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {storedVehicles.map(v => {
                    const img = getVehicleImage(v);
                    return (
                      <div 
                        key={v.id} 
                        onClick={() => navigate(`/stored-vehicle/${v.id}`)}
                        className="group border border-indigo-100 rounded-xl overflow-hidden hover:border-indigo-400 hover:shadow-md transition-all bg-indigo-50/30 cursor-pointer flex flex-col"
                      >
                        <div className="aspect-video bg-gray-200 w-full relative overflow-hidden flex items-center justify-center">
                           {img ? (
                            <img src={img} alt={v.model} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <Car size={32} className="text-gray-400" />
                          )}
                           <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1">
                             <MapPin size={10} /> Stored
                           </div>
                        </div>
                        <div className="p-4 flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                             <p className="font-bold text-gray-900 truncate">{v.brand} {v.model}</p>
                          </div>
                          <ChevronRight size={18} className="text-indigo-400 group-hover:text-indigo-700 transition-colors" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Applications */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
             <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Clock className="text-orange-500" size={20} /> Partner Applications
              </h2>
              <button onClick={() => navigate('/add-garage')} className="text-sm font-bold text-orange-600 hover:underline">
                New Application
              </button>
          </div>
          <div className="p-6">
            {appsLoading ? (
               <div className="flex items-center justify-center h-32">
                <Loader2 size={32} className="animate-spin text-gray-400" />
              </div>
            ) : applications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <p className="text-gray-500 font-medium mb-3">No applications submitted yet.</p>
                <button
                  onClick={() => navigate('/add-garage')}
                  className="px-5 py-2 bg-orange-50 text-orange-600 rounded-lg text-sm font-bold hover:bg-orange-100 transition-colors"
                >
                  Apply for Partnership
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {applications.map(app => {
                  const isSC = app.applicationType === 2 || app.applicationType === 'ServiceCenter';
                  return (
                    <div
                      key={`${app.id}-${app.applicationType}`}
                      onClick={() => navigate('/track-application')}
                      className="border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer flex items-center justify-between bg-white"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                          <Warehouse size={20} className="text-gray-700" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 mb-1">{app.businessName}</p>
                          <p className="text-xs text-gray-500 font-medium">
                            {isSC ? 'Service Center' : 'Garage'} • {new Date(app.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={app.status} />
                        <ChevronRight size={18} className="text-gray-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}