import { useState, useEffect } from 'react';
import { ClipboardList, Clock, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getToken } from '../../api/auth';
import { useNavigate } from 'react-router-dom';

export default function ManagerTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const token = getToken('AccessToken');
      const res = await fetch(`https://gd1-grand-auto-depot-one-9ms1.onrender.com/api/lot-manager/pending-maintenance-tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const result = await res.json();
      setTasks(result.data || []);
    } catch (err) {
      toast.error(err.message || "Error loading tasks");
    } finally {
      setLoading(false);
    }
  };

  const getTaskInfo = (type) => {
    if (type === 1 || type === 'WeeklyConditionCheck') return { title: 'Weekly Condition Check', color: 'bg-blue-50 text-blue-700', path: 'weekly' };
    if (type === 0 || type === 'OnDemandImage') return { title: 'On-Demand Image Request', color: 'bg-yellow-50 text-yellow-700', path: 'ondemand' };
    if (type === 2 || type === 'AfterServiceCondition') return { title: 'After Service Condition', color: 'bg-green-50 text-green-700', path: 'afterservice' };
    return { title: 'Unknown Task', color: 'bg-gray-50 text-gray-700', path: '' };
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-[28px] font-black text-gray-900 tracking-tight">Maintenance Tasks</h2>
          <p className="text-gray-500 text-sm mt-1">Pending weekly checks, on-demand image requests, and post-service condition reports.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
          <ClipboardList size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-bold text-gray-900">No pending tasks</h3>
          <p className="text-gray-500 text-sm mt-2">You have completed all your maintenance tasks. Great job!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => {
            const info = getTaskInfo(task.type);
            const formattedUrl = task.imageUrl?.startsWith('/') ? task.imageUrl : `/${task.imageUrl}`;
            const displayImage = task.imageUrl ? (task.imageUrl.startsWith('http') ? task.imageUrl : `https://gd1-grand-auto-depot-one-9ms1.onrender.com${formattedUrl}`) : null;
            return (
              <div key={task.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col gap-4">
                  {displayImage ? (
                    <img src={displayImage} alt={`${task.brand} ${task.model}`} className="w-full h-48 rounded-xl object-cover border border-gray-100 shadow-sm" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                  ) : null}
                  <div className={`w-full h-48 rounded-xl items-center justify-center ${info.color}`} style={{ display: displayImage ? 'none' : 'flex' }}>
                    <ClipboardList size={40} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-1">{info.title}</h4>
                    <p className="text-sm font-semibold text-gray-500">
                      Vehicle: <span className="text-gray-900">{task.brand} {task.model} ({task.registrationNo})</span>
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col gap-3 pt-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg">
                    <Clock size={16} /> Requested: {new Date(task.requestedAt).toLocaleDateString()}
                  </div>
                  <button 
                    onClick={() => navigate(`/lot-manager/submit-${info.path}/${task.id}`)}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0071e3] text-white font-bold hover:bg-[#0077ED] transition-colors shadow-sm"
                  >
                    Submit Report <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
