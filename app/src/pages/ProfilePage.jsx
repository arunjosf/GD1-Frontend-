import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#ebeced] font-sans flex flex-col">
      <Navbar />
      <div className="flex-1 pt-32 pb-20 px-[6vw]">
        <div className="max-w-[600px] mx-auto bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.04)] border border-black/[0.04] p-8 md:p-12">
          <h1 className="text-[2rem] font-medium leading-[1.1] tracking-tight text-[#111] mb-8">
            Your Profile
          </h1>
          
          <div className="space-y-6">
            <div>
              <label className="block text-[11px] font-bold tracking-widest text-[#555] mb-2 uppercase">Full Name</label>
              <div className="text-[15px] font-medium text-[#111]">
                {typeof user === 'object' && user?.fullName ? user.fullName : 'User'}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold tracking-widest text-[#555] mb-2 uppercase">Email</label>
              <div className="text-[15px] font-medium text-[#111]">
                {typeof user === 'object' && user?.email ? user.email : 'Loading...'}
              </div>
            </div>

            <div className="pt-8 mt-8 border-t border-gray-100">
              <button 
                onClick={handleLogout}
                className="w-full sm:w-auto px-8 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-full text-[13px] font-bold tracking-widest uppercase transition-colors"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
