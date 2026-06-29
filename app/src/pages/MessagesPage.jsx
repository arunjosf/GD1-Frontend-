import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCall } from '../context/CallContext';
import BookingChat from '../components/BookingChat';
import { getToken } from '../api/auth';
import toast from 'react-hot-toast';

export default function MessagesPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null); // { category, referenceId, title }
  const [chatManually, setChatManually] = useState(false);
  const [managers, setManagers] = useState([]);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [bosses, setBosses] = useState([]);
  const [loadingBosses, setLoadingBosses] = useState(false);

  const { user } = useAuth();
  const { startCall } = useCall();
  const navigate = useNavigate();
  const location = useLocation();
  const predictiveMsg = location.state?.predictiveMessage ? "Hi! Just following up on the pickup request." : null;



  useEffect(() => {
    if (location.state?.preselect) {
      const preselect = location.state.preselect;
      if (preselect.category === 'manager') {
        setChatManually(true);
        setSelectedChat({
          category: 'manager',
          referenceId: preselect.referenceId,
          title: preselect.name,
          otherUserId: preselect.referenceId,
          otherUserName: preselect.name,
          isChatActive: true
        });
      } else {
        setActiveTab(preselect.category);
      }
    }
    fetchConversations();
  }, [location.state]);

  useEffect(() => {
    if (user) {
      if (user.roleId === 2 && (activeTab === 'all' || activeTab === 'manager') && managers.length === 0) {
        fetchManagers();
      } else if (user.roleId === 4 && (activeTab === 'all' || activeTab === 'manager') && bosses.length === 0) {
        fetchBosses();
      }
    }
  }, [activeTab, user]);

  const fetchBosses = async () => {
    try {
      setLoadingBosses(true);
      const token = getToken('AccessToken');
      if (!token) return;

      const res = await fetch('https://gd1-grand-auto-depot-one-9ms1.onrender.com/api/lot-manager/my-owners', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        setBosses(result.data || []);
      }
    } catch (err) {
      console.error('Error fetching bosses:', err);
    } finally {
      setLoadingBosses(false);
    }
  };

  const fetchManagers = async () => {
    try {
      setLoadingManagers(true);
      const token = getToken('AccessToken');
      if (!token) return;

      const res = await fetch('https://gd1-grand-auto-depot-one-9ms1.onrender.com/api/lot-manager/lot-owners/all-managers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        const activeManagers = (result.data || []).filter(m => m.isActive);
        setManagers(activeManagers);
      }
    } catch (err) {
      console.error('Error fetching managers:', err);
    } finally {
      setLoadingManagers(false);
    }
  };

  const handleSelectManager = (mgr) => {
    setSelectedChat({
      category: 'manager',
      referenceId: mgr.managerUserId,
      title: mgr.managerName,
      otherUserId: mgr.managerUserId,
      otherUserName: mgr.managerName,
      isChatActive: true
    });
  };

  const handleSelectBoss = (boss) => {
    setSelectedChat({
      category: 'manager',
      referenceId: user.userId,
      title: boss.fullName,
      otherUserId: boss.ownerId,
      otherUserName: boss.fullName,
      isChatActive: true
    });
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const value = `; ${document.cookie}`;
      const parts = value.split(`; AccessToken=`);
      const token = parts.length === 2 ? parts.pop().split(';').shift() : null;

      const response = await fetch('https://gd1-grand-auto-depot-one-9ms1.onrender.com/api/Chat/conversations', {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
          const data = await response.json();
          setConversations(data);
          
          if (location.state?.preselect) {
              const preselect = location.state.preselect;
              const found = data.find(c => c.referenceId === preselect.referenceId && c.category === preselect.category);
              if (found) setSelectedChat(found);
          }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const combinedConversations = [...conversations];

  if (user && user.roleId === 2) {
    managers.forEach(mgr => {
      const existingConv = combinedConversations.find(c => c.category === 'manager' && c.referenceId === mgr.managerUserId);
      if (!existingConv) {
        combinedConversations.push({
          category: 'manager',
          referenceId: mgr.managerUserId,
          title: mgr.managerName,
          otherUserId: mgr.managerUserId,
          otherUserName: mgr.managerName,
          latestMessage: 'No messages yet',
          latestMessageAt: null,
          unreadCount: 0,
          isChatActive: true,
        });
      }
    });
  } else if (user && user.roleId === 4) {
    bosses.forEach(boss => {
      const existingConv = combinedConversations.find(c => c.category === 'manager' && c.otherUserId === boss.ownerId);
      if (!existingConv) {
        combinedConversations.push({
          category: 'manager',
          referenceId: user.userId,
          title: boss.fullName,
          otherUserId: boss.ownerId,
          otherUserName: boss.fullName,
          latestMessage: 'No messages yet',
          latestMessageAt: null,
          unreadCount: 0,
          isChatActive: true,
        });
      }
    });
  }

  const filteredConversations = (activeTab === 'all' ? combinedConversations : combinedConversations.filter(c => c.category === activeTab))
    .sort((a, b) => new Date(b.latestMessageAt || 0) - new Date(a.latestMessageAt || 0));

  if (!user) return <div className="p-8 text-center text-gray-500">Please log in to view messages.</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-8 h-[calc(100vh-80px)]">
      <div className="flex flex-col md:flex-row h-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        
        {/* Sidebar */}
        <div className={`w-full md:w-1/3 border-r border-gray-200 flex flex-col ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <h1 className="text-2xl font-bold text-gray-800">Messages</h1>
            
            {/* Tabs */}
            <div className="flex mt-6 bg-gray-200 p-1 rounded-lg overflow-x-auto no-scrollbar gap-1">
              {user.roleId === 4 ? (
                <>
                  <button
                    className={`flex-1 min-w-[60px] py-2 text-[13px] font-medium rounded-md transition-all whitespace-nowrap ${
                      activeTab === 'all'
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => { setActiveTab('all'); setChatManually(false); setSelectedChat(null); }}
                  >
                    All
                    {conversations.reduce((sum, c) => sum + c.unreadCount, 0) > 0 && (
                      <span className="ml-1 bg-blue-100 text-blue-600 py-0.5 px-1.5 rounded-full text-[10px]">
                        {conversations.reduce((sum, c) => sum + c.unreadCount, 0)}
                      </span>
                    )}
                  </button>
                  <button
                    className={`flex-1 min-w-[60px] py-2 text-[13px] font-medium rounded-md transition-all whitespace-nowrap ${
                      activeTab === 'manager'
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => { setActiveTab('manager'); setChatManually(true); setSelectedChat(null); }}
                  >
                    Owners
                    {conversations.filter(c => c.category === 'manager').reduce((sum, c) => sum + c.unreadCount, 0) > 0 && (
                      <span className="ml-1 bg-blue-100 text-blue-600 py-0.5 px-1.5 rounded-full text-[10px]">
                        {conversations.filter(c => c.category === 'manager').reduce((sum, c) => sum + c.unreadCount, 0)}
                      </span>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <button
                    className={`flex-1 min-w-[60px] py-2 text-[13px] font-medium rounded-md transition-all whitespace-nowrap ${
                      activeTab === 'all'
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => { setActiveTab('all'); setChatManually(false); setSelectedChat(null); }}
                  >
                    All
                    {conversations.reduce((sum, c) => sum + c.unreadCount, 0) > 0 && (
                      <span className="ml-1 bg-blue-100 text-blue-600 py-0.5 px-1.5 rounded-full text-[10px]">
                        {conversations.reduce((sum, c) => sum + c.unreadCount, 0)}
                      </span>
                    )}
                  </button>
                  <button
                    className={`flex-1 min-w-[60px] py-2 text-[13px] font-medium rounded-md transition-all whitespace-nowrap ${
                      activeTab === 'garage'
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => { setActiveTab('garage'); setChatManually(false); setSelectedChat(null); }}
                  >
                    {user && user.roleId === 2 ? 'V-Owner' : 'Garage'}
                    {conversations.filter(c => c.category === 'garage').reduce((sum, c) => sum + c.unreadCount, 0) > 0 && (
                      <span className="ml-1 bg-blue-100 text-blue-600 py-0.5 px-1.5 rounded-full text-[10px]">
                        {conversations.filter(c => c.category === 'garage').reduce((sum, c) => sum + c.unreadCount, 0)}
                      </span>
                    )}
                  </button>
                  {user && user.roleId !== 3 && (
                    <button
                      className={`flex-1 min-w-[60px] py-2 text-[13px] font-medium rounded-md transition-all whitespace-nowrap ${
                        activeTab === 'serviceCenter'
                          ? 'bg-white text-blue-600 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      onClick={() => { setActiveTab('serviceCenter'); setChatManually(false); setSelectedChat(null); }}
                    >
                      Service
                      {conversations.filter(c => c.category === 'serviceCenter').reduce((sum, c) => sum + c.unreadCount, 0) > 0 && (
                        <span className="ml-1 bg-blue-100 text-blue-600 py-0.5 px-1.5 rounded-full text-[10px]">
                          {conversations.filter(c => c.category === 'serviceCenter').reduce((sum, c) => sum + c.unreadCount, 0)}
                        </span>
                      )}
                    </button>
                  )}
                  {user && user.roleId === 2 && (
                    <button
                      className={`flex-1 min-w-[60px] py-2 text-[13px] font-medium rounded-md transition-all whitespace-nowrap ${
                        activeTab === 'manager'
                          ? 'bg-white text-blue-600 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      onClick={() => { setActiveTab('manager'); setChatManually(true); setSelectedChat(null); }}
                    >
                      Manager
                      {conversations.filter(c => c.category === 'manager').reduce((sum, c) => sum + c.unreadCount, 0) > 0 && (
                        <span className="ml-1 bg-blue-100 text-blue-600 py-0.5 px-1.5 rounded-full text-[10px]">
                          {conversations.filter(c => c.category === 'manager').reduce((sum, c) => sum + c.unreadCount, 0)}
                        </span>
                      )}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading || 
             (user?.roleId === 2 && loadingManagers && (activeTab === 'all' || activeTab === 'manager')) || 
             (user?.roleId === 4 && loadingBosses && (activeTab === 'all' || activeTab === 'manager')) ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                No active conversations.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredConversations.map((chat) => (
                  <button
                    key={chat.referenceId}
                    onClick={() => setSelectedChat(chat)}
                    className={`w-full text-left p-4 hover:bg-blue-50 transition-colors focus:outline-none ${
                      selectedChat?.referenceId === chat.referenceId && selectedChat?.category === chat.category
                        ? 'bg-blue-50 border-l-4 border-blue-600'
                        : 'border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        {chat.isChatActive && <div className="w-2 h-2 rounded-full bg-green-500"></div>}
                        <h3 className="font-semibold text-gray-900 truncate pr-2">{chat.title}</h3>
                        {user && user.roleId === 4 && chat.category === 'manager' && (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm shrink-0">
                            Boss
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {chat.latestMessageAt && (
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                            {new Date(chat.latestMessageAt).toLocaleDateString()}
                            </span>
                        )}
                        {chat.unreadCount > 0 && (
                            <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {chat.unreadCount}
                            </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{chat.latestMessage}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`w-full md:w-2/3 flex flex-col ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
          {selectedChat ? (
            <div className="flex-1 flex flex-col h-full relative">
              {/* Mobile back button header */}
              <div className="md:hidden p-4 border-b border-gray-200 bg-white flex items-center gap-3">
                <button 
                  onClick={() => setSelectedChat(null)}
                  className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="font-semibold text-gray-900 flex-1">{selectedChat.title}</div>
                <button onClick={() => {
                    if (selectedChat.otherUserId) {
                        startCall(
                            selectedChat.otherUserId,
                            selectedChat.category,
                            selectedChat.otherUserName || selectedChat.title
                        );
                    } else {
                        toast.error("Cannot call this user.");
                    }
                }} className="w-9 h-9 flex items-center justify-center bg-green-50 text-green-600 rounded-full hover:bg-green-100 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </button>
              </div>
              
              <div className="bg-white px-6 py-4 border-b border-gray-200 flex justify-between items-center hidden md:flex">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selectedChat.title}</h2>
                  <p className="text-sm text-gray-500">Messages are secure and private</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => {
                      if (selectedChat.category === 'garage') navigate(`/lot-owner/pickup/${selectedChat.referenceId}`);
                      else if (selectedChat.category === 'serviceCenter') navigate(`/lot-owner/service/${selectedChat.referenceId}`);
                      else if (selectedChat.category === 'manager') navigate('/lot-owner/managers', { state: { viewAllManagers: true } });
                  }} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg text-sm transition-colors">
                    View Details
                  </button>
                  <button onClick={() => {
                      if (selectedChat.otherUserId) {
                          startCall(
                              selectedChat.otherUserId,
                              selectedChat.category,
                              selectedChat.otherUserName || selectedChat.title
                          );
                      } else {
                          toast.error("Cannot call this user.");
                      }
                  }} className="w-10 h-10 flex items-center justify-center bg-green-50 text-green-600 rounded-full hover:bg-green-100 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-hidden flex flex-col">
                <BookingChat 
                  bookingId={selectedChat.referenceId} 
                  category={selectedChat.category}
                  currentUserId={user?.userId}
                  receiverId={selectedChat.otherUserId}
                  otherUserName={selectedChat.title}
                  isCancelled={!selectedChat.isChatActive}
                  initialMessage={predictiveMsg}
                  hideHeader={true}
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-500 p-8">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                <svg className="w-12 h-12 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
              <h2 className="text-xl font-medium text-gray-700 mb-2">Your Messages</h2>
              <p className="text-center max-w-md">Select a conversation from the sidebar to view your messages and calls.</p>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
