import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Clock, Hand, Handshake } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function TrackApplicationPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchApplications = async () => {
      try {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; AccessToken=`);
        const token = parts.length === 2 ? parts.pop().split(';').shift() : null;

        if (!token) throw new Error("No token found");

        const res = await fetch('https://localhost:7108/api/Franchise/my-applications', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error("Failed to fetch applications");
        
        const data = await res.json();
        setApplications(data.data || []);
      } catch {
        toast.error("Failed to load applications");
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [isAuthenticated, navigate]);

  const getStepProgress = (app) => {
    if (app.status === 4 || app.status === 5) return 4;
    if (app.status === 3 || app.inspectionCompletedAt) return 3;
    if (app.status === 2 || app.assignedAt) return 2;
    return 1;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-['Inter',sans-serif]">
      <Navbar />

      <main className="flex-grow pt-[140px] pb-20 px-[6vw]">
        <div className="max-w-5xl mx-auto">
          
          <div className="mb-12 text-center md:text-left">
            <h1 className="text-3xl md:text-5xl font-black font-medium text-[#111] tracking-tight mb-3">Track Applications</h1>
            <p className="text-gray-500 text-[16px]">Monitor the real-time status of your franchise requests.</p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-500 font-medium">Loading applications...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-5">
                 <Clock className="text-gray-400 w-10 h-10" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-bold text-[#111] mb-2">No Applications Found</h3>
              <p className="text-gray-500 mb-6">You haven't submitted any franchise applications yet.</p>
              <button onClick={() => navigate('/add-garage')} className="bg-[#111] text-white px-8 py-3 rounded-full font-bold hover:bg-[#333] transition-colors">
                Apply Now
              </button>
            </div>
          ) : (
            <div className="space-y-10">
              {applications.map(app => {
                const currentStep = getStepProgress(app);
                const isRejected = app.status === 4;
                const isApproved = app.status === 5;
                
                const steps = [
                  { id: 1, label: 'Application Submitted', description: app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'Pending' },
                  { id: 2, label: 'Agent Assigned', description: app.assignedAt ? new Date(app.assignedAt).toLocaleDateString() : 'Pending' },
                  { id: 3, label: 'Inspection Complete', description: app.inspectionCompletedAt ? new Date(app.inspectionCompletedAt).toLocaleDateString() : 'Pending' },
                  { id: 4, label: 'Final Decision', description: isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Pending' }
                ];

                return (
                  <div key={app.id} className="bg-white rounded-[2rem] p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 relative overflow-hidden group">
                    {/* Status Badge */}
                    <div className={`absolute top-0 right-0 px-6 py-2 rounded-bl-2xl font-bold text-[11px] tracking-widest uppercase
                      ${isApproved ? 'bg-green-500 text-white' : 
                        isRejected ? 'bg-red-500 text-white' : 
                        'bg-blue-600 text-white'}`}
                    >
                      {isApproved ? 'Approved' : isRejected ? 'Rejected' : 'In Progress'}
                    </div>

                    <div className="mb-12">
                      <h2 className="text-2xl font-black font-medium text-[#111] mb-2 tracking-tight">{app.businessName}</h2>
                      <p className="text-gray-400 text-[13px]">Application ID: #{app.id} • Submitted on {new Date(app.createdAt).toLocaleDateString()}</p>
                    </div>

                    {/* Timeline minimalist like the image */}
                    <div className="relative pt-6 pb-4 overflow-x-auto scrollbar-hide">
                      <div className="min-w-[600px] md:min-w-full relative px-6">
                        {/* Background Thin Line */}
                        <div className="absolute top-[11px] left-[3rem] right-[3rem] h-[1px] bg-gray-200 z-0"></div>
                        
                        {/* Active Progress Line */}
                        <div 
                          className="absolute top-[11px] left-[3rem] h-[1px] bg-[#2563eb] z-0 transition-all duration-1000" 
                          style={{ width: `calc((100% - 6rem) * ${(currentStep - 1) / (steps.length - 1)})` }}
                        ></div>

                        {/* Hand Animation Overlay */}
                        <div className="absolute top-[11px] left-[3rem] right-[3rem] h-[0px] pointer-events-none z-20">
                          {isApproved ? (
                            <div className="absolute top-0 left-full -translate-x-1/2 -translate-y-1/2">
                              {/* Container at 100% (Final Decision Dot) */}
                              <div className="relative w-10 h-10">
                                <div className="absolute top-1/2 left-1/2 animate-[slideLeftHand_2s_ease-in-out_forwards]" style={{ transformOrigin: 'center' }}>
                                  <Hand className="w-6 h-6 text-black transform rotate-90" />
                                </div>
                                <div className="absolute top-1/2 left-1/2 animate-[slideRightHand_2s_ease-in-out_forwards]" style={{ transformOrigin: 'center' }}>
                                  <Hand className="w-6 h-6 text-black transform -rotate-90 scale-x-[-1]" />
                                </div>
                                <div className="absolute top-1/2 left-1/2 animate-[handshakeReveal_2.5s_ease-in-out_forwards] drop-shadow-[0_0_15px_rgba(37,99,235,0.8)]" style={{ transformOrigin: 'center' }}>
                                  <Handshake className="w-8 h-8 text-black" />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div 
                              className="absolute top-0 -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ease-in-out"
                              style={{ left: `calc(100% * ${(currentStep - 1) / (steps.length - 1)})` }}
                            >
                              <div className="pb-8 animate-pulse">
                                <Hand className="w-6 h-6 text-black transform rotate-180" />
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex justify-between items-start relative z-10">
                          {steps.map((step) => {
                            const isCompleted = step.id < currentStep || (step.id === currentStep && (isApproved || isRejected));
                            const isActive = step.id === currentStep && !isApproved && !isRejected;

                            return (
                              <div key={step.id} className="flex flex-col items-center text-center relative w-24">
                                
                                {/* Step Dot Wrapper */}
                                <div className="h-[24px] flex items-center justify-center mb-3">
                                  {isActive ? (
                                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                    </div>
                                  ) : (
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                  )}
                                </div>

                                {/* Step Label */}
                                <h4 className={`text-[13px] font-bold leading-tight mb-1 ${isActive || isCompleted ? 'text-[#333]' : 'text-gray-400'}`}>
                                  {step.label}
                                </h4>
                                
                                {/* Step Subtext */}
                                <p className="text-[11px] text-gray-400">
                                  {step.description}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {isRejected && app.adminNotes && (
                      <div className="mt-8 p-4 bg-red-50 border border-red-100 rounded-xl">
                        <p className="text-sm text-red-800"><span className="font-bold">Reason for Rejection:</span> {app.adminNotes}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
