import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

export default function ServiceSection() {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (videoRef.current) {
              videoRef.current.currentTime = 0;
              videoRef.current.play().catch(e => console.log("Auto-play prevented", e));
            }
          } else {
            if (videoRef.current) {
              videoRef.current.pause();
            }
          }
        });
      },
      { threshold: 0.3 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-screen h-screen max-md:h-[85svh] overflow-hidden font-sans bg-[#ebeced]">
      
      {/* ── ROOM BACKGROUND (Mimics video lighting perfectly to hide any gaps) ── */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          background: 'linear-gradient(to bottom, #d9dcde 0%, #cbcdcf 45%, #b2b4b6 100%)'
        }}
      />

      {/* ── PERFECT FOREGROUND VIDEO (Anchored top right, slightly decreased size) ── */}
      <div 
        className="absolute top-0 right-0 h-[85vh] aspect-[16/9] z-0 max-md:inset-0 max-md:w-full max-md:h-full max-md:aspect-auto md:[mask-image:linear-gradient(to_right,transparent_0%,transparent_15%,black_35%)] md:[-webkit-mask-image:linear-gradient(to_right,transparent_0%,transparent_15%,black_35%)]"
      >
        <video
          ref={videoRef}
          src="/section3.mp4"
          muted
          playsInline
          className="w-full h-full object-cover md:translate-x-[5%]"
        />
      </div>

      {/* ── TOP BLEND: Seamlessly blends the top of the video into the second section ── */}
      <div 
        className="absolute top-0 left-0 w-full h-[20vh] z-30 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, #ebeced 0%, rgba(235,236,237,0.85) 30%, transparent 100%)',
        }}
      />

      {/* ── BOTTOM BLEND: Seamlessly fades the bottom edge of the video ── */}
      <div 
        className="absolute bottom-0 left-0 w-full h-[35vh] z-30 pointer-events-none"
        style={{
          /* Solid at the very bottom (where there is no video), then fades smoothly over the video's bottom edge */
          background: 'linear-gradient(to top, #ebeced 0%, #ebeced 40%, rgba(235,236,237,0.8) 60%, transparent 100%)',
        }}
      />

      {/* ── LEFT BLEND: Smoother, more gradual fade for text (Mirroring CinematicHero) ── */}
      <div 
        className="max-md:hidden absolute inset-0 z-10 pointer-events-none"
        style={{
          /* Even softer fade: almost invisible over the car, slowly building up to the text */
          background: 'linear-gradient(to right, rgba(235,236,237,0.95) 0%, rgba(235,236,237,0.6) 20%, rgba(235,236,237,0.15) 45%, transparent 65%)',
        }} 
      />

      {/* ── MOBILE OVERLAY ── */}
      <div className="md:hidden absolute inset-0 z-10 pointer-events-none bg-gradient-to-t from-[#ebeced] via-[#ebeced]/90 to-transparent" />

      {/* ── TEXT CONTENT on left (Elevated above all blends) ── */}
      <div className="absolute inset-0 z-40 flex flex-col justify-center px-[6vw] max-md:justify-end max-md:pb-[8vh]">
        <div 
          className={`max-w-[500px] flex flex-col gap-7 max-md:gap-5 -mt-[10vh] max-md:mt-0 transition-all duration-[1500ms] ease-[cubic-bezier(0.16,1,0.3,1)] delay-300 ${
            isVisible ? 'opacity-100 translate-x-0 translate-y-0' : 'opacity-0 md:-translate-x-[50vw] max-md:translate-y-[10vh]'
          }`}
        >

          <p className="text-[11px] font-bold tracking-[0.22em] uppercase text-[#888] m-0">
            White-Glove Service
          </p>

          <h2 className="text-[clamp(2.6rem,4.2vw,4.8rem)] font-medium leading-[1.07] tracking-[-0.03em] text-[#111] m-0">
            Pristine.<br />
            Maintained.<br />
            <em className="italic font-light">Ready.</em>
          </h2>

          <p className="text-[15px] leading-[1.72] text-[#555] m-0 max-w-[360px]">
            Daily startup checks, weekly vehicle updates, smart diagnostics, and direct owner service booking with nearby service centers for on-site lot servicing.
          </p>

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
    </div>
  );
}
