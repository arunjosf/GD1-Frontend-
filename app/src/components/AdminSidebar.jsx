import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BarChart3, 
  Calendar, 
  Building2, 
  Users, 
  Settings,
  LogOut,
  FileText,
  Truck,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminSidebar({ isMobileOpen, setIsMobileOpen }) {
  const { logout } = useAuth();
  const [appCount, setAppCount] = useState(0);
  const [pendingBookingCount, setPendingBookingCount] = useState(0);

  useEffect(() => {
    // Fetch pending applications count
    const fetchAppCount = async () => {
      try {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; AccessToken=`);
        const token = parts.length === 2 ? parts.pop().split(';').shift() : null;
        if (!token) return;

        const [franchiseRes, scRes, bookingsRes] = await Promise.all([
          fetch('https://gd1-grand-auto-depot-one-9ms1.onrender.com/api/admin/franchise/applications', {
            headers: { 'Authorization': `Bearer ${token}` }
          }).catch(() => null),
          fetch('https://gd1-grand-auto-depot-one-9ms1.onrender.com/api/admin/service-centers/applications', {
            headers: { 'Authorization': `Bearer ${token}` }
          }).catch(() => null),
          fetch('https://gd1-grand-auto-depot-one-9ms1.onrender.com/api/LotBooking/bookings', {
            headers: { 'Authorization': `Bearer ${token}` }
          }).catch(() => null)
        ]);

        let pendingCount = 0;
        
        if (franchiseRes && franchiseRes.ok) {
          const result = await franchiseRes.json();
          pendingCount += (result.data || []).filter(app => app.status === 'Pending').length;
        }

        if (scRes && scRes.ok) {
          const result = await scRes.json();
          pendingCount += (result.data || []).filter(app => app.status === 'PendingReview' || app.status === 'Pending').length;
        }

        setAppCount(pendingCount);

        if (bookingsRes && bookingsRes.ok) {
          const result = await bookingsRes.json();
          const bookings = result.data || result;
          const pbCount = bookings.filter(b => String(b.status) === 'PendingVerification' || String(b.status) === '13').length;
          setPendingBookingCount(pbCount);
        }
      } catch {
        // ignore
      }
    };
    fetchAppCount();
    const interval = setInterval(fetchAppCount, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Bookings', path: '/admin/bookings', icon: <Calendar size={20} />, count: pendingBookingCount },
    { name: 'Applications', path: '/admin/applications', icon: <FileText size={20} />, count: appCount },
    { name: 'Partners', path: '/admin/partners', icon: <Building2 size={20} /> },
    { name: 'Users', path: '/admin/users', icon: <Users size={20} /> },
    { name: 'Agents', path: '/admin/agents', icon: <UserCheck size={20} /> }
  ];

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-[260px] bg-white border-r border-gray-100 flex flex-col py-6
        transition-transform duration-300 ease-in-out shadow-sm
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-8 mb-10">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
          <span className="font-bold text-xl text-[#111] tracking-tight">GD1 Admin</span>
        </div>

        <nav className="flex flex-col gap-2 w-full px-4 overflow-y-auto flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-4 px-4 h-12 rounded-xl transition-all duration-200 font-medium text-[15px] relative
                ${isActive 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                  : 'bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
              `}
            >
              {({ isActive }) => (
                <>
                  <div className="w-6 flex justify-center">{item.icon}</div>
                  <span className="flex-1">{item.name}</span>
                  {item.count > 0 && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      isActive ? 'bg-white text-blue-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto px-4 pt-4">
          <button 
            onClick={logout}
            className="flex items-center gap-4 px-4 h-12 w-full rounded-xl bg-white text-gray-500 hover:bg-red-50 hover:text-red-600 font-medium text-[15px] transition-all duration-200"
          >
            <div className="w-6 flex justify-center"><LogOut size={20} /></div>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
