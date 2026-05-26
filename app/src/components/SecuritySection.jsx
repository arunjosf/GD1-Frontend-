import { Link } from 'react-router-dom';

export default function SecuritySection() {
  return (
    <div className="relative w-screen h-screen overflow-hidden font-sans bg-white">
      {/* ── FULL SCREEN VIDEO (raw, no overlay) ── */}
      <video
        src="/security_video_2.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover object-left z-0"
      />

      {/* ── TOP BLEND: Softens the horizontal edge between sections ── */}
      <div 
        className="absolute top-0 left-0 w-full h-[20vh] z-30 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, #f1f2f4 0%, rgba(241,242,244,0.8) 15%, transparent 100%)',
        }}
      />

      {/* ── RIGHT BLEND: Uses white to match the bright video background and mirrors the first section exactly ── */}
      <div 
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: 'linear-gradient(to left, #ffffff 18%, rgba(255,255,255,0.6) 35%, transparent 52%)',
        }} 
      />

      {/* ── TEXT CONTENT on right ── */}
      <div className="absolute inset-0 z-20 flex justify-end items-center px-[6vw]">
        <div className="max-w-[500px] flex flex-col gap-7 animate-[fadeSlideIn_1s_ease_both]">

          <p className="text-[11px] font-bold tracking-[0.22em] uppercase text-[#888] m-0">
            Uncompromising Security
          </p>

          <h2 className="text-[clamp(2.6rem,4.2vw,4.8rem)] font-medium leading-[1.07] tracking-[-0.03em] text-[#111] m-0">
            Impenetrable.<br />
            Protected.<br />
            <em className="italic font-light">Secure.</em>
          </h2>

          <p className="text-[15px] leading-[1.72] text-[#555] m-0 max-w-[360px]">
            Military-grade security and 24/7 HD monitoring. The ultimate sanctuary for your automotive investments, keeping them safe from every threat.
          </p>

          {/* Learn More button matching CinematicHero */}
          <Link
            to="/register"
            className="inline-flex items-center gap-3.5 bg-[#111] text-white no-underline rounded-full pl-6 pr-1.5 py-1.5 text-[14px] font-semibold w-fit shadow-[0_8px_30px_rgba(0,0,0,0.18)] transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_14px_40px_rgba(0,0,0,0.26)] group"
          >
            Explore Security
            <div className="w-[36px] h-[36px] rounded-full bg-white flex items-center justify-center shrink-0">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>
          </Link>

        </div>
      </div>
    </div>
  );
}
