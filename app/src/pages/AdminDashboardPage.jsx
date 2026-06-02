import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
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
import { Line, Bar, Doughnut } from 'react-chartjs-2';

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

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; AccessToken=`);
        const token = parts.length === 2 ? parts.pop().split(';').shift() : null;
        if (!token) throw new Error("No token found");

        const res = await fetch('https://localhost:7108/api/admin/dashboard/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to fetch dashboard stats");
        const data = await res.json();
        setStats(data.data);
      } catch (err) {
        toast.error(err.message || 'Could not load dashboard stats.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-[calc(100vh-80px)]">
        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!stats) return <div className="p-10 text-center text-gray-500">Failed to load data.</div>;

  const formatCurrency = (val) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
    return `$${val}`;
  };

  const formatNumber = (val) => {
    if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
    return val.toString();
  };

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
          label: (context) => `${context.parsed.y} (+7.1% vs prev)`
        }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#9ca3af', font: { size: 11 } } },
      y: { grid: { color: '#f3f4f6', drawBorder: false }, ticks: { color: '#9ca3af', font: { size: 11 }, maxTicksLimit: 5 } }
    },
    elements: {
      line: { tension: 0.4 },
      point: { radius: 0, hitRadius: 10, hoverRadius: 6 }
    }
  };

  // Generate smooth data for main line chart
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const lineData = {
    labels: months,
    datasets: [{
      label: 'Sales',
      data: [3200, 4100, 2900, 5200, 3484, 6100, 4800, 7200, 5400, 8100, 6800, 5900],
      borderColor: '#3b82f6',
      borderWidth: 2,
      fill: false,
    }]
  };

  // Bar Chart Options
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { color: '#9ca3af', font: { size: 11 } } },
      y: { display: false }
    },
    elements: {
      bar: { borderRadius: 12, borderSkipped: false }
    }
  };

  const barData = {
    labels: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5'],
    datasets: [{
      data: [12000, 10500, 18944, 11000, 13000],
      backgroundColor: (context) => {
        const index = context.dataIndex;
        return index === 2 ? '#3b82f6' : '#e0e7ff';
      },
      barThickness: 40
    }]
  };

  // Doughnut Chart Options
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: { legend: { display: false } },
  };

  const doughnutData = {
    labels: ['SmartWatch Pro', 'Others'],
    datasets: [{
      data: [70, 30],
      backgroundColor: ['#3b82f6', '#e5e7eb'],
      borderWidth: 0,
      hoverOffset: 4
    }]
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 animate-fade-in pt-4">
      
      {/* TOP METRICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <TopMetricCard 
          title="Total Sales" 
          value={formatNumber(stats.totalBookings || 132500)} 
          trend="+8.3%" 
          subtitle="Up 8.3% compared to last year" 
          chartData={[10, 25, 40, 20, 50, 80, 60]} 
        />
        <TopMetricCard 
          title="Total Revenue" 
          value={formatCurrency(stats.totalRevenue || 52800000)} 
          trend="+8.3%" 
          subtitle="Steady increase in Q3 and Q4" 
          chartData={[20, 30, 20, 40, 60, 50, 90]} 
        />
        <TopMetricCard 
          title="Net Profit" 
          value={formatCurrency(stats.netProfit || 18600000)} 
          trend="+8.3%" 
          subtitle="Average profit margin is 35%" 
          chartData={[30, 40, 30, 50, 70, 60, 100]} 
        />
        <TopMetricCard 
          title="Customer Retention" 
          value="72%" 
          trend="-8.3%" 
          isNegative
          subtitle="Retention improved by 4% from last year" 
          chartData={[80, 60, 70, 50, 40, 30, 20]} 
          color="#ef4444"
        />
        <TopMetricCard 
          title="SmartWatch Pro Sales" 
          value="32K" 
          trend="+8.3%" 
          subtitle="Contributes 24% of total sales" 
          chartData={[10, 20, 15, 30, 25, 40, 50]} 
        />
      </div>

      {/* MIDDLE ROW: Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Line Chart */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 lg:col-span-2 flex flex-col relative">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-gray-500 text-sm font-medium mb-1">Total Sales</h3>
              <div className="flex items-baseline gap-3">
                <h2 className="text-[32px] font-bold text-[#111]">8,944</h2>
                <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                  +2.1%
                </span>
                <span className="text-xs text-gray-400 font-medium ml-1">vs last month</span>
              </div>
            </div>
            <div className="flex gap-2">
              <select className="bg-gray-50 border border-gray-100 text-xs font-medium text-gray-600 rounded-lg px-3 py-1.5 outline-none cursor-pointer">
                <option>Monthly</option>
              </select>
              <select className="bg-gray-50 border border-gray-100 text-xs font-medium text-gray-600 rounded-lg px-3 py-1.5 outline-none cursor-pointer">
                <option>All Products</option>
              </select>
            </div>
          </div>
          <div className="flex-1 min-h-[250px] w-full mt-4">
            <Line data={lineData} options={lineOptions} />
          </div>
        </div>

        {/* Quarterly Growth Bar Chart */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col relative">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-gray-500 text-sm font-medium mb-1">Quarterly Growth</h3>
              <div className="flex items-baseline gap-3">
                <h2 className="text-[28px] font-bold text-[#111]">18,944</h2>
                <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                  +2.1%
                </span>
                <span className="text-[10px] text-gray-400 font-medium ml-1">vs last Quarter</span>
              </div>
            </div>
            <select className="bg-white border-none text-xs font-medium text-gray-500 outline-none cursor-pointer">
              <option>All Products</option>
            </select>
          </div>
          <div className="flex-1 min-h-[200px] w-full mt-auto">
            <Bar data={barData} options={barOptions} />
          </div>
        </div>

      </div>

      {/* BOTTOM ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Doughnut Chart */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 relative flex flex-col">
          <div className="flex justify-between items-start mb-8">
            <h3 className="text-gray-500 text-sm font-medium">Top Products by Revenue</h3>
            <button className="w-6 h-6 rounded border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors">
              <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-between">
            <div className="w-[180px] h-[180px] relative">
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm font-medium text-gray-700">SmartWatch Pro</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-200"></div>
                <span className="text-sm font-medium text-gray-500">Others</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2x2 Small Grid */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-6">
          <SmallStatCard title="Best Month" value="15,800 sales" subtitle="July" />
          <SmallStatCard title="Slowest Month" value="7,200 sales" subtitle="Feb" />
          <SmallStatCard title="Male Customers" value="54%" subtitle="44% Female, 2% Other" />
          <SmallStatCard title="Dominant Age Group" value="26-35" subtitle="38% of customer base" />
        </div>

      </div>

    </div>
  );
}

// Sparkline Bar Component using Chart.js
function SparklineBar({ data, color = '#3b82f6' }) {
  const chartData = {
    labels: data.map((_, i) => i),
    datasets: [{
      data: data,
      backgroundColor: data.map((val, i) => i === data.length - 1 ? color : '#f3f4f6'),
      barThickness: 3,
      borderRadius: 4
    }]
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: { x: { display: false }, y: { display: false, min: 0 } },
    animation: false
  };
  return <Bar data={chartData} options={options} />;
}

// Top Metric Card
function TopMetricCard({ title, value, trend, subtitle, chartData, color = '#3b82f6', isNegative = false }) {
  return (
    <div className="bg-white rounded-[20px] p-5 shadow-sm border border-gray-100 relative group flex flex-col h-[160px] justify-between">
      <button className="absolute top-4 right-4 w-6 h-6 rounded border border-gray-100 flex items-center justify-center text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50">
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
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${isNegative ? 'text-red-500 bg-red-50' : 'text-green-500 bg-green-50'}`}>
          {isNegative ? <TrendingDown size={10} /> : <TrendingUp size={10} />}
          {trend}
        </span>
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
    <div className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100 relative group flex flex-col justify-center">
      <button className="absolute top-4 right-4 w-6 h-6 rounded border border-gray-100 flex items-center justify-center text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50">
        <ArrowUpRight size={14} />
      </button>
      <h3 className="text-gray-500 text-sm font-medium mb-3">{title}</h3>
      <h2 className="text-[22px] font-bold text-[#111] mb-1">{value}</h2>
      <p className="text-xs text-gray-400">{subtitle}</p>
    </div>
  );
}
