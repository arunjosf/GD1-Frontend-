import { useState, useEffect } from 'react';
import { getToken } from '../../api/auth';
import { IndianRupee, Clock, CheckCircle, Car, Wrench, Bike, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import Navbar from '../../components/Navbar';
import { useRazorpay } from 'react-razorpay';
import { toast } from 'react-hot-toast';

export default function VehicleOwnerPaymentsPage() {
  const [paymentsData, setPaymentsData] = useState({ Pending: [], Upcoming: [], Paid: [] });
  const [activeTab, setActiveTab] = useState('Pending');
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState(null); // tracks which item is being paid
  const { Razorpay } = useRazorpay();

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const token = getToken('AccessToken');
      const res = await fetch('https://gd1-grand-auto-depot-one-9ms1.onrender.com/api/LotBooking/my-payments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.data) {
        setPaymentsData({
          Pending: data.data.pending || [],
          Upcoming: data.data.upcoming || [],
          Paid: data.data.paid || []
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async (item, itemIndex) => {
    const uniqueKey = `${item.bookingId}-${itemIndex}`;
    setPayingId(uniqueKey);

    try {
      const token = getToken('AccessToken');

      // 1. Fetch Razorpay key
      const keyRes = await fetch('https://gd1-grand-auto-depot-one-9ms1.onrender.com/api/payment/config', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const keyData = await keyRes.json();

      let razorpayOrderId;
      let amountToPay = item.amount;

      if (item.type === 'Service Payment') {
        // Service payments use Razorpay directly with the service amount (no order creation needed)
        razorpayOrderId = null;
      } else {
        // Lot booking / storage cycle / pickup charge — create order on backend
        const orderRes = await fetch('https://gd1-grand-auto-depot-one-9ms1.onrender.com/api/payment/create-cycle-order', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            bookingId: item.bookingId,
            amountToPay: amountToPay
          })
        });

        if (!orderRes.ok) throw new Error('Failed to create payment order');
        const orderData = await orderRes.json();
        razorpayOrderId = orderData.razorpayOrderId;
        amountToPay = orderData.totalAmountToPay;
      }

      // 2. Open Razorpay checkout
      const options = {
        key: keyData.keyId,
        amount: Math.round(amountToPay * 100).toString(),
        currency: 'INR',
        name: 'Grand Auto Depot',
        description: `${item.type} — ${item.vehicleName}`,
        order_id: razorpayOrderId || undefined,
        handler: async (response) => {
          try {
            // 3. Verify on backend
            const verifyEndpoint = item.type === 'Service Payment'
              ? `https://gd1-grand-auto-depot-one-9ms1.onrender.com/api/service-center/request/${item.serviceRequestId}/verify-payment`
              : 'https://gd1-grand-auto-depot-one-9ms1.onrender.com/api/payment/verify-cycle';

            const body = item.type === 'Service Payment'
              ? {
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpayOrderId: response.razorpay_order_id || 'direct',
                  razorpaySignature: response.razorpay_signature || 'verified'
                }
              : {
                  bookingId: item.bookingId,
                  razorpayOrderId: response.razorpay_order_id || razorpayOrderId,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature || 'verified'
                };

            const verifyRes = await fetch(verifyEndpoint, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(body)
            });

            if (verifyRes.ok) {
              toast.success('Payment successful! ✓');
              fetchPayments(); // Refresh the list
            } else {
              toast.error('Payment verification failed. Contact support.');
            }
          } catch {
            toast.error('Payment recorded but verification failed. Contact support.');
          }
        },
        prefill: {},
        theme: { color: '#2563EB' },
        modal: {
          ondismiss: () => setPayingId(null)
        }
      };

      const rzp = new Razorpay(options);
      rzp.on('payment.failed', () => {
        toast.error('Payment failed. Please try again.');
        setPayingId(null);
      });
      rzp.open();
    } catch (err) {
      console.error(err);
      toast.error('Could not initialize payment. Please try again.');
    } finally {
      setPayingId(null);
    }
  };

  const currentList = paymentsData[activeTab] || [];

  const getTypeIcon = (type) => {
    if (type === 'Pickup Charge') return <Car size={22} />;
    if (type === 'Service Payment') return <Wrench size={22} />;
    return <Bike size={22} />;
  };

  const getTypeColor = (type) => {
    if (type === 'Pickup Charge') return 'bg-orange-100 text-orange-600';
    if (type === 'Service Payment') return 'bg-purple-100 text-purple-600';
    return 'bg-blue-100 text-blue-600';
  };

  const formatDate = (dateStr) => {
    try { return format(new Date(dateStr), 'MMM dd, yyyy'); }
    catch { return 'N/A'; }
  };

  const isPayable = (tab) => tab === 'Pending' || tab === 'Upcoming';

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 pt-28 pb-12">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Payments</h1>
          <p className="text-gray-500 text-sm mt-1">View your lot bookings, pickup charges and service payments</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            {['Pending', 'Upcoming', 'Paid'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-4 text-sm font-semibold border-b-2 transition-all ${
                  activeTab === tab
                    ? tab === 'Pending' ? 'border-red-500 text-red-600'
                    : tab === 'Upcoming' ? 'border-blue-600 text-blue-600'
                    : 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab}
                <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full ${
                  activeTab === tab
                    ? tab === 'Pending' ? 'bg-red-100 text-red-600'
                    : tab === 'Upcoming' ? 'bg-blue-100 text-blue-600'
                    : 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {paymentsData[tab]?.length || 0}
                </span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-5">
            {loading ? (
              <div className="py-16 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : currentList.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                  <CheckCircle size={34} />
                </div>
                <h3 className="text-base font-semibold text-gray-800 mb-1">No {activeTab} Payments</h3>
                <p className="text-gray-400 text-sm">
                  {activeTab === 'Pending' ? "You're all caught up! No payments due." :
                   activeTab === 'Upcoming' ? 'No scheduled payments at this time.' :
                   'No payment history yet.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentList.map((item, idx) => {
                  const uniqueKey = `${item.bookingId}-${idx}`;
                  const isCurrentlyPaying = payingId === uniqueKey;

                  return (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/60 hover:bg-white hover:shadow-sm transition-all"
                    >
                      {/* Left: Icon + Info */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${getTypeColor(item.type)}`}>
                          {getTypeIcon(item.type)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900 text-sm">{item.vehicleName}</h3>
                            {item.vehicleRegistration && (
                              <span className="bg-gray-100 text-gray-600 text-[11px] font-medium px-2 py-0.5 rounded">
                                {item.vehicleRegistration}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">{item.propertyName}</p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${getTypeColor(item.type)}`}>
                              {item.type}
                            </span>
                            <span className="flex items-center gap-1 text-[11px] text-gray-400">
                              <Clock size={10} />
                              {activeTab === 'Paid' ? `Paid on ${formatDate(item.date)}` : `Due: ${formatDate(item.date)}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Amount + Pay Now */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 sm:gap-2 sm:shrink-0">
                        <div className="text-right">
                          <div className={`text-lg font-bold flex items-center justify-end gap-0.5 ${
                            activeTab === 'Paid' ? 'text-green-600' :
                            activeTab === 'Pending' ? 'text-red-600' : 'text-blue-600'
                          }`}>
                            <IndianRupee size={15} />
                            {Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <p className={`text-[11px] font-medium ${
                            activeTab === 'Paid' ? 'text-green-500' :
                            activeTab === 'Pending' ? 'text-red-400' : 'text-blue-400'
                          }`}>
                            {activeTab === 'Paid' ? '✓ Paid' : activeTab === 'Pending' ? '⚠ Overdue' : 'Upcoming'}
                          </p>
                        </div>

                        {isPayable(activeTab) && (
                          <button
                            onClick={() => handlePayNow(item, idx)}
                            disabled={isCurrentlyPaying}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm ${
                              activeTab === 'Pending'
                                ? 'bg-red-500 hover:bg-red-600 text-white disabled:opacity-60'
                                : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60'
                            }`}
                          >
                            {isCurrentlyPaying ? (
                              <>
                                <Loader2 size={14} className="animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <IndianRupee size={13} />
                                Pay Now
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
