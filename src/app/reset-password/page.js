'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function ResetPasswordInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [form, setForm]       = useState({ password: '', confirm: '' });
  const [show, setShow]       = useState(false);
  const [status, setStatus]   = useState('idle'); // idle | loading | success | error
  const [msg, setMsg]         = useState('');

  useEffect(() => {
    if (!token) setStatus('no-token');
  }, [token]);

  const submit = async () => {
    if (!form.password || form.password.length < 8) { setMsg('Password must be at least 8 characters.'); return; }
    if (form.password !== form.confirm) { setMsg('Passwords do not match.'); return; }
    setStatus('loading'); setMsg('');
    try {
      const res  = await fetch(`${API}/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg(data.message || 'Reset failed. Link may have expired.'); setStatus('error'); return; }
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

          {status === 'success' && (
            <div style={{ textAlign:'center' }}>
              <div style={{ width:64, height:64, borderRadius:'50%', background:'#eaf8ee', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', fontSize:'1.8rem' }}>✓</div>
              <h2 style={{ fontSize:'1.4rem', fontWeight:900, color:'#111', marginBottom:10 }}>Password reset!</h2>
              <p style={{ color:'#6b7280', fontSize:'0.9rem', lineHeight:1.7, marginBottom:28 }}>
                Your password has been changed successfully. You can now log in with your new password.
              </p>
              <a href="/login" style={{ display:'block', padding:'13px', background:'#1f8f43', color:'#fff', borderRadius:12, fontWeight:800, fontSize:'0.95rem' }}>
                Go to Login
              </a>
            </div>
          )}

          {status === 'no-token' && (
            <div style={{ textAlign:'center' }}>
              <div style={{ width:64, height:64, borderRadius:'50%', background:'#fef2f2', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', fontSize:'1.8rem' }}>✗</div>
              <h2 style={{ fontSize:'1.4rem', fontWeight:900, color:'#111', marginBottom:10 }}>Invalid link</h2>
              <p style={{ color:'#6b7280', fontSize:'0.9rem', lineHeight:1.7, marginBottom:28 }}>This reset link is invalid or has expired. Request a new one.</p>
              <a href="/forgot-password" style={{ display:'block', padding:'13px', background:'#1f8f43', color:'#fff', borderRadius:12, fontWeight:800, fontSize:'0.95rem' }}>
                Request New Link
              </a>
            </div>
          )}

          {(status === 'idle' || status === 'loading' || status === 'error') && token && (
            <>
              <h1 style={{ fontSize:'1.6rem', fontWeight:900, color:'#111', letterSpacing:'-0.04em', marginBottom:8 }}>Reset password</h1>
              <p style={{ color:'#6b7280', fontSize:'0.88rem', marginBottom:28, lineHeight:1.6 }}>Enter your new password below.</p>

              {msg && (
                <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'12px 14px', fontSize:'0.83rem', fontWeight:600, color:'#dc2626', marginBottom:16 }}>
                  {msg}
                </div>
              )}

              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontSize:'0.82rem', fontWeight:700, color:'#374151', marginBottom:6 }}>New Password</label>
                <div style={{ position:'relative' }}>
                  <input
                    type={show ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => { setForm(p => ({ ...p, password: e.target.value })); setMsg(''); }}
                    placeholder="At least 8 characters"
                    style={{ width:'100%', padding:'13px 48px 13px 16px', border:'1.5px solid #e5e7eb', borderRadius:12, fontSize:'0.91rem', color:'#111', outline:'none', fontFamily:'Inter,sans-serif', boxSizing:'border-box' }}
                  />
                  <button onClick={() => setShow(v => !v)} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#9ca3af', fontSize:'0.78rem', fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
                    {show ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom:20 }}>
                <label style={{ display:'block', fontSize:'0.82rem', fontWeight:700, color:'#374151', marginBottom:6 }}>Confirm New Password</label>
                <input
                  type="password"
                  value={form.confirm}
                  onChange={e => { setForm(p => ({ ...p, confirm: e.target.value })); setMsg(''); }}
                  onKeyDown={e => e.key === 'Enter' && submit()}
                  placeholder="Repeat your new password"
                  style={{ width:'100%', padding:'13px 16px', border:'1.5px solid #e5e7eb', borderRadius:12, fontSize:'0.91rem', color:'#111', outline:'none', fontFamily:'Inter,sans-serif', boxSizing:'border-box' }}
                />
              </div>

              <button
                onClick={submit}
                disabled={status === 'loading'}
                style={{ width:'100%', padding:'14px', background:'#1f8f43', color:'#fff', border:'none', borderRadius:12, fontSize:'0.95rem', fontWeight:800, cursor: status === 'loading' ? 'not-allowed' : 'pointer', opacity: status === 'loading' ? 0.7 : 1, display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontFamily:'Inter,sans-serif', marginBottom:16 }}
              >
                {status === 'loading'
                  ? <><div style={{ width:16, height:16, border:'2px solid rgba(255,255,255,0.35)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.65s linear infinite' }} /> Resetting...</>
                  : 'Reset Password'
                }
              </button>

              <div style={{ textAlign:'center', fontSize:'0.875rem', color:'#6b7280' }}>
                <a href="/login" style={{ color:'#1f8f43', fontWeight:700 }}>Back to Login</a>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}><div style={{ width:32, height:32, border:'3px solid #e5e7eb', borderTopColor:'#1f8f43', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} /></div>}>
      <ResetPasswordInner />
    </Suspense>
  );
}