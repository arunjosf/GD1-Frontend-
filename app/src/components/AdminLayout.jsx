import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bell, Search, Menu } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import NotificationSidebar from './NotificationSidebar';

export default function AdminLayout() {
  const { isAuthenticated } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      const fetchNotifications = async () => {
        try {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; AccessToken=`);
          const token = parts.length === 2 ? parts.pop().split(';').shift() : null;
          if (!token) return;

          const res = await fetch('https://localhost:7108/api/notifications', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const result = await res.json();
            const allNotifs = result.data || [];
            
            // Add actionUrl for application notifications if missing
            const enhancedNotifs = allNotifs.map(n => {
              if (n.title && n.title.toLowerCase().includes('application') && !n.actionUrl) {
                return { ...n, actionUrl: '/admin/applications', actionType: 'View Application' };
              }
              return n;
            });

            setNotifications(enhancedNotifs);
            const unread = enhancedNotifs.filter(n => !n.isRead).length;
            setUnreadCount(unread);
          }
        } catch { /* ignore */ }
      };
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const handleOpenNotifications = () => {
    setIsNotificationOpen(true);
    setUnreadCount(0);

    const unreadNotifs = notifications.filter(n => !n.isRead);
    if (unreadNotifs.length > 0) {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; AccessToken=`);
      const token = parts.length === 2 ? parts.pop().split(';').shift() : null;

      if (token) {
        unreadNotifs.forEach(notif => {
          fetch(`https://localhost:7108/api/notifications/${notif.id}/mark-read`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
          }).catch(() => { /* ignore */ });
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f6fc] flex font-['Inter',sans-serif]">
      
      {/* Sidebar Component */}
      <AdminSidebar isMobileOpen={isSidebarOpen} setIsMobileOpen={setIsSidebarOpen} />

      {/* Main Content */}
      {/* 
        The sidebar is fixed and width 260px. 
        So main content needs lg:ml-[260px] to not overlap.
      */}
      <main className="flex-1 flex flex-col min-w-0 lg:ml-[260px]">
        {/* Top Header - NOT fixed/sticky, it scrolls with page */}
        <header className="h-24 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg bg-white"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h1 className="text-[22px] font-semibold text-[#111] hidden sm:block">Executive Business Dashboard</h1>
          </div>

          <div className="flex items-center gap-4">
            <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-600 shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors">
              <Search size={18} />
            </button>
            
            <button 
              onClick={handleOpenNotifications}
              className="relative w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-600 shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-blue-500 border-2 border-white rounded-full"></span>
              )}
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-x-hidden px-8 pb-8">
          <Outlet />
        </div>
      </main>

      <NotificationSidebar 
        isOpen={isNotificationOpen} 
        onClose={() => setIsNotificationOpen(false)} 
        notifications={notifications} 
      />
    </div>
  );
}
