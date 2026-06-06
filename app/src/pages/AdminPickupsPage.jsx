import React, { useState, useEffect } from 'react';
import { Truck, MapPin, Calendar, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminPickupsPage() {
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPickups();
  }, []);

  const fetchPickups = async () => {
    try {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; AccessToken=`);
      const token = parts.length === 2 ? parts.pop().split(';').shift() : null;

      if (!token) return;

      const res = await fetch('https://localhost:7108/api/Pickup/lot-owner/all-requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setPickups(data.data || []);
      } else {
        toast.error("Failed to load pickup requests");
      }
    } catch (err) {
      toast.error("Network error while loading pickups");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 animate-fade-in pt-4 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-[28px] font-bold text-[#111]">Pickup Requests</h2>
          <p className="text-gray-500 text-sm mt-1">Manage pickup requests for your properties.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : pickups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Truck size={48} className="mb-4 opacity-20" strokeWidth={1} />
            <p>No pickup requests found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Pickup Details</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Vehicle</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pickups.map((pickup) => (
                  <tr key={pickup.pickupRequestId} className="hover:bg-gray-50/30 transition-colors">
                    <td className="py-4 px-6 align-top">
                      <div className="flex items-center gap-2 text-sm font-bold text-[#111] mb-1">
                        <Calendar size={16} className="text-blue-500" />
                        {new Date(pickup.requestedPickupTime).toLocaleString()}
                      </div>
                      <div className="flex items-start gap-2 text-xs text-gray-500 mt-2">
                        <MapPin size={14} className="mt-0.5 shrink-0" />
                        <span className="max-w-[200px] truncate" title={pickup.pickupAddress}>
                          {pickup.pickupAddress || 'Address not provided'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 align-top">
                      <div className="font-semibold text-sm text-[#111]">{pickup.customerName}</div>
                      <div className="text-xs text-gray-500 mt-1">{pickup.customerEmail}</div>
                      <div className="text-xs text-gray-500">{pickup.customerPhone}</div>
                    </td>
                    <td className="py-4 px-6 align-top">
                      <div className="font-semibold text-sm text-[#111]">
                        {pickup.vehicleBrand} {pickup.vehicleModel}
                      </div>
                      <div className="inline-block mt-1 px-2 py-0.5 bg-gray-100 rounded text-xs font-medium text-gray-600 font-mono">
                        {pickup.registrationNo}
                      </div>
                    </td>
                    <td className="py-4 px-6 align-top">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold tracking-wide uppercase ${
                        pickup.status === 'Completed' ? 'bg-green-100 text-green-700' :
                        pickup.status === 'Pending' ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {pickup.status === 'Completed' ? <CheckCircle size={12}/> : <Clock size={12}/>}
                        {pickup.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
