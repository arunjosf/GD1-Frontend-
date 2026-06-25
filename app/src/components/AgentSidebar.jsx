import { NavLink } from 'react-router-dom';
import { LayoutDashboard, LogOut, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AgentSidebar({ isMobileOpen, setIsMobileOpen }) {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-screen w-[260px] bg-white border-r border-gray-100 flex flex-col z-50
        transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo Area */}
        <div className="h-24 px-8 flex items-center justify-between shrink-0">
          <span className="text-[22px] font-bold tracking-tight text-[#111]">GD1.</span>
          <button 
            className="lg:hidden text-gray-400 hover:text-gray-600"
            onClick={() => setIsMobileOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-4 mb-4">Menu</div>
          
          <NavLink 
            to="/agent/assignments" 
            end
            onClick={() => setIsMobileOpen(false)}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3.5 rounded-xl text-[15px] font-medium transition-all
              ${isActive 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                : 'text-gray-500 hover:text-[#111] hover:bg-gray-50'
              }
            `}
          >
            <LayoutDashboard size={20} strokeWidth={2.5} />
            My Assignments
          </NavLink>
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-100 space-y-1">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-[15px] font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut size={20} strokeWidth={2.5} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
