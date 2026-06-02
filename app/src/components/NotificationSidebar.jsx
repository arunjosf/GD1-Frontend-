import { X, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function NotificationSidebar({ isOpen, onClose, notifications = [] }) {
  const navigate = useNavigate();

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };

  const isYesterday = (date) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear();
  };

  const getDaysAgo = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return Math.floor((today - d) / (1000 * 60 * 60 * 24));
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffMins < 60) return diffMins <= 0 ? 'Now' : `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    if (diffWeeks < 4) return `${diffWeeks}w`;
    if (diffMonths < 12) return `${diffMonths}mo`;
    return `${Math.floor(diffMonths / 12)}y`;
  };

  const categorized = {
    'Today': [],
    'Yesterday': [],
    'Last 7 Days': [],
    'Last 30 Days': [],
    'Older': []
  };

  notifications.forEach(n => {
    const date = new Date(n.createdAt);
    const daysAgo = getDaysAgo(date);
    if (isToday(date)) categorized['Today'].push(n);
    else if (isYesterday(date)) categorized['Yesterday'].push(n);
    else if (daysAgo < 7) categorized['Last 7 Days'].push(n);
    else if (daysAgo <= 30) categorized['Last 30 Days'].push(n);
    else categorized['Older'].push(n);
  });

  return (
    <div className={`fixed inset-0 z-[120] pointer-events-none ${isOpen ? 'visible' : 'invisible'}`}>
      <div 
        className={`absolute inset-0 bg-black/10 transition-opacity duration-300 pointer-events-auto ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
        onClick={onClose}
      />
      
      <div className={`absolute top-0 right-0 h-full w-full sm:w-[380px] bg-white shadow-2xl transition-transform duration-300 pointer-events-auto flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="text-[16px] font-bold text-[#111] tracking-tight">Notifications</h2>
          <button onClick={onClose} className="text-[#111] hover:text-gray-600 transition-colors">
            <X size={24} strokeWidth={1.5} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-2 py-2 scrollbar-thin">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <Bell size={32} className="mb-2 opacity-20" strokeWidth={1} />
              <p className="text-[13px]">No notifications</p>
            </div>
          ) : (
            Object.keys(categorized).map(category => {
              const list = categorized[category];
              if (list.length === 0) return null;
              
              return (
                <div key={category} className="mb-2 border-b border-gray-50 pb-2 last:border-0">
                  <h3 className="px-3 py-2 text-[13px] font-bold text-[#111]">{category}</h3>
                  <div className="space-y-1">
                    {list.map((notif) => (
                      <div key={notif.id} className="flex items-start gap-3 px-3 py-2 hover:bg-gray-50 transition-colors rounded-lg group cursor-pointer">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200 mt-0.5">
                           <Bell size={14} strokeWidth={1.5} className={!notif.isRead ? "text-black" : "text-gray-400"} />
                        </div>
                        
                        <div className="flex-1 min-w-0 pt-0.5">
                          <p className="text-[13px] text-[#111] leading-snug">
                            <span className="font-semibold">{notif.title}</span> <span className="text-gray-700">{notif.body}</span> <span className="text-gray-400 font-normal ml-1">{formatTime(notif.createdAt)}</span>
                          </p>
                          
                          {/* Dynamic Action Button embedded in notification */}
                          {(notif.actionType || notif.actionUrl) && (
                            <div className="mt-2.5 mb-1.5">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onClose();
                                  navigate(notif.actionUrl || '/track-application');
                                }}
                                className="px-4 py-1.5 bg-[#2563eb] text-white text-[12px] font-bold rounded-lg hover:bg-[#2d6df0] transition-all shadow-sm"
                              >
                                {notif.actionType === 'TrackApplication' ? 'Track' : 
                                 notif.actionType ? notif.actionType.replace(/([A-Z])/g, ' $1').trim() : 'View'}
                              </button>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col items-end shrink-0 pt-1">
                           {!notif.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
