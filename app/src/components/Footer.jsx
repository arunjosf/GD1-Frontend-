import { Link } from 'react-router-dom';

const footerLinks = [
  {
    heading: 'Explore GD1',
    links: ['Home', 'About Us', 'Our Facilities', 'Pricing', 'Contact'],
  },
  {
    heading: 'For Vehicle Owners',
    links: ['Book a Space', 'Track Your Vehicle', 'Service History', 'Maintenance Requests', 'Live Surveillance'],
  },
  {
    heading: 'Partner Network',
    links: ['Add your Garage', 'Add your Service Center', 'Partner Guidelines', 'Certification Process', 'Partner Dashboard'],
  },
  {
    heading: 'Support',
    links: ['Help Centre', 'FAQs', 'Report an Issue', 'Community', 'System Status'],
  },
  {
    heading: 'Company',
    links: ['Our Story', 'Careers', 'Press', 'Investors', 'Legal'],
  },
];

const slugify = (text) => text.toLowerCase().replace(/ /g, '-');

export default function Footer() {
  return (
    <footer className="w-full bg-[#ebeced] font-sans">
      <div className="w-full max-w-[1200px] mx-auto px-[6vw] pt-14 pb-10">

        {/* Top Divider Line */}
        <div className="w-full h-px bg-[#111]/10 mb-7" />

        {/* Main Links Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-25 w-full">
          {footerLinks.map((col) => (
            <div key={col.heading}>
              <p className="text-[12px] font-semibold text-[#111] mb-4 tracking-tight">
                {col.heading}
              </p>
              <ul className="flex flex-col gap-2.5 list-none m-0 p-0">
                {col.links.map((link) => (
                  <li key={link}>
                    <Link
                      to={`/${slugify(link)}`}
                      className="text-[12px] text-[#555] no-underline hover:text-[#111] transition-colors duration-200"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Divider + Bottom Bar — same max-w */}
      <div className="w-full max-w-[1200px] mx-auto px-[6vw]">
        <div className="w-full h-px bg-[#111]/10" />
        <div className="py-5 flex flex-col md:flex-row items-center justify-center gap-3 text-center">
          <p className="text-[11px] text-[#888] m-0">
            Copyright &copy; {new Date().getFullYear()} Grand Auto Depot One. All rights reserved.
          </p>
          <span className="hidden md:block text-[#bbb] text-[10px]">|</span>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            {['Privacy Policy', 'Terms of Use', 'Cookie Policy', 'Legal'].map((item, i, arr) => (
              <span key={item} className="flex items-center gap-4">
                <Link to={`/${slugify(item)}`} className="text-[11px] text-[#888] no-underline hover:text-[#111] transition-colors duration-200">
                  {item}
                </Link>
                {i < arr.length - 1 && <span className="text-[#bbb] text-[10px]">|</span>}
              </span>
            ))}
          </div>
        </div>
      </div>

    </footer>
  );
}
