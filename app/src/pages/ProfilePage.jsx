import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getToken } from '../api/auth';
import {
  User, Mail, Phone, Car, MapPin, ChevronRight,
  LogOut, Warehouse, Clock, CheckCircle, XCircle, Loader2, Package
} from 'lucide-react';

const API = 'https://gd1-grand-auto-depot-one-9ms1.onrender.com';

function StatusBadge({ status, applicationType }) {
  const isApproved = status === 5 || status === 'Approved';
  const isRejected = status === 4 || status === 'Rejected' || status === 'Cancelled';
  if (isApproved) return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
      <CheckCircle size={11} /> Approved
    </span>
  );
  if (isRejected) return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-500 border border-red-100">
      <XCircle size={11} /> {status === 'Cancelled' ? 'Cancelled' : 'Rejected'}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
      <Clock size={11} className="animate-pulse" /> In Progress
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

  return (
    <div className="min-h-screen bg-[#f4f4f6] font-['Inter',sans-serif] flex flex-col">
      <Navbar />

      <main className="flex-1 pt-28 pb-20 px-4 sm:px-8 max-w-5xl mx-auto w-full">

        {/* Hero Card */}
        <div className="relative bg-white rounded-3xl shadow-[0_4px_30px_rgba(0,0,0,0.06)] border border-black/[0.04] overflow-hidden mb-6">
          {/* Gradient strip */}
          <div className="h-24 w-full" style={{ background: 'linear-gradient(135deg, #a200ff 0%, #003cff 100%)' }} />

          <div className="px-8 pb-8">
            {/* Avatar */}
            <div className="relative -mt-12 mb-4 flex items-end justify-between">
              <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center text-white text-2xl font-black"
                style={{ background: 'linear-gradient(135deg, #a200ff, #003cff)' }}>
                {initials}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-red-500 bg-red-50 hover:bg-red-100 border border-red-100 transition-colors"
              >
                <LogOut size={14} /> Log Out
              </button>
            </div>

            <h1 className="text-[1.6rem] font-black text-[#111] tracking-tight">{fullName}</h1>

            <div className="mt-4 flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-[13px] text-gray-500">
                <Mail size={14} className="text-gray-400" />
                {email}
              </div>
              {phone && (
                <div className="flex items-center gap-2 text-[13px] text-gray-500">
                  <Phone size={14} className="text-gray-400" />
                  {phone}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* My Vehicles */}
          <div className="bg-white rounded-3xl border border-black/[0.04] shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Car size={16} className="text-blue-600" />
                </div>
                <h2 className="text-[15px] font-bold text-[#111]">My Vehicles</h2>
              </div>
              <button
                onClick={() => navigate('/my-vehicles')}
                className="text-[12px] font-semibold text-blue-600 hover:underline"
              >
                View all
              </button>
            </div>

            {vehiclesLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 size={24} className="animate-spin text-gray-300" />
              </div>
            ) : regularVehicles.length === 0 ? (
              <div className="text-center py-8">
                <Car size={32} className="mx-auto text-gray-200 mb-2" />
                <p className="text-[13px] text-gray-400">No vehicles registered</p>
                <button
                  onClick={() => navigate('/add-vehicle')}
                  className="mt-3 text-[12px] font-semibold text-blue-600 hover:underline"
                >+ Add Vehicle</button>
              </div>
            ) : (
              <div className="space-y-2">
                {regularVehicles.slice(0, 4).map(v => (
                  <div key={v.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 hover:bg-blue-50 transition-colors group">
                    <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                      <Car size={14} className="text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-[#111] truncate">{v.brand} {v.model}</p>
                      <p className="text-[11px] text-gray-400">{v.registrationNo || 'No Reg.'}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 uppercase">{v.type || 'Car'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stored Vehicles */}
          <div className="bg-white rounded-3xl border border-black/[0.04] shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center">
                <Package size={16} className="text-purple-600" />
              </div>
              <h2 className="text-[15px] font-bold text-[#111]">Stored Vehicles</h2>
            </div>

            {vehiclesLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 size={24} className="animate-spin text-gray-300" />
              </div>
            ) : storedVehicles.length === 0 ? (
              <div className="text-center py-8">
                <Warehouse size={32} className="mx-auto text-gray-200 mb-2" />
                <p className="text-[13px] text-gray-400">No vehicles currently stored</p>
              </div>
            ) : (
              <div className="space-y-2">
                {storedVehicles.map(v => (
                  <div
                    key={v.id}
                    onClick={() => navigate(`/stored-vehicle`)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-purple-50/60 hover:bg-purple-50 border border-purple-100 transition-colors cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white border border-purple-100 flex items-center justify-center shadow-sm">
                      <Car size={14} className="text-purple-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-[#111] truncate">{v.brand} {v.model}</p>
                      <p className="text-[11px] text-purple-400 flex items-center gap-1">
                        <MapPin size={10} /> Currently Stored
                      </p>
                    </div>
                    <ChevronRight size={14} className="text-purple-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Applications */}
        <div className="mt-6 bg-white rounded-3xl border border-black/[0.04] shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center">
              <Warehouse size={16} className="text-orange-500" />
            </div>
            <h2 className="text-[15px] font-bold text-[#111]">My Applications</h2>
          </div>

          {appsLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={24} className="animate-spin text-gray-300" />
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-10">
              <Clock size={32} className="mx-auto text-gray-200 mb-2" />
              <p className="text-[13px] text-gray-400 mb-3">No applications yet</p>
              <button
                onClick={() => navigate('/add-garage')}
                className="text-[12px] font-semibold text-orange-500 hover:underline"
              >Apply for a Garage →</button>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map(app => {
                const isSC = app.applicationType === 2 || app.applicationType === 'ServiceCenter';
                return (
                  <div
                    key={`${app.id}-${app.applicationType}`}
                    onClick={() => navigate('/track-application')}
                    className="flex items-center gap-4 px-4 py-4 rounded-2xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50/40 transition-all cursor-pointer group"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isSC ? 'bg-purple-50' : 'bg-orange-50'}`}>
                      <Warehouse size={18} className={isSC ? 'text-purple-500' : 'text-orange-500'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold text-[#111] truncate">{app.businessName}</p>
                      <p className="text-[11px] text-gray-400">
                        {isSC ? 'Service Center' : 'Garage'} · {new Date(app.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={app.status} applicationType={app.applicationType} />
                      <ChevronRight size={14} className="text-gray-300 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all" />
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