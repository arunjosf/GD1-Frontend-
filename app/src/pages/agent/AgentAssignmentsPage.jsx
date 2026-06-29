import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, CheckCircle, Clock, Search, FileText, Camera, ChevronRight } from 'lucide-react';

export default function AgentAssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Pending'); // Pending or Completed
  const navigate = useNavigate();

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const value = `; ${document.cookie}`;
      const parts = value.split(`; AccessToken=`);
      const token = parts.length === 2 ? parts.pop().split(';').shift() : null;

      const res = await fetch('https://gd1-grand-auto-depot-one-9ms1.onrender.com/api/agents/my-inspections', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        setAssignments(result.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredAssignments = () => {
    return assignments.filter(app => {
      // Find my latest assignment for this app
      const myAssignments = app.assignments || [];
      if (myAssignments.length === 0) return false;
      const latestAssignment = myAssignments[myAssignments.length - 1];

      if (filter === 'Pending') return latestAssignment.status !== 'Completed';
      if (filter === 'Completed') return latestAssignment.status === 'Completed';
      return true;
    });
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto space-y-6 pt-4 pb-10 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-[28px] font-bold text-[#111]">My Assignments</h2>
          <p className="text-gray-500 text-sm mt-1">Manage and report on your assigned inspections.</p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-full text-sm focus:ring-2 focus:ring-blue-500 w-full sm:w-64 shadow-sm outline-none transition-all"
          />
        </div>
      </div>

      <div className="flex p-1 bg-gray-200/50 rounded-xl w-max">
        {['Pending', 'Completed'].map((tab) => {
          const isActive = filter === tab;
          return (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                isActive ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
           <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      ) : getFilteredAssignments().length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500 bg-white rounded-3xl border border-gray-100">
          <FileText size={48} className="mb-4 opacity-20" strokeWidth={1} />
          <p>No {filter.toLowerCase()} assignments found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {getFilteredAssignments().map(app => {
            const assignment = app.assignments[app.assignments.length - 1];
            
            return (
              <div 
                key={app.id} 
                onClick={() => navigate(`/agent/assignments/${assignment.id}/details`)}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="p-6 border-b border-gray-50 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{app.businessName || 'Business Name'}</h3>
                      <p className="text-sm text-gray-500 mt-1">{app.ownerName || app.fullName}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full whitespace-nowrap ${assignment.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {assignment.status === 'Completed' ? 'COMPLETED' : 'PENDING'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mt-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin size={16} className="text-gray-400" />
                      <span>{app.city}, {app.state}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar size={16} className="text-gray-400" />
                      <span>Scheduled: {new Date(assignment.scheduledDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {assignment.status === 'Completed' && assignment.report && (
                  <div className="px-6 py-4 bg-green-50/50 border-b border-gray-50">
                    <h4 className="text-xs font-bold text-green-800 uppercase mb-2">Report Summary</h4>
                    {assignment.report.overallDescription && (
                      <p className="text-sm text-green-900 line-clamp-2 mb-3">{assignment.report.overallDescription}</p>
                    )}
                    <div className="flex gap-2 flex-wrap">
                      <div className="text-xs font-bold bg-white border border-green-200 text-green-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                        <Camera size={14} /> {assignment.report.siteImages?.length || 0} Images
                      </div>
                      <div className="text-xs font-bold bg-white border border-green-200 text-green-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                        <CheckCircle size={14} /> {assignment.report.slotVerifications?.filter(s => s.isVerified).length || 0} Slots Verified
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-6 bg-gray-50 flex items-center justify-between mt-auto">
                  <div className="text-sm text-gray-500 font-medium">
                    {app.slots ? app.slots.length : 0} Slots to Inspect
                  </div>
                  {assignment.status !== 'Completed' ? (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/agent/assignments/${assignment.id}/details`);
                      }}
                      className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
                    >
                      View Details <ChevronRight size={16} />
                    </button>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="hidden sm:flex items-center gap-1.5 text-green-600 font-bold text-sm">
                        <CheckCircle size={18} />
                        Report Submitted
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/agent/assignments/${assignment.id}/details`);
                        }}
                        className="px-6 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold group-hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2"
                      >
                        View Report <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
