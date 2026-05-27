import Navbar from '../components/Navbar';
import CinematicHero from '../components/CinematicHero';
import SecuritySection from '../components/SecuritySection';
import ServiceSection from '../components/ServiceSection';
import PartnerSection from '../components/PartnerSection';
import Footer from '../components/Footer';

export default function LandingPage() {
  return (
    <div className="bg-[#ebeced] overflow-x-hidden w-full">
      <Navbar />
      
      {/* ── CINEMATIC HERO SECTION ── */}
      <CinematicHero />
      
      {/* ── SECURITY SECTION ── */}
      <SecuritySection />
      
      {/* ── SERVICE SECTION ── */}
      <ServiceSection />
      
      {/* ── PARTNER SECTION ── */}
      <PartnerSection />

      {/* ── FOOTER ── */}
      <Footer />
    </div>
  );
}
