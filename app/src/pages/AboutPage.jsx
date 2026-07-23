import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Target, Zap, Shield, Globe, Clock, ChevronRight } from 'lucide-react';

const PROGRESS_LIST = [
  {
    year: '2023',
    title: 'The Concept',
    description: 'GD1 was founded with a vision to revolutionize urban parking and vehicle storage. We realized the chaotic nature of finding secure parking needed a digital-first solution.',
    icon: <Target size={18} />
  },
  {
    year: '2024',
    title: 'Platform Launch',
    description: 'We launched the core platform, connecting vehicle owners directly with verified garage owners and service centers in real-time.',
    icon: <Zap size={18} />
  },
  {
    year: '2025',
    title: 'Nationwide Expansion',
    description: 'Expanded our operations across major cities, integrating smart AI chatbot assistants and real-time tracking for ultimate peace of mind.',
    icon: <Globe size={18} />
  },
  {
    year: 'Future',
    title: 'Autonomous Integrations',
    description: 'Preparing for the autonomous era with automated valet parking integrations and smart-charging lot facilities.',
    icon: <Clock size={18} />
  }
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white font-['Inter',sans-serif] flex flex-col selection:bg-gray-900 selection:text-white">
      <Navbar />

      <main className="flex-1 pt-36 pb-24 px-6 md:px-12 max-w-5xl mx-auto w-full">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-6 border border-gray-200 text-gray-600 bg-gray-50 uppercase tracking-widest">
            <Shield size={13} /> Our Story
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight mb-6 leading-tight">
            Redefining vehicle <br className="hidden md:block" />
            <span className="text-blue-600">storage & care.</span>
          </h1>
          <p className="text-gray-500 text-lg leading-relaxed">
            GD1 (Grand Auto Depot One) is a premium digital platform designed to seamlessly connect vehicle owners with highly secure, verified parking spaces, long-term storage facilities, and certified service centers. We eliminate the stress of vehicle management.
          </p>
        </div>

        {/* Progress Timeline */}
        <div className="relative border-l border-gray-100 ml-4 md:ml-8 space-y-16 mt-24">
          {PROGRESS_LIST.map((item, i) => (
            <div key={i} className="relative pl-10 md:pl-16 group">
              {/* Timeline dot */}
              <div className="absolute -left-[18px] top-0.5 w-9 h-9 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 group-hover:text-blue-600 group-hover:border-blue-200 group-hover:bg-blue-50 transition-all duration-300 shadow-sm">
                {item.icon}
              </div>
              
              <div className="bg-gray-50 border border-gray-100 rounded-3xl p-8 hover:bg-gray-100/50 transition-colors">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-gray-900 text-xs font-bold tracking-widest uppercase rounded-full mb-4 shadow-sm border border-gray-200">
                  {item.year}
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-500 leading-relaxed text-sm md:text-base">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Closing CTA */}
        <div className="mt-32 text-center bg-gray-900 rounded-[3rem] p-12 md:p-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20"></div>
          
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Join the revolution.</h2>
            <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
              Whether you are looking for secure storage or want to partner your garage with us, GD1 is your ultimate destination.
            </p>
            <a href="/add-garage" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-sm font-bold text-gray-900 bg-white hover:bg-gray-100 transition-colors">
              Partner with GD1 <ChevronRight size={16} />
            </a>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
