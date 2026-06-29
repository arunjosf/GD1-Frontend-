import { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Maximize2, Loader2, X, FileText } from 'lucide-react';
import { useRazorpay } from 'react-razorpay';

export default function AddServiceCenterPage() {
  const navigate = useNavigate();
  const { Razorpay } = useRazorpay();
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [form, setForm] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    businessRegistrationUrl: '',
    ownerIdProofUrl: ''
  });

  const [uploading, setUploading] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFileUpload = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(prev => ({ ...prev, [fieldName]: true }));
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('https://gd1-grand-auto-depot-one-9ms1.onrender.com/api/Upload/upload-file', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setForm(f => ({ ...f, [fieldName]: data.url }));
        toast.success('File uploaded successfully!');
      } else {
        try {
          const errData = await res.json();
          toast.error(errData.message || 'File upload failed.');
        } catch {
          toast.error('File upload failed.');
        }
      }
    } catch (err) {
      toast.error('Network error: ' + err.message);
    } finally {
      setUploading(prev => ({ ...prev, [fieldName]: false }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.businessName || !form.ownerName || !form.email || !form.businessRegistrationUrl || !form.ownerIdProofUrl) {
      toast.error('Please fill in all required fields and upload both required documents.');
      return;
    }
    confirmAndSubmit();
  };

  const confirmAndSubmit = async () => {
    try {
      setLoading(true);

      const tokenCookie = document.cookie.split('; ').find(row => row.startsWith('AccessToken='));
      const token = tokenCookie ? tokenCookie.split('=')[1] : null;
      if (!token) throw new Error('You must be logged in to apply.');

      // 1. Fetch Razorpay config (key ID)
      const configRes = await fetch('https://gd1-grand-auto-depot-one-9ms1.onrender.com/api/Payment/config');
      if (!configRes.ok) throw new Error('Could not fetch payment configuration.');
      const { keyId } = await configRes.json();

      // 2. Create Razorpay Order for the ₹12,000 application fee
      const orderRes = await fetch('https://gd1-grand-auto-depot-one-9ms1.onrender.com/api/service-center/create-application-order', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!orderRes.ok) throw new Error('Could not create payment order. Please try again.');
      const { orderId } = await orderRes.json();

      // 3. Base application payload (submitted inside the payment success handler)
      const basePayload = {
        businessName: form.businessName,
        ownerName: form.ownerName,
        contactEmail: form.email,
        phoneNumber: form.phone,
        addressLine: form.address,
        city: form.city,
        district: form.city,
        state: form.state,
        country: 'India',
        postalCode: form.zip,
        businessRegistrationUrl: form.businessRegistrationUrl,
        ownerIdProofUrl: form.ownerIdProofUrl,
        images: []
      };

      // 4. Open Razorpay Checkout
      const options = {
        key: keyId,
        amount: 1200000, // ₹12,000 in paise
        currency: 'INR',
        name: 'Grand Auto Depot',
        description: 'Service Center Application Fee — ₹12,000',
        order_id: orderId,
        handler: async function (response) {
          try {
            // 5. Submit application WITH payment ID so admin rejection triggers Razorpay refund
            const payload = {
              ...basePayload,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature
            };

            const applyRes = await fetch('https://gd1-grand-auto-depot-one-9ms1.onrender.com/api/service-center/apply', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(payload)
            });

            if (!applyRes.ok) {
              const errText = await applyRes.text();
              try {
                const errData = JSON.parse(errText);
                throw new Error(errData.message || 'Application submission failed after payment.');
              } catch {
                throw new Error(errText || 'Application submission failed after payment.');
              }
            }

            const data = await applyRes.json();
            if (!data.success) throw new Error(data.message || 'Submission failed.');

            toast.success('Application submitted! Fee of ₹12,000 paid successfully.');
            navigate('/track-application');
          } catch (err) {
            toast.error(err.message || 'An error occurred after payment.');
            setLoading(false);
          }
        },
        prefill: {
          name: form.ownerName,
          email: form.email,
          contact: form.phone
        },
        theme: { color: '#2563eb' },
        modal: {
          ondismiss: function () {
            setLoading(false);
            toast.error('Payment was cancelled.');
          }
        }
      };

      const rzp = new Razorpay(options);
      rzp.on('payment.failed', function (response) {
        toast.error('Payment failed: ' + response.error.description);
        setLoading(false);
      });
      rzp.open();

    } catch (err) {
      toast.error(err.message || 'An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#ebeced] font-sans">
      <Navbar />

      <div className="pt-28 pb-20 px-[6vw]">
        <div className="max-w-[800px] mx-auto">

          <div className="mb-10 text-center md:text-left">
            <h1 className="text-3xl md:text-5xl font-black text-[#111] tracking-tight mb-4 leading-tight">Partner as a GD1 <span className="text-[#2563eb]">Service Center</span></h1>
            <p className="text-gray-500 text-[15px] max-w-2xl">Join our exclusive network of certified service centers. Pay a <strong>₹12,000</strong> application fee to get started.</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">

            {/* Section 1: Owner Details */}
            <div className="mb-10">
              <h2 className="text-[18px] font-semibold text-[#111] mb-6 tracking-tight">1. Owner Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-bold tracking-widest text-[#111] mb-2 uppercase">Owner Name *</label>
                  <input required name="ownerName" value={form.ownerName} onChange={handleChange} placeholder="John Doe" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[13px] outline-none focus:border-[#111] focus:ring-1 focus:ring-[#111] transition-all" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold tracking-widest text-[#111] mb-2 uppercase">Contact Email *</label>
                  <input required type="email" name="email" value={form.email} onChange={handleChange} placeholder="john@example.com" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[13px] outline-none focus:border-[#111] focus:ring-1 focus:ring-[#111] transition-all" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold tracking-widest text-[#111] mb-2 uppercase">Phone Number *</label>
                  <input required name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[13px] outline-none focus:border-[#111] focus:ring-1 focus:ring-[#111] transition-all" />
                </div>
              </div>
            </div>

            <div className="w-full h-px bg-gray-100 mb-10" />

            {/* Section 2: Facility Details */}
            <div className="mb-10">
              <h2 className="text-[18px] font-semibold text-[#111] mb-6 tracking-tight">2. Facility Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold tracking-widest text-[#111] mb-2 uppercase">Business / Facility Name *</label>
                  <input required name="businessName" value={form.businessName} onChange={handleChange} placeholder="Elite Auto Vault" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[13px] outline-none focus:border-[#111] focus:ring-1 focus:ring-[#111] transition-all" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold tracking-widest text-[#111] mb-2 uppercase">Address Line *</label>
                  <input required name="address" value={form.address} onChange={handleChange} placeholder="123 Luxury Lane" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[13px] outline-none focus:border-[#111] focus:ring-1 focus:ring-[#111] transition-all" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold tracking-widest text-[#111] mb-2 uppercase">City *</label>
                  <input required name="city" value={form.city} onChange={handleChange} placeholder="Bengaluru" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[13px] outline-none focus:border-[#111] focus:ring-1 focus:ring-[#111] transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold tracking-widest text-[#111] mb-2 uppercase">State</label>
                    <input name="state" value={form.state} onChange={handleChange} placeholder="Karnataka" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[13px] outline-none focus:border-[#111] focus:ring-1 focus:ring-[#111] transition-all" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold tracking-widest text-[#111] mb-2 uppercase">Zip Code</label>
                    <input name="zip" value={form.zip} onChange={handleChange} placeholder="560001" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[13px] outline-none focus:border-[#111] focus:ring-1 focus:ring-[#111] transition-all" />
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full h-px bg-gray-100 mb-10" />

            {/* Section 3: Documents */}
            <div className="mb-10">
              <h2 className="text-[18px] font-semibold text-[#111] mb-2 tracking-tight">3. Documents</h2>
              <p className="text-[13px] text-[#666] mb-6">Please upload clear photos or valid PDF documents to speed up your verification.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[
                  { name: 'businessRegistrationUrl', label: 'Business Registration (PDF/IMG)', accept: '.pdf,image/*' },
                  { name: 'ownerIdProofUrl', label: 'Owner ID Proof (PDF/IMG)', accept: '.pdf,image/*' },
                ].map((doc) => (
                  <div key={doc.name} className="flex flex-col gap-2 p-4 rounded-xl border border-gray-200 bg-gray-50">
                    <label className="text-[11px] font-bold tracking-widest text-[#111] uppercase">{doc.label} *</label>

                    {form[doc.name] ? (
                      <div className="relative h-[120px] rounded-xl border border-gray-200 overflow-hidden group mt-1">
                        {form[doc.name].toLowerCase().includes('.pdf') ? (
                          <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center">
                            <FileText size={28} className="text-gray-400 mb-1" />
                            <span className="text-[11px] font-medium text-gray-500">PDF Document</span>
                          </div>
                        ) : (
                          <img src={form[doc.name]} alt={doc.label} className="w-full h-full object-cover" />
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-4">
                          <button type="button" onClick={() => setPreviewUrl(form[doc.name])} className="text-white hover:text-blue-400 bg-black/50 p-2 rounded-full transition-colors" title="Expand">
                            <Maximize2 size={16} />
                          </button>
                          <button type="button" onClick={() => setForm(f => ({ ...f, [doc.name]: '' }))} className="text-white hover:text-red-500 bg-black/50 p-2 rounded-full transition-colors" title="Remove">
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="relative mt-1 h-[120px]">
                        <input
                          type="file"
                          accept={doc.accept}
                          onChange={(e) => handleFileUpload(e, doc.name)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          disabled={uploading[doc.name]}
                        />
                        <div className={`w-full h-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg text-center transition-colors ${uploading[doc.name] ? 'bg-gray-50' : 'hover:bg-gray-50 hover:border-black'}`}>
                          {uploading[doc.name] ? (
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 size={18} className="animate-spin text-gray-400" />
                              <div className="w-24 h-1 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-black rounded-full animate-pulse"></div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[12px] font-medium text-[#555]">Click or drag file to upload</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full h-px bg-gray-100 mb-10" />

            {/* Payment notice + Submit */}
            <div className="flex flex-col items-center">
              <div className="w-full bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6 text-center">
                <p className="text-[13px] font-semibold text-blue-800">Application fee: <span className="text-blue-600 font-black">₹12,000</span></p>
                <p className="text-[11px] text-blue-500 mt-0.5">You will be redirected to Razorpay to complete payment. A full refund is initiated automatically if your application is rejected.</p>
              </div>
              <p className="text-[12px] text-[#888] mb-6 text-center max-w-md leading-relaxed">
                By submitting this application, you agree to the GD1 Service Center Terms &amp; Conditions.
              </p>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-8 md:px-32 py-3.5 bg-[#2563eb] hover:bg-[#2d6df0] text-white rounded-full text-[13px] font-bold tracking-widest uppercase transition-all disabled:opacity-50 whitespace-nowrap"
              >
                {loading ? 'Processing...' : 'Pay ₹12,000 & Submit'}
              </button>
            </div>

          </form>
        </div>
      </div>

      <Footer />

      {/* File Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setPreviewUrl(null)}>
          <div className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreviewUrl(null)} className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors">
              <X size={24} />
            </button>
            {previewUrl.toLowerCase().includes('.pdf') ? (
              <iframe src={previewUrl} className="w-full h-[80vh] bg-white rounded-xl shadow-2xl" title="Document Preview" />
            ) : (
              <img src={previewUrl} className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl" alt="Preview" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
