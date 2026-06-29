import { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Wrench, Circle, User } from 'lucide-react';
import { getToken } from '../../api/auth';

const api = {
  get: async (url) => {
    const res = await fetch(`https://gd1-grand-auto-depot-one-9ms1.onrender.com/api${url}`, {
      headers: { Authorization: `Bearer ${getToken('AccessToken')}` }
    });
    if (!res.ok) throw new Error('API Error');
    return { data: await res.json() };
  },
  post: async (url, body) => {
    const res = await fetch(`https://gd1-grand-auto-depot-one-9ms1.onrender.com/api${url}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken('AccessToken')}` 
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('API Error');
    return { data: await res.json() };
  },
  put: async (url, body) => {
    const res = await fetch(`https://gd1-grand-auto-depot-one-9ms1.onrender.com/api${url}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken('AccessToken')}` 
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('API Error');
    return { data: await res.json() };
  }
};

import { toast } from 'react-hot-toast';

export default function SCMechanicsPage() {
  const [mechanics, setMechanics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMechanics();
  }, []);

  const fetchMechanics = async () => {
    try {
      const response = await api.get('/service-center/mechanics');
      setMechanics(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load mechanics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex h-full items-center justify-center">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Our Mechanics</h1>
        <p className="text-gray-500">Manage and view the team of mechanics assigned to your service center.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {mechanics.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-[2rem] border border-gray-100">
            No mechanics registered yet.
          </div>
        ) : (
          mechanics.map((mechanic) => (
            <div key={mechanic.id} className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
              <div className="absolute top-4 right-4 flex items-center gap-1">
                <Circle size={10} className={mechanic.isAvailable ? "fill-green-500 text-green-500" : "fill-red-500 text-red-500"} />
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  {mechanic.isAvailable ? 'Available' : 'Busy'}
                </span>
              </div>
              
              <div className="flex flex-col items-center text-center mt-2">
                <div className="w-24 h-24 rounded-full bg-blue-50 border-4 border-white shadow-lg overflow-hidden mb-4 relative flex items-center justify-center text-blue-300">
                  {mechanic.imageUrl ? (
                    <img src={mechanic.imageUrl} alt={mechanic.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <User size={40} />
                  )}
                </div>
                
                <h3 className="font-black text-gray-900 text-lg">{mechanic.fullName}</h3>
                <p className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full mt-2 inline-flex items-center gap-1">
                  <Wrench size={14} /> Certified
                </p>
              </div>

              <div className="mt-6 space-y-3 pt-6 border-t border-gray-50">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                    <Mail size={14} />
                  </div>
                  <span className="truncate">{mechanic.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                    <Phone size={14} />
                  </div>
                  <span>{mechanic.phoneNumber}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
