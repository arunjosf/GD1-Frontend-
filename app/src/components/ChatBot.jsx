import { useState, useRef, useEffect } from 'react';

const BOT_INTRO = {
  id: 'intro',
  role: 'bot',
  text: "Hi! I'm GD1 Assistant 👋 I can help you find the perfect garage space, check availability, explain our services, or answer any questions about your booking. What can I help you with today?",
};

function BotIcon() {
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center flex-shrink-0">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
        <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
        <path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
        <circle cx="9" cy="17" r="1" />
        <circle cx="15" cy="17" r="1" />
      </svg>
    </div>
  );
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([BOT_INTRO]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text }]);
    setThinking(true);

    // Try backend first, fall back to smart mock
    try {
      const res = await fetch('https://localhost:7108/api/ai/chat', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { id: Date.now() + 1, role: 'bot', text: data.reply || data.message }]);
        setThinking(false);
        return;
      }
    } catch {
      /* ignore */
    } // Smart mock fallback
    await new Promise(r => setTimeout(r, 1200));
    const reply = getMockReply(text);
    setMessages(prev => [...prev, { id: Date.now() + 1, role: 'bot', text: reply }]);
    setThinking(false);
  };

  const getMockReply = (msg) => {
    const m = msg.toLowerCase();
    if (m.includes('price') || m.includes('cost') || m.includes('fee'))
      return "Our pricing starts from ₹2,500/month for standard spaces and ₹6,000/month for climate-controlled premium bays. We offer flexible daily, weekly, and monthly plans. Would you like me to find spaces in your area?";
    if (m.includes('book') || m.includes('reserve') || m.includes('space'))
      return "Great! To book a space, use the search bar above — enter your location and preferred date. I can also help narrow down garages based on your vehicle type. What kind of vehicle do you have?";
    if (m.includes('garage') || m.includes('partner') || m.includes('list'))
      return "Interested in listing your garage? Head to 'Add your Garage' from the Partner With Us menu. Our team will verify your facility and get you onboarded within 48 hours!";
    if (m.includes('service') || m.includes('maintenance') || m.includes('repair'))
      return "GD1 connects you with certified service centers. You can schedule oil changes, detailing, tire rotation, and more directly from your dashboard once you've booked a space.";
    if (m.includes('safe') || m.includes('secure') || m.includes('camera') || m.includes('surveillance'))
      return "Every GD1 facility has 24/7 HD surveillance, biometric access control, and a dedicated security team. You'll also receive real-time alerts and can check your vehicle via live feed anytime.";
    if (m.includes('cancel') || m.includes('refund'))
      return "You can cancel any booking up to 24 hours before the start date for a full refund. Cancellations within 24 hours are eligible for a 50% refund or a free reschedule.";
    if (m.includes('hello') || m.includes('hi') || m.includes('hey'))
      return "Hello! 👋 Happy to help. Are you looking to book a garage space, partner with us, or need support with an existing booking?";
    return "That's a great question! Let me connect you with the right information. For the most accurate help, you can also reach our support team at support@gd1.in or use the Help Centre in the footer. Is there anything else I can help you with?";
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-[46px] h-[46px] p-[2.5px] rounded-[15px] bg-gradient-to-br from-[#ff0a54] via-[#a200ff] to-[#003cff] shadow-[0_8px_30px_rgba(0,0,0,0.15)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.25)]"
        aria-label="Open AI Chat"
      >
        <div className="w-full h-full bg-white rounded-[13px] flex items-center justify-center relative">
          {open ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3d3d3d" strokeWidth="2.5">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3d3d3d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 3-1.91 5.8a2 2 0 0 1-1.27 1.27L3 12l5.8 1.91a2 2 0 0 1 1.27 1.27L12 21l1.91-5.8a2 2 0 0 1 1.27-1.27L21 12l-5.8-1.91a2 2 0 0 1-1.27-1.27z" />
              <path d="M5.5 3l.8 2.3a1 1 0 0 0 .6.6L9 6.5l-2.1.7a1 1 0 0 0-.6.6L5.5 10l-.8-2.2a1 1 0 0 0-.6-.6L2 6.5l2.1-.7a1 1 0 0 0 .6-.6z" />
              <path d="M18.5 14l.8 2.3a1 1 0 0 0 .6.6l2.1.7-2.1.7a1 1 0 0 0-.6.6l-.8 2.2-.8-2.2a1 1 0 0 0-.6-.6l-2.1-.7 2.1-.7a1 1 0 0 0 .6-.6z" />
            </svg>
          )}
          {!open && (
            <span className="absolute -top-[2px] -right-[2px] w-[14px] h-[14px] rounded-full bg-[#ff0a54] border-2 border-white animate-pulse" />
          )}
        </div>
      </button>

      {/* Chat Panel */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-24px)] rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.2)] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          open ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-6 pointer-events-none'
        }`}
        style={{ background: 'rgba(10,10,15,0.92)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.06]">
          <BotIcon />
          <div>
            <p className="text-[13px] font-semibold text-white m-0 leading-tight">GD1 Assistant</p>
            <p className="text-[11px] text-green-400 m-0 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
              Online — powered by AI
            </p>
          </div>
          <button onClick={() => setOpen(false)} className="ml-auto text-white/40 hover:text-white/80 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="h-[340px] overflow-y-auto px-4 py-4 flex flex-col gap-3 scrollbar-thin">
          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              {msg.role === 'bot' && <BotIcon />}
              <div
                className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-sm'
                    : 'bg-white/[0.08] text-white/90 rounded-tl-sm'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {thinking && (
            <div className="flex gap-2.5 items-end">
              <BotIcon />
              <div className="bg-white/[0.08] px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick Prompts */}
        <div className="px-4 pb-2 flex gap-2 flex-wrap">
          {['Book a space', 'Pricing info', 'Partner with us'].map(q => (
            <button
              key={q}
              onClick={() => { setInput(q); setTimeout(() => inputRef.current?.focus(), 50); }}
              className="text-[11px] text-white/60 border border-white/10 rounded-full px-3 py-1 hover:border-white/30 hover:text-white/90 transition-all"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="px-4 pb-4 pt-2 border-t border-white/[0.06]">
          <div className="flex gap-2 items-center bg-white/[0.06] rounded-xl px-3 py-2 focus-within:ring-1 focus-within:ring-blue-500/50">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Ask me anything..."
              className="flex-1 bg-transparent text-[13px] text-white placeholder-white/30 outline-none"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || thinking}
              className="w-7 h-7 rounded-lg bg-blue-600 disabled:opacity-30 flex items-center justify-center hover:bg-blue-500 transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
