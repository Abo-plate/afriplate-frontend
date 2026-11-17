'use client';
import Link from 'next/link';
import { useState } from 'react';

import { API_ORIGIN as API } from '../lib/endpoints';

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [msg, setMsg] = useState('');

  const submit = async (event) => {
    event?.preventDefault();
    if (status === 'loading') return;

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setStatus('error');
      setMsg('Enter your email address.');
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setStatus('error');
      setMsg('Enter a valid email address.');
      return;
    }

    setStatus('loading');
    setMsg('');

    try {
      const res = await fetch(`${API}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMsg(data.message || 'Something went wrong.');
        setStatus('error');
        return;
      }

      setSubmittedEmail(normalizedEmail);
      setMsg(data.message || '');
      setStatus('success');
    } catch {
      setMsg('Cannot connect to server. Try again.');
      setStatus('error');
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Inter',sans-serif; background:var(--ap-page-background, #f7f8fa); }
        a { text-decoration:none; color:inherit; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>

      <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px', fontFamily:'Inter,sans-serif', background:'var(--ap-page-background, #f7f8fa)' }}>
        <Link href="/" style={{ fontSize:'1.8rem', fontWeight:900, color:'var(--ap-text-strong, #111)', letterSpacing:'-0.04em', marginBottom:40 }}>
          Afri<span style={{ color:'var(--ap-accent-text, #1f8f43)' }}>Plate</span>
        </Link>

        <div style={{ background:'var(--ap-surface, #fff)', border:'1px solid var(--ap-border, #eceff3)', borderRadius:24, padding:'48px 40px', maxWidth:420, width:'100%', boxShadow:'0 8px 32px rgba(0,0,0,0.06)', animation:'fadeUp 0.4s ease both' }}>
          {status === 'success' ? (
            <div style={{ textAlign:'center' }}>
              <div style={{ width:64, height:64, borderRadius:'50%', background:'var(--ap-accent-surface, #eaf8ee)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', fontSize:'0.95rem', fontWeight:900, color:'var(--ap-accent-text, #1f8f43)', letterSpacing:'0.08em' }}>EMAIL</div>
              <h2 style={{ fontSize:'1.4rem', fontWeight:900, color:'var(--ap-text-strong, #111)', marginBottom:10 }}>Check your email</h2>
              <p style={{ color:'var(--ap-text-muted, #6b7280)', fontSize:'0.9rem', lineHeight:1.7, marginBottom:12 }}>
                If an account exists for <strong style={{ color:'var(--ap-text-strong, #111)' }}>{submittedEmail}</strong>, reset instructions have been requested. Check your inbox and spam folder.
              </p>
              {msg && (
                <p style={{ color:'var(--ap-text-muted, #6b7280)', fontSize:'0.83rem', lineHeight:1.6, marginBottom:28 }}>
                  {msg}
                </p>
              )}
              <Link href="/login" style={{ display:'block', padding:'13px', background:'#1f8f43', color:'#fff', borderRadius:12, fontWeight:800, fontSize:'0.95rem' }}>
                Back to Login
              </Link>
            </div>
          ) : (
            <>
              <h1 style={{ fontSize:'1.6rem', fontWeight:900, color:'var(--ap-text-strong, #111)', letterSpacing:'-0.04em', marginBottom:8 }}>Forgot password?</h1>
              <p style={{ color:'var(--ap-text-muted, #6b7280)', fontSize:'0.88rem', marginBottom:28, lineHeight:1.6 }}>
                Enter the email address linked to your account and we&apos;ll send you a reset link.
              </p>

              {msg && (
                <div style={{ background:'var(--ap-danger-surface, #fef2f2)', border:'1px solid var(--ap-danger-border, #fecaca)', borderRadius:10, padding:'12px 14px', fontSize:'0.83rem', fontWeight:600, color:'var(--ap-danger-text, #dc2626)', marginBottom:16 }}>
                  {msg}
                </div>
              )}

              <form onSubmit={submit}>
                <div style={{ marginBottom:16 }}>
                  <label style={{ display:'block', fontSize:'0.82rem', fontWeight:700, color:'var(--ap-text-strong, #374151)', marginBottom:6 }}>Email address</label>
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setMsg('');
                      if (status === 'error') setStatus('idle');
                    }}
                    placeholder="you@university.edu.ng"
                    style={{ width:'100%', padding:'13px 16px', border:'1.5px solid var(--ap-border, #e5e7eb)', borderRadius:12, fontSize:'0.91rem', color:'var(--ap-text-strong, #111)', outline:'none', fontFamily:'Inter,sans-serif', boxSizing:'border-box' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  style={{ width:'100%', padding:'14px', background:'#1f8f43', color:'#fff', border:'none', borderRadius:12, fontSize:'0.95rem', fontWeight:800, cursor: status === 'loading' ? 'not-allowed' : 'pointer', opacity: status === 'loading' ? 0.7 : 1, display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontFamily:'Inter,sans-serif', marginBottom:16 }}
                >
                  {status === 'loading'
                    ? <><div style={{ width:16, height:16, border:'2px solid rgba(255,255,255,0.35)', borderTopColor:'var(--ap-surface, #fff)', borderRadius:'50%', animation:'spin 0.65s linear infinite' }} /> Sending...</>
                    : 'Send Reset Link'
                  }
                </button>
              </form>

              <div style={{ textAlign:'center', fontSize:'0.875rem', color:'var(--ap-text-muted, #6b7280)' }}>
                Remember your password? <Link href="/login" style={{ color:'var(--ap-accent-text, #1f8f43)', fontWeight:700 }}>Sign in</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
