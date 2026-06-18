import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken } from '../../api/auth';
import { Phone, MessageSquare, IndianRupee, Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function LotOwnerPaymentsPage() {
  const navigate = useNavigate();
  const [paymentsData, setPaymentsData] = useState({ pending: [], upcoming: [], paid: [] });
  const [activeTab, setActiveTab] = useState('Pending');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const token = getToken('AccessToken');
      const res = await fetch('https://localhost:7108/api/lot-owner/dashboard/payments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setPaymentsData({
          Pending: data.data.pending || [],
          Upcoming: data.data.upcoming || [],
          Paid: data.data.paid || []
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const currentList = paymentsData[activeTab] || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your pending and upcoming balances</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          {['Pending', 'Upcoming', 'Paid'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab} ({paymentsData[tab]?.length || 0})
            </button>
          ))}
        </div>

        <div className="p-6">
          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : currentList.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No {activeTab} Payments</h3>
              <p className="text-gray-500 text-sm">You're all caught up for now.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentList.map((item, idx) => (
                <div key={idx} className="flex flex-col xl:flex-row xl:items-center justify-between p-5 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white transition-colors gap-4">
                  
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      activeTab === 'Paid' ? 'bg-green-100 text-green-600' :
                      activeTab === 'Pending' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      <IndianRupee size={24} />
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.vehicleName}</h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <span className="bg-gray-100 px-2 py-0.5 rounded font-medium text-gray-700">{item.vehicleRegistration}</span>
                        <span>•</span>
                        <span>{item.ownerName}</span>
                        <span>•</span>
                        <span>{item.type}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between xl:justify-end gap-4 sm:gap-6 w-full xl:w-auto mt-4 xl:mt-0">
                    <div className="flex flex-col gap-1">
                        <div className="text-lg font-bold text-gray-900 flex items-center">
                        <IndianRupee size={16} />
                        {item.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Clock size={12} />
                        <span>{activeTab === 'Paid' ? 'Paid on' : 'Due:'} {format(new Date(item.date), 'MMM dd, yyyy')}</span>
                        </div>
                    </div>

                    {activeTab !== 'Paid' && (
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button 
                            onClick={() => {
                                window.dispatchEvent(new CustomEvent('START_GLOBAL_CALL', { detail: { 
                                    bookingId: item.bookingId, 
                                    category: 'garage',
                                    receiverName: item.ownerName 
                                }}));
                            }}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors"
                        >
                            <Phone size={16} />
                            Call
                        </button>
                        <button 
                            onClick={() => {
                                navigate('/lot-owner/messages', { state: { preselect: { referenceId: item.bookingId, category: 'garage' }, predictiveMessage: true } });
                            }}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                        >
                            <MessageSquare size={16} />
                            Message
                        </button>
                        </div>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
