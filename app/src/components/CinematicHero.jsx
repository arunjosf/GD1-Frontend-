import { Link } from 'react-router-dom';

export default function CinematicHero() {
  return (
    <div className="relative w-screen h-screen overflow-hidden font-sans bg-[#ebeced]">
      {/* ── ROOM BACKGROUND (Mimics video lighting perfectly to hide any gaps) ── */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          background: 'linear-gradient(to bottom, #d9dcde 0%, #cbcdcf 45%, #b2b4b6 100%)'
        }}
      />

      {/* ── PERFECT FOREGROUND VIDEO (Car stays exactly on right) ── */}
      <div 
        className="absolute top-0 right-0 h-full aspect-[16/9] z-0"
        style={{
          /* Smooth, wide blend: Starts after the worst vignette (6%) and fades softly to 25%, providing a much smoother transition without ever touching the car. */
          maskImage: 'linear-gradient(to right, transparent 0%, transparent 6%, black 25%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, transparent 6%, black 25%)'
        }}
      >
        <video
          src="/hero_video.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        />
      </div>

      {/* ── LEFT BLEND: Classic soft fade for text ── */}
      <div 
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: 'linear-gradient(to right, #ebeced 10%, rgba(235,236,237,0.7) 25%, transparent 38%)',
        }} 
      />

      {/* ── BOTTOM BLEND: fades the bottom of the video into the page background ── */}
      <div 
        className="absolute bottom-0 left-0 w-full h-[20vh] z-10 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, #ebeced 0%, rgba(235,236,237,0.85) 30%, transparent 100%)',
        }} 
      />

      {/* ── TEXT CONTENT on left ── */}
      <div className="absolute inset-0 z-20 flex flex-col justify-center px-[6vw]">
        <div className="max-w-[500px] flex flex-col gap-7 animate-[fadeSlideIn_1s_ease_both]">

          <p className="text-[11px] font-bold tracking-[0.22em] uppercase text-[#888] m-0">
            Grand Auto Depot One
          </p>

          <h1 className="text-[clamp(2.6rem,4.2vw,4.8rem)] font-medium leading-[1.07] tracking-[-0.03em] text-[#111] m-0">
            The safest home<br />
            for your prized<br />
            <em className="italic font-light">vehicle.</em>
          </h1>

          <p className="text-[15px] leading-[1.72] text-[#555] m-0 max-w-[360px]">
            Protect your legacy with 24/7 HD surveillance, flawless preservation, and dedicated maintenance tracking-all in one secure facility.
          </p>

          {/* Book Your Lot button */}
         <Link
  to="/register"
  className="inline-flex items-center bg-[#2563eb] text-white no-underline rounded-full pl-6 pr-1.5 py-1.5 text-[14px] font-semibold w-fit shadow-[0_8px_30px_rgba(0,0,0,0.18)] transition-all duration-300  hover:shadow-[0_14px_40px_rgba(0,0,0,0.26)] group overflow-hidden"
>
  {/* Text + animated arrows */}
  <div className="flex items-center">
    <span>Book Your Space</span>

    {/* Hidden arrows initially */}
    <div className="flex max-w-0 opacity-0 overflow-hidden transition-all duration-600 group-hover:max-w-[40px] group-hover:opacity-100">
      <span className="ml-2 tracking-[1px] text-gray-300">&gt;&gt;</span>
    </div>
  </div>

  {/* White circle */}
  <div className="w-[36px] h-[36px] ml-3 group-hover:ml-0 group-hover:mr-2 rounded-full bg-white flex items-center justify-center shrink-0 transition-all duration-300 group-hover:translate-x-2">
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#111"
      strokeWidth="2.5"
      className="transition-transform duration-300 "
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  </div>
</Link>

        </div>
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateX(-24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
