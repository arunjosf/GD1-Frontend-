import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Wrench, ChevronRight } from 'lucide-react';

export default function AdminApplicationsPage() {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({ franchise: 0, serviceCenter: 0 });

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; AccessToken=`);
        const token = parts.length === 2 ? parts.pop().split(';').shift() : null;
        if (!token) return;

        const [franchiseRes, scRes] = await Promise.all([
          fetch('https://localhost:7108/api/admin/franchise/applications', { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => null),
          fetch('https://localhost:7108/api/admin/service-centers/applications', { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => null)
        ]);

        let fCount = 0;
        let scCount = 0;

        if (franchiseRes && franchiseRes.ok) {
          const result = await franchiseRes.json();
          fCount = (result.data || []).filter(app => app.status === 'Pending').length;
        }
        if (scRes && scRes.ok) {
          const result = await scRes.json();
          scCount = (result.data || []).filter(app => app.status === 'PendingReview' || app.status === 'Pending').length;
        }

        setCounts({ franchise: fCount, serviceCenter: scCount });
      } catch { /* ignore */ }
    };
    fetchCounts();
  }, []);

  return (
    <div className="w-full max-w-[1200px] mx-auto space-y-6 animate-fade-in pt-4 pb-10">
      <div>
        <h2 className="text-[28px] font-bold text-[#111]">Applications Overview</h2>
        <p className="text-gray-500 text-sm mt-1">Select an application category to review and manage submissions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        
        {/* Garage Partnership Card */}
        <div 
          onClick={() => navigate('/admin/applications/garage')}
          className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 cursor-pointer group transition-all duration-300 relative overflow-hidden flex flex-col"
        >
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform duration-300">
            <Building2 size={28} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">Garage Partnership Applications</h3>
          <p className="text-gray-500 text-sm mb-6 flex-1">Review applications from lot owners looking to partner their parking spaces with GD1.</p>
          
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-gray-900">{counts.franchise}</span>
              <span className="text-sm font-medium text-gray-500">Pending</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
              <ChevronRight size={20} />
            </div>
          </div>
        </div>

        {/* Service Center Card */}
        <div 
          onClick={() => navigate('/admin/applications/service-center')}
          className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 cursor-pointer group transition-all duration-300 relative overflow-hidden flex flex-col"
        >
          <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 mb-6 group-hover:scale-110 transition-transform duration-300">
            <Wrench size={28} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-500 transition-colors">Service Center Applications</h3>
          <p className="text-gray-500 text-sm mb-6 flex-1">Review applications from mechanics and garages looking to become certified GD1 service centers.</p>
          
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-gray-900">{counts.serviceCenter}</span>
              <span className="text-sm font-medium text-gray-500">Pending</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
              <ChevronRight size={20} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
