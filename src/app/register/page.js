'use client';
import { useState, useEffect } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const UNIVERSITIES = [
  'University of Lagos (UNILAG)', 'Obafemi Awolowo University (OAU)',
  'University of Ibadan (UI)', 'Federal University of Technology, Akure (FUTA)',
  'Lagos State University (LASU)', 'University of Benin (UNIBEN)',
  'Ahmadu Bello University (ABU)', 'Bayero University Kano (BUK)',
  'University of Port Harcourt (UNIPORT)', 'Yaba College of Technology (YABATECH)',
  'University of Ilorin (UNILORIN)', 'University of Abuja (UNIABUJA)',
  'Covenant University', 'Babcock University', 'Pan-Atlantic University (PAU)',
  "Redeemer's University", 'Landmark University', 'Bowen University', 'Other',
];

const STEPS = ['Account', 'Personal', 'Campus'];

function isValidEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }
function isValidPhone(v) { return /^(\+234|0)[7-9][0-1]\d{8}$/.test(v.replace(/\s/g, '')); }

function pwStrength(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 6) s++;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

export default function RegisterPage() {
  const [step, setStep]         = useState(0);
  const [form, setForm]         = useState({ user_type:'buyer', first_name:'', last_name:'', email:'', password:'', confirm:'', phone:'', university:'', level:'' });
  const [success, setSuccess]   = useState(false);
  const [errors, setErrors]     = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPw, setShowPw]     = useState(false);

  useEffect(() => {
    if (localStorage.getItem('token')) window.location.href = '/dashboard';
  }, []);

  const set = (k) => (e) => {
    setForm(p => ({ ...p, [k]: e.target.value }));
    setErrors(p => ({ ...p, [k]: '' }));
    setApiError('');
  };

  const validateStep = () => {
    const e = {};
    if (step === 0) {
      if (!form.user_type)                 e.user_type = 'Please select account type';
      if (!form.email.trim())              e.email    = 'Email address is required';
      else if (!isValidEmail(form.email))  e.email    = 'Enter a valid email address (e.g. name@mail.com)';
      if (!form.password)                  e.password = 'Password is required';
      else if (form.password.length < 6)   e.password = 'Password must be at least 6 characters';
      if (!form.confirm)                   e.confirm  = 'Please confirm your password';
      else if (form.confirm !== form.password) e.confirm = 'Passwords do not match';
    }
    if (step === 1) {
      if (!form.first_name.trim())               e.first_name = 'First name is required';
      if (!form.last_name.trim())                e.last_name  = 'Last name is required';
      if (!form.phone.trim())                    e.phone = 'Phone number is required';
      else if (!isValidPhone(form.phone))        e.phone = 'Enter a valid Nigerian number (e.g. 08012345678)';
    }
    if (step === 2) {
      if (!form.university) e.university = 'Please select your university';
      if (!form.level)      e.level      = 'Please select your level';
    }
    setErrors(e);
    return !Object.keys(e).length;
  };

  const next = () => {
    setApiError('');
    if (!validateStep()) return;
    if (step < 2) { setStep(s => s + 1); return; }
    submit();
  };

  const submit = async () => {
    setLoading(true); setApiError('');
    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_type:  form.user_type,
          first_name: form.first_name.trim(),
          last_name:  form.last_name.trim(),
          email:      form.email.trim().toLowerCase(),
          password:   form.password,
          phone:      form.phone.trim(),
          university: form.university,
          level:      form.level,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setApiError(data.message || 'Registration failed. Please try again.'); setStep(0); return; }
      // Backend requires email verification before login
      setSuccess(true);
    } catch {
      setApiError('Cannot connect to server. Make sure the backend is running on port 5000.');
      setStep(0);
    } finally { setLoading(false); }
  };

  const strength      = pwStrength(form.password);
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][strength];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#eab308', '#22c55e', '#1f8f43'][strength];

  if (success) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f7f8fa', fontFamily:'Inter,sans-serif' }}>
        <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:24, padding:'48px 40px', maxWidth:440, width:'100%', textAlign:'center', boxShadow:'0 8px 32px rgba(0,0,0,0.06)' }}>
          <div style={{ width:64, height:64, borderRadius:'50%', background:'#eaf8ee', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', fontSize:'1.8rem' }}>✓</div>
          <h1 style={{ fontSize:'1.5rem', fontWeight:900, color:'#111', marginBottom:10, letterSpacing:'-0.04em' }}>Check your email!</h1>
          <p style={{ color:'#6b7280', fontSize:'0.9rem', lineHeight:1.7, marginBottom:24 }}>
            We sent a verification link to <strong style={{ color:'#111' }}>{form.email}</strong>.<br />
            Click the link in the email to verify your account, then come back to log in.
          </p>
          <a href="/login" style={{ display:'block', padding:'13px', background:'#1f8f43', color:'#fff', borderRadius:12, fontWeight:800, fontSize:'0.95rem', textDecoration:'none' }}>
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Inter',sans-serif; background:#f7f8fa; }
        a { color:inherit; text-decoration:none; }
        button { font-family:'Inter',sans-serif; cursor:pointer; border:none; }
        input, select { font-family:'Inter',sans-serif; }

        .page { min-height:100vh; display:grid; grid-template-columns:1fr 1fr; }

        .left {
          background:linear-gradient(160deg,#0d3320 0%,#1f8f43 60%,#2aad55 100%);
          padding:48px; display:flex; flex-direction:column;
          justify-content:space-between; position:relative; overflow:hidden;
        }
        .left::before { content:''; position:absolute; width:500px; height:500px; border-radius:50%; background:rgba(255,255,255,0.04); top:-150px; right:-150px; }
        .left::after  { content:''; position:absolute; width:300px; height:300px; border-radius:50%; background:rgba(31,143,67,0.08); bottom:-80px; left:-80px; }

        .brand { font-size:1.9rem; font-weight:900; color:#fff; letter-spacing:-0.04em; position:relative; z-index:1; }
        .brand span { color:#1f8f43; }

        .left-body { position:relative; z-index:1; }
        .left-body h2 { font-size:clamp(1.9rem,2.6vw,2.8rem); font-weight:900; color:#fff; line-height:1.05; letter-spacing:-0.05em; margin-bottom:14px; }
        .left-body h2 em { font-style:normal; color:#a9e68a; }
        .left-body p { color:rgba(255,255,255,0.65); font-size:0.95rem; line-height:1.65; }

        .perks { display:flex; flex-direction:column; gap:12px; position:relative; z-index:1; }
        .perk { display:flex; align-items:flex-start; gap:12px; }
        .perk-check { width:22px; height:22px; border-radius:50%; background:#1f8f43; display:flex; align-items:center; justify-content:center; font-size:0.65rem; flex-shrink:0; margin-top:2px; color:#fff; font-weight:900; }
        .perk-text { font-size:0.84rem; color:rgba(255,255,255,0.75); line-height:1.5; }

        .right { background:#fff; display:flex; align-items:center; justify-content:center; padding:40px 52px; overflow-y:auto; }
        .form-box { width:100%; max-width:400px; }

        .eyebrow { font-size:0.72rem; font-weight:700; color:#1f8f43; text-transform:uppercase; letter-spacing:1.8px; margin-bottom:10px; }
        .form-title { font-size:2.2rem; font-weight:900; color:#111; letter-spacing:-0.05em; margin-bottom:6px; }
        .form-sub { font-size:0.88rem; color:#6b7280; margin-bottom:24px; }
        .form-sub a { color:#1f8f43; font-weight:700; }

        .stepper { display:flex; align-items:center; margin-bottom:26px; }
        .s-circle { width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.72rem; font-weight:800; flex-shrink:0; border:2px solid #e5e7eb; background:#fff; color:#9ca3af; transition:all 0.25s; }
        .s-circle.done   { background:#1f8f43; border-color:#1f8f43; color:#fff; }
        .s-circle.active { background:#fff; border-color:#1f8f43; color:#1f8f43; }
        .s-label { font-size:0.74rem; font-weight:600; color:#9ca3af; white-space:nowrap; margin-left:7px; }
        .s-label.active { color:#1f8f43; }
        .s-line { flex:1; height:2px; background:#e5e7eb; margin:0 8px; min-width:20px; transition:background 0.25s; }
        .s-line.done { background:#1f8f43; }

        .field { margin-bottom:15px; }
        .field label { display:block; font-size:0.82rem; font-weight:700; color:#374151; margin-bottom:6px; }
        .input-wrap { position:relative; }
        .input-wrap input,
        .input-wrap select {
          width:100%; padding:13px 16px; border:1.5px solid #e5e7eb;
          border-radius:12px; font-size:0.91rem; color:#111; outline:none;
          background:#fafafa; transition:border-color 0.2s, box-shadow 0.2s, background 0.2s;
          appearance:none;
        }
        .input-wrap input:focus,
        .input-wrap select:focus { border-color:#1f8f43; box-shadow:0 0 0 3px rgba(31,143,67,0.1); background:#fff; }
        .input-wrap input.err,
        .input-wrap select.err { border-color:#ef4444; background:#fef2f2; }
        .field-error { color:#ef4444; font-size:0.75rem; font-weight:600; margin-top:5px; display:block; }

        .pw-toggle { position:absolute; right:14px; top:50%; transform:translateY(-50%); background:none; color:#9ca3af; font-size:0.78rem; font-weight:700; padding:4px 6px; border-radius:6px; }
        .pw-toggle:hover { color:#374151; }

        .pw-bar-wrap { height:4px; background:#f3f4f6; border-radius:2px; overflow:hidden; margin-top:7px; margin-bottom:4px; }
        .pw-bar { height:100%; border-radius:2px; transition:width 0.35s, background 0.35s; }
        .pw-label { font-size:0.72rem; font-weight:700; }

        .type-toggle { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:18px; }
        .type-card {
          border:2px solid #e5e7eb; border-radius:14px; padding:16px 14px;
          cursor:pointer; background:#fafafa; transition:all 0.2s; text-align:center;
        }
        .type-card:hover { border-color:#1f8f43; background:#f0fdf4; }
        .type-card.selected { border-color:#1f8f43; background:#eaf8ee; }
        .type-card.selected .tc-icon { background:#1f8f43; color:#fff; }
        .tc-icon { width:40px; height:40px; border-radius:10px; background:#f3f4f6; display:flex; align-items:center; justify-content:center; margin:0 auto 10px; font-size:1.2rem; transition:all 0.2s; }
        .tc-title { font-size:0.88rem; font-weight:800; color:#111; margin-bottom:3px; }
        .tc-sub   { font-size:0.72rem; color:#6b7280; line-height:1.4; }



        .btn-row { display:flex; gap:10px; margin-top:10px; }
        .back-btn { padding:13px 18px; border:1.5px solid #e5e7eb; border-radius:12px; background:#fff; color:#374151; font-size:0.9rem; font-weight:700; transition:all 0.2s; }
        .back-btn:hover { background:#f9fafb; }
        .next-btn {
          flex:1; padding:13px; background:#1f8f43; color:#fff;
          font-size:0.95rem; font-weight:800; border-radius:12px;
          box-shadow:0 8px 24px rgba(31,143,67,0.22); transition:all 0.22s;
          display:flex; align-items:center; justify-content:center; gap:8px;
        }
        .next-btn:hover:not(:disabled) { background:#187536; transform:translateY(-2px); }
        .next-btn:disabled { opacity:0.65; cursor:not-allowed; }
        .btn-spinner { width:16px; height:16px; border:2px solid rgba(255,255,255,0.35); border-top-color:#fff; border-radius:50%; animation:spin 0.65s linear infinite; flex-shrink:0; }
        @keyframes spin { to { transform:rotate(360deg); } }

        .switch-text { text-align:center; font-size:0.875rem; color:#6b7280; margin-top:18px; }
        .switch-text a { color:#1f8f43; font-weight:700; }

        @media (max-width:768px) {
          .page { grid-template-columns:1fr; }
          .left { padding:28px 24px 28px; }
          .perks { display:none; }
          .right { padding:32px 24px 48px; align-items:flex-start; }
          .form-box { max-width:100%; }
          .form-title { font-size:1.9rem; }
        }
        @media (max-width:400px) { .s-label { display:none; } }
      `}</style>

      <div className="page">
        <div className="left">
          <div className="brand">Afri<span>Plate</span></div>
          <div className="left-body">
            <h2>Join 35,000+<br />students <em>hustling</em><br />on campus</h2>
            <p>Nigeria's #1 student marketplace. Safe, fast and built for your campus.</p>
          </div>
          <div className="perks">
            {['Free to sign up — no credit card needed','Sell anything from textbooks to services','Escrow payments protect every transaction','Connect with verified students on your campus'].map(t => (
              <div key={t} className="perk">
                <div className="perk-check">&#10003;</div>
                <span className="perk-text">{t}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="right">
          <div className="form-box">
            <div className="eyebrow">Create account</div>
            <h1 className="form-title">Join AfriPlate</h1>
            <p className="form-sub">Already have an account? <a href="/login">Sign in</a></p>

            <div className="stepper">
              {STEPS.map((s, i) => (
                <div key={s} style={{ display:'flex', alignItems:'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
                  <div className={`s-circle ${i < step ? 'done' : i === step ? 'active' : ''}`}>
                    {i < step ? '✓' : i + 1}
                  </div>
                  <span className={`s-label ${i === step ? 'active' : ''}`}>{s}</span>
                  {i < STEPS.length - 1 && <div className={`s-line ${i < step ? 'done' : ''}`} />}
                </div>
              ))}
            </div>

            {apiError && <div className="api-error">{apiError}</div>}

            {step === 0 && (
              <>
                <div style={{ marginBottom:6 }}>
                  <label style={{ display:'block', fontSize:'0.82rem', fontWeight:700, color:'#374151', marginBottom:10 }}>I want to</label>
                  <div className="type-toggle">
                    {[
                      { value:'buyer',  icon:'🛍', title:'Buy',  sub:'Shop products, services & jobs from students' },
                      { value:'seller', icon:'💼', title:'Sell', sub:'List products, offer services & post jobs' },
                    ].map(opt => (
                      <div key={opt.value}
                        className={`type-card ${form.user_type === opt.value ? 'selected' : ''}`}
                        onClick={() => { setForm(p => ({ ...p, user_type: opt.value })); setErrors(p => ({ ...p, user_type:'' })); }}
                      >
                        <div className="tc-icon">{opt.icon}</div>
                        <div className="tc-title">{opt.title}</div>
                        <div className="tc-sub">{opt.sub}</div>
                      </div>
                    ))}
                  </div>
                  {errors.user_type && <span className="field-error">{errors.user_type}</span>}
                </div>
                <div className="field">
                  <label htmlFor="reg-email">Email address</label>
                  <div className="input-wrap">
                    <input id="reg-email" type="email" autoComplete="email"
                      placeholder="you@university.edu.ng"
                      value={form.email} onChange={set('email')}
                      className={errors.email ? 'err' : ''} />
                  </div>
                  {errors.email && <span className="field-error">{errors.email}</span>}
                </div>
                <div className="field">
                  <label htmlFor="reg-password">Password</label>
                  <div className="input-wrap">
                    <input id="reg-password" type={showPw ? 'text' : 'password'} autoComplete="new-password"
                      placeholder="Create a strong password"
                      value={form.password} onChange={set('password')}
                      className={errors.password ? 'err' : ''} />
                    <button className="pw-toggle" onClick={() => setShowPw(v => !v)}>{showPw ? 'Hide' : 'Show'}</button>
                  </div>
                  {errors.password && <span className="field-error">{errors.password}</span>}
                  {form.password && !errors.password && (
                    <>
                      <div className="pw-bar-wrap"><div className="pw-bar" style={{ width:`${(strength/5)*100}%`, background:strengthColor }} /></div>
                      <span className="pw-label" style={{ color:strengthColor }}>{strengthLabel}</span>
                    </>
                  )}
                </div>
                <div className="field">
                  <label htmlFor="reg-confirm">Confirm password</label>
                  <div className="input-wrap">
                    <input id="reg-confirm" type="password" autoComplete="new-password"
                      placeholder="Repeat your password"
                      value={form.confirm} onChange={set('confirm')}
                      className={errors.confirm ? 'err' : ''} />
                  </div>
                  {errors.confirm && <span className="field-error">{errors.confirm}</span>}
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div className="field">
                  <label htmlFor="reg-fname">First name</label>
                  <div className="input-wrap">
                    <input id="reg-fname" type="text" autoComplete="given-name"
                      placeholder="e.g. Tunde"
                      value={form.first_name} onChange={set('first_name')}
                      className={errors.first_name ? 'err' : ''} />
                  </div>
                  {errors.first_name && <span className="field-error">{errors.first_name}</span>}
                </div>
                <div className="field">
                  <label htmlFor="reg-lname">Last name</label>
                  <div className="input-wrap">
                    <input id="reg-lname" type="text" autoComplete="family-name"
                      placeholder="e.g. Adeyemi"
                      value={form.last_name} onChange={set('last_name')}
                      className={errors.last_name ? 'err' : ''} />
                  </div>
                  {errors.last_name && <span className="field-error">{errors.last_name}</span>}
                </div>
                <div className="field">
                  <label htmlFor="reg-phone">Phone number</label>
                  <div className="input-wrap">
                    <input id="reg-phone" type="tel" autoComplete="tel"
                      placeholder="08012345678"
                      value={form.phone} onChange={set('phone')}
                      className={errors.phone ? 'err' : ''} />
                  </div>
                  {errors.phone && <span className="field-error">{errors.phone}</span>}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="field">
                  <label htmlFor="reg-uni">University</label>
                  <div className="input-wrap">
                    <select id="reg-uni" value={form.university} onChange={set('university')} className={errors.university ? 'err' : ''}>
                      <option value="">Select your university</option>
                      {UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  {errors.university && <span className="field-error">{errors.university}</span>}
                </div>
                <div className="field">
                  <label htmlFor="reg-level">Level / Year</label>
                  <div className="input-wrap">
                    <select id="reg-level" value={form.level} onChange={set('level')} className={errors.level ? 'err' : ''}>
                      <option value="">Select your level</option>
                      <option>100 Level</option><option>200 Level</option>
                      <option>300 Level</option><option>400 Level</option>
                      <option>500 Level</option><option>Postgraduate</option>
                    </select>
                  </div>
                  {errors.level && <span className="field-error">{errors.level}</span>}
                </div>
              </>
            )}

            <div className="btn-row">
              {step > 0 && (
                <button className="back-btn" onClick={() => { setStep(s => s - 1); setErrors({}); }}>Back</button>
              )}
              <button className="next-btn" onClick={next} disabled={loading}>
                {loading ? <><span className="btn-spinner" /> Creating account...</> : step < 2 ? 'Continue' : 'Create Account'}
              </button>
            </div>

            <div className="switch-text">Already have an account? <a href="/login">Sign in</a></div>
          </div>
        </div>
      </div>
    </>
  );
}