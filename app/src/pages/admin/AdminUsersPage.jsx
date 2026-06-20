import { useState, useEffect } from 'react';
import { getToken } from '../../api/auth';
import { toast } from 'react-hot-toast';
import { Search, UserCircle, Calendar, Phone, Mail, ShieldAlert, CheckCircle, Ban } from 'lucide-react';

const api = {
  get: async (url) => {
    const res = await fetch(`https://localhost:7108/api${url}`, {
      headers: { Authorization: `Bearer ${getToken('AccessToken')}` }
    });
    if (!res.ok) throw new Error('API Error');
    return { data: await res.json() };
  },
  post: async (url, body) => {
    const res = await fetch(`https://localhost:7108/api${url}`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${getToken('AccessToken')}`,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : null
    });
    if (!res.ok) throw new Error('API Error');
    return { data: await res.json() };
  }
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Fetch users with Role = 1 (VehicleOwner)
      const res = await api.get('/admin/users?role=1');
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlock = async (user) => {
    if (user.hasActiveBooking) {
      toast.error("Cannot block user with active bookings");
      return;
    }
    
    try {
      const res = await api.post(`/admin/users/${user.id}/toggle-block`);
      if (res.data.success) {
        toast.success(res.data.message);
        // Update local state
        setUsers(users.map(u => u.id === user.id ? { ...u, isActive: res.data.data } : u));
      }
    } catch (err) {
      toast.error('Failed to update user status');
    }
  };

  const filteredUsers = users.filter(u => 
    u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.phoneNumber?.includes(searchQuery)
  );

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Users</h1>
            <p className="text-gray-500 font-medium">Manage regular platform users</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search users by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium"
          />
        </div>

        {/* Users List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredUsers.length === 0 ? (
            <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-[2rem] border border-gray-100">
              No users found.
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div key={user.id} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col gap-5 hover:shadow-lg transition-shadow">
                
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
                            ) : (
                                <UserCircle size={24} className="text-gray-400" />
                            )}
                        </div>
                        <div>
                            <h3 className="font-black text-gray-900 text-lg leading-tight">{user.fullName}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                    user.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                                }`}>
                                    {user.isActive ? <CheckCircle size={10} /> : <Ban size={10} />}
                                    {user.isActive ? 'Active' : 'Blocked'}
                                </span>
                                {user.hasActiveBooking && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-blue-50 text-blue-600">
                                        Active Booking
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Block/Unblock Button */}
                    <div className="flex flex-col items-end">
                         <button
                            onClick={() => handleToggleBlock(user)}
                            disabled={user.hasActiveBooking}
                            className={`px-4 py-2 text-sm font-bold rounded-xl transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                user.hasActiveBooking 
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' 
                                  : user.isActive 
                                    ? 'bg-red-50 text-red-600 hover:bg-red-500 hover:text-white focus:ring-red-500' 
                                    : 'bg-green-50 text-green-600 hover:bg-green-500 hover:text-white focus:ring-green-500'
                            }`}
                            title={user.hasActiveBooking ? "Cannot modify user with active booking" : (user.isActive ? "Block User" : "Unblock User")}
                        >
                            {user.isActive ? 'Block' : 'Unblock'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-2 pt-4 border-t border-gray-50">
                    <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
                        <Mail size={16} className="text-gray-400" />
                        <span className="truncate">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
                        <Phone size={16} className="text-gray-400" />
                        <span>{user.phoneNumber || 'No phone number'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
                        <Calendar size={16} className="text-gray-400" />
                        <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>

              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
