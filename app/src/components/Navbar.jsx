import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bell } from 'lucide-react';
import NotificationSidebar from './NotificationSidebar';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const { isAuthenticated, role } = useAuth();

  const handleOpenNotifications = () => {
    setIsNotificationOpen(true);
    setUnreadCount(0); // Immediately hide the count badge on the bell

    // Mark unread notifications as read in the backend so the count doesn't return on next fetch,
    // BUT do NOT update local state 'isRead: true' immediately, so the user can still see 
    // the blue dots on the new notifications while the bar is open!
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
            setNotifications(allNotifs);
            const unread = allNotifs.filter(n => !n.isRead).length;
            setUnreadCount(unread);
          }
        } catch { /* ignore */ }
      };
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  return (
    <nav className="fixed top-0 left-0 w-full z-[100]">
      {/* Expandable Glass Background */}
      <div 
        className={`absolute top-0 left-0 w-full bg-white/40 backdrop-blur-2xl border-b border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.05)] transition-all duration-300 -z-10 ${
          isHovered ? 'h-[120px]' : 'h-12'
        }`} 
      />

      <div className="w-full px-[6vw] h-12 flex items-center justify-between">
        
        {/* Logo / Brand */}
        <div className="flex-shrink-0 flex items-center relative z-[110]">
          <Link to="/" className="flex items-center outline-none">
            <img src="/GD1 Logo.png" alt="GD1 Logo" className="h-[24px] md:h-[27px] w-auto object-contain" />
          </Link>
        </div>  

        {/* Center Nav Links */}
        <div className="hidden md:flex items-center justify-center gap-9 absolute left-1/2 -translate-x-1/2">
          {['Home', 'About', 'Contact'].map((item) => (
            <Link 
              key={item} 
              to={`/${item.toLowerCase().replace(/ /g, '-')}`}
              className="text-[12px] font-medium tracking-wide text-gray-800 hover:text-black transition-colors no-underline"
            >
              {item}
            </Link>
          ))}

          {/* Dropdown for Partner With Us */}
          <div 
            className="relative h-full flex items-center"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <button className={`text-[12px] font-medium tracking-wide transition-colors no-underline py-4 outline-none ${isHovered ? 'text-[#111]' : 'text-gray-800 hover:text-black'}`}>
              Partner With Us
            </button>
            
            {/* Dropdown Menu */}
            <div className={`absolute top-12  left-0 w-[220px] transition-all duration-300 flex flex-col pt-1 pb-4 z-50 ${isHovered ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}>
              <Link to="/add-garage" className="py-1.5 text-[12px] font-medium text-[#111]/70 hover:text-[#111] transition-colors no-underline">
                Add your Garage
              </Link>
              <Link to="/add-service-center" className="py-1.5 text-[12px] font-medium text-[#111]/70 hover:text-[#111] transition-colors no-underline">
                Add your service center
              </Link>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="hidden md:flex items-center gap-5 flex-shrink-0">
          {isAuthenticated ? (
            <>
              <Link to="/profile" className="text-[12px] font-medium tracking-wide text-gray-800 hover:text-black transition-colors no-underline">
                Profile
              </Link>
              <Link to={role === 'LotOwner' ? "/lot-owner/vehicles" : "/my-vehicles"} className="text-[12px] font-medium tracking-wide text-gray-800 hover:text-black transition-colors no-underline">
                Vehicles
              </Link>
              <Link to="/my-bookings" className="text-[12px] font-medium tracking-wide text-gray-800 hover:text-black transition-colors no-underline">
                My Bookings
              </Link>
              <Link to="/messages" className="text-[12px] font-medium tracking-wide text-gray-800 hover:text-black transition-colors no-underline">
                Messages
              </Link>

                 <button onClick={handleOpenNotifications} className="relative text-gray-800 hover:text-black transition-colors outline-none cursor-pointer">
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-[#111] text-[8px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-[12px] font-medium tracking-wide text-gray-800 hover:text-black transition-colors no-underline">
                Log in
              </Link>
              <Link to="/register" className="bg-[#111] text-white text-[12px] font-medium tracking-wide px-4 py-1.5 rounded-full hover:bg-[#333] transition-colors no-underline">
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Mobile Actions (Bell + Hamburger) */}
        <div className="md:hidden flex items-center gap-5 z-[110]">
          {isAuthenticated && (
            <button onClick={handleOpenNotifications} className="relative text-gray-800 hover:text-black transition-colors outline-none cursor-pointer">
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-[#111] text-[8px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          )}
          <button 
            className="flex flex-col justify-center items-center w-8 h-8 space-y-1"
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className={`block w-5 h-0.5 bg-[#111] transition-transform duration-300 ${isOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
            <span className={`block w-5 h-0.5 bg-[#111] transition-opacity duration-300 ${isOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-[#111] transition-transform duration-300 ${isOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div className={`md:hidden fixed inset-0 z-[105] h-screen w-screen bg-white/95 backdrop-blur-3xl transition-all duration-500 flex flex-col pt-[120px] px-[6vw] ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="flex flex-col items-start gap-8">
          {['Home', 'About', 'Contact', 'Add your Garage', 'Add your service center'].map((item) => (
            <Link 
              key={item} 
              to={`/${item.toLowerCase().replace(/ /g, '-')}`}
              onClick={() => setIsOpen(false)}
              className="text-[15px] font-medium text-[#111] no-underline"
            >
              {item}
            </Link>
          ))}
          
          <div className="w-full" />

          {isAuthenticated ? (
            <>
              <Link to="/profile" onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-[15px] font-medium text-[#111] no-underline">
                Profile
              </Link>
              <Link to={role === 'LotOwner' ? "/lot-owner/vehicles" : "/my-vehicles"} onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-[15px] font-medium text-[#111] no-underline">
                Vehicles
              </Link>
              <Link to="/my-bookings" onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-[15px] font-medium text-[#111] no-underline">
                My Bookings
              </Link>
              <Link to="/messages" onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-[15px] font-medium text-[#111] no-underline">
                Messages
              </Link>
              
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setIsOpen(false)} className="text-[15px] font-medium text-[#111] no-underline">
                Log in
              </Link>
              <Link to="/register" onClick={() => setIsOpen(false)} className="bg-[#111] text-white text-[15px] font-medium px-7 py-2.5 rounded-full no-underline shadow-md w-fit">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
      {/* Notification Sidebar Component */}
      <NotificationSidebar 
        isOpen={isNotificationOpen} 
        onClose={() => setIsNotificationOpen(false)} 
        notifications={notifications} 
      />
    </nav>
  );
}
