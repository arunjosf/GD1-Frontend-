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

function StatusBadge({ status, applicationType }) {
  const isApproved = status === 5 || status === 'Approved';
  const isRejected = status === 4 || status === 'Rejected' || status === 'Cancelled';
  if (isApproved) return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#f0fdf4] text-[#16a34a] border border-[#dcfce7]">
      <CheckCircle size={12} strokeWidth={2.5} /> Approved
    </span>
  );
  if (isRejected) return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#fef2f2] text-[#ef4444] border border-[#fee2e2]">
      <XCircle size={12} strokeWidth={2.5} /> {status === 'Cancelled' ? 'Cancelled' : 'Rejected'}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#eff6ff] text-[#3b82f6] border border-[#dbeafe]">
      <div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] animate-pulse" /> In Progress
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
    <div className="min-h-screen bg-[#fafafa] font-['Inter',sans-serif] flex flex-col selection:bg-black selection:text-white">
      <Navbar />

      <main className="flex-1 pt-32 pb-24 px-5 sm:px-8 max-w-[1100px] mx-auto w-full">

        {/* Profile Header section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-10 border-b border-black/[0.06]">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[2rem] bg-black text-white flex items-center justify-center text-3xl font-medium tracking-tighter shadow-sm border border-black/5">
              {initials}
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-semibold text-[#111] tracking-tight mb-2">{fullName}</h1>
              <div className="flex items-center gap-4 text-[14px] text-gray-500 font-medium">
                <span className="flex items-center gap-1.5"><Mail size={15} /> {email}</span>
                {phone && <span className="flex items-center gap-1.5"><Phone size={15} /> {phone}</span>}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="group flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-[13px] font-semibold text-[#111] bg-white border border-black/10 hover:border-black/30 hover:bg-black/5 transition-all w-full md:w-auto"
          >
            Log Out <LogOut size={14} className="text-gray-400 group-hover:text-[#111] transition-colors" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* My Vehicles */}
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-[17px] font-semibold text-[#111] tracking-tight flex items-center gap-2">
                Garage <span className="text-gray-400 font-normal">({regularVehicles.length})</span>
              </h2>
              <button onClick={() => navigate('/my-vehicles')} className="text-[13px] font-medium text-blue-600 hover:text-blue-700 transition-colors">
                View all
              </button>
            </div>

            {vehiclesLoading ? (
              <div className="h-40 bg-white rounded-3xl border border-black/[0.06] flex items-center justify-center">
                <Loader2 size={24} className="animate-spin text-gray-300" />
              </div>
            ) : regularVehicles.length === 0 ? (
              <div className="h-40 bg-white rounded-3xl border border-black/[0.06] flex flex-col items-center justify-center text-center p-6">
                <Car size={28} strokeWidth={1.5} className="text-gray-300 mb-3" />
                <p className="text-[14px] text-gray-500 font-medium mb-1">No vehicles found</p>
                <button onClick={() => navigate('/add-vehicle')} className="text-[13px] text-blue-600 font-medium hover:underline">Add your first vehicle</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {regularVehicles.slice(0, 4).map(v => {
                  const img = getVehicleImage(v);
                  return (
                    <div key={v.id} className="group bg-white p-4 rounded-3xl border border-black/[0.06] hover:border-black/15 transition-all shadow-sm hover:shadow-md cursor-pointer flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-black/[0.04] overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {img ? (
                          <img src={img} alt={v.model} className="w-full h-full object-cover" />
                        ) : (
                          <Car size={20} className="text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-[#111] truncate mb-0.5">{v.brand} {v.model}</p>
                        <p className="text-[12px] text-gray-500 truncate">{v.registrationNo || 'No Registration'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Stored Vehicles */}
          <div className="flex flex-col gap-5">
            <div className="flex items-center px-1">
              <h2 className="text-[17px] font-semibold text-[#111] tracking-tight flex items-center gap-2">
                Stored Vehicles <span className="text-gray-400 font-normal">({storedVehicles.length})</span>
              </h2>
            </div>

            {vehiclesLoading ? (
              <div className="h-40 bg-white rounded-3xl border border-black/[0.06] flex items-center justify-center">
                <Loader2 size={24} className="animate-spin text-gray-300" />
              </div>
            ) : storedVehicles.length === 0 ? (
              <div className="h-40 bg-white rounded-3xl border border-black/[0.06] flex flex-col items-center justify-center text-center p-6">
                <Warehouse size={28} strokeWidth={1.5} className="text-gray-300 mb-3" />
                <p className="text-[14px] text-gray-500 font-medium">No vehicles in storage</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {storedVehicles.map(v => {
                  const img = getVehicleImage(v);
                  return (
                    <div 
                      key={v.id} 
                      onClick={() => navigate(`/stored-vehicle/${v.id}`)}
                      className="group bg-[#fafafa] p-4 rounded-3xl border border-black/[0.06] hover:border-black/20 hover:bg-white transition-all shadow-sm hover:shadow-md cursor-pointer flex flex-col"
                    >
                      <div className="flex items-start gap-4 mb-4">
                         <div className="w-14 h-14 rounded-[1rem] bg-white border border-black/[0.04] overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {img ? (
                            <img src={img} alt={v.model} className="w-full h-full object-cover" />
                          ) : (
                            <Car size={18} className="text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pt-1">
                          <p className="text-[14px] font-semibold text-[#111] truncate mb-0.5">{v.brand} {v.model}</p>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/5 text-[10px] font-medium text-black">
                            <MapPin size={10} /> Stored
                          </span>
                        </div>
                      </div>
                      <div className="mt-auto flex items-center justify-between pt-3 border-t border-black/5">
                        <span className="text-[12px] font-medium text-gray-500">Manage Storage</span>
                        <ChevronRight size={14} className="text-gray-400 group-hover:text-black transition-colors" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Applications */}
        <div className="mt-12 flex flex-col gap-5">
           <div className="flex items-center px-1">
              <h2 className="text-[17px] font-semibold text-[#111] tracking-tight">Partner Applications</h2>
            </div>

          {appsLoading ? (
            <div className="h-32 bg-white rounded-3xl border border-black/[0.06] flex items-center justify-center">
              <Loader2 size={24} className="animate-spin text-gray-300" />
            </div>
          ) : applications.length === 0 ? (
            <div className="bg-white rounded-3xl border border-black/[0.06] p-8 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                <Clock size={20} strokeWidth={1.5} className="text-gray-400" />
              </div>
              <p className="text-[14px] font-medium text-[#111] mb-2">No applications yet</p>
              <p className="text-[13px] text-gray-500 max-w-sm mb-5">Have a property or service center? Partner with us to grow your business.</p>
              <button
                onClick={() => navigate('/add-garage')}
                className="px-6 py-2.5 rounded-full bg-black text-white text-[13px] font-medium hover:bg-gray-800 transition-colors"
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
                    className="group bg-white p-5 rounded-3xl border border-black/[0.06] hover:border-black/15 transition-all shadow-sm cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-[1rem] bg-black/5 flex items-center justify-center shrink-0">
                        <Warehouse size={18} strokeWidth={1.5} className="text-[#111]" />
                      </div>
                      <div>
                        <p className="text-[15px] font-semibold text-[#111] mb-0.5">{app.businessName}</p>
                        <p className="text-[13px] text-gray-500">
                          {isSC ? 'Service Center' : 'Garage'} · {new Date(app.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={app.status} applicationType={app.applicationType} />
                      <ChevronRight size={16} className="text-gray-300 group-hover:text-black transition-colors" />
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