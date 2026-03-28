'use client';
import { useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('');
  const [status, setStatus]   = useState('idle'); // idle | loading | success | error
  const [msg, setMsg]         = useState('');

  const submit = async () => {
    if (!email.trim()) { setMsg('Enter your email address.'); return; }
    setStatus('loading'); setMsg('');
    try {
      const res  = await fetch(`${API}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg(data.message || 'Something went wrong.'); setStatus('error'); return; }
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
        body { font-family:'Inter',sans-serif; background:#f7f8fa; }
        a { text-decoration:none; color:inherit; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>

      <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px', fontFamily:'Inter,sans-serif', background:'#f7f8fa' }}>
        <a href="/" style={{ fontSize:'1.8rem', fontWeight:900, color:'#111', letterSpacing:'-0.04em', marginBottom:40 }}>
          Afri<span style={{ color:'#1f8f43' }}>Plate</span>
        </a>

        <div style={{ background:'#fff', border:'1px solid #eceff3', borderRadius:24, padding:'48px 40px', maxWidth:420, width:'100%', boxShadow:'0 8px 32px rgba(0,0,0,0.06)', animation:'fadeUp 0.4s ease both' }}>

          {status === 'success' ? (
            <div style={{ textAlign:'center' }}>
              <div style={{ width:64, height:64, borderRadius:'50%', background:'#eaf8ee', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', fontSize:'1.8rem' }}>✓</div>
              <h2 style={{ fontSize:'1.4rem', fontWeight:900, color:'#111', marginBottom:10 }}>Check your email</h2>
              <p style={{ color:'#6b7280', fontSize:'0.9rem', lineHeight:1.7, marginBottom:28 }}>
                We sent a password reset link to <strong style={{ color:'#111' }}>{email}</strong>. Click the link in the email to reset your password.
              </p>
              <a href="/login" style={{ display:'block', padding:'13px', background:'#1f8f43', color:'#fff', borderRadius:12, fontWeight:800, fontSize:'0.95rem' }}>
                Back to Login
              </a>
            </div>
          ) : (
            <>
              <h1 style={{ fontSize:'1.6rem', fontWeight:900, color:'#111', letterSpacing:'-0.04em', marginBottom:8 }}>Forgot password?</h1>
              <p style={{ color:'#6b7280', fontSize:'0.88rem', marginBottom:28, lineHeight:1.6 }}>
                Enter the email address linked to your account and we'll send you a reset link.
              </p>

              {msg && (
                <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'12px 14px', fontSize:'0.83rem', fontWeight:600, color:'#dc2626', marginBottom:16 }}>
                  {msg}
                </div>
              )}

              <div style={{ marginBottom:16 }}>
                <label style={{ display:'block', fontSize:'0.82rem', fontWeight:700, color:'#374151', marginBottom:6 }}>Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setMsg(''); }}
                  onKeyDown={e => e.key === 'Enter' && submit()}
                  placeholder="you@university.edu.ng"
                  style={{ width:'100%', padding:'13px 16px', border:'1.5px solid #e5e7eb', borderRadius:12, fontSize:'0.91rem', color:'#111', outline:'none', fontFamily:'Inter,sans-serif', boxSizing:'border-box' }}
                />
              </div>

              <button
                onClick={submit}
                disabled={status === 'loading'}
                style={{ width:'100%', padding:'14px', background:'#1f8f43', color:'#fff', border:'none', borderRadius:12, fontSize:'0.95rem', fontWeight:800, cursor: status === 'loading' ? 'not-allowed' : 'pointer', opacity: status === 'loading' ? 0.7 : 1, display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontFamily:'Inter,sans-serif', marginBottom:16 }}
              >
                {status === 'loading'
                  ? <><div style={{ width:16, height:16, border:'2px solid rgba(255,255,255,0.35)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.65s linear infinite' }} /> Sending...</>
                  : 'Send Reset Link'
                }
              </button>

              <div style={{ textAlign:'center', fontSize:'0.875rem', color:'#6b7280' }}>
                Remember your password? <a href="/login" style={{ color:'#1f8f43', fontWeight:700 }}>Sign in</a>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}