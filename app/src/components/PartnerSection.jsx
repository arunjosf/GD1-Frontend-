import { Link } from 'react-router-dom';

export default function PartnerSection() {
  return (
    <section className="relative w-full bg-[#ebeced] overflow-hidden">

      <div className="w-full max-w-[1200px] mx-auto px-[6vw] pt-12 pb-20 md:pt-16 md:pb-24">

        {/* Top Divider Line */}
        <div className="w-full h-px bg-[#111]/10 mb-10" />

        {/* Eyebrow */}
        <p className="text-[11px] font-bold tracking-[0.22em] uppercase text-gray-800 mb-10">
          Partner With Us
        </p>

        {/* Items */}
        <div className="flex flex-col divide-y divide-[#111]/[0.07]">

          {/* Row 1 — Garage */}
          <Link
            to="/add-garage"
            className="group flex flex-col md:flex-row md:items-center justify-between gap-6 py-8 no-underline transition-all duration-300"
          >
            <div className="flex items-start md:items-center gap-6">
              <div className="w-11 h-11 rounded-2xl bg-[#111]/8 border border-[#111]/12 flex-shrink-0 flex items-center justify-center group-hover:bg-[#111]/15 transition-colors duration-300">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.65)" strokeWidth="1.5">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <div>
                <h4 className="text-[22px] md:text-[26px] font-semibold text-[#111] tracking-tight mb-1.5 group-hover:text-[#333] transition-colors duration-300">
                  Own a Garage?
                </h4>
                <p className="text-[14px] text-[#555] max-w-md leading-relaxed">
                  List your premium facility and connect directly with high-end vehicle owners seeking secure certified storage.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 md:flex-shrink-0 pl-16 md:pl-0">
              <span className="text-[12px] font-medium text-[#888] tracking-wide group-hover:text-[#333] transition-colors duration-300">
                Apply now
              </span>
              <div className="w-8 h-8 rounded-full border border-[#111]/20 flex items-center justify-center group-hover:border-[#111]/50 group-hover:bg-[#111]/5 transition-all duration-300 group-hover:translate-x-1">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Row 2 — Service Center */}
          <Link
            to="/add-service-center"
            className="group flex flex-col md:flex-row md:items-center justify-between gap-6 py-8 no-underline transition-all duration-300"
          >
            <div className="flex items-start md:items-center gap-6">
              <div className="w-11 h-11 rounded-2xl bg-[#111]/8 border border-[#111]/12 flex-shrink-0 flex items-center justify-center group-hover:bg-[#111]/15 transition-colors duration-300">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.65)" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </div>
              <div>
                <h4 className="text-[22px] md:text-[26px] font-semibold text-[#111] tracking-tight mb-1.5 group-hover:text-[#333] transition-colors duration-300">
                  Run a Service Center?
                </h4>
                <p className="text-[14px] text-[#555] max-w-md leading-relaxed">
                  Become a certified GD1 maintenance provider and reach owners who demand only white-glove care for their vehicles.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 md:flex-shrink-0 pl-16 md:pl-0">
              <span className="text-[12px] font-medium text-[#888] tracking-wide group-hover:text-[#333] transition-colors duration-300">
                Apply now
              </span>
              <div className="w-8 h-8 rounded-full border border-[#111]/20 flex items-center justify-center group-hover:border-[#111]/50 group-hover:bg-[#111]/5 transition-all duration-300 group-hover:translate-x-1">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

        </div>

      </div>

    </section>
  );
}
