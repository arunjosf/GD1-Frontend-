import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getToken } from '../api/auth';
import { LogOut } from 'lucide-react';

const API = 'https://gd1-grand-auto-depot-one-9ms1.onrender.com';

const getImageUrl = (url) => {
  if (!url) return "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&auto=format&fit=crop";
  if (url.startsWith('http')) return url;
  return `https://gd1-grand-auto-depot-one-9ms1.onrender.com${url.startsWith('/') ? url : `/${url}`}`;
};

export default function ProfilePage() {
  const { user, logout, userVehicles, vehiclesLoading } = useAuth();
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);

  const fullName = typeof user === 'object' && user?.fullName ? user.fullName : 'User';
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
      } catch (e) {
        console.error(e);
      }
    };
    fetchApplications();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-white font-['Inter',sans-serif] selection:bg-[#111] selection:text-white pb-20">
      <Navbar />

      <main className="pt-32 px-6 md:px-12 max-w-[1200px] mx-auto w-full">
        
        {/* Profile Hero Header */}
        <div className="flex flex-col items-center justify-center text-center mb-24">
          <div className="w-24 h-24 rounded-full bg-[#111] text-white flex items-center justify-center text-3xl font-semibold mb-6 shadow-md">
            {initials}
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold text-[#1d1d1f] tracking-tight mb-2">
            Welcome, {fullName.split(' ')[0]}
          </h1>
          <p className="text-[16px] text-gray-500 mb-8 max-w-md">
            Manage your registered vehicles, track storage locations, and monitor your partner applications.
          </p>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-6 py-2 rounded-full text-[13px] font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>

        {/* Section: Stored Vehicles */}
        <section className="mb-20">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-[28px] font-semibold text-[#1d1d1f] tracking-tight">Stored Vehicles</h2>
          </div>
          
          {vehiclesLoading ? (
            <p className="text-[#1d1d1f] text-sm">Loading vehicles...</p>
          ) : storedVehicles.length === 0 ? (
            <div className="py-12 border-b border-gray-200">
              <p className="text-[16px] text-gray-500">You don't have any vehicles currently parked in a lot.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
              {storedVehicles.map(v => (
                <div 
                  key={v.id} 
                  onClick={() => navigate(`/stored-vehicle/${v.id}`)}
                  className="flex flex-col w-full flex-shrink-0 group cursor-pointer text-left items-start"
                >
                  <div className="w-full rounded-[13px] overflow-hidden flex justify-center mb-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-all duration-300 relative aspect-[4/3]">
                    <img 
                      src={getImageUrl(v.profileImageUrl)} 
                      alt={v.model} 
                      className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-500" 
                      onError={(e) => { e.target.onerror = null; e.target.src="https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&auto=format&fit=crop"; }}
                    />
                    <div className="absolute top-4 right-4 bg-green-500 text-white px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest shadow-lg">
                      STORED
                    </div>
                  </div>
                  <p className="text-[12px] font-semibold text-[#bf4800] mb-2 uppercase tracking-wide">{v.registrationNo || 'NO REG'}</p>
                  <h3 className="text-[24px] font-semibold text-[#1d1d1f] tracking-tight mb-2 truncate w-full">{v.brand} {v.model}</h3>
                  <p className="text-[15px] text-[#1d1d1f] mb-3 truncate w-full">{v.lotName || 'Secure Facility'}</p>
                  <p className="text-[14px] text-blue-600 font-medium group-hover:underline">View booking details &rarr;</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section: My Vehicles */}
        <section className="mb-20">
          <div className="flex items-center justify-between mb-8 border-t border-gray-200 pt-16">
            <h2 className="text-[28px] font-semibold text-[#1d1d1f] tracking-tight">My Vehicles</h2>
            <button onClick={() => navigate('/my-vehicles')} className="text-[14px] font-medium text-blue-600 hover:underline">
              Manage All
            </button>
          </div>

          {vehiclesLoading ? (
            <p className="text-[#1d1d1f] text-sm">Loading vehicles...</p>
          ) : regularVehicles.length === 0 ? (
            <div className="py-12 border-b border-gray-200">
              <p className="text-[16px] text-gray-500">Your vehicle list is empty. Add a vehicle to get started.</p>
              <button onClick={() => navigate('/add-vehicle')} className="mt-4 px-6 py-2 bg-[#111] text-white rounded-full text-sm font-medium hover:bg-[#333] transition-colors">
                Add Vehicle
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
              {regularVehicles.slice(0, 3).map(v => (
                <div 
                  key={v.id} 
                  onClick={() => navigate('/my-vehicles')}
                  className="flex flex-col w-full flex-shrink-0 group cursor-pointer text-left items-start"
                >
                  <div className="w-full rounded-[13px] bg-gray-100 overflow-hidden flex justify-center mb-5 shadow-[0_4px_24px_rgba(0,0,0,0.02)] transition-all duration-300 relative aspect-[4/3]">
                    <img 
                      src={getImageUrl(v.profileImageUrl)} 
                      alt={v.model} 
                      className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-500 opacity-90 group-hover:opacity-100" 
                      onError={(e) => { e.target.onerror = null; e.target.src="https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&auto=format&fit=crop"; }}
                    />
                  </div>
                  <p className="text-[12px] font-semibold text-gray-500 mb-2 uppercase tracking-wide">{v.registrationNo || 'NO REG'}</p>
                  <h3 className="text-[24px] font-semibold text-[#1d1d1f] tracking-tight mb-2 truncate w-full">{v.brand} {v.model}</h3>
                  <p className="text-[15px] text-gray-500 font-medium">Idle — Ready to park</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section: Partner Applications */}
        <section>
          <div className="flex items-center justify-between mb-8 border-t border-gray-200 pt-16">
            <h2 className="text-[28px] font-semibold text-[#1d1d1f] tracking-tight">Partner Applications</h2>
            <button onClick={() => navigate('/add-garage')} className="text-[14px] font-medium text-blue-600 hover:underline">
              New Application
            </button>
          </div>

          {applications.length === 0 ? (
            <div className="py-12 border-b border-gray-200">
              <p className="text-[16px] text-gray-500 mb-4">You have not submitted any property partnership applications.</p>
              <button onClick={() => navigate('/add-garage')} className="px-6 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors">
                Become a Partner
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {applications.map(app => {
                const isSC = app.applicationType === 2 || app.applicationType === 'ServiceCenter';
                const status = app.status;
                const isApproved = status === 5 || status === 'Approved';
                const isRejected = status === 4 || status === 'Rejected' || status === 'Cancelled';
                
                return (
                  <div 
                    key={`${app.id}-${app.applicationType}`} 
                    onClick={() => navigate('/track-application')}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-white border border-gray-200 rounded-[16px] hover:border-[#111] hover:shadow-sm cursor-pointer transition-all"
                  >
                    <div>
                      <h3 className="text-[18px] font-semibold text-[#1d1d1f] tracking-tight mb-1">{app.businessName}</h3>
                      <p className="text-[14px] text-gray-500">
                        {isSC ? 'Service Center' : 'Garage Parking'} &nbsp;•&nbsp; Submitted {new Date(app.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="mt-4 sm:mt-0 flex items-center gap-3">
                      {isApproved ? (
                        <span className="text-[13px] font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">Approved</span>
                      ) : isRejected ? (
                        <span className="text-[13px] font-medium text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-100">Rejected</span>
                      ) : (
                        <span className="text-[13px] font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span> Under Review
                        </span>
                      )}
                      <span className="text-gray-400">&rarr;</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </main>

      <Footer />
    </div>
  );
}