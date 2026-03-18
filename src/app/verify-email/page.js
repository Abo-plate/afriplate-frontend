'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading'); // loading | success | error | no-token

  useEffect(() => {
    if (!token) { setStatus('no-token'); return; }

    fetch(`${API}/api/auth/verify-email/${token}`, { method: 'GET' })
      .then(r => r.json())
      .then(d => {
        if (d.status === 'success') setStatus('success');
        else setStatus('error');
      })
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Inter',sans-serif; background:#f7f8fa; }
        a { text-decoration:none; color:inherit; }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px', fontFamily:'Inter,sans-serif', background:'#f7f8fa' }}>

        {/* Brand */}
        <a href="/" style={{ fontSize:'1.8rem', fontWeight:900, color:'#111', letterSpacing:'-0.04em', marginBottom:40 }}>
          Afri<span style={{ color:'#1f8f43' }}>Plate</span>
        </a>

        <div style={{ background:'#fff', border:'1px solid #eceff3', borderRadius:24, padding:'48px 40px', maxWidth:440, width:'100%', textAlign:'center', boxShadow:'0 8px 32px rgba(0,0,0,0.06)', animation:'fadeUp 0.4s ease both' }}>

          {status === 'loading' && (
            <>
              <div style={{ width:52, height:52, border:'3px solid #e5e7eb', borderTopColor:'#1f8f43', borderRadius:'50%', animation:'spin 0.7s linear infinite', margin:'0 auto 24px' }} />
              <h2 style={{ fontSize:'1.2rem', fontWeight:800, color:'#111', marginBottom:8 }}>Verifying your email...</h2>
              <p style={{ fontSize:'0.875rem', color:'#9ca3af' }}>Please wait a moment.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div style={{ width:64, height:64, borderRadius:'50%', background:'#eaf8ee', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', fontSize:'1.8rem' }}>✓</div>
              <h2 style={{ fontSize:'1.4rem', fontWeight:900, color:'#111', marginBottom:10, letterSpacing:'-0.03em' }}>Email verified!</h2>
              <p style={{ color:'#6b7280', fontSize:'0.9rem', lineHeight:1.7, marginBottom:28 }}>
                Your AfriPlate account is now active. You can log in and start buying or selling on campus.
              </p>
              <a href="/login" style={{ display:'block', padding:'14px', background:'#1f8f43', color:'#fff', borderRadius:12, fontWeight:800, fontSize:'0.95rem' }}>
                Go to Login
              </a>
            </>
          )}

          {status === 'error' && (
            <>
              <div style={{ width:64, height:64, borderRadius:'50%', background:'#fef2f2', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', fontSize:'1.8rem' }}>✗</div>
              <h2 style={{ fontSize:'1.4rem', fontWeight:900, color:'#111', marginBottom:10, letterSpacing:'-0.03em' }}>Verification failed</h2>
              <p style={{ color:'#6b7280', fontSize:'0.9rem', lineHeight:1.7, marginBottom:28 }}>
                The link may have expired or already been used. Request a new verification email below.
              </p>
              <a href="/login" style={{ display:'block', padding:'14px', background:'#1f8f43', color:'#fff', borderRadius:12, fontWeight:800, fontSize:'0.95rem', marginBottom:12 }}>
                Go to Login
              </a>
              <a href="/resend-verification" style={{ display:'block', padding:'14px', background:'#f3f4f6', color:'#374151', borderRadius:12, fontWeight:700, fontSize:'0.875rem' }}>
                Resend verification email
              </a>
            </>
          )}

          {status === 'no-token' && (
            <>
              <div style={{ width:64, height:64, borderRadius:'50%', background:'#fef3c7', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', fontSize:'1.8rem' }}>⚠</div>
              <h2 style={{ fontSize:'1.4rem', fontWeight:900, color:'#111', marginBottom:10 }}>Invalid link</h2>
              <p style={{ color:'#6b7280', fontSize:'0.9rem', lineHeight:1.7, marginBottom:28 }}>
                This verification link is invalid. Please use the link sent to your email.
              </p>
              <a href="/" style={{ display:'block', padding:'14px', background:'#1f8f43', color:'#fff', borderRadius:12, fontWeight:800, fontSize:'0.95rem' }}>
                Go to Homepage
              </a>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter,sans-serif' }}>
        <div style={{ width:32, height:32, border:'3px solid #e5e7eb', borderTopColor:'#1f8f43', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
      </div>
    }>
      <VerifyEmailInner />
    </Suspense>
  );
}