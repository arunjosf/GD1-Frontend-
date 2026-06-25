import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu } from 'lucide-react';
import AgentSidebar from './AgentSidebar';

export default function AgentLayout() {
  const { isAuthenticated } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f3f6fc] flex font-['Inter',sans-serif]">
      
      {/* Sidebar Component */}
      <AgentSidebar isMobileOpen={isSidebarOpen} setIsMobileOpen={setIsSidebarOpen} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 lg:ml-[260px]">
        {/* Top Header */}
        <header className="h-24 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg bg-white"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h1 className="text-[22px] font-semibold text-[#111] hidden sm:block">Agent Dashboard</h1>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto px-4 sm:px-8 pb-12">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
