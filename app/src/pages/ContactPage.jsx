import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  Phone, Mail, MapPin, Clock, MessageCircle,
  Send, ChevronRight, Headphones, Shield, Zap
} from 'lucide-react';

const SUPPORT_CHANNELS = [
  {
    icon: <Phone size={22} />,
    label: 'Call Us',
    value: '+91 8086699324',
    sub: 'Mon–Sat, 9 AM – 8 PM IST',
    color: '#111827',
    bg: '#f3f4f6',
    action: 'tel:+918086699324',
  },
  {
    icon: <MessageCircle size={22} />,
    label: 'WhatsApp',
    value: '+91 8086699324',
    sub: 'Quick replies within minutes',
    color: '#16a34a',
    bg: '#f0fdf4',
    action: 'https://wa.me/918086699324',
  },
  {
    icon: <Mail size={22} />,
    label: 'Email Support',
    value: 'arunjoseph400@gmail.com',
    sub: 'We reply within 24 hours',
    color: '#2563eb',
    bg: '#eff6ff',
    action: 'mailto:arunjoseph400@gmail.com',
  },
  {
    icon: <MapPin size={22} />,
    label: 'Head Office',
    value: 'Kochi, Kerala, India',
    sub: 'KINFRA Tech Park, Kakkanad',
    color: '#dc2626',
    bg: '#fef2f2',
    action: 'https://maps.google.com',
  },
];

const FAQS = [
  { q: 'How do I book a garage?', a: 'Search for available garages on the home page, select your preferred slot, and complete the payment. You\'ll receive a confirmation instantly.' },
  { q: 'Can I cancel my booking?', a: 'Yes, bookings can be cancelled before the vehicle is stored. Refunds are processed within 5–7 business days.' },
  { q: 'How do I register my vehicle?', a: 'Go to My Vehicles from the navigation menu and click "Add Vehicle". Fill in your vehicle details and submit.' },
  { q: 'How do I become a garage partner?', a: 'Click "Partner With Us" from the home page, fill in your property details and submit an application. Our team will review it within 48 hours.' },
];

export default function ContactPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);

    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: "8667caca-17eb-4558-a428-8242a4954013",
          name: form.name,
          email: form.email,
          subject: form.subject,
          message: form.message,
        }),
      });
      
      const result = await res.json();
      if (result.success) {
        setSent(true);
        setForm({ name: '', email: '', subject: '', message: '' });
      } else {
        alert("Failed to send message. Please make sure you added a valid Web3Forms access key.");
      }
    } catch (error) {
      console.error(error);
      alert("Network error occurred.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-['Inter',sans-serif] flex flex-col selection:bg-gray-900 selection:text-white">
      <Navbar />

      {/* Hero (Clean Minimal) */}
      <section className="pt-36 pb-20 px-6 bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-6 border border-gray-200 text-gray-600 bg-gray-50">
            <Headphones size={13} /> 24/7 Support Available
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight mb-5 leading-tight">
            We're here to <br className="hidden md:block" />
            <span className="text-blue-700">help you.</span>
          </h1>
          <p className="text-gray-500 text-[16px] max-w-xl mx-auto leading-relaxed">
            Reach out to the GD1 team for any questions about bookings, partnerships, or your vehicle storage.
          </p>
        </div>
      </section>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">

        {/* Support Channel Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {SUPPORT_CHANNELS.map((ch, i) => (
            <a
              key={i}
              href={ch.action}
              target={ch.action.startsWith('http') ? '_blank' : undefined}
              rel="noreferrer"
              className="group bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-300 flex flex-col gap-4"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: ch.bg, color: ch.color }}>
                {ch.icon}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{ch.label}</p>
                <p className="text-sm font-bold text-gray-900">{ch.value}</p>
                <p className="text-xs text-gray-500 mt-1">{ch.sub}</p>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold mt-auto"
                style={{ color: ch.color }}>
                Contact <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </a>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* Contact Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-900 text-white">
                <Send size={18} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Send a Message</h2>
                <p className="text-sm text-gray-500">We'll get back to you shortly</p>
              </div>
            </div>

            {sent ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-green-50 border border-green-100">
                  <Shield size={28} className="text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                <p className="text-gray-500 text-sm max-w-xs mx-auto">
                  Thank you for reaching out. Our support team will get back to you at <strong>{form.email || 'your email'}</strong> within 24 hours.
                </p>
                <button onClick={() => setSent(false)} className="mt-8 text-sm font-bold text-blue-600 hover:underline">
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {[
                    { label: 'Your Name', key: 'name', type: 'text', placeholder: 'John Doe' },
                    { label: 'Email Address', key: 'email', type: 'email', placeholder: 'john@example.com' },
                  ].map(({ label, key, type, placeholder }) => (
                    <div key={key}>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">{label}</label>
                      <input
                        type={type}
                        required
                        value={form[key]}
                        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Subject</label>
                  <input
                    type="text"
                    required
                    value={form.subject}
                    onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                    placeholder="What is this regarding?"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Message</label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                    placeholder="Describe your issue or question..."
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all bg-blue-600 hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <Send size={16} className={sending ? "animate-pulse" : ""} /> {sending ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>

          {/* FAQ + Info */}
          <div className="flex flex-col gap-6">

            {/* Quick Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col gap-5">
              <h2 className="text-lg font-bold text-gray-900 mb-2">Quick Info</h2>
              {[
                { icon: <Clock size={16} />, label: 'Support Hours', val: 'Mon–Sat, 9 AM – 8 PM IST', color: 'text-blue-600', bg: 'bg-blue-50' },
                { icon: <Zap size={16} />, label: 'Avg. Response Time', val: 'Under 2 hours', color: 'text-orange-600', bg: 'bg-orange-50' },
                { icon: <Shield size={16} />, label: 'Emergency Line', val: '+91 8086699324 (24/7)', color: 'text-green-600', bg: 'bg-green-50' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.bg} ${item.color}`}>
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-0.5">{item.label}</p>
                    <p className="text-sm font-bold text-gray-900">{item.val}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* FAQ */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
              <div className="space-y-3">
                {FAQS.map((faq, i) => (
                  <div key={i} className="border border-gray-100 rounded-xl overflow-hidden bg-gray-50">
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-sm font-bold text-gray-900 pr-4">{faq.q}</span>
                      <ChevronRight
                        size={16}
                        className="text-gray-400 shrink-0 transition-transform duration-200"
                        style={{ transform: openFaq === i ? 'rotate(90deg)' : 'rotate(0deg)' }}
                      />
                    </button>
                    {openFaq === i && (
                      <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-100">
                        <div className="pt-4">{faq.a}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}