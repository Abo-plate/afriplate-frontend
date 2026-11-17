'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { API_ORIGIN as API } from '../lib/endpoints';

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const verification = useRef(null);
  const [requestStatus, setStatus] = useState('loading'); // loading | success | error | no-token

  const status = token ? requestStatus : 'no-token';
  useEffect(() => {
    if (!token) return;

    if (!verification.current || verification.current.token !== token) {
      verification.current = { token, promise: fetch(`${API}/api/auth/verify-email/${encodeURIComponent(token)}`, { method: 'GET', cache: 'no-store' }).then(response => response.json()) };
    }
    let current = true;
    verification.current.promise.then(data => { if (current) setStatus(data.status === 'success' ? 'success' : 'error'); }).catch(() => { if (current) setStatus('error'); });
    return () => { current = false; };
  }, [token]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Inter',sans-serif; background:var(--ap-page-background, #f7f8fa); }
        a { text-decoration:none; color:inherit; }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px', fontFamily:'Inter,sans-serif', background:'var(--ap-page-background, #f7f8fa)' }}>

        {/* Brand */}
        <Link href="/" style={{ fontSize:'1.8rem', fontWeight:900, color:'var(--ap-text-strong, #111)', letterSpacing:'-0.04em', marginBottom:40 }}>
          Afri<span style={{ color:'var(--ap-accent-text, #1f8f43)' }}>Plate</span>
        </Link>

        <div style={{ background:'var(--ap-surface, #fff)', border:'1px solid var(--ap-border, #eceff3)', borderRadius:24, padding:'48px 40px', maxWidth:440, width:'100%', textAlign:'center', boxShadow:'0 8px 32px rgba(0,0,0,0.06)', animation:'fadeUp 0.4s ease both' }}>

          {status === 'loading' && (
            <>
              <div style={{ width:52, height:52, border:'3px solid var(--ap-border, #e5e7eb)', borderTopColor:'var(--ap-accent-border, #1f8f43)', borderRadius:'50%', animation:'spin 0.7s linear infinite', margin:'0 auto 24px' }} />
              <h2 style={{ fontSize:'1.2rem', fontWeight:800, color:'var(--ap-text-strong, #111)', marginBottom:8 }}>Verifying your email...</h2>
              <p style={{ fontSize:'0.875rem', color:'var(--ap-text-subtle, #9ca3af)' }}>Please wait a moment.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div style={{ width:64, height:64, borderRadius:'50%', background:'var(--ap-accent-surface, #eaf8ee)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', fontSize:'1.8rem' }}>✓</div>
              <h2 style={{ fontSize:'1.4rem', fontWeight:900, color:'var(--ap-text-strong, #111)', marginBottom:10, letterSpacing:'-0.03em' }}>Email verified!</h2>
              <p style={{ color:'var(--ap-text-muted, #6b7280)', fontSize:'0.9rem', lineHeight:1.7, marginBottom:28 }}>
                Your AfriPlate account is now active. You can log in and start buying or selling on campus.
              </p>
              <Link href="/login" style={{ display:'block', padding:'14px', background:'#1f8f43', color:'#fff', borderRadius:12, fontWeight:800, fontSize:'0.95rem' }}>
                Go to Login
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div style={{ width:64, height:64, borderRadius:'50%', background:'var(--ap-danger-surface, #fef2f2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', fontSize:'1.8rem' }}>✗</div>
              <h2 style={{ fontSize:'1.4rem', fontWeight:900, color:'var(--ap-text-strong, #111)', marginBottom:10, letterSpacing:'-0.03em' }}>Verification failed</h2>
              <p style={{ color:'var(--ap-text-muted, #6b7280)', fontSize:'0.9rem', lineHeight:1.7, marginBottom:28 }}>
                The link may have expired or already been used. Request a new verification email below.
              </p>
              <Link href="/login" style={{ display:'block', padding:'14px', background:'#1f8f43', color:'#fff', borderRadius:12, fontWeight:800, fontSize:'0.95rem', marginBottom:12 }}>
                Go to Login
              </Link>
              <Link href="/resend-verification" style={{ display:'block', padding:'14px', background:'var(--ap-surface-muted, #f3f4f6)', color:'var(--ap-text-strong, #374151)', borderRadius:12, fontWeight:700, fontSize:'0.875rem' }}>
                Resend verification email
              </Link>
            </>
          )}

          {status === 'no-token' && (
            <>
              <div style={{ width:64, height:64, borderRadius:'50%', background:'var(--ap-warning-surface, #fef3c7)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', fontSize:'1.8rem' }}>⚠</div>
              <h2 style={{ fontSize:'1.4rem', fontWeight:900, color:'var(--ap-text-strong, #111)', marginBottom:10 }}>Invalid link</h2>
              <p style={{ color:'var(--ap-text-muted, #6b7280)', fontSize:'0.9rem', lineHeight:1.7, marginBottom:28 }}>
                This verification link is invalid. Please use the link sent to your email.
              </p>
              <Link href="/" style={{ display:'block', padding:'14px', background:'#1f8f43', color:'#fff', borderRadius:12, fontWeight:800, fontSize:'0.95rem' }}>
                Go to Homepage
              </Link>
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
        <div style={{ width:32, height:32, border:'3px solid var(--ap-border, #e5e7eb)', borderTopColor:'var(--ap-accent-border, #1f8f43)', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
      </div>
    }>
      <VerifyEmailInner />
    </Suspense>
  );
}