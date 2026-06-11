import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Truck, 
  Car,
  LogOut, 
  MessageCircle,
  ClipboardList,
  X,
  Maximize2,
  Menu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getToken } from '../api/auth';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useNavigation } from '../context/NavigationContext';

const vehicleLocationIcon = L.divIcon({
  html: `
    <div style="position: relative; display: flex; align-items: center; justify-content: center;">
      <div style="width: 30px; height: 30px; background-color: #ef4444; border-radius: 9999px; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border: 2px solid #ffffff; transform: translateY(-3px);">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px; color: #ffffff;">
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
          <circle cx="7" cy="17" r="2"/>
          <path d="M9 17h6"/>
          <circle cx="17" cy="17" r="2"/>
        </svg>
      </div>
      <div style="position: absolute; bottom: -6px; left: 11px; width: 8px; height: 8px; background-color: #ef4444; transform: rotate(45deg); border-right: 2px solid #ffffff; border-bottom: 2px solid #ffffff;"></div>
    </div>
  `,
  className: 'custom-vehicle-icon-pip',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

const managerIcon = L.divIcon({
  html: `
    <div style="width: 18px; height: 18px; background-color: #6b7280; border-radius: 9999px; border: 3px solid #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center;">
      <div style="width: 6px; height: 6px; background-color: #ffffff; border-radius: 9999px;"></div>
    </div>
  `,
  className: 'custom-manager-icon-pip',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function MapBoundsFit({ bounds, center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom(), { animate: true });
    } else if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [bounds, center, zoom, map]);
  return null;
}

export default function ManagerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { 
    navigationMode, 
    setNavigationMode, 
    pickup, 
    routeCoords, 
    currentGpsPos, 
    stopNavigation 
  } = useNavigation();

  const [metrics, setMetrics] = useState(null);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = getToken('AccessToken');
        if (!token) return;

        const metricsRes = await fetch('https://localhost:7108/api/lot-manager/dashboard-metrics', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (metricsRes.ok) {
          const mData = await metricsRes.json();
          setMetrics(mData.data);
        }

        const chatRes = await fetch('https://localhost:7108/api/Chat/conversations', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (chatRes.ok) {
          const cData = await chatRes.json();
          const unread = (cData || []).reduce((sum, c) => sum + (c.unreadCount || 0), 0);
          setUnreadMessagesCount(unread);
        }
      } catch (err) {
        console.error('Error fetching layout badges data:', err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/lot-manager/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/lot-manager/pickups', icon: Truck, label: 'Pickups', badge: metrics?.pendingPickupsCount },
    { path: '/lot-manager/vehicles', icon: Car, label: 'Vehicles' },
    { 
      path: '/lot-manager/tasks', 
      icon: ClipboardList, 
      label: 'Tasks', 
      badge: metrics ? (metrics.pendingWeeklyCount + metrics.pendingOnDemandCount) : 0 
    },
    { path: '/lot-manager/messages', icon: MessageCircle, label: 'Messages', badge: unreadMessagesCount },
  ];

  const pLat = pickup ? parseFloat(pickup.pickupLatitude) : 0;
  const pLon = pickup ? parseFloat(pickup.pickupLongitude) : 0;
  const lLat = pickup ? parseFloat(pickup.lotLatitude) : 0;
  const lLon = pickup ? parseFloat(pickup.lotLongitude) : 0;
  const hasValidCoords = pickup && !isNaN(pLat) && !isNaN(pLon) && !isNaN(lLat) && !isNaN(lLon);

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between px-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <img src="/GD1 Logo.png" alt="GD1 Logo" className="w-8 h-8 object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#111] tracking-tight leading-none">GD1</h1>
            <p className="text-[10px] font-bold text-blue-600 tracking-wide uppercase mt-1">Manager Portal</p>
          </div>
        </div>
        {/* Mobile close button */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center justify-between px-4 h-12 rounded-xl font-medium text-[15px] transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-6 flex justify-center">
                  <Icon size={20} className={isActive ? 'text-white' : 'text-gray-400'} />
                </div>
                <span>{item.label}</span>
              </div>
              {item.badge > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  isActive ? 'bg-white text-blue-600 shadow-sm' : 'bg-red-500 text-white shadow-sm'
                }`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 border-t border-gray-100 pt-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-4 px-4 h-12 w-full rounded-xl bg-white text-gray-500 hover:bg-red-50 hover:text-red-600 font-medium text-[15px] transition-all duration-200"
        >
          <div className="w-6 flex justify-center"><LogOut size={20} /></div>
          <span>Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* ── Desktop Sidebar (fixed, visible lg+) ── */}
      <aside className="hidden lg:flex w-[240px] xl:w-[260px] bg-white border-r border-gray-100 flex-col py-6 fixed h-full z-20 shadow-sm">
        <SidebarContent />
      </aside>

      {/* ── Mobile Sidebar Drawer (slide-in overlay) ── */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Drawer */}
          <aside className="relative w-[260px] bg-white flex flex-col py-6 h-full z-50 shadow-2xl animate-slide-in-left">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* ── Main Content ── */}
      <main className="flex-1 lg:ml-[240px] xl:ml-[260px] min-w-0">
        {/* Mobile top header bar */}
        <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2.5">
            <img src="/GD1 Logo.png" alt="GD1" className="w-7 h-7 object-contain" />
            <span className="font-bold text-gray-900">GD1 Manager</span>
          </div>
          {/* Badge summary for mobile */}
          <div className="ml-auto flex items-center gap-2">
            {unreadMessagesCount > 0 && (
              <button onClick={() => navigate('/lot-manager/messages')} className="relative">
                <MessageCircle size={22} className="text-gray-500" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                </span>
              </button>
            )}
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>

      {/* ── Global floating PiP Map ── */}
      {navigationMode === 'floating' && hasValidCoords && (
        <div 
          onClick={() => {
            setNavigationMode('fullscreen');
            navigate(`/lot-manager/pickup-details/${pickup.pickupRequestId}`);
          }}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[200px] h-[140px] sm:w-[280px] sm:h-[185px] md:w-[320px] md:h-[210px] z-[9999] bg-white rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-white overflow-hidden cursor-pointer group hover:scale-[1.02] transition-all duration-300"
          title="Click to expand to fullscreen"
        >
          {/* Close button */}
          <button 
            onClick={(e) => { e.stopPropagation(); stopNavigation(); }}
            className="absolute top-2 right-2 z-[1000] w-7 h-7 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
            title="Stop Navigation"
          >
            <X size={14} strokeWidth={2.5} />
          </button>

          {/* Expand label */}
          <div className="absolute bottom-2 left-2 z-[1000] bg-blue-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-xl shadow flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
            <Maximize2 size={10} />
            <span>Expand</span>
          </div>

          <div className="w-full h-full pointer-events-none">
            <MapContainer 
              key={`floating-${currentGpsPos ? currentGpsPos.join('-') : 'gps'}`}
              center={currentGpsPos || [pLat, pLon]} 
              zoom={14} 
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
              attributionControl={false}
            >
              <TileLayer url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png" />
              <MapBoundsFit bounds={routeCoords} center={currentGpsPos} zoom={14} />
              <Marker position={[pLat, pLon]} icon={vehicleLocationIcon} />
              <Marker position={[lLat, lLon]} />
              {currentGpsPos && <Marker position={currentGpsPos} icon={managerIcon} />}
              <Polyline positions={routeCoords} color="#3b82f6" weight={5} />
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png"
                pane="shadowPane"
              />
            </MapContainer>
          </div>
        </div>
      )}
    </div>
  );
}
