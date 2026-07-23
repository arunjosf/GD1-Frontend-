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
    value: '+91 98765 43210',
    sub: 'Mon–Sat, 9 AM – 8 PM IST',
    color: '#4f46e5',
    bg: '#eef2ff',
    action: 'tel:+919876543210',
  },
  {
    icon: <MessageCircle size={22} />,
    label: 'WhatsApp',
    value: '+91 98765 43210',
    sub: 'Quick replies within minutes',
    color: '#16a34a',
    bg: '#f0fdf4',
    action: 'https://wa.me/919876543210',
  },
  {
    icon: <Mail size={22} />,
    label: 'Email Support',
    value: 'support@gd1.in',
    sub: 'We reply within 24 hours',
    color: '#0284c7',
    bg: '#f0f9ff',
    action: 'mailto:support@gd1.in',
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
  const [sent, setSent] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate submission
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-[#f4f4f6] font-['Inter',sans-serif] flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden pt-36 pb-20 px-6">
        <div
          className="absolute inset-0 z-0"
          style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}
        />
        {/* Glow orbs */}
        <div className="absolute top-10 left-1/4 w-72 h-72 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #a200ff, transparent)' }} />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full opacity-15 blur-3xl"
          style={{ background: 'radial-gradient(circle, #003cff, transparent)' }} />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px] font-semibold mb-6 border"
            style={{ background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)' }}>
            <Headphones size={13} /> 24/7 Support Available
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-5 leading-tight">
            We're here to <br />
            <span style={{ background: 'linear-gradient(90deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              help you.
            </span>
          </h1>
          <p className="text-white/60 text-[16px] max-w-xl mx-auto leading-relaxed">
            Reach out to the GD1 team for any questions about bookings, partnerships, or your vehicle storage.
          </p>
        </div>
      </section>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-8 -mt-8 pb-24 relative z-10">

        {/* Support Channel Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {SUPPORT_CHANNELS.map((ch, i) => (
            <a
              key={i}
              href={ch.action}
              target={ch.action.startsWith('http') ? '_blank' : undefined}
              rel="noreferrer"
              className="group bg-white rounded-2xl p-5 border border-black/[0.04] shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300 flex flex-col gap-3"
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: ch.bg, color: ch.color }}>
                {ch.icon}
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">{ch.label}</p>
                <p className="text-[14px] font-bold text-[#111]">{ch.value}</p>
                <p className="text-[12px] text-gray-400 mt-0.5">{ch.sub}</p>
              </div>
              <div className="flex items-center gap-1 text-[12px] font-semibold mt-auto"
                style={{ color: ch.color }}>
                Contact <ChevronRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </a>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Contact Form */}
          <div className="bg-white rounded-3xl border border-black/[0.04] shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-8">
            <div className="flex items-center gap-3 mb-7">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #a200ff, #003cff)', color: 'white' }}>
                <Send size={16} />
              </div>
              <div>
                <h2 className="text-[17px] font-black text-[#111]">Send a Message</h2>
                <p className="text-[12px] text-gray-400">We'll get back to you shortly</p>
              </div>
            </div>

            {sent ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #a200ff20, #003cff20)' }}>
                  <Send size={28} className="text-indigo-500" />
                </div>
                <h3 className="text-[18px] font-black text-[#111] mb-2">Message Sent!</h3>
                <p className="text-gray-400 text-[14px]">We'll reply to <strong>{form.email}</strong> within 24 hours.</p>
                <button onClick={() => setSent(false)} className="mt-6 text-[13px] font-semibold text-indigo-500 hover:underline">
                  Send another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {[
                  { label: 'Your Name', key: 'name', type: 'text', placeholder: 'Arun Joseph' },
                  { label: 'Email Address', key: 'email', type: 'email', placeholder: 'you@email.com' },
                  { label: 'Subject', key: 'subject', type: 'text', placeholder: 'Booking issue, refund, partnership...' },
                ].map(({ label, key, type, placeholder }) => (
                  <div key={key}>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">{label}</label>
                    <input
                      type={type}
                      required
                      value={form[key]}
                      onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-[14px] text-[#111] placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Message</label>
                  <textarea
                    required
                    rows={4}
                    value={form.message}
                    onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                    placeholder="Describe your issue or question..."
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-[14px] text-[#111] placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl text-[14px] font-bold text-white flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all"
                  style={{ background: 'linear-gradient(135deg, #a200ff, #003cff)' }}
                >
                  <Send size={15} /> Send Message
                </button>
              </form>
            )}
          </div>

          {/* FAQ + Info */}
          <div className="flex flex-col gap-6">

            {/* Quick Info */}
            <div className="bg-white rounded-3xl border border-black/[0.04] shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-6 flex flex-col gap-4">
              <h2 className="text-[15px] font-black text-[#111] mb-1">Quick Info</h2>
              {[
                { icon: <Clock size={15} />, label: 'Support Hours', val: 'Mon–Sat, 9 AM – 8 PM IST', color: '#4f46e5' },
                { icon: <Zap size={15} />, label: 'Avg. Response Time', val: 'Under 2 hours', color: '#f59e0b' },
                { icon: <Shield size={15} />, label: 'Emergency Line', val: '+91 98765 99999 (24/7)', color: '#16a34a' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: item.color + '18', color: item.color }}>
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 font-semibold">{item.label}</p>
                    <p className="text-[13px] font-bold text-[#111]">{item.val}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* FAQ */}
            <div className="bg-white rounded-3xl border border-black/[0.04] shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-6">
              <h2 className="text-[15px] font-black text-[#111] mb-4">FAQs</h2>
              <div className="space-y-2">
                {FAQS.map((faq, i) => (
                  <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-[13px] font-bold text-[#111]">{faq.q}</span>
                      <ChevronRight
                        size={15}
                        className="text-gray-400 shrink-0 transition-transform duration-200"
                        style={{ transform: openFaq === i ? 'rotate(90deg)' : 'rotate(0deg)' }}
                      />
                    </button>
                    {openFaq === i && (
                      <div className="px-4 pb-4 text-[13px] text-gray-500 leading-relaxed border-t border-gray-50">
                        <div className="pt-3">{faq.a}</div>
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