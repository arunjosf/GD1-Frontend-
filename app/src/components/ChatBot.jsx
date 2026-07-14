import { useState, useRef, useEffect } from 'react';

const BOT_INTRO = {
  id: 'intro',
  role: 'bot',
  text: "Hi! I'm Lara, your GD1 Assistant. I can help you find the perfect garage space, check availability, explain our services, or answer any questions about your booking. What can I help you with today?",
};

function GirlAvatar() {
  return (
    <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden" style={{ background: 'linear-gradient(135deg, #ff0a54, #a200ff)' }}>
      <svg viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg" width="32" height="32">
        {/* Hair */}
        <path d="M8 15 Q9 6 18 6 Q27 6 28 15 Q26 9 18 10 Q10 9 8 15Z" fill="#3d2000" />
        {/* Face */}
        <circle cx="18" cy="17" r="7.5" fill="#FDBCB4" />
        {/* Hair sides */}
        <path d="M10.5 14 Q8 18 9 22 Q10 14 10.5 14Z" fill="#3d2000" />
        <path d="M25.5 14 Q28 18 27 22 Q26 14 25.5 14Z" fill="#3d2000" />
        {/* Hair top */}
        <path d="M10 14 Q10 7 18 7 Q26 7 26 14 Q23 10 18 10 Q13 10 10 14Z" fill="#3d2000" />
        {/* Body / shirt */}
        <path d="M9 36 Q9 27 18 27 Q27 27 27 36Z" fill="#a200ff" />
        {/* Neck */}
        <rect x="15.5" y="23" width="5" height="5" rx="1" fill="#FDBCB4" />
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

    try {
      const res = await fetch('https://gd1-grand-auto-depot-one-9ms1.onrender.com/api/aichat/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: text }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { id: Date.now() + 1, role: 'bot', text: data.reply }]);
      } else {
        setMessages(prev => [...prev, { id: Date.now() + 1, role: 'bot', text: "Sorry, I am having trouble connecting to the server right now." }]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'bot', text: "Sorry, my network connection failed." }]);
    } finally {
      setThinking(false);
    }
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

      {/* Chat Panel - Gradient border wrapper */}
      <div
        className={`fixed bottom-24 z-50 w-[360px] max-w-[calc(100vw-32px)] right-0 left-0 mx-auto sm:left-auto sm:right-6 sm:mx-0 rounded-2xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-[0_20px_60px_rgba(0,0,0,0.15)] ${
          open ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-6 pointer-events-none'
        }`}
        style={{ padding: '1.5px', background: 'linear-gradient(135deg, #ff0a54, #a200ff, #003cff)', borderRadius: '1rem' }}
      >
        {/* White inner panel */}
        <div style={{ background: 'white', borderRadius: 'calc(1rem - 1.5px)', overflow: 'hidden' }}>

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
            <GirlAvatar />
            <div>
              <p className="text-[13px] font-semibold text-black m-0 leading-tight">Lara</p>
              <p className="text-[11px] text-black m-0 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                bot
              </p>
            </div>
            <button onClick={() => setOpen(false)} className="ml-auto text-gray-400 hover:text-gray-700 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages - scrollbar hidden */}
          <div
            className="h-[340px] overflow-y-auto px-4 py-4 flex flex-col gap-3"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <style>{`.chat-scroll::-webkit-scrollbar { display: none; }`}</style>
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {msg.role === 'bot' && <GirlAvatar />}
                <div
                  className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-[#a200ff] to-[#003cff] text-white rounded-tr-sm'
                      : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {thinking && (
              <div className="flex gap-2.5 items-end">
                <GirlAvatar />
                <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
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
                className="text-[11px] text-gray-500 border border-gray-200 rounded-full px-3 py-1 hover:border-purple-400 hover:text-purple-600 transition-all"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="px-4 pb-4 pt-2 border-t border-gray-100">
            <div className="flex gap-2 items-center bg-gray-50 rounded-xl px-3 py-2 focus-within:ring-1 focus-within:ring-purple-400">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Ask me anything..."
                className="flex-1 bg-transparent text-[13px] text-gray-800 placeholder-gray-400 outline-none"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || thinking}
                className="w-7 h-7 rounded-lg disabled:opacity-30 flex items-center justify-center transition-colors"
                style={{ background: 'linear-gradient(135deg, #ff0a54, #a200ff)' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}