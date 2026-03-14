'use client';
import { useState, useEffect } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export default function LoginPage() {
  const [form, setForm]     = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading]   = useState(false);
  const [show, setShow]         = useState(false);

  useEffect(() => {
    if (localStorage.getItem('token')) window.location.href = '/dashboard';
  }, []);

  const set = (k) => (e) => {
    setForm(p => ({ ...p, [k]: e.target.value }));
    setErrors(p => ({ ...p, [k]: '' }));
    setApiError('');
  };

  const validate = () => {
    const e = {};
    if (!form.email.trim())              e.email    = 'Email address is required';
    else if (!isValidEmail(form.email))  e.email    = 'Enter a valid email address (e.g. name@mail.com)';
    if (!form.password)                  e.password = 'Password is required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async () => {
    if (!validate()) return;
    setLoading(true); setApiError('');
    try {
      const res  = await fetch(`${API}/api/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: form.email.trim().toLowerCase(), password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.message?.toLowerCase().includes('verify')) {
          setApiError('Please verify your email first. Check your inbox for the verification link.');
        } else {
          setApiError(data.message || 'Invalid email or password.');
        }
        return;
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user',  JSON.stringify(data.user));
      window.location.href = data.user?.role === 'admin' ? '/admin' : '/dashboard';
    } catch {
      setApiError('Cannot connect to server. Make sure the backend is running on port 5000.');
    } finally { setLoading(false); }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Inter',sans-serif; background:#f7f8fa; }
        a { color:inherit; text-decoration:none; }
        button { font-family:'Inter',sans-serif; cursor:pointer; border:none; }
        input { font-family:'Inter',sans-serif; }

        .page { min-height:100vh; display:grid; grid-template-columns:1fr 1fr; }

        .left {
          background:linear-gradient(160deg,#0d3320 0%,#1f8f43 60%,#2aad55 100%);
          padding:48px; display:flex; flex-direction:column;
          justify-content:space-between; position:relative; overflow:hidden;
        }
        .left::before { content:''; position:absolute; width:500px; height:500px; border-radius:50%; background:rgba(255,255,255,0.04); top:-150px; right:-150px; }
        .left::after  { content:''; position:absolute; width:300px; height:300px; border-radius:50%; background:rgba(31,143,67,0.08); bottom:-80px; left:-80px; }

        .brand { font-size:1.9rem; font-weight:900; color:#fff; letter-spacing:-0.04em; position:relative; z-index:1; }
        .brand span { color:rgba(255,255,255,0.75); }

        .left-body { position:relative; z-index:1; }
        .left-body h2 { font-size:clamp(2rem,2.8vw,3rem); font-weight:900; color:#fff; line-height:1.05; letter-spacing:-0.05em; margin-bottom:16px; }
        .left-body h2 em { font-style:normal; color:rgba(255,255,255,0.75); }
        .left-body p { color:rgba(255,255,255,0.65); font-size:1rem; line-height:1.65; max-width:320px; }

        .trust-list { display:flex; flex-direction:column; gap:12px; position:relative; z-index:1; }
        .trust-item { display:flex; align-items:center; gap:12px; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.12); border-radius:14px; padding:13px 16px; }
        .trust-label { width:28px; height:28px; border-radius:8px; background:rgba(255,255,255,0.15); display:flex; align-items:center; justify-content:center; font-size:0.7rem; font-weight:900; color:#fff; flex-shrink:0; }
        .trust-text { font-size:0.84rem; color:rgba(255,255,255,0.78); font-weight:500; line-height:1.4; }

        .right { background:#fff; display:flex; align-items:center; justify-content:center; padding:48px 52px; }
        .form-box { width:100%; max-width:380px; }

        .eyebrow { font-size:0.72rem; font-weight:700; color:#1f8f43; text-transform:uppercase; letter-spacing:1.8px; margin-bottom:10px; }
        .form-title { font-size:2.4rem; font-weight:900; color:#111; letter-spacing:-0.05em; margin-bottom:6px; }
        .form-sub { font-size:0.88rem; color:#6b7280; margin-bottom:32px; }
        .form-sub a { color:#1f8f43; font-weight:700; }
        .form-sub a:hover { text-decoration:underline; }

        .field { margin-bottom:18px; }
        .field label { display:block; font-size:0.82rem; font-weight:700; color:#374151; margin-bottom:7px; }
        .input-wrap { position:relative; }
        .input-wrap input {
          width:100%; padding:14px 16px; border:1.5px solid #e5e7eb;
          border-radius:12px; font-size:0.94rem; color:#111; outline:none;
          background:#fafafa; transition:border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }
        .input-wrap input:focus { border-color:#1f8f43; box-shadow:0 0 0 3px rgba(31,143,67,0.1); background:#fff; }
        .input-wrap input.err { border-color:#ef4444; background:#fef2f2; }
        .field-error { color:#ef4444; font-size:0.75rem; font-weight:600; margin-top:5px; display:block; }

        .pw-toggle { position:absolute; right:14px; top:50%; transform:translateY(-50%); background:none; color:#9ca3af; font-size:0.8rem; font-weight:700; padding:4px 6px; border-radius:6px; }
        .pw-toggle:hover { color:#374151; }

        .forgot { text-align:right; margin-top:-8px; margin-bottom:20px; }
        .forgot a { font-size:0.82rem; color:#1f8f43; font-weight:600; }

        .api-error { background:#fef2f2; border:1px solid #fecaca; color:#dc2626; border-radius:10px; padding:12px 14px; font-size:0.83rem; font-weight:600; margin-bottom:18px; }

        .submit-btn {
          width:100%; padding:15px; background:#1f8f43; color:#fff;
          font-size:1rem; font-weight:800; border-radius:12px;
          box-shadow:0 8px 24px rgba(31,143,67,0.28);
          transition:all 0.22s; margin-bottom:22px;
          display:flex; align-items:center; justify-content:center; gap:8px;
        }
        .submit-btn:hover:not(:disabled) { background:#187536; transform:translateY(-2px); }
        .submit-btn:disabled { opacity:0.65; cursor:not-allowed; }
        .btn-spinner { width:16px; height:16px; border:2px solid rgba(255,255,255,0.35); border-top-color:#fff; border-radius:50%; animation:spin 0.65s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }

        .switch-text { text-align:center; font-size:0.875rem; color:#6b7280; }
        .switch-text a { color:#1f8f43; font-weight:700; }

        @media (max-width:768px) {
          .page { grid-template-columns:1fr; }
          .left { padding:28px 24px 32px; }
          .trust-list { display:none; }
          .right { padding:36px 24px 48px; align-items:flex-start; }
          .form-box { max-width:100%; }
          .form-title { font-size:2rem; }
        }
      `}</style>

      <div className="page">
        <div className="left">
          <div className="brand">Afri<span>Plate</span></div>
          <div className="left-body">
            <h2>Your campus<br />market is <em>waiting</em></h2>
            <p>Buy, sell and offer services safely within your university community.</p>
          </div>
          <div className="trust-list">
            {[
              ['01', 'Escrow payments — money moves only when you confirm delivery'],
              ['02', '35,000+ verified Nigerian students across 20+ campuses'],
              ['03', 'List anything in under 2 minutes — free forever'],
            ].map(([n, t]) => (
              <div key={n} className="trust-item">
                <div className="trust-label">{n}</div>
                <span className="trust-text">{t}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="right">
          <div className="form-box">
            <div className="eyebrow">Welcome back</div>
            <h1 className="form-title">Sign in</h1>
            <p className="form-sub">No account yet? <a href="/register">Create one free</a></p>

            {apiError && <div className="api-error">{apiError}</div>}

            <div className="field">
              <label htmlFor="email">Email address</label>
              <div className="input-wrap">
                <input
                  id="email" type="email" autoComplete="email"
                  placeholder="you@university.edu.ng"
                  value={form.email} onChange={set('email')}
                  className={errors.email ? 'err' : ''}
                  onKeyDown={e => e.key === 'Enter' && submit()}
                />
              </div>
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="input-wrap">
                <input
                  id="password" type={show ? 'text' : 'password'} autoComplete="current-password"
                  placeholder="Enter your password"
                  value={form.password} onChange={set('password')}
                  className={errors.password ? 'err' : ''}
                  onKeyDown={e => e.key === 'Enter' && submit()}
                />
                <button className="pw-toggle" onClick={() => setShow(v => !v)}>{show ? 'Hide' : 'Show'}</button>
              </div>
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>

            <div className="forgot"><a href="/forgot-password">Forgot password?</a></div>

            <button className="submit-btn" onClick={submit} disabled={loading}>
              {loading ? <><span className="btn-spinner" /> Signing in...</> : 'Sign In'}
            </button>

            <div className="switch-text">New to AfriPlate? <a href="/register">Create a free account</a></div>
          </div>
        </div>
      </div>
    </>
  );
}