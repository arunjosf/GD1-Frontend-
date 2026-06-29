import { useState, useEffect } from 'react';
import { 
  Users, 
  Car, 
  Truck, 
  CheckCircle,
  Clock,
  AlertCircle,
  CalendarDays
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getToken } from '../../api/auth';
import { useNavigate } from 'react-router-dom';

export default function ManagerDashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const token = getToken('AccessToken');
      const res = await fetch('https://localhost:7108/api/lot-manager/dashboard-metrics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load metrics");
      const result = await res.json();
      setMetrics(result.data);
    } catch (err) {
      toast.error(err.message || "Error loading dashboard");
    } finally {
      setLoading(false);
    }
  };

  const getGraphData = () => {
    const fallbackDays = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
      fallbackDays.push({
        date: formattedDate,
        pickupsDone: 0,
        weeklySubmissionsDone: 0,
        onDemandImagesDone: 0
      });
    }

    if (!metrics?.performanceGraphData || metrics.performanceGraphData.length === 0) {
      return fallbackDays;
    }

    return metrics.performanceGraphData;
  };

  const graphData = getGraphData();
  const maxVal = Math.max(5, ...graphData.map(d => (d.pickupsDone || 0) + (d.weeklySubmissionsDone || 0) + (d.onDemandImagesDone || 0)));
  let roundedMax = Math.ceil(maxVal / 5) * 5;
  if (roundedMax === 0) roundedMax = 10;
  const ticks = [roundedMax, Math.round(roundedMax * 0.75), Math.round(roundedMax * 0.5), Math.round(roundedMax * 0.25), 0];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
         <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 animate-fade-in pb-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-[28px] font-black text-gray-900 tracking-tight">Manager Dashboard</h2>
          <p className="text-gray-500 text-sm mt-1">Overview of your property metrics and performance</p>
        </div>
      </div>

      {metrics?.isPropertyHidden && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <span className="text-red-600 font-black">!</span>
            </div>
            <div>
                <h4 className="text-red-800 font-bold">Property Hidden</h4>
                <p className="text-red-600 text-sm">This property is currently hidden by the administrator. It will not appear in search results for new vehicle owners.</p>
            </div>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm flex flex-col justify-between h-[130px] hover:shadow-md transition-shadow">
          <div>
            <h3 className="text-[13px] font-semibold text-gray-500 uppercase tracking-wider">Total Vehicles</h3>
            <h2 className="text-[28px] font-bold text-gray-900 mt-4 leading-none">{metrics?.totalVehicles || 0}</h2>
          </div>
          <p className="text-xs text-gray-400 font-medium">Currently inside the lots</p>
        </div>
        
        <div 
          onClick={() => navigate('/lot-manager/pickups')}
          className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm flex flex-col justify-between h-[130px] cursor-pointer hover:shadow-md transition-shadow"
        >
          <div>
            <h3 className="text-[13px] font-semibold text-gray-500 uppercase tracking-wider">Pending Pickups</h3>
            <h2 className="text-[28px] font-bold text-gray-900 mt-4 leading-none">{metrics?.pendingPickupsCount || 0}</h2>
          </div>
          <p className="text-xs text-gray-400 font-medium">Awaiting manager handoff</p>
        </div>

        <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm flex flex-col justify-between h-[130px] hover:shadow-md transition-shadow">
          <div>
            <h3 className="text-[13px] font-semibold text-gray-500 uppercase tracking-wider">Upcoming Services</h3>
            <h2 className="text-[28px] font-bold text-gray-900 mt-4 leading-none">{metrics?.upcomingServicesCount || 0}</h2>
          </div>
          <p className="text-xs text-gray-400 font-medium">Scheduled services</p>
        </div>

        <div 
          onClick={() => navigate('/lot-manager/tasks')}
          className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm flex flex-col justify-between h-[130px] cursor-pointer hover:shadow-md transition-shadow"
        >
          <div>
            <h3 className="text-[13px] font-semibold text-gray-500 uppercase tracking-wider">Weekly Checks</h3>
            <h2 className="text-[28px] font-bold text-gray-900 mt-4 leading-none">{metrics?.pendingWeeklyCount || 0}</h2>
          </div>
          <p className="text-xs text-gray-400 font-medium">Routine walkthrough reports</p>
        </div>

        <div 
          onClick={() => navigate('/lot-manager/tasks')}
          className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm flex flex-col justify-between h-[130px] cursor-pointer hover:shadow-md transition-shadow"
        >
          <div>
            <h3 className="text-[13px] font-semibold text-gray-500 uppercase tracking-wider">OnDemand Tasks</h3>
            <h2 className="text-[28px] font-bold text-gray-900 mt-4 leading-none">{metrics?.pendingOnDemandCount || 0}</h2>
          </div>
          <p className="text-xs text-gray-400 font-medium">Image requests by customers</p>
        </div>
      </div>

      {/* Performance Graph */}
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm mb-8 flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h3 className="text-gray-500 text-sm font-medium mb-1">Performance Overview</h3>
            <h2 className="text-[24px] font-bold text-gray-900">Last 7 Days</h2>
          </div>
          
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-gray-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span>Pickups</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Weekly Checks</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>OnDemand Tasks</span>
            </div>
          </div>
        </div>

        {/* Chart Grid */}
        <div className="relative h-72 w-full flex mt-2">
          {/* Y-Axis Labels */}
          <div className="flex flex-col justify-between h-[240px] text-xs text-gray-400 pb-2 pr-4 select-none w-8">
            {ticks.map((tick, i) => (
              <span key={i} className="text-right">{tick}</span>
            ))}
          </div>

          {/* Grid and Bars Area */}
          <div className="flex-1 h-full relative flex flex-col justify-between">
            {/* Horizontal Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between h-[240px] pointer-events-none">
              {ticks.map((_, i) => (
                <div key={i} className="border-b border-gray-100 w-full h-0"></div>
              ))}
            </div>

            {/* Bars Container */}
            <div className="absolute inset-0 flex items-end justify-between h-[240px] z-10 px-4">
              {graphData.map((data, index) => {
                const pickups = data.pickupsDone || 0;
                const weekly = data.weeklySubmissionsDone || 0;
                const ondemand = data.onDemandImagesDone || 0;
                const total = pickups + weekly + ondemand;
                const heightPct = (total / roundedMax) * 100;

                return (
                  <div key={index} className="flex-1 flex flex-col items-center justify-end h-full relative group px-1 sm:px-2 md:px-4">
                    {/* Tooltip */}
                    <div className="absolute -top-24 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-900 text-white text-xs p-3 rounded-xl whitespace-nowrap shadow-xl z-20 pointer-events-none select-none flex flex-col gap-1">
                      <p className="font-bold border-b border-gray-800 pb-1 mb-1">{data.date}</p>
                      <p className="flex justify-between gap-6">
                        <span className="text-gray-400">Pickups:</span> 
                        <span className="font-bold text-blue-400">{pickups}</span>
                      </p>
                      <p className="flex justify-between gap-6">
                        <span className="text-gray-400">Weekly Checks:</span> 
                        <span className="font-bold text-emerald-400">{weekly}</span>
                      </p>
                      <p className="flex justify-between gap-6">
                        <span className="text-gray-400">OnDemand Tasks:</span> 
                        <span className="font-bold text-amber-400">{ondemand}</span>
                      </p>
                      <p className="flex justify-between gap-6 border-t border-gray-800 pt-1 mt-1 font-bold">
                        <span>Total:</span> 
                        <span>{total}</span>
                      </p>
                    </div>

                    {/* Stacking / Single Bar */}
                    <div 
                      className={`w-full max-w-[28px] rounded-t-lg transition-all duration-300 hover:scale-x-105 relative ${
                        total > 0 
                          ? 'bg-gradient-to-t from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500' 
                          : 'bg-gray-100 border-t border-gray-200 h-[4px]'
                      }`}
                      style={total > 0 ? { height: `${Math.max(4, heightPct)}%` } : {}}
                    >
                    </div>
                  </div>
                );
              })}
            </div>

            {/* X-Axis Labels Row */}
            <div className="absolute bottom-0 left-0 right-0 h-6 flex justify-between px-4 z-10">
              {graphData.map((data, index) => (
                <span key={index} className="flex-1 text-center text-xs text-gray-400 font-semibold truncate pt-2">
                  {data.date}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
