import { useState, useEffect, useRef } from 'react';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { Send, Phone } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function BookingChat({ bookingId, category = "garage", currentUserId, receiverId, isCancelled, otherUserName, initialMessage, hideHeader = false }) {
  const referenceId = bookingId; // map bookingId prop to referenceId for internal usage
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState(initialMessage || '');
  const [connection, setConnection] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (initialMessage) {
        setNewMessage(initialMessage);
    }
  }, [initialMessage]);

  useEffect(() => {
    fetchHistory();
    setupSignalR();
    return () => {
      if (connection) connection.stop();
    };
  }, [bookingId]);

  const fetchHistory = async () => {
    try {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; AccessToken=`);
      const token = parts.length === 2 ? parts.pop().split(';').shift() : null;

      const res = await fetch(`https://localhost:7108/api/Chat/history/${category}/${referenceId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setMessages(data);
      }
    } catch (err) {
      console.error('Failed to fetch chat history', err);
    } finally {
      setLoading(false);
    }
  };

  const setupSignalR = async () => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; AccessToken=`);
    const token = parts.length === 2 ? parts.pop().split(';').shift() : null;

    if (!token) return;

    const newConnection = new HubConnectionBuilder()
      .withUrl("https://localhost:7108/hubs/chat", { accessTokenFactory: () => token })
      .configureLogging(LogLevel.Information)
      .build();

    newConnection.on("ReceiveMessage", (message) => {
      setMessages(prev => [...prev, message]);
    });

    try {
      await newConnection.start();
      await newConnection.invoke("JoinGroup", category, Number(referenceId));
      setConnection(newConnection);
    } catch (err) {
      console.error("SignalR Connection Error: ", err);
      toast.error("Failed to connect to chat server.");
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (isCancelled) return toast.error("You can't message without an active booking.");
    if (!newMessage.trim() || !connection) return;

    try {
      await connection.invoke("SendMessage", category, Number(referenceId), Number(receiverId), newMessage);
      setNewMessage('');
    } catch (err) {
      console.error(err);
      toast.error("Failed to send message");
    }
  };

  const startCall = async () => {
      if (isCancelled) return toast.error("You can't call without an active booking.");
      window.dispatchEvent(new CustomEvent('START_GLOBAL_CALL', { detail: { 
          bookingId: referenceId, 
          category: category,
          receiverName: otherUserName || "User"
      }}));
  };

  if (loading) return <div className="text-center p-4 text-gray-500">Loading chat...</div>;

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative">
      
      {/* Header */}
      {!hideHeader && (
        <div className={`p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50`}>
          <div>
              <h3 className="font-bold text-gray-900">{otherUserName || 'Chat'}</h3>
              <p className="text-xs text-gray-500">Messages are secure and private</p>
          </div>
          <button 
              onClick={startCall}
              disabled={isCancelled}
              className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <Phone size={20} />
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#f8fafc]">
        {isCancelled && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-semibold text-center mb-4">
                You can't message without an active booking.
            </div>
        )}
        
        {messages.length === 0 && !isCancelled ? (
            <div className="text-center text-gray-500 mt-10">
                <p>No messages yet.</p>
                <p className="text-sm">Send a message to start the conversation.</p>
            </div>
        ) : (
            messages.map((msg, idx) => {
                const isMine = msg.senderId === currentUserId;
                return (
                    <div key={idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-2xl p-3 ${
                            isMine ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm'
                        }`}>
                            <p className="text-sm">{msg.messageContent}</p>
                            <p className={`text-[10px] mt-1 ${isMine ? 'text-blue-200' : 'text-gray-400'}`}>
                                {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                        </div>
                    </div>
                );
            })
        )}
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-100">
        <div className="flex gap-2 relative">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={isCancelled}
            placeholder={isCancelled ? "Messaging disabled" : "Type a message..."}
            className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-5 py-3 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button 
            type="submit"
            disabled={!newMessage.trim() || isCancelled}
            className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send size={18} className="ml-1" />
          </button>
        </div>
      </form>
    </div>
  );
}
