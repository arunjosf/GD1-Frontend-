import { useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, Calendar, Wrench, CreditCard, LogOut, Menu, X, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState as useReactState } from 'react';
import { getToken } from '../api/auth';
import NotificationSidebar from '../components/NotificationSidebar';

export default function ServiceCenterLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [scName, setScName] = useReactState('Service Center');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`https://localhost:7108/api/service-center/profile`, {
        headers: { Authorization: `Bearer ${getToken('AccessToken')}` }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.name) {
          setScName(json.data.name);
        }
      }
    } catch(e) {}
  };
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/service-center/dashboard', icon: LayoutDashboard },
    { name: 'Bookings', path: '/service-center/bookings', icon: Calendar },
    { name: 'Mechanics', path: '/service-center/mechanics', icon: Wrench },
    { name: 'Payments', path: '/service-center/payments', icon: CreditCard }
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-20 px-6 border-b border-gray-100">
          <h1 className="text-xl font-black text-blue-600 tracking-tighter">{scName}</h1>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-gray-900">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-160px)]">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 mt-2 px-2">Menu</div>
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'}`}
              >
                <Icon size={20} className={isActive ? "text-blue-600" : "text-gray-400"} />
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="absolute bottom-0 w-full p-4 border-t border-gray-100 bg-white">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full text-red-600 hover:bg-red-50 rounded-xl font-bold transition-colors">
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>

      
      <NotificationSidebar 
        isOpen={notificationsOpen} 
        onClose={() => setNotificationsOpen(false)} 
        userRole="ServiceCenter" 
      />
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0 lg:px-8">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-xl lg:hidden">
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-bold text-gray-900 hidden sm:block">
              {navItems.find(i => location.pathname.startsWith(i.path))?.name || 'Dashboard'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setNotificationsOpen(true)} className="p-2 text-gray-400 hover:text-gray-900 relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center border border-blue-200">
              SC
            </div>
          </div>
        </header>

        {/* Main Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
