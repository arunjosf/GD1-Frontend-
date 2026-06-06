import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getToken } from '../api/auth';
import { Download, CheckCircle, XCircle, Clock, ChevronLeft, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

function ShadowWrapper({ htmlContent, onScrollProgress }) {
  const containerRef = useRef(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    let shadow = containerRef.current.shadowRoot;
    if (!shadow) {
      shadow = containerRef.current.attachShadow({ mode: 'open' });
    }
    
    shadow.innerHTML = `
      <style>
        .scroll-container {
          height: 100%;
          overflow-y: auto;
          padding: 16px 8px 100px 8px;
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @media (max-width: 767px) {
          .page {
            padding: 16px 12px !important;
          }
        }
        @media (min-width: 768px) {
          .scroll-container {
            padding: 32px 48px 100px 48px;
          }
        }
        .scroll-container::-webkit-scrollbar {
          display: none;
        }
      </style>
      <div class="scroll-container">
        ${htmlContent}
      </div>
    `;
    
    const scrollContainer = shadow.querySelector('.scroll-container');
    const handleScroll = (e) => {
      const el = e.target;
      const maxScroll = el.scrollHeight - el.clientHeight;
      if (maxScroll <= 0) {
        onScrollProgress(100);
      } else {
        onScrollProgress(Math.min(100, Math.max(0, Math.round((el.scrollTop / maxScroll) * 100))));
      }
    };
    
    scrollContainer.addEventListener('scroll', handleScroll);
    setTimeout(() => handleScroll({ target: scrollContainer }), 100);
    
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [htmlContent, onScrollProgress]);

  return <div ref={containerRef} className="h-full w-full" />;
}

export default function AgreementPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [agreement, setAgreement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Decline Modal State
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const declineReasons = [
    "Terms are unacceptable",
    "Price is too high",
    "Found another storage facility",
    "Changed my mind"
  ];

  useEffect(() => {
    const fetchAgreement = async () => {
      try {
        const token = getToken('AccessToken');
        const res = await fetch(`https://localhost:7108/api/Agreement?id=${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data.success && data.data) {
          setAgreement(data.data);
        } else {
          toast.error(data.message || 'Failed to load agreement');
          navigate(-1);
        }
      } catch (err) {
        toast.error('Network error while loading agreement');
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAgreement();
    }
  }, [id, navigate]);

  const handleRespond = async (responseType, reason = null) => {
    if (!agreement) return;
    setProcessing(true);
    try {
      const token = getToken('AccessToken');
      let url = `https://localhost:7108/api/Agreement/${id}/respond?response=${responseType}`;
      if (reason) {
        url += `&rejectionReason=${encodeURIComponent(reason)}`;
      }
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        if (responseType === 'Approve') {
          toast.success('Agreement signed successfully!');
          // Handle both integer (1) and string ('LotBooking') enum values since LotBooking = 1
          if (agreement.type === 1 || agreement.type === '1' || agreement.type === 'LotBooking') { 
            navigate('/pickup-options/' + agreement.referenceId);
          } else {
            navigate('/track-application');
          }
        } else {
          toast.success('Agreement declined.');
          navigate('/');
        }
      } else {
        toast.error(data.message || 'Failed to process response');
      }
    } catch (err) {
      toast.error('Network error while saving response');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    const toastId = toast.loading('Downloading PDF...');
    try {
      const token = getToken('AccessToken');
      const res = await fetch(`https://localhost:7108/api/Agreement/${id}/download`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to download PDF');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Agreement_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Download complete!', { id: toastId });
    } catch (err) {
      toast.error('Failed to download PDF', { id: toastId });
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#f4f5f8]">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#2563eb]"></div>
      </div>
    );
  }

  if (!agreement) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#f4f5f8]">
        <p className="text-xl text-slate-600">Agreement not found</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#f4f5f8] font-sans">
      
      {/* ── TOP NAVBAR ── */}
      <nav className="flex min-h-[72px] shrink-0 items-center justify-between border-b border-gray-200 bg-white px-2 md:px-8 max-md:flex-wrap py-3 md:py-0">
        <div className="flex items-center gap-2 md:gap-4">
          <button onClick={() => navigate(-1)} className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
            <ChevronLeft size={20} className="max-md:h-5 max-md:w-5" />
          </button>
          <div className="flex items-center gap-2 md:gap-4">
            <img src="/GD1 Logo.png" alt="GD1 Logo" className="h-8 w-8 md:h-10 md:w-10 rounded-xl bg-[#0B0F19] object-contain p-1 md:p-1.5 shrink-0" />
            <div className="flex flex-col max-w-[150px] md:max-w-none">
              <span className="text-[12px] md:text-sm font-bold text-slate-900 truncate">Vehicle Storage Agreement</span>
              <span className="text-[10px] md:text-xs font-medium text-slate-500 truncate">REF: {agreement.id} &middot; Pending Your Response</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4 max-md:mt-2 max-md:w-full max-md:justify-end">
          <div className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-full border border-indigo-100 bg-indigo-50/50 text-[9px] md:text-[10px] font-bold text-[#2563eb]">
            {scrollProgress}%
          </div>
          <button 
            onClick={handleDownload} 
            disabled={downloading}
            className="flex items-center gap-1.5 md:gap-2 rounded-xl border border-indigo-100 bg-indigo-50/50 px-3 py-1.5 md:px-5 md:py-2.5 text-xs md:text-sm font-semibold text-[#2563eb] hover:bg-indigo-100/80 transition-colors disabled:opacity-60"
          >
            {downloading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-current max-md:h-3 max-md:w-3"></div>
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <Download size={16} className="max-md:h-4 max-md:w-4" />
                <span>Download PDF</span>
              </>
            )}
          </button>
        </div>
      </nav>

      {/* ── WARNING BANNER ── */}
      <div className="z-10 mt-3 md:mt-6 flex shrink-0 justify-center px-2 md:px-0">
        <div className="flex items-center rounded-full border border-amber-200 bg-[#fff9eb] px-4 py-1.5 md:px-6 md:py-1.5 text-[11px] md:text-[13px] font-medium text-amber-600 shadow-sm text-center">
          <AlertTriangle className="mr-1.5 md:mr-2 shrink-0" size={16} />
          Please read the full agreement before signing
        </div>
      </div>

      {/* ── DOCUMENT CARD ── */}
      <div className="mx-auto mt-3 md:mt-6 mb-0 flex w-[98%] md:w-full max-w-4xl flex-1 flex-col overflow-hidden rounded-t-xl md:rounded-t-2xl border-t-[4px] border-gray-700 bg-white shadow-md relative">
        
        {/* Card Header */}
        <div className="flex shrink-0 flex-col md:flex-row items-start md:justify-between bg-slate-50/50 p-4 md:p-8 gap-4 md:gap-0">
          <div className="flex items-start gap-3 md:gap-4">
            <img src="/GD1 Logo.png" alt="Logo" className="h-8 w-8 md:h-10 md:w-10 rounded-xl bg-[#0B0F19] object-contain p-1 md:p-1.5 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[7px] md:text-[8px] mt-0.5 md:mt-1 font-bold uppercase tracking-wider text-indigo-500">Official Legal Document</span>
              <h1 className="text-lg md:text-1xl font-bold text-slate-900 leading-tight">Vehicle Storage Agreement</h1>
            </div>
          </div>
          
          <div className="flex max-md:w-full max-md:flex-row max-md:items-center max-md:justify-between min-w-[120px] flex-col rounded-xl border border-indigo-100 bg-[#fafaff] p-2 md:text-center">
            <span className="text-[9px] md:text-[10px] font-semibold uppercase tracking-wider text-black">Agreement ID<span className="hidden md:inline">:</span> <span className="max-md:hidden text-[11px] font-bold text-slate-900">{agreement.id}</span></span>
            <span className="md:hidden text-xs font-bold text-slate-900">{agreement.id}</span>
          </div>
        </div>

        {/* Scrollable Document Content via Shadow DOM */}
        <div className="flex-1 overflow-hidden relative">
          <ShadowWrapper 
            htmlContent={agreement.content} 
            onScrollProgress={setScrollProgress} 
          />
        </div>
      </div>

      {/* ── FIXED FOOTER ── */}
      <div className="fixed bottom-0 left-0 z-40 flex w-full flex-col md:flex-row items-center md:justify-between border-t border-gray-200 bg-white px-2 md:px-8 py-3 md:py-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] gap-3 md:gap-0 max-md:pb-6">
        <div className="flex items-center gap-3 md:gap-4 max-md:w-full">
          <div className={`flex h-8 w-8 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-full ${scrollProgress >= 100 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-500'}`}>
            {scrollProgress >= 100 ? <CheckCircle size={20} className="max-md:h-5 max-md:w-5" /> : <Clock size={20} className="max-md:h-5 max-md:w-5" />}
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] md:text-sm font-bold text-slate-900">Review before signing</span>
            <span className="text-[10px] md:text-xs font-medium text-slate-500">Scroll to read the full document ({scrollProgress}% done)</span>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4 max-md:w-full max-md:mb-2">
          <button 
            onClick={() => setShowDeclineModal(true)}
            disabled={processing}
            className="flex max-md:flex-1 justify-center items-center gap-1.5 md:gap-2 rounded-lg md:rounded-xl border border-red-200 px-4 md:px-8 py-2.5 md:py-3 text-xs md:text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            <XCircle size={18} className="max-md:h-4 max-md:w-4" />
            Decline
          </button>
          <button 
            onClick={() => handleRespond('Approve')}
            disabled={processing || scrollProgress < 100}
            className={`flex max-md:flex-1 justify-center items-center gap-1.5 md:gap-2 rounded-lg md:rounded-xl px-4 md:px-8 py-2.5 md:py-3 text-xs md:text-sm font-bold text-white shadow-sm transition-all ${
              scrollProgress >= 100 && !processing
                ? 'bg-[#2563eb] hover:bg-blue-700 cursor-pointer' 
                : 'bg-[#2563eb] cursor-not-allowed opacity-80'
            }`}
          >
            <CheckCircle size={18} className="max-md:h-4 max-md:w-4" />
            I Accept & Sign
          </button>
        </div>
      </div>

      {/* ── DECLINE MODAL ── */}
      {showDeclineModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 sm:p-0 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <h2 className="mb-2 text-lg md:text-xl font-bold text-slate-900">Reason for Declining</h2>
            <p className="mb-4 text-xs md:text-sm text-slate-500">Please let us know why you are declining the agreement.</p>
            
            {/* Scrollable preset options */}
            <div 
              className="flex flex-col gap-2.5 max-h-[35vh] overflow-y-auto pb-1 [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {declineReasons.map((reason) => (
                <label key={reason} className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 p-3 hover:bg-slate-50 transition-colors">
                  <input
                    type="radio"
                    name="declineReason"
                    value={reason}
                    checked={declineReason === reason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    className="h-3 w-4 text-[#2563eb] focus:ring-[#2563eb] cursor-pointer"
                  />
                  <span className="text-sm font-medium text-slate-700">{reason}</span>
                </label>
              ))}
            </div>
            
            {/* Always open Custom Input */}
            <div className="mt-2.5">
              <textarea
                autoFocus
                value={customReason}
                onClick={() => setDeclineReason("Other")}
                onChange={(e) => {
                  setCustomReason(e.target.value);
                  setDeclineReason("Other");
                }}
                placeholder="Other reason (Please specify)..."
                className={`w-full rounded-xl border p-6 text-sm outline-none transition-all resize-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] focus:bg-blue-50/30 ${
                  declineReason === 'Other' 
                    ? 'border-[#2563eb] ring-1 ring-[#2563eb] bg-blue-50/30' 
                    : 'border-gray-200 hover:border-gray-300 bg-slate-50'
                }`}
                rows="2"
              />
            </div>
            
            <div className="mt-5 flex flex-col sm:flex-row justify-end gap-3 sm:gap-2 pt-2">
              <button
                onClick={() => {
                  setShowDeclineModal(false);
                  setDeclineReason('');
                  setCustomReason('');
                }}
                className="w-full sm:w-auto rounded-xl px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const finalReason = declineReason === "Other" ? customReason : declineReason;
                  setShowDeclineModal(false);
                  handleRespond('Reject', finalReason);
                }}
                disabled={!declineReason || (declineReason === "Other" && !customReason.trim())}
                className="w-full sm:w-auto rounded-xl bg-red-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
