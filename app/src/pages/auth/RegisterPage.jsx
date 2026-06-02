import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { authApi } from '../../api/auth';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, X } from "lucide-react";
import { toast } from 'react-hot-toast';


const EmailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);


const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);


// ── NEW: OTP Modal popup ───────────────────────────────────────────────────────
function OtpModal({ email, onClose, onVerify, onResend, onSuccess }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [verifyError, setVerifyError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (val, idx) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus();
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0)
      document.getElementById(`otp-${idx - 1}`)?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      document.getElementById('otp-5')?.focus();
    }
    e.preventDefault();
  };

  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length < 6) { setVerifyError('Please enter all 6 digits'); return; }
    setLoading(true);
    setVerifyError('');
    const loadingToast = toast.loading('Verifying OTP...');
    try {
      const result = await onVerify(code);
      if (result.success) {
        toast.success('Authenticated successfully!', { id: loadingToast });
        onClose();
        if (onSuccess) onSuccess(result.user);
      } else {
        toast.dismiss(loadingToast);
        setVerifyError(result.message || 'Invalid OTP');
      }
    } catch {
      toast.dismiss(loadingToast);
      setVerifyError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    const loadingToast = toast.loading('Resending OTP...');
    try {
      await onResend();
      toast.success('New OTP sent to your email.', { id: loadingToast });
      setOtp(['', '', '', '', '', '']);
      setVerifyError('');
    } catch {
      toast.error('Failed to resend OTP.', { id: loadingToast });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white w-full max-w-sm mx-4 p-8 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors">
          <X size={18} />
        </button>
        <div className='flex gap-2 mb-6'>
          <img src="/GD1 Logo.png" className="w-10 h-10" alt="GD1" />
          <h2 className="text-[27px] tracking-loose text-black">GD1</h2>
        </div>
        <h3 className="text-[18px] font-medium text-black mb-2">Verify your email</h3>
        <p className="text-[13px] text-gray-500 mb-6">
          We sent a 6-digit OTP to <strong>{email}</strong>. Enter it below to activate your account.
        </p>
        <div className="flex gap-2 justify-between mb-4" onPaste={handlePaste}>
          {otp.map((digit, idx) => (
            <input
              key={idx}
              id={`otp-${idx}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(e.target.value, idx)}
              onKeyDown={e => handleKeyDown(e, idx)}
              autoFocus={idx === 0}
              className="w-11 h-12 text-center text-[20px] font-semibold border border-gray-300
                         outline-none focus:border-black focus:ring-1 focus:ring-black
                         transition-all caret-transparent"
            />
          ))}
        </div>
        {verifyError && <p className="text-[12px] text-red-500 mb-3">{verifyError}</p>}
        <button
          onClick={handleVerifyOtp}
          disabled={loading}
          className="w-full bg-[#2563eb] hover:bg-blue-700 text-white text-[13px] py-2 font-semibold transition-colors mb-3"
        >
          {loading ? 'VERIFYING...' : 'Verify Email'}
        </button>
        <button onClick={handleResendOtp} className="w-full text-[13px] text-blue-600 hover:underline">
          Resend OTP
        </button>
      </div>
    </div>
  );
}
// ── END OTP Modal ─────────────────────────────────────────────────────────────


export default function RegisterPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [form, setForm] = useState({ fullname: '', email: '', password: '', confirmpassword: '' });
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const loadingToast = toast.loading('Authenticating with Google...');
      try {
        const result = await authApi.googleLogin(tokenResponse.access_token);
        if (result.success) {
          toast.success(result.isNewUser ? 'Registration successful!' : 'Login successful!', { id: loadingToast });
          if (result.user) setUser(result.user);
          else setUser(true);
          localStorage.setItem('isAuthenticated', 'true');
          navigate('/home');
        } else {
          toast.error(result.message || 'Google registration failed', { id: loadingToast });
          setErrors({ form: result.message || 'Google registration failed' });
        }
      } catch {
        toast.error('Google registration failed.', { id: loadingToast });
        setErrors({ form: 'Google registration failed.' });
      }
    },
    onError: () => toast.error('Google login was unsuccessful.')
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false); 


  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    const errs = {};
    if (!form.fullname) errs.fullname = 'Fullname required';
    if (!form.email) errs.email = 'Email required';
    if (!form.password) errs.password = 'Password required';
    if (!form.confirmpassword) errs.confirmpassword = 'Confirm Password required';
    else if (form.password && form.password !== form.confirmpassword) errs.confirmpassword = 'Passwords do not match';
    return errs;
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  const errs = validate();
  if (Object.keys(errs).length) return setErrors(errs);

    const loadingToast = toast.loading('Creating account...');
    setLoading(true);
    try {
      const result = await authApi.register({
        fullName: form.fullname,
        email:    form.email,
        password: form.password,
        confirmPassword: form.confirmpassword
        
      });

      if (result.success) {
        toast.success('Registration initiated! Please verify your email.', { id: loadingToast });
        setShowOtpModal(true); // CHANGED: open modal instead of setRegistered(true)
      } else {
        toast.dismiss(loadingToast); // CHANGED: no error toast — show inline only
        setErrors({ form: result.message || 'Registration failed' });
      }
    } catch {
      toast.dismiss(loadingToast); // CHANGED: no error toast — show inline only
      setErrors({ form: 'Something went wrong. Try again.' });
    } finally {
      setLoading(false);
    }
};

  return (
    <>
      {/* CHANGED: OTP modal overlay — form stays mounted behind it */}
      {showOtpModal && (
        <OtpModal
          email={form.email}
          onClose={() => setShowOtpModal(false)}
          onVerify={(code) => authApi.verifyEmail(form.email, code)}
          onResend={() => authApi.sendOtp(form.email)}
          onSuccess={(user) => {
            if (user) setUser(user);
            else setUser(true);
            localStorage.setItem('isAuthenticated', 'true');
            navigate('/home');
          }}
        />
      )}

    <div className="h-screen w-full flex font-sans text-gray-900 bg-white overflow-hidden">

      <div className="relative hidden md:flex flex-col w-[100%] h-full bg-black">

        <div className="absolute top-8 left-10 z-30 flex items-center gap-3">
         
         
        </div>

        <div className="relative flex-1 w-full min-h-0 flex flex-col justify-end px-12 pb-4">
          <img
            src="/Authpage.png"
            className="absolute inset-0 w-full h-full object-cover"
            alt="Vault Garage"
          />
          <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-black via-black/60 to-transparent z-10" />

          <div className="relative z-20">
            <div className="inline-flex items-center gap-2 px-3 py-1  rounded-full 
  bg-gray/10 backdrop-blur-md 
  border border-white/20 
  shadow-[0_4px_20px_rgba(0,0,0,0.2)] 
  text-[10px] font-medium tracking-wide text-white mb-3 w-fit">

  <span className="block w-1.5 h-1.5 rounded-full bg-blue-500"></span>
  BAY 07 Â· SECURE STORAGE
</div>

            <h1 className="text-[2.6rem] font-light text-white leading-[1.1] tracking-tight">
              Where every <span className="italic text-blue-600" style={{ fontFamily: 'Georgia, serif' }}>machine</span><br />
rests in safety.
            </h1>
          </div>
        </div>

        <div className="relative z-20 px-12 pb-10 pt-0 shrink-0 bg-black">
          <p className="text-gray-400 text-[13px] leading-relaxed  mb-7">
            Refined storage conditions, scheduled maintenance, and 24/7 surveillance for the cars you love most.
          </p>
          <div className="grid grid-cols-3 w-[50%] mb-8">
            <div>
              <div className="text-gray-300 text-[1.8rem] font-light tracking-tight mb-0.5">24/7</div>
              <div className="text-[11px] text-gray-500">Features</div>
            </div>
            <div>
              <div className="text-gray-300 text-[1.8rem] font-light tracking-tight mb-0.5">65Â°F</div>
              <div className="text-[11px] text-gray-500">65Â°F</div>
            </div>
            <div>
              <div className="text-gray-300 text-[1.8rem] font-light tracking-tight mb-0.5">256-bit</div>
              <div className="text-[11px] text-gray-500">256-bit</div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative flex flex-col items-center justify-center w-full md:w-[50%] h-full bg-white">

        <div className="w-full max-w-[390px] px-10">

          <div className="mb-5">
            <div className="flex items-center gap-3 mb-3">
            </div>
            <div className='flex gap-2'>
            <img
            src="/GD1 Logo.png"
            className="w-10 h-10"
            alt="Vault Garage"
          />
            <h2 className="text-[27px]  tracking-loose mb-3 text-black">GD1</h2>
                        </div>

            <p className="text-gray-800 font-medium text-[13px] leading-snug">
              Grand Auto Depot One
            </p>
          </div>

          {/* CHANGED: removed registered ternary — form always shows, modal overlays */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>  {/* CHANGED: noValidate kills browser native popup */}

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <label className="text-[11px] font-bold text-black tracking-widest">FullName</label>
              </div>
              <div className={`relative flex items-center border overflow-hidden focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all border-gray-300`}>  {/* CHANGED: always border-gray-300, no red */}
                <input
                  type="text"
                  name="fullname"
                  value={form.fullname}
                  onChange={handleChange}
                  className="w-full pl-2.5 pr-4 py-2 outline-none bg-transparent text-[13px]"
                  placeholder="Enter your fullname"
                />
              </div>
              {errors.fullname && <p className="text-[11px] text-red-500 mt-1">{errors.fullname}</p>}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <label className="text-[11px] font-bold text-black tracking-widest">Email</label>
              </div>
              <div className={`relative flex items-center border overflow-hidden focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all border-gray-300`}>  {/* CHANGED: always border-gray-300, no red */}
                <input
                  type="text"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full pl-2.5 pr-4 py-2 outline-none bg-transparent text-[13px]"
                  placeholder="Enter your email"
                />
                 <div className="absolute right-3 flex items-center pointer-events-none">
                  <EmailIcon />
                </div>
              </div>
              {errors.email && <p className="text-[11px] text-red-500 mt-1">{errors.email}</p>}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <label className="text-[11px] font-bold text-black tracking-widest ">Password</label>
              </div>
              <div className={`relative flex items-center border  overflow-hidden focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all border-gray-300`}>  {/* CHANGED: always border-gray-300, no red */}
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full pl-2.5 pr-10 py-2 outline-none bg-transparent text-[13px] tracking-widest"
                  placeholder="•••••••••••"
                />
                <div className="absolute right-3 flex items-center">
                  <button type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />} 
                  </button>
                </div>
              </div>
              {errors.password && <p className="text-[11px] text-red-500 mt-1">{errors.password}</p>}

                 <div>
              <div className="flex items-center gap-2 mb-1.5 mt-4">
                <label className="text-[11px] font-bold text-black tracking-widest ">Confirm Password</label>
              </div>
              <div className={`relative flex items-center border  overflow-hidden focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all border-gray-300`}>  {/* CHANGED: always border-gray-300, no red */}
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmpassword"
                  value={form.confirmpassword}
                  onChange={handleChange}
                  className="w-full pl-2.5 pr-10 py-2 outline-none bg-transparent text-[13px] tracking-widest"
                  placeholder="•••••••••••"
                />
                 <div className="absolute right-3 flex items-center">
                  <button type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />} 
                  </button>
                </div>
              </div>
              </div>

              {errors.confirmpassword && <p className="text-[11px] text-red-500 mt-1">{errors.confirmpassword}</p>}
            </div>

            {/* CHANGED: backend error message shown inline here, no toast */}
            {errors.form && (
              <p className="text-[12px] text-red-500 text-center">{errors.form}</p>
            )}

              <button className="w-full bg-[#2563eb] hover:bg-blue-700 text-white text-[13px] py-2  tracking-widest font-semibold transition-colors">
              {loading ? 'AUTHENTICATING...' : 'Sign Up'}
            </button>

            <div className="text-center mt-4">
              <button 
                type="button" 
                onClick={() => navigate('/login')}
                className="text-[13px]"
              >
                Already have an account? <Link to="/register" className="font-medium"><span className="underline text-blue-800 hover:text-blue-500">Login</span></Link>
              </button>
            </div>

            <div className="relative flex items-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink-0 mx-4 text-[10px] text-gray-500 tracking-[0.1em] font-light uppercase">OR</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

         
              <button type="button" onClick={() => handleGoogleLogin()} className="flex items-center w-full justify-center gap-2 border border-gray-300 py-2 text-[13px] font-medium text-black hover:bg-gray-50 transition-colors bg-white">
                <GoogleIcon />
                Google
              </button>

          </form>
        </div>


      </div>
    </div>
    </>
  );
}