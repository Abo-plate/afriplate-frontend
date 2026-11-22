'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '../lib/SessionProvider';
import StudentIdentityFields from '@/components/StudentIdentityFields';
import {useRef} from 'react';
import {createClientId} from '../lib/clientId';
import Link from 'next/link';

import { API_ORIGIN as API } from '../lib/endpoints';



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
  const [form, setForm]         = useState({ is_student:'', user_type:'buyer', first_name:'', last_name:'', email:'', password:'', confirm:'', phone:'', university:'', level:'', university_id:'', matric_number:'' });
  const [idPhoto,setIdPhoto]=useState(null),[createdStudent,setCreatedStudent]=useState(true);
  const STEPS=form.is_student==='false'?['Account','Personal']:['Account','Personal','Campus'];
  const chooseStudent=value=>{if(loading)return;setForm(p=>({...p,is_student:value,user_type:value==='false'?'buyer':p.user_type,...(value==='false'?{university:'',university_id:'',matric_number:'',level:''}:{})}));if(value==='false')setIdPhoto(null);submissionId.current=null;setErrors({});setApiError('');};
  const submissionId=useRef(null),submitLock=useRef(false),feedbackRef=useRef(null),confirmationRef=useRef(null),submissionController=useRef(null),mounted=useRef(true);
  const [feedbackVersion,setFeedbackVersion]=useState(0);
  const [success, setSuccess]   = useState(false);
  const [errors, setErrors]     = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPw, setShowPw]     = useState(false);

  useEffect(() => {
    if (isAuthed) router.replace('/dashboard');
  }, [isAuthed, router]);

  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;submissionController.current?.abort();}},[]);
  useEffect(()=>{if(feedbackVersion>0){feedbackRef.current?.focus({preventScroll:true});feedbackRef.current?.scrollIntoView({block:'center',behavior:'smooth'});}},[feedbackVersion]);
  useEffect(()=>{if(success){confirmationRef.current?.focus({preventScroll:true});confirmationRef.current?.scrollIntoView({block:'center'});}},[success]);
  const showFailure=message=>{setApiError(message);setFeedbackVersion(v=>v+1);};

  const set = (k) => (e) => {
    setForm(p => ({ ...p, [k]: e.target.value }));
    setErrors(p => ({ ...p, [k]: '' }));
    setApiError('');
  };

  const validateStep = () => {
    const e = {};
    if (step === 0) {
      if(!['true','false'].includes(form.is_student))e.is_student='Choose Yes or No.';
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
    if (step === 2 && form.is_student==='true') {
      if (!form.university) e.university = 'Please select your university';
      if (!form.matric_number.trim()) e.matric_number='Enter your matric number';
      if (!idPhoto) e.student_id='Choose a JPEG or PNG student ID photo';
      if (!form.level)      e.level      = 'Please select your level';
    }
    setErrors(e);
    if(Object.keys(e).length)setFeedbackVersion(v=>v+1);
    return !Object.keys(e).length;
  };

  const next = () => {
    if (loading) return;
    setApiError('');
    if (!validateStep()) return;
    if (step < STEPS.length-1) { setStep(s => s + 1); return; }
    submit();
  };

  const submit = async () => {
    if (submitLock.current) return;
    submitLock.current=true;setLoading(true);setApiError('');
    const controller=new AbortController();submissionController.current=controller;
    const timer=setTimeout(()=>controller.abort(),90000);
    try {
      const body=new FormData();
      for(const key of ['is_student','user_type','first_name','last_name','email','password','phone'])body.append(key,form[key]);
      if(form.is_student==='true'){
        if(!submissionId.current)submissionId.current=createClientId();
        for(const key of ['university','university_id','matric_number','level'])body.append(key,form[key]);
        body.append('client_id',submissionId.current);body.append('student_id',idPhoto);
      }
      const res=await fetch(API+'/api/auth/register',{method:'POST',body,signal:controller.signal});
      const data=await res.json().catch(()=>null);
      if(!mounted.current)return;
      if(!res.ok){showFailure(data?.message||(res.status===413?'The upload is too large. Choose a JPEG or PNG student ID photo up to 5 MB.':res.status===429?'Too many signup attempts. Please wait before retrying. If you already submitted, try signing in.':'Registration could not be confirmed. Please retry later, or use Sign in if your account was already created.'));return;}
      if(res.status!==201||data?.status!=='success'||!Number.isSafeInteger(data?.user?.id)||data.user.id<1){showFailure('The server response did not confirm account creation. Sign in to check your account before trying again.');return;}
      if(form.is_student==='false'&&data.user.student_membership!=='non_student'){showFailure('Account type could not be confirmed. Sign in to check your account before retrying.');return;}
      setCreatedStudent(data.user.student_membership!=='non_student');
      setIdPhoto(null);setSuccess(true);
    }catch(error){if(mounted.current)showFailure(error.name==='AbortError'?'The connection timed out. Sign in to check whether your account was created before trying again.':error.code==='SECURE_BROWSER_REQUIRED'?'Your browser cannot create a secure submission ID. Update your browser and open the HTTPS AfriPlate website.':'Could not confirm signup. Try signing in before registering again.');}
    finally{clearTimeout(timer);submissionController.current=null;submitLock.current=false;if(mounted.current)setLoading(false);}
  };

  const strength      = pwStrength(form.password);
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][strength];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#eab308', '#22c55e', '#1f8f43'][strength];

  if (success) {
    return <main style={{padding:'24px 16px',minHeight:'100dvh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--ap-page-background,#f7f8fa)',fontFamily:'Inter,sans-serif'}}>
      <section ref={confirmationRef} tabIndex={-1} aria-labelledby="signup-confirmation-title" style={{background:'var(--ap-surface,#fff)',border:'1px solid var(--ap-border,#e5e7eb)',borderRadius:24,padding:'32px 24px',maxWidth:460,width:'100%',textAlign:'center',outline:'none'}}>
        <p className="student-status">Account created</p>
        <h1 id="signup-confirmation-title" style={{fontSize:'1.5rem',fontWeight:800,color:'var(--ap-text-strong,#183d28)',margin:'12px 0'}}>{createdStudent?'Student ID under review':'Your buyer account is ready'}</h1>
        <p role="status" className="student-help">{createdStudent?'Your ID has been saved for review.':'You can now browse products and contact sellers.'}</p>
        <p className="student-help" style={{margin:'16px 0'}}>{createdStudent?'Check Settings for review updates.':'You can apply to sell after signing in.'}</p>
        <Link href="/login" className="student-primary" style={{width:'100%'}}>Sign in to your account</Link>

      </section>
    </main>;
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



        .student-choice{border:0;padding:0;margin:0 0 20px;min-width:0}.student-choice legend{font-weight:700;margin-bottom:12px;color:var(--ap-text-strong)}.student-choice .type-card{background:var(--ap-surface);color:var(--ap-text-strong);display:flex;flex-direction:column;align-items:flex-start;text-align:left;font:inherit}.student-choice .type-card.selected{background:var(--ap-accent-surface);border-color:var(--ap-color-primary)}.student-choice button:focus-visible{outline:2px solid var(--ap-accent-text);outline-offset:3px}
        .signup-feedback { margin:16px 0;padding:14px;border:1px solid var(--ap-danger-border,#fecaca);border-radius:12px;background:var(--ap-danger-surface,#fef2f2);color:var(--ap-danger-text,#b42318);font-size:.9rem;line-height:1.6;overflow-wrap:anywhere;scroll-margin:24px; }
        .signup-feedback:focus {outline:2px solid var(--ap-danger-text,#b42318);outline-offset:3px;}
        .signup-progress {margin:12px 0;color:var(--ap-text-muted,#53655a);font-size:.85rem;line-height:1.5;}
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
            <h2>Buy, sell and<br /><em>connect</em><br />on AfriPlate</h2>
            <p>Find products, services and opportunities in your campus community.</p>
          </div>
          <div className="perks">
            {['Free to sign up — no credit card needed','Sell anything from textbooks to services','Create your marketplace account','Students and approved sellers welcome'].map(t => (
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


            {step === 0 && (
              <>
                <fieldset className="student-choice" disabled={loading}><legend>Are you currently a student?</legend><div className="type-toggle">{[['true','Yes','Verify with your student ID'],['false','No','Create a buyer account']].map(([value,title,detail])=><button type="button" key={value} className={'type-card '+(form.is_student===value?'selected':'')} aria-pressed={form.is_student===value} onClick={()=>chooseStudent(value)}><span className="tc-title">{title}</span><span className="tc-sub">{detail}</span></button>)}</div>{errors.is_student&&<p className="field-error">{errors.is_student}</p>}</fieldset>
                {form.is_student==='false'&&<p className="student-help" style={{marginBottom:18}}>You can apply to sell after signup.</p>}
                {form.is_student==='true'&&<>
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
                </>}
                <div className="field">
                  <label htmlFor="reg-email">Email address</label>
                  <div className="input-wrap">
                    <input id="reg-email" type="email" autoComplete="email"
                      placeholder="you@example.com"
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

            {step === 2 && form.is_student==='true' && (
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

            {(apiError||Object.values(errors).find(Boolean))&&<div ref={feedbackRef} id="signup-feedback" tabIndex={-1} role="alert" className="signup-feedback">{apiError||Object.values(errors).find(Boolean)}</div>}
            {loading&&<p role="status" className="signup-progress">{form.is_student==='true'?'Saving your account and private ID...':'Creating your buyer account...'}</p>}
            <div className="btn-row">
              {step > 0 && (
                <button className="back-btn" disabled={loading} onClick={() => { setStep(s => s - 1); setErrors({}); }}>Back</button>
              )}
              <button type="button" className="next-btn" onClick={next} disabled={loading} aria-describedby={apiError||Object.values(errors).find(Boolean)?"signup-feedback":undefined}>
                {loading ? <><span className="btn-spinner" /> Creating account...</> : step < STEPS.length-1 ? 'Continue' : 'Create Account'}
              </button>
            </div>

            <div className="switch-text">Already have an account? <Link href="/login">Sign in</Link> | <Link href="/forgot-password">Reset password</Link></div>
          </div>
        </div>
      </div>
    </>
  );
}