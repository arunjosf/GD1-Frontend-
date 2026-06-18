import { useState, useEffect } from 'react';
import { getToken } from '../api/auth';
import { 
  ArrowUpRight, 
  TrendingUp,
  Building2,
  MapPin,
  IndianRupee,
  Calendar,
  Wrench,
  Users
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Chart toggles
  const [timeframe, setTimeframe] = useState('Monthly');
  const [earningsType, setEarningsType] = useState('Garage Earnings');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = getToken('AccessToken');
        if (!token) return;

        const res = await fetch('https://localhost:7108/api/admin/dashboard/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const result = await res.json();
          const data = result.data || result;
          setStats(data);
        } else {
          console.error('[AdminDashboard] API error:', res.status);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // --- Dynamic Graph Data Setup ---
  const chartLabels = timeframe === 'Monthly' 
    ? (stats?.monthlyStats?.map(s => s.month) || [])
    : (stats?.yearlyStats?.map(s => s.year) || []);
    
  const chartDataPoints = timeframe === 'Monthly'
    ? (stats?.monthlyStats?.map(s => earningsType === 'Garage Earnings' ? s.garageRevenue : s.serviceRevenue) || [])
    : (stats?.yearlyStats?.map(s => earningsType === 'Garage Earnings' ? s.garageRevenue : s.serviceRevenue) || []);

  const lineData = {
    labels: chartLabels,
    datasets: [
      {
        label: earningsType,
        data: chartDataPoints,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
      }
    ]
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#fff',
        titleColor: '#111',
        bodyColor: '#666',
        borderColor: '#f3f4f6',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context) => `â‚¹${context.parsed.y.toLocaleString('en-IN')}`
        }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#9ca3af' }, border: { display: false } },
      y: { 
        grid: { color: '#f3f4f6', drawBorder: false }, 
        ticks: { font: { size: 11 }, color: '#9ca3af', callback: (value) => `â‚¹${value / 1000}k` },
        border: { display: false }
      }
    },
    interaction: { intersect: false, mode: 'index' }
  };

  // --- Helpers ---
  const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
  const formatNumber = (val) => new Intl.NumberFormat('en-IN').format(val || 0);

  const topGarage = stats?.topGarages?.[0];
  const topServiceCenter = stats?.topServiceCenters?.[0];

  return (
    <div className="space-y-6">

      {/* TOP ROW: 5 Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <TopMetricCard 
          title="Total Garage Bookings" 
          value={formatNumber(stats?.totalBookings)} 
          icon={<Calendar size={18} className="text-blue-500" />}
          color="#3b82f6"
        />
        <TopMetricCard 
          title="Total Service Bookings" 
          value={formatNumber(stats?.totalServiceBookings)} 
          icon={<Wrench size={18} className="text-purple-500" />}
          color="#8b5cf6"
        />
        <TopMetricCard 
          title="Total Users" 
          value={formatNumber(stats?.totalUsers)} 
          icon={<Users size={18} className="text-pink-500" />}
          color="#ec4899"
        />
        <TopMetricCard 
          title="Total Revenue" 
          value={formatCurrency(stats?.totalRevenue)} 
          icon={<IndianRupee size={18} className="text-orange-500" />}
          color="#f97316"
        />
        <TopMetricCard 
          title="Net Profit" 
          value={formatCurrency(stats?.netProfit)} 
          icon={<TrendingUp size={18} className="text-green-500" />}
          color="#22c55e"
        />
      </div>

      {/* MIDDLE ROW: Main Graph + Top Single Entities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Line Chart (Total Growth) */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 lg:col-span-2 flex flex-col relative min-h-[400px]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h3 className="text-gray-500 text-sm font-medium mb-1">Total Growth</h3>
              <div className="flex items-baseline gap-3">
                <h2 className="text-[28px] font-bold text-[#111]">
                  {formatCurrency(chartDataPoints.reduce((a, b) => a + b, 0))}
                </h2>
              </div>
            </div>
            <div className="flex gap-2">
              <select 
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="bg-gray-50 border border-gray-100 text-xs font-medium text-gray-600 rounded-lg px-3 py-2 outline-none cursor-pointer focus:ring-2 focus:ring-blue-100 transition-shadow"
              >
                <option value="Monthly">Monthly</option>
                <option value="Yearly">Yearly</option>
              </select>
              <select 
                value={earningsType}
                onChange={(e) => setEarningsType(e.target.value)}
                className="bg-gray-50 border border-gray-100 text-xs font-medium text-gray-600 rounded-lg px-3 py-2 outline-none cursor-pointer focus:ring-2 focus:ring-blue-100 transition-shadow"
              >
                <option value="Garage Earnings">Garage Earnings</option>
                <option value="Service Center Earnings">Service Center Earnings</option>
              </select>
            </div>
          </div>
          <div className="flex-1 w-full mt-4">
            <Line data={lineData} options={lineOptions} />
          </div>
        </div>

        {/* Top Entities Column */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          {/* Top Garage Card */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex-1 flex flex-col justify-center relative group overflow-hidden">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-50 rounded-full blur-2xl opacity-60"></div>
            <h3 className="text-gray-500 text-sm font-medium mb-4 flex items-center gap-2">
              <Building2 size={16} className="text-blue-500" />
              Top Bookings Garage
            </h3>
            {topGarage ? (
              <>
                <h2 className="text-[22px] font-bold text-[#111] mb-2 leading-tight">{topGarage.name}</h2>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-6">
                  <MapPin size={12} className="shrink-0" />
                  <span className="truncate">{topGarage.location}</span>
                </div>
                <div className="flex items-end justify-between mt-auto">
                  <div>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-1">Bookings</p>
                    <p className="text-xl font-bold text-blue-600">{formatNumber(topGarage.totalBookings)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-1">Revenue</p>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(topGarage.totalRevenue)}</p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-gray-400 text-sm mt-2">No garage data available.</p>
            )}
          </div>

          {/* Top Service Center Card */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex-1 flex flex-col justify-center relative group overflow-hidden">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-50 rounded-full blur-2xl opacity-60"></div>
            <h3 className="text-gray-500 text-sm font-medium mb-4 flex items-center gap-2">
              <Wrench size={16} className="text-purple-500" />
              Top Booked Service Center
            </h3>
            {topServiceCenter ? (
              <>
                <h2 className="text-[22px] font-bold text-[#111] mb-2 leading-tight">{topServiceCenter.name}</h2>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-6">
                  <MapPin size={12} className="shrink-0" />
                  <span className="truncate">{topServiceCenter.location}</span>
                </div>
                <div className="flex items-end justify-between mt-auto">
                  <div>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-1">Services</p>
                    <p className="text-xl font-bold text-purple-600">{formatNumber(topServiceCenter.totalServiceBookings)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-1">Revenue</p>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(topServiceCenter.totalRevenue)}</p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-gray-400 text-sm mt-2">No service center data available.</p>
            )}
          </div>
        </div>

      </div>

      {/* BOTTOM ROW: Top 5 Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top 5 Garages List */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-[#111] text-lg">Top 5 Booking Garages</h3>
            <button className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">View All</button>
          </div>
          <div className="flex flex-col gap-4">
            {stats?.topGarages?.slice(0, 5).map((garage, i) => (
              <div key={garage.propertyId} className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    #{i + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">{garage.name}</h4>
                    <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-0.5">
                      <MapPin size={10} />
                      <span className="truncate max-w-[150px] sm:max-w-[200px]">{garage.location}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-sm text-gray-900">{formatNumber(garage.totalBookings)}</p>
                  <p className="text-[10px] text-gray-400 font-medium uppercase mt-0.5">Bookings</p>
                </div>
              </div>
            ))}
            {(!stats?.topGarages || stats.topGarages.length === 0) && (
              <div className="text-center py-8 text-gray-400 text-sm">No garage records found.</div>
            )}
          </div>
        </div>

        {/* Top 5 Service Centers List */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-[#111] text-lg">Top 5 Booking Service Centers</h3>
            <button className="text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors">View All</button>
          </div>
          <div className="flex flex-col gap-4">
            {stats?.topServiceCenters?.slice(0, 5).map((sc, i) => (
              <div key={sc.serviceCenterId} className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    #{i + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm group-hover:text-purple-600 transition-colors">{sc.name}</h4>
                    <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-0.5">
                      <MapPin size={10} />
                      <span className="truncate max-w-[150px] sm:max-w-[200px]">{sc.location}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-sm text-gray-900">{formatNumber(sc.totalServiceBookings)}</p>
                  <p className="text-[10px] text-gray-400 font-medium uppercase mt-0.5">Services</p>
                </div>
              </div>
            ))}
            {(!stats?.topServiceCenters || stats.topServiceCenters.length === 0) && (
              <div className="text-center py-8 text-gray-400 text-sm">No service center records found.</div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

// Top Metric Card
function TopMetricCard({ title, value, icon, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative group flex flex-col justify-between overflow-hidden">
      <div 
        className="absolute -right-4 -top-4 w-16 h-16 rounded-full blur-2xl opacity-20 transition-opacity group-hover:opacity-40"
        style={{ backgroundColor: color }}
      ></div>
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          {icon}
        </div>
        <button className="w-6 h-6 rounded border border-gray-100 flex items-center justify-center text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-colors">
          <ArrowUpRight size={14} />
        </button>
      </div>

      <div className="relative z-10">
        <h2 className="text-[22px] font-bold text-[#111] leading-none mb-1.5">{value}</h2>
        <h3 className="text-xs font-medium text-gray-500">{title}</h3>
      </div>
    </div>
  );
}
