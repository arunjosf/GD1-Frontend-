import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft, MapPin, Phone, Mail, Calendar, CheckCircle, ChevronRight, User } from 'lucide-react';
import { getToken } from '../../api/auth';

export default function AdminAssignAgentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appDetails, setAppDetails] = useState(null);
  const [nearbyAgents, setNearbyAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scheduledDate, setScheduledDate] = useState('');
  const [assignLoadingId, setAssignLoadingId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = getToken('AccessToken');
        if (!token) return;

        // Fetch application details to get name/location
        const appRes = await fetch(`https://gd1-grand-auto-depot-one-9ms1.onrender.com/api/admin/franchise/applications/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const appResult = await appRes.json();
        setAppDetails(appResult.data);

        // Fetch nearby agents
        const agentsRes = await fetch(`https://gd1-grand-auto-depot-one-9ms1.onrender.com/api/admin/franchise/applications/${id}/nearby-agents`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const agentsResult = await agentsRes.json();
        const agents = agentsResult.data || [];
        // Filter agents to within 30 km if distance is available
        const filteredAgents = agents.filter(a => a.distanceKm == null || a.distanceKm <= 30);
        setNearbyAgents(filteredAgents);
      } catch (err) {
        toast.error('Could not load data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleAssignAgent = async (agent) => {
    if (!scheduledDate) {
      toast.error("Please select a scheduled date.");
      return;
    }

    const bookedDatesStr = agent.bookedDates || '';
    const isBooked = bookedDatesStr.split(',').some(d => d === scheduledDate);
    if (isBooked) {
      const confirmed = window.confirm("This agent already has an assignment on this date. Do you still want to assign them?");
      if (!confirmed) return;
    }

    setAssignLoadingId(agent.id);

    try {
      const token = getToken('AccessToken');
      
      const res = await fetch(`https://gd1-grand-auto-depot-one-9ms1.onrender.com/api/admin/franchise/applications/${id}/assign-agent`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          agentId: agent.id,
          scheduledDate: new Date(scheduledDate).toISOString()
        })
      });

      if (!res.ok) throw new Error("Failed to assign agent");
      toast.success("Agent assigned successfully!");
      navigate('/admin/applications/garage', { state: { selectedAppId: id } });
    } catch (err) {
      toast.error(err.message || 'Could not assign agent.');
    } finally {
      setAssignLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-100px)]">
         <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1200px] mx-auto pb-20 animate-fade-in relative">
      <button 
        onClick={() => navigate('/admin/applications/garage', { state: { selectedAppId: id } })}
        className="flex items-center gap-2 text-gray-500 hover:text-blue-600 font-medium mb-6 transition-colors"
      >
        <ArrowLeft size={18} /> Back to Application
      </button>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-8 bg-gradient-to-br from-blue-50 to-white border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Assign Verification Agent</h1>
            <p className="text-gray-500 font-medium mt-2 text-lg">Application #{appDetails?.applicationNumber || id}</p>
            {appDetails?.preferredInspectionDate && (
              <p className="text-blue-600 font-medium mt-2 flex items-center gap-2">
                <Calendar size={18} /> User Preferred Date: {new Date(appDetails.preferredInspectionDate).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm w-full md:w-auto">
            <Calendar className="text-blue-500" size={24} />
            <input 
              type="date" 
              className="border-none outline-none text-gray-700 font-medium bg-transparent cursor-pointer text-lg w-full"
              value={scheduledDate}
              onChange={e => setScheduledDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        <div className="p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
            <MapPin size={22} className="text-gray-400" />
            Nearby Agents
          </h2>

          <div className="space-y-4">
            {nearbyAgents.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <User size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium text-lg">No agents found near this location.</p>
              </div>
            ) : (
              nearbyAgents.map(agent => (
                <div key={agent.id} className="flex flex-col sm:flex-row items-center justify-between p-6 rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all bg-white group">
                  <div className="flex items-center gap-5 w-full sm:w-auto mb-4 sm:mb-0">
                    {agent.avatarUrl ? (
                      <img src={agent.avatarUrl} alt={agent.fullName} className="w-14 h-14 rounded-full object-cover border border-blue-100 group-hover:scale-110 transition-transform" />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xl border border-blue-100 group-hover:scale-110 transition-transform">
                        {agent.fullName?.charAt(0) || 'A'}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">{agent.fullName}</h4>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6 mt-1 text-sm text-gray-500 font-medium">
                        <span className="flex items-center gap-1.5"><Mail size={16} className="text-gray-400" /> {agent.email}</span>
                        <span className="flex items-center gap-1.5"><Phone size={16} className="text-gray-400" /> {agent.phoneNumber}</span>
                        {agent.city && (
                          <span className="flex items-center gap-1.5"><MapPin size={16} className="text-gray-400" /> {agent.city}</span>
                        )}
                        {agent.distanceKm !== undefined && agent.distanceKm !== null && (
                          <span className="flex items-center gap-1.5 text-blue-600"><MapPin size={16} /> {agent.distanceKm.toFixed(1)} km away</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleAssignAgent(agent)}
                    disabled={assignLoadingId === agent.id}
                    className="w-full sm:w-auto px-8 py-3 bg-blue-700 hover:bg-blue-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                  >
                    {assignLoadingId === agent.id ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : (
                      <>Assign <ChevronRight size={18} /></>
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
