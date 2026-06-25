import { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, ArrowUpRight, User, Award, CalendarDays, BarChart2 } from 'lucide-react';
import { getToken } from '../../api/auth';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { toast } from 'react-hot-toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Filler
);

export default function LotOwnerDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [graphType, setGraphType] = useState('Monthly'); // 'Monthly' or 'Yearly'

  const welcomeShown = useRef(false);

  useEffect(() => {
    fetchMetrics();

    // Show once-only welcome toast after garage application acceptance
    if (!welcomeShown.current && localStorage.getItem('gd1_newly_partnered') === 'true') {
      welcomeShown.current = true;
      localStorage.removeItem('gd1_newly_partnered');
      setTimeout(() => {
        toast.success(
          '🎉 Congratulations! Your garage application was accepted. Welcome to GD1 as a Lot Owner!',
          {
            duration: 7000,
            style: {
              background: 'linear-gradient(135deg, #1a3d2b, #16a34a)',
              color: '#fff',
              fontWeight: '600',
              fontSize: '14px',
              borderRadius: '12px',
              padding: '16px 20px',
              maxWidth: '420px',
            },
            iconTheme: { primary: '#fbbf24', secondary: '#1a3d2b' },
          }
        );
      }, 800);
    }
  }, []);

  const fetchMetrics = async () => {
    try {
      const token = getToken('AccessToken');
      const res = await fetch('https://localhost:7108/api/lot-owner/dashboard/metrics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load metrics");
      const result = await res.json();
      setStats(result.data);
    } catch (err) {
      toast.error(err.message || "Error loading dashboard");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    if (!val) return '$0';
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
    return `$${val}`;
  };

  const formatNumber = (val) => {
    if (!val) return '0';
    if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
    return val.toString();
  };

  if (loading || !stats) {
    return <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center min-h-[50vh]">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      Loading dashboard...
    </div>;
  }

  // Main Line Chart Options
  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'white',
        titleColor: '#111',
        bodyColor: '#666',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context) => `${context.parsed.y} bookings`
        }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#9ca3af', font: { size: 11 } } },
      y: { grid: { color: '#f3f4f6', drawBorder: false }, ticks: { color: '#9ca3af', font: { size: 11 }, maxTicksLimit: 5, stepSize: 1 } }
    },
    elements: {
      line: { tension: 0.4 },
      point: { radius: 0, hitRadius: 10, hoverRadius: 6 }
    }
  };

  const lineData = {
    labels: graphType === 'Monthly' 
      ? stats.monthlyBookings?.map(m => m.month) || []
      : stats.yearlyBookings?.map(y => y.year) || [],
    datasets: [{
      label: 'Bookings',
      data: graphType === 'Monthly'
        ? stats.monthlyBookings?.map(m => m.bookingsCount) || []
        : stats.yearlyBookings?.map(y => y.bookingsCount) || [],
      borderColor: '#3b82f6',
      borderWidth: 2,
      fill: false,
    }]
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 animate-fade-in pt-4">
      
      {/* TOP METRICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <TopMetricCard 
          title="Total Bookings" 
          value={formatNumber(stats.totalBookings)} 
          trend="" 
          subtitle="All time properties bookings" 
          chartData={[10, 25, 40, 20, 50, 80, 60]} 
        />
        <TopMetricCard 
          title="Total Revenue" 
          value={formatCurrency(stats.totalRevenue)} 
          trend="" 
          subtitle="Gross revenue collected" 
          chartData={[20, 30, 20, 40, 60, 50, 90]} 
        />
        <TopMetricCard 
          title="Net Profit" 
          value={formatCurrency(stats.netProfit)} 
          trend="" 
          subtitle="Your lot earnings" 
          chartData={[30, 40, 30, 50, 70, 60, 100]} 
        />
        <TopMetricCard 
          title="Customer Retention" 
          value={`${stats.customerRetentionRate}%`} 
          trend="" 
          subtitle="Repeating customers" 
          chartData={[80, 60, 70, 50, 40, 30, 20]} 
          color="#3b82f6"
        />
      </div>

      {/* MIDDLE ROW: Main Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Main Line Chart */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 xl:col-span-2 flex flex-col relative min-h-[350px]">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-gray-500 text-sm font-medium mb-1">Total Bookings</h3>
            </div>
            <div className="flex gap-2">
              <select 
                className="bg-gray-50 border border-gray-100 text-xs font-medium text-gray-600 rounded-lg px-3 py-1.5 outline-none cursor-pointer"
                value={graphType}
                onChange={(e) => setGraphType(e.target.value)}
              >
                <option value="Monthly">Monthly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>
          </div>
          <div className="flex-1 min-h-[250px]">
            <Line options={lineOptions} data={lineData} />
          </div>
        </div>

        {/* Best Performed Manager */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col relative">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-gray-500 text-sm font-medium">Best Performed Manager</h3>
            <Award className="text-blue-500 w-5 h-5" />
          </div>
          {stats.bestPerformedManager ? (
            <div className="flex flex-col flex-1">
              <div className="flex items-center gap-4 mb-6">
                {stats.bestPerformedManager.avatarUrl ? (
                  <img src={stats.bestPerformedManager.avatarUrl} alt="Manager Avatar" className="w-16 h-16 rounded-full object-cover shadow-sm border border-gray-100" />
                ) : (
                  <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
                    <User size={28} />
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold text-[#111] leading-tight">{stats.bestPerformedManager.name}</h2>
                  <p className="text-xs text-gray-500">Top Performer</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Pickups Done</span>
                  <span className="font-bold text-[#111]">{stats.bestPerformedManager.pickupsDone}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min(100, stats.bestPerformedManager.pickupsDone * 5)}%` }}></div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Weekly Submissions</span>
                  <span className="font-bold text-[#111]">{stats.bestPerformedManager.weeklySubmissionsDone}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: `${Math.min(100, stats.bestPerformedManager.weeklySubmissionsDone * 5)}%` }}></div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">On-Demand Images</span>
                  <span className="font-bold text-[#111]">{stats.bestPerformedManager.onDemandSubmissionsDone}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${Math.min(100, stats.bestPerformedManager.onDemandSubmissionsDone * 5)}%` }}></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-center">
              <p className="text-sm text-gray-400">No manager data available</p>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Most Days Stored Vehicle */}
        <div className="rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between relative lg:col-span-1 h-full group overflow-hidden cursor-pointer hover:shadow-md transition-all p-6 min-h-[220px]">
          {/* Background Image */}
          {stats.mostDaysStoredVehicle?.imageUrl ? (
            <div className="absolute inset-0 z-0">
              <img src={stats.mostDaysStoredVehicle.imageUrl} alt="Vehicle" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent"></div>
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-gray-900 z-0"></div>
          )}
          
          <div className="z-10 relative h-full flex flex-col justify-end w-full">
             <h3 className="text-gray-300 text-xs font-medium mb-1">Most Stored Vehicle</h3>
             <h2 className="text-[28px] font-bold text-white mb-0.5 leading-tight">{stats.mostDaysStoredVehicle?.daysStored || 0} Days</h2>
             <p className="text-[13px] text-gray-200 font-medium">{stats.mostDaysStoredVehicle?.brand} {stats.mostDaysStoredVehicle?.model}</p>
             <p className="text-[11px] text-gray-400">{stats.mostDaysStoredVehicle?.registrationNo}</p>
          </div>
        </div>

        {/* 4 Cards Grid */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-6 h-full">
            {/* Best Year */}
            <SmallStatCard 
              title="Best Year" 
              value={stats.bestYear || "N/A"} 
              subtitle="Highest bookings" 
            />
            
            {/* Slowest Year */}
            <SmallStatCard 
              title="Slowest Year" 
              value={stats.slowestYear || "N/A"} 
              subtitle="Lowest bookings" 
            />
            
            {/* Best Month */}
            <SmallStatCard 
              title="Best Month" 
              value={stats.bestMonth || "N/A"} 
              subtitle="Highest bookings" 
            />
            
            {/* Slowest Month */}
            <SmallStatCard 
              title="Slowest Month" 
              value={stats.slowestMonth || "N/A"} 
              subtitle="Lowest bookings" 
            />
        </div>
      </div>
    </div>
  );
}

// Sparkline component
function SparklineBar({ data, color = '#3b82f6' }) {
  if (!data || !data.length) return null;
  const max = Math.max(...data);
  return (
    <div className="flex items-end h-full gap-[3px] w-full">
      {data.map((val, i) => (
        <div 
          key={i} 
          className="flex-1 rounded-t-sm" 
          style={{ height: `${(val / max) * 100}%`, backgroundColor: color, opacity: i === data.length - 1 ? 1 : 0.3 }}
        />
      ))}
    </div>
  );
}

// Top Metric Card
function TopMetricCard({ title, value, trend, subtitle, chartData, isNegative, color = '#3b82f6' }) {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative group overflow-hidden">
      <button className="absolute top-4 right-4 w-6 h-6 rounded border border-gray-100 flex items-center justify-center text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50 z-10 bg-white">
        <ArrowUpRight size={14} />
      </button>
      
      <div>
        <h3 className="text-[13px] font-medium text-[#111] mb-2">{title}</h3>
        <div className="flex items-end gap-3 mt-4">
          <h2 className="text-[26px] font-bold text-[#111] leading-none">{value}</h2>
        </div>
        <p className="text-[10px] text-gray-400 font-medium mt-3 max-w-[120px] leading-snug">{subtitle}</p>
      </div>

      <div className="absolute right-4 bottom-5 flex flex-col items-end gap-2">
        {trend && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${isNegative ? 'text-red-500 bg-red-50' : 'text-green-500 bg-green-50'}`}>
            {isNegative ? <TrendingDown size={10} /> : <TrendingUp size={10} />}
            {trend}
          </span>
        )}
        <div className="w-[60px] h-[30px]">
          <SparklineBar data={chartData} color={color} />
        </div>
      </div>
    </div>
  );
}

// Small Stat Card
function SmallStatCard({ title, value, subtitle }) {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative group flex flex-col justify-center min-h-[140px]">
      <button className="absolute top-4 right-4 w-6 h-6 rounded border border-gray-100 flex items-center justify-center text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50">
        <ArrowUpRight size={14} />
      </button>
      <h3 className="text-gray-500 text-xs font-medium mb-2">{title}</h3>
      <h2 className="text-[22px] font-bold text-[#111] mb-1 leading-tight">{value}</h2>
      <p className="text-[11px] text-gray-400">{subtitle}</p>
    </div>
  );
}
