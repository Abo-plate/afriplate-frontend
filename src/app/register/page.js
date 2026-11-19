'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '../lib/SessionProvider';
import StudentIdentityFields from '@/components/StudentIdentityFields';
import {useRef} from 'react';
import Link from 'next/link';
import ResendVerification from '@/components/ResendVerification';

import { API_ORIGIN as API } from '../lib/endpoints';

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
  const router = useRouter();
  const { isAuthed } = useSession();
  const [step, setStep]         = useState(0);
  const [form, setForm]         = useState({ user_type:'buyer', first_name:'', last_name:'', email:'', password:'', confirm:'', phone:'', university:'', level:'', university_id:'', matric_number:'' });
  const [idPhoto,setIdPhoto]=useState(null);
  const submissionId=useRef(null),submitLock=useRef(false);
  const [verificationCode,setVerificationCode]=useState(null);
  const [success, setSuccess]   = useState(false);
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);
  const [errors, setErrors]     = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPw, setShowPw]     = useState(false);

  useEffect(() => {
    if (isAuthed) router.replace('/dashboard');
  }, [isAuthed, router]);

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
      else if (form.password.length < 8)   e.password = 'Password must be at least 8 characters';
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
      if (!form.matric_number.trim()) e.matric_number='Enter your matric number';
      if (!idPhoto) e.student_id='Choose a JPEG or PNG student ID photo';
      if (!form.level)      e.level      = 'Please select your level';
    }
    setErrors(e);
    return !Object.keys(e).length;
  };

  const next = () => {
    if (loading) return;
    setApiError('');
    if (!validateStep()) return;
    if (step < 2) { setStep(s => s + 1); return; }
    submit();
  };

  const submit = async () => {
    if (submitLock.current) return;
    submitLock.current=true;setLoading(true);setApiError('');
    try {
      if(!submissionId.current)submissionId.current=crypto.randomUUID();
      const body=new FormData();
      for(const key of ['user_type','first_name','last_name','email','password','phone','university','university_id','matric_number','level'])body.append(key,form[key]);
      body.append('client_id',submissionId.current);body.append('student_id',idPhoto);
      const res=await fetch(API+'/api/auth/register',{method:'POST',body});
      const data=await res.json();
      if(!res.ok){setApiError(data.message||'Registration could not be completed.');return;}
      setVerificationEmailSent(data.verification_email_sent===true);setVerificationCode(data.verification_email_code);setIdPhoto(null);setSuccess(true);
    }catch{setApiError('We could not confirm registration. If your account was created, use Sign in or Resend verification instead of registering again.');}
    finally{submitLock.current=false;setLoading(false);}
  };

  const strength      = pwStrength(form.password);
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][strength];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#eab308', '#22c55e', '#1f8f43'][strength];

  if (success) {
    return (
      <div style={{ padding:'24px 16px', minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--ap-page-background, #f7f8fa)', fontFamily:'Inter,sans-serif' }}>
        <div style={{ background:'var(--ap-surface, #fff)', border:'1px solid var(--ap-border, #e5e7eb)', borderRadius:24, padding:'32px 24px', maxWidth:440, width:'100%', textAlign:'center', boxShadow:'0 8px 32px rgba(0,0,0,0.06)' }}>
          <div style={{ width:64, height:64, borderRadius:'50%', background:'var(--ap-accent-surface, #eaf8ee)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', fontSize:'1.8rem' }}>✓</div>
          <h1 style={{ fontSize:'1.5rem', fontWeight:900, color:'var(--ap-text-strong, #111)', marginBottom:10, letterSpacing:'-0.04em' }}>{verificationEmailSent ? 'Check your email!' : 'Account created'}</h1>
          <p role="status" style={{ color:'var(--ap-text-muted, #6b7280)', fontSize:'0.9rem', lineHeight:1.7, marginBottom:24 }}>
            {verificationEmailSent ? <>Your account was created and a verification email was requested for <strong style={{ color:'var(--ap-text-strong, #111)' }}>{form.email}</strong>. Check your inbox and spam folder, then follow the link before logging in.</> : <>Your account was created, but we could not confirm that a verification email was sent to <strong style={{ color:'var(--ap-text-strong, #111)' }}>{form.email}</strong>. Request a new email below. You do not need to register again.</>}
          </p>
          <a href="/login" style={{ display:'block', padding:'13px', background:'#1f8f43', color:'#fff', borderRadius:12, fontWeight:800, fontSize:'0.95rem', textDecoration:'none' }}>
            Go to Login
          </a>
          <p className="student-status">Student ID under review</p><p className="student-help">Email verification and student ID approval are separate. You can review your ID status in Settings after signing in.</p><ResendVerification email={form.email} initialCode={verificationCode} />
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:var(--ap-font); background:var(--ap-color-background); }
        a { color:inherit; text-decoration:none; }
        button { font-family:var(--ap-font); cursor:pointer; border:none; }
        input, select { font-family:var(--ap-font); }

        .page { min-height:100vh; display:grid; grid-template-columns:1fr 1fr; }

        .left {
          background:linear-gradient(160deg,#0d3320 0%,var(--ap-color-primary) 60%,#2aad55 100%);
          padding:48px; display:flex; flex-direction:column;
          justify-content:space-between; position:relative; overflow:hidden;
        }
        .left::before { content:''; position:absolute; width:500px; height:500px; border-radius:50%; background:rgba(255,255,255,0.04); top:-150px; right:-150px; }
        .left::after  { content:''; position:absolute; width:300px; height:300px; border-radius:50%; background:rgba(31,143,67,0.08); bottom:-80px; left:-80px; }

        .brand { font-size:1.9rem; font-weight:var(--ap-weight-heading); color:#fff; letter-spacing:-0.04em; position:relative; z-index:1; }
        .brand span { color:var(--ap-accent-text, var(--ap-color-primary)); }

        .left-body { position:relative; z-index:1; }
        .left-body h2 { font-size:clamp(1.9rem,2.6vw,2.8rem); font-weight:var(--ap-weight-heading); color:#fff; line-height:1.05; letter-spacing:-0.05em; margin-bottom:14px; }
        .left-body h2 em { font-style:normal; color:var(--ap-accent-text, #a9e68a); }
        .left-body p { color:rgba(255,255,255,0.65); font-size:0.95rem; line-height:1.65; }

        .perks { display:flex; flex-direction:column; gap:12px; position:relative; z-index:1; }
        .perk { display:flex; align-items:flex-start; gap:12px; }
        .perk-check { width:22px; height:22px; border-radius:50%; background:var(--ap-color-primary); display:flex; align-items:center; justify-content:center; font-size:0.65rem; flex-shrink:0; margin-top:2px; color:#fff; font-weight:var(--ap-weight-heading); }
        .perk-text { font-size:0.84rem; color:rgba(255,255,255,0.75); line-height:1.5; }

        .right { background:var(--ap-surface, #fff); display:flex; align-items:center; justify-content:center; padding:40px 52px; overflow-y:auto; }
        .form-box { width:100%; max-width:400px; }

        .eyebrow { font-size:0.72rem; font-weight:var(--ap-weight-label); color:var(--ap-accent-text, var(--ap-color-primary)); text-transform:uppercase; letter-spacing:1.8px; margin-bottom:10px; }
        .form-title { font-size:2.2rem; font-weight:var(--ap-weight-heading); color:var(--ap-text-strong, #111); letter-spacing:-0.05em; margin-bottom:6px; }
        .form-sub { font-size:0.88rem; color:var(--ap-color-muted); margin-bottom:24px; }
        .form-sub a { color:var(--ap-accent-text, var(--ap-color-primary)); font-weight:var(--ap-weight-label); }

        .stepper { display:flex; align-items:center; margin-bottom:26px; }
        .s-circle { width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.72rem; font-weight:var(--ap-weight-button); flex-shrink:0; border:2px solid var(--ap-color-border); background:var(--ap-surface, #fff); color:var(--ap-text-subtle, #9ca3af); transition:all 0.25s; }
        .s-circle.done   { background:var(--ap-color-primary); border-color:var(--ap-color-primary); color:#fff; }
        .s-circle.active { background:var(--ap-surface, #fff); border-color:var(--ap-color-primary); color:var(--ap-accent-text, var(--ap-color-primary)); }
        .s-label { font-size:0.74rem; font-weight:600; color:var(--ap-text-subtle, #9ca3af); white-space:nowrap; margin-left:7px; }
        .s-label.active { color:var(--ap-accent-text, var(--ap-color-primary)); }
        .s-line { flex:1; height:2px; background:var(--ap-color-border); margin:0 8px; min-width:20px; transition:background 0.25s; }
        .s-line.done { background:var(--ap-color-primary); }

        .field { margin-bottom:15px; }
        .field label { display:block; font-size:0.82rem; font-weight:var(--ap-weight-label); color:var(--ap-color-label); margin-bottom:6px; }
        .input-wrap { position:relative; }
        .input-wrap input,
        .input-wrap select {
          width:100%; padding:13px 16px; border:1.5px solid var(--ap-color-border);
          border-radius:var(--ap-radius-control); font-size:0.91rem; color:var(--ap-text-strong, #111); outline:none;
          background:var(--ap-color-input); transition:border-color 0.2s, box-shadow 0.2s, background 0.2s;
          appearance:none;
        }
        .input-wrap input:focus,
        .input-wrap select:focus { border-color:var(--ap-color-primary); box-shadow:0 0 0 3px rgba(31,143,67,0.1); background:var(--ap-surface, #fff); }
        .input-wrap input.err,
        .input-wrap select.err { border-color:var(--ap-danger-border, #ef4444); background:var(--ap-danger-surface, #fef2f2); }
        .field-error { color:var(--ap-danger-text, #ef4444); font-size:0.75rem; font-weight:600; margin-top:5px; display:block; }

        .pw-toggle { position:absolute; right:14px; top:50%; transform:translateY(-50%); background:none; color:var(--ap-text-subtle, #9ca3af); font-size:0.78rem; font-weight:var(--ap-weight-label); padding:4px 6px; border-radius:6px; }
        .pw-toggle:hover { color:var(--ap-color-label); }

        .pw-bar-wrap { height:4px; background:var(--ap-surface-muted, #f3f4f6); border-radius:2px; overflow:hidden; margin-top:7px; margin-bottom:4px; }
        .pw-bar { height:100%; border-radius:2px; transition:width 0.35s, background 0.35s; }
        .pw-label { font-size:0.72rem; font-weight:var(--ap-weight-label); }

        .type-toggle { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:18px; }
        .type-card {
          border:2px solid var(--ap-color-border); border-radius:14px; padding:16px 14px;
          cursor:pointer; background:var(--ap-color-input); transition:all 0.2s; text-align:center;
        }
        .type-card:hover { border-color:var(--ap-color-primary); background:var(--ap-accent-surface, #f0fdf4); }
        .type-card.selected { border-color:var(--ap-color-primary); background:var(--ap-accent-surface, #eaf8ee); }
        .type-card.selected .tc-icon { background:var(--ap-color-primary); color:#fff; }
        .tc-icon { width:40px; height:40px; border-radius:10px; background:var(--ap-surface-muted, #f3f4f6); display:flex; align-items:center; justify-content:center; margin:0 auto 10px; font-size:1.2rem; transition:all 0.2s; }
        .tc-title { font-size:0.88rem; font-weight:var(--ap-weight-button); color:var(--ap-text-strong, #111); margin-bottom:3px; }
        .tc-sub   { font-size:0.72rem; color:var(--ap-color-muted); line-height:1.4; }



        .btn-row { display:flex; gap:10px; margin-top:10px; }
        .back-btn { padding:13px 18px; border:1.5px solid var(--ap-color-border); border-radius:var(--ap-radius-control); background:var(--ap-surface, #fff); color:var(--ap-color-label); font-size:0.9rem; font-weight:var(--ap-weight-label); transition:all 0.2s; }
        .back-btn:hover { background:var(--ap-surface-muted, #f9fafb); }
        .next-btn {
          flex:1; padding:13px; background:var(--ap-color-primary); color:#fff;
          font-size:0.95rem; font-weight:var(--ap-weight-button); border-radius:var(--ap-radius-control);
          box-shadow:0 8px 24px rgba(31,143,67,0.22); transition:all 0.22s;
          display:flex; align-items:center; justify-content:center; gap:8px;
        }
        .next-btn:hover:not(:disabled) { background:var(--ap-color-primary-hover); transform:translateY(-2px); }
        .next-btn:disabled { opacity:0.65; cursor:not-allowed; }
        .btn-spinner { width:16px; height:16px; border:2px solid rgba(255,255,255,0.35); border-top-color:var(--ap-surface, #fff); border-radius:50%; animation:spin 0.65s linear infinite; flex-shrink:0; }
        @keyframes spin { to { transform:rotate(360deg); } }

        .switch-text { text-align:center; font-size:0.875rem; color:var(--ap-color-muted); margin-top:18px; }
        .switch-text a { color:var(--ap-accent-text, var(--ap-color-primary)); font-weight:var(--ap-weight-label); }

        @media (max-width:768px) {
          .page { grid-template-columns:1fr; }
          .left { padding:28px 24px 28px; }
          .perks { display:none; }
          .right { padding:32px 24px 48px; align-items:flex-start; }
          .form-box { max-width:100%; }
          .form-title { font-size:1.9rem; }
        }
        @media (max-width:400px) { .s-label { display:none; } }
        .submit-btn:focus-visible, .next-btn:focus-visible, .back-btn:focus-visible, .pw-toggle:focus-visible {
          outline:3px solid var(--ap-color-primary); outline-offset:4px;
        }
      `}</style>

      <div className="page">
        <div className="left">
          <div className="brand">Afri<span>Plate</span></div>
          <div className="left-body">
            <h2>Join 35,000+<br />students <em>hustling</em><br />on campus</h2>
            <p>Nigeria's #1 student marketplace. Safe, fast and built for your campus.</p>
          </div>
          <div className="perks">
            {['Free to sign up — no credit card needed','Sell anything from textbooks to services','Create your campus marketplace account','Student ID approval is reviewed separately'].map(t => (
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

            {apiError && <div className="api-error" role="alert">{apiError}</div>}

            {step === 0 && (
              <>
                <div style={{ marginBottom:6 }}>
                  <label style={{ display:'block', fontSize:'0.82rem', fontWeight:700, color:'var(--ap-text-strong, #374151)', marginBottom:10 }}>I want to</label>
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
                <StudentIdentityFields value={form} file={idPhoto} disabled={loading} onChange={patch=>{submissionId.current=null;setForm(p=>({...p,...patch}));setErrors({});}} onFile={file=>{submissionId.current=null;setIdPhoto(file);setErrors({});}}/>
                {(errors.matric_number||errors.student_id||errors.university)&&<p role="alert" className="field-error">{errors.matric_number||errors.student_id||errors.university}</p>}
                <div className="field">
                  <label htmlFor="reg-level">Level / Year</label>
                  <div className="input-wrap">
                    <select disabled={loading} id="reg-level" value={form.level} onChange={set('level')} className={errors.level ? 'err' : ''}>
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
                <button className="back-btn" disabled={loading} onClick={() => { setStep(s => s - 1); setErrors({}); }}>Back</button>
              )}
              <button className="next-btn" onClick={next} disabled={loading}>
                {loading ? <><span className="btn-spinner" /> Creating account...</> : step < 2 ? 'Continue' : 'Create Account'}
              </button>
            </div>

            <div className="switch-text">Already have an account? <Link href="/login">Sign in</Link> | <Link href="/resend-verification">Resend verification</Link> | <Link href="/forgot-password">Reset password</Link></div>
          </div>
        </div>
      </div>
    </>
  );
}