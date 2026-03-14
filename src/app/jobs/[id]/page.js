'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}
function getUser() {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
}

function fmt(n) { return Number(n || 0).toLocaleString('en-NG'); }

function Avatar({ name = '', size = 40 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg,#1f8f43,#4ade80)',
      color: '#fff', fontWeight: 800, fontSize: size * 0.38,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      {name?.[0]?.toUpperCase() || 'U'}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'80px 0' }}>
      <div style={{ width:32, height:32, border:'3px solid #e5e7eb', borderTopColor:'#1f8f43', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
    </div>
  );
}

const TYPE_COLORS = {
  'Freelance':  { bg:'#eef2ff', color:'#6366f1' },
  'Part-time':  { bg:'#fef3c7', color:'#d97706' },
  'Full-time':  { bg:'#eaf8ee', color:'#1f8f43' },
  'Internship': { bg:'#fce7f3', color:'#db2777' },
  'Remote':     { bg:'#f0f9ff', color:'#0284c7' },
};

export default function JobPage() {
  const { id } = useParams();
  const [job, setJob]               = useState(null);
  const [related, setRelated]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [applyState, setApplyState] = useState('idle'); // idle | form | loading | success | error
  const [applyMsg, setApplyMsg]     = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [hasApplied, setHasApplied] = useState(false);
  const user = getUser();

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/api/jobs/${id}`);
        if (res.ok) {
          const d = await res.json();
          setJob(d.job || d.data || d);
        }
        // Check if user already applied
        if (getToken()) {
          const aRes = await fetch(`${API}/api/jobs/${id}/applied`, {
            headers: { Authorization: `Bearer ${getToken()}` }
          });
          if (aRes.ok) {
            const aData = await aRes.json();
            setHasApplied(aData.applied || false);
          }
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, [id]);

  useEffect(() => {
    if (!job?.category) return;
    fetch(`${API}/api/jobs?category=${encodeURIComponent(job.category)}&limit=4`)
      .then(r => r.json())
      .then(d => setRelated((d.jobs || d.data || []).filter(j => j.id !== job.id).slice(0, 3)))
      .catch(() => {});
  }, [job]);

  const submitApplication = async () => {
    if (!getToken()) { window.location.href = '/login'; return; }
    if (!coverLetter.trim()) { setApplyMsg('Please write a short cover letter.'); return; }
    setApplyState('loading');
    try {
      const res = await fetch(`${API}/api/jobs/${id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ cover_letter: coverLetter }),
      });
      const data = await res.json();
      if (!res.ok) { setApplyMsg(data.message || 'Application failed.'); setApplyState('error'); return; }
      setApplyState('success');
      setHasApplied(true);
      setApplyMsg('Application submitted! The poster will be in touch.');
    } catch {
      setApplyMsg('Connection error. Please try again.');
      setApplyState('error');
    }
  };

  const messagesPoster = () => {
    if (!getToken()) { window.location.href = '/login'; return; }
    window.location.href = `/dashboard?tab=messages&to=${job?.poster_id}`;
  };

  if (loading) return (
    <div style={{ minHeight:'100vh', fontFamily:'Inter,sans-serif', background:'#f7f8fa' }}>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
      <Nav />
      <Spinner />
    </div>
  );

  if (!job) return (
    <div style={{ minHeight:'100vh', fontFamily:'Inter,sans-serif', background:'#f7f8fa' }}>
      <Nav />
      <div style={{ maxWidth:640, margin:'80px auto', textAlign:'center', padding:'0 24px' }}>
        <div style={{ fontSize:'3rem', marginBottom:16 }}>404</div>
        <h2 style={{ fontSize:'1.4rem', fontWeight:900, color:'#111', marginBottom:8 }}>Job not found</h2>
        <p style={{ color:'#6b7280', marginBottom:24 }}>This listing may have been removed or filled.</p>
        <a href="/jobs" style={{ padding:'12px 24px', background:'#1f8f43', color:'#fff', borderRadius:12, fontWeight:800, fontSize:'0.9rem', textDecoration:'none' }}>Browse Jobs</a>
      </div>
    </div>
  );

  const typeStyle = TYPE_COLORS[job.type] || { bg:'#f3f4f6', color:'#374151' };
  const posterName = job.poster_name || `${job.poster_first_name || ''} ${job.poster_last_name || ''}`.trim() || 'Poster';
  const isOwner = user?.id === job.poster_id;
  const isExpired = job.deadline && new Date(job.deadline) < new Date();
  const daysLeft = job.deadline
    ? Math.max(0, Math.ceil((new Date(job.deadline) - new Date()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Inter',sans-serif; background:#f7f8fa; color:#1f2937; }
        a { color:inherit; text-decoration:none; }
        button { font-family:'Inter',sans-serif; cursor:pointer; border:none; }
        textarea { font-family:'Inter',sans-serif; }

        @keyframes spin   { to { transform:rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }

        .page-wrap { max-width:1000px; margin:0 auto; padding:32px 24px 80px; animation:fadeUp 0.4s ease both; }

        .breadcrumb { display:flex; align-items:center; gap:6px; margin-bottom:24px; font-size:0.8rem; color:#9ca3af; flex-wrap:wrap; }
        .breadcrumb a { color:#9ca3af; font-weight:600; }
        .breadcrumb a:hover { color:#1f8f43; }
        .breadcrumb span { color:#d1d5db; }

        .main-grid { display:grid; grid-template-columns:1fr 340px; gap:28px; margin-bottom:48px; }

        /* JOB CARD */
        .job-card { background:#fff; border:1px solid #eceff3; border-radius:20px; padding:28px; box-shadow:0 4px 24px rgba(15,23,42,0.05); }
        .job-header { margin-bottom:22px; padding-bottom:22px; border-bottom:1px solid #f3f4f6; }
        .job-title  { font-size:1.6rem; font-weight:900; color:#111; letter-spacing:-0.04em; line-height:1.2; margin-bottom:14px; }
        .job-badges { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px; }
        .job-badge  { padding:'5px 12px'; border-radius:50px; font-size:'0.75rem'; font-weight:800; }
        .meta-row   { display:flex; gap:20px; flex-wrap:wrap; }
        .meta-item  { display:flex; align-items:center; gap:6px; font-size:0.82rem; color:#6b7280; font-weight:600; }
        .meta-icon  { width:16px; height:16px; flex-shrink:0; }

        /* SECTION */
        .section-title { font-size:0.78rem; font-weight:800; color:#374151; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:12px; }
        .body-text { font-size:0.9rem; color:#374151; line-height:1.85; white-space:pre-wrap; }

        /* REQUIREMENTS LIST */
        .req-item { display:flex; align-items:flex-start; gap:10px; margin-bottom:8px; font-size:0.875rem; color:#374151; line-height:1.5; }

        /* APPLY CARD */
        .apply-card { background:#fff; border:1px solid #eceff3; border-radius:20px; padding:22px; box-shadow:0 4px 24px rgba(15,23,42,0.05); position:sticky; top:80px; }
        .apply-title { font-size:1rem; font-weight:900; color:#111; margin-bottom:6px; }
        .apply-sub   { font-size:0.8rem; color:#9ca3af; margin-bottom:18px; }

        /* BUDGET DISPLAY */
        .budget-box { background:linear-gradient(135deg,#eaf8ee,#f0fdf4); border:1px solid #bbf7d0; border-radius:14px; padding:16px 18px; margin-bottom:18px; }
        .budget-label { font-size:0.72rem; fontWeight:700; color:#6b7280; textTransform:'uppercase'; letterSpacing:'1px'; marginBottom:4; }
        .budget-amount { font-size:1.8rem; font-weight:900; color:#1f8f43; letter-spacing:-0.04em; }

        /* APPLY FORM */
        .apply-textarea { width:100%; padding:12px 14px; border:1.5px solid #e5e7eb; border-radius:12px; font-size:0.875rem; color:#111; outline:none; resize:vertical; min-height:110px; background:#fafafa; transition:border-color 0.2s; }
        .apply-textarea:focus { border-color:#1f8f43; background:#fff; box-shadow:0 0 0 3px rgba(31,143,67,0.1); }

        /* BTNS */
        .primary-btn { width:100%; padding:14px; border-radius:13px; background:#1f8f43; color:#fff; font-size:0.95rem; font-weight:900; box-shadow:0 8px 24px rgba(31,143,67,0.2); transition:all 0.22s; display:flex; align-items:center; justify-content:center; gap:8px; }
        .primary-btn:hover:not(:disabled) { background:#187536; transform:translateY(-2px); }
        .primary-btn:disabled { opacity:0.65; cursor:not-allowed; transform:none; }
        .secondary-btn { width:100%; padding:13px; border-radius:13px; background:#f3f4f6; color:#374151; font-size:0.88rem; font-weight:700; transition:all 0.18s; margin-top:10px; }
        .secondary-btn:hover { background:#e5e7eb; }
        .btn-spinner { width:16px; height:16px; border:2px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; animation:spin 0.65s linear infinite; }

        /* POSTER */
        .poster-card { background:#fff; border:1px solid #eceff3; border-radius:16px; padding:18px; margin-top:16px; }

        /* RELATED */
        .related-list { display:flex; flex-direction:column; gap:12px; }
        .rel-job { background:#fff; border:1px solid #eceff3; border-radius:14px; padding:16px 18px; transition:all 0.2s; }
        .rel-job:hover { border-color:#1f8f43; transform:translateX(4px); }

        @media (max-width:860px) {
          .main-grid { grid-template-columns:1fr; }
          .apply-card { position:static; }
        }
        @media (max-width:520px) {
          .page-wrap { padding:20px 16px 60px; }
          .job-title { font-size:1.3rem; }
        }
      `}</style>

      <Nav />

      <div className="page-wrap">
        {/* BREADCRUMB */}
        <div className="breadcrumb">
          <a href="/">Home</a>
          <span>/</span>
          <a href="/jobs">Jobs</a>
          {job.category && <><span>/</span><a href={`/jobs?category=${encodeURIComponent(job.category)}`}>{job.category}</a></>}
          <span>/</span>
          <span style={{ color:'#374151', fontWeight:600 }}>{job.title}</span>
        </div>

        <div className="main-grid">

          {/* LEFT — JOB DETAILS */}
          <div>
            <div className="job-card">
              <div className="job-header">
                <h1 className="job-title">{job.title}</h1>

                <div className="job-badges">
                  {job.type && (
                    <span style={{ padding:'5px 12px', borderRadius:50, fontSize:'0.75rem', fontWeight:800, background:typeStyle.bg, color:typeStyle.color }}>
                      {job.type}
                    </span>
                  )}
                  {job.category && (
                    <span style={{ padding:'5px 12px', borderRadius:50, fontSize:'0.75rem', fontWeight:700, background:'#f3f4f6', color:'#374151' }}>
                      {job.category}
                    </span>
                  )}
                  {isExpired
                    ? <span style={{ padding:'5px 12px', borderRadius:50, fontSize:'0.75rem', fontWeight:800, background:'#fef2f2', color:'#ef4444' }}>Expired</span>
                    : <span style={{ padding:'5px 12px', borderRadius:50, fontSize:'0.75rem', fontWeight:800, background:'#eaf8ee', color:'#1f8f43' }}>Open</span>
                  }
                </div>

                <div className="meta-row">
                  {job.poster_university && (
                    <div className="meta-item">
                      <svg className="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 14l9-5-9-5-9 5 9 5z"/><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/></svg>
                      {job.poster_university}
                    </div>
                  )}
                  {job.deadline && (
                    <div className="meta-item" style={{ color: daysLeft <= 3 ? '#ef4444' : '#6b7280' }}>
                      <svg className="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      {isExpired ? 'Deadline passed' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
                      {' · '}{new Date(job.deadline).toLocaleDateString('en-NG', { day:'numeric', month:'short', year:'numeric' })}
                    </div>
                  )}
                  {job.applicant_count > 0 && (
                    <div className="meta-item">
                      <svg className="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
                      {job.applicant_count} applicant{job.applicant_count !== 1 ? 's' : ''}
                    </div>
                  )}
                  <div className="meta-item">
                    <svg className="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    Posted {job.created_at ? new Date(job.created_at).toLocaleDateString('en-NG', { day:'numeric', month:'short' }) : 'Recently'}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom:28 }}>
                <div className="section-title">About this job</div>
                <p className="body-text">{job.description || 'No description provided.'}</p>
              </div>

              {/* Requirements */}
              {job.requirements?.length > 0 && (
                <div style={{ marginBottom:28 }}>
                  <div className="section-title">Requirements</div>
                  {job.requirements.map((req, i) => (
                    <div key={i} className="req-item">
                      <div style={{ width:20, height:20, borderRadius:'50%', background:'#eaf8ee', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#1f8f43" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      {req}
                    </div>
                  ))}
                </div>
              )}

              {/* Skills */}
              {job.skills?.length > 0 && (
                <div>
                  <div className="section-title">Skills needed</div>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {job.skills.map(skill => (
                      <span key={skill} style={{ padding:'6px 12px', borderRadius:50, background:'#f3f4f6', fontSize:'0.8rem', fontWeight:700, color:'#374151' }}>{skill}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* POSTER INFO */}
            <div style={{ background:'#fff', border:'1px solid #eceff3', borderRadius:16, padding:20, marginTop:16 }}>
              <div className="section-title" style={{ marginBottom:14 }}>Posted by</div>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <Avatar name={posterName} size={48} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:'0.95rem', fontWeight:900, color:'#111' }}>{posterName}</div>
                  <div style={{ fontSize:'0.78rem', color:'#9ca3af', marginTop:2 }}>{job.poster_university || 'AfriPlate Member'}</div>
                </div>
                {!isOwner && (
                  <button onClick={messagesPoster} style={{ padding:'9px 16px', borderRadius:10, background:'#eaf8ee', color:'#1f8f43', fontSize:'0.8rem', fontWeight:800, flexShrink:0 }}>
                    Message
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT — APPLY CARD */}
          <div>
            <div className="apply-card">
              {job.budget ? (
                <div className="budget-box">
                  <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'1px', marginBottom:4 }}>Budget</div>
                  <div className="budget-amount">₦{fmt(job.budget)}</div>
                  <div style={{ fontSize:'0.75rem', color:'#6b7280', marginTop:3 }}>
                    You receive ₦{fmt(Math.round(job.budget * 0.92))} after 8% platform fee
                  </div>
                </div>
              ) : (
                <div style={{ background:'#f8fafc', borderRadius:12, padding:'14px 16px', marginBottom:18, textAlign:'center' }}>
                  <div style={{ fontSize:'0.85rem', fontWeight:700, color:'#374151' }}>Budget negotiable</div>
                  <div style={{ fontSize:'0.75rem', color:'#9ca3af', marginTop:2 }}>Discuss payment with the poster</div>
                </div>
              )}

              {/* State: owner */}
              {isOwner ? (
                <div style={{ textAlign:'center', padding:'16px', background:'#f8fafc', borderRadius:12 }}>
                  <div style={{ fontSize:'0.85rem', fontWeight:700, color:'#374151', marginBottom:8 }}>This is your job posting</div>
                  <a href={`/jobs/${id}/edit`} style={{ display:'block', padding:'11px', background:'#eaf8ee', color:'#1f8f43', borderRadius:10, fontSize:'0.85rem', fontWeight:800 }}>
                    Edit Listing
                  </a>
                </div>

              /* State: already applied */
              ) : hasApplied || applyState === 'success' ? (
                <div style={{ textAlign:'center', padding:'18px', background:'#eaf8ee', border:'1px solid #bbf7d0', borderRadius:14 }}>
                  <div style={{ fontSize:'1.4rem', marginBottom:6 }}>✓</div>
                  <div style={{ fontSize:'0.9rem', fontWeight:800, color:'#1f8f43', marginBottom:4 }}>Application Sent!</div>
                  <div style={{ fontSize:'0.78rem', color:'#6b7280' }}>{applyMsg || 'The poster will review your application and reach out.'}</div>
                </div>

              /* State: expired */
              ) : isExpired ? (
                <div style={{ textAlign:'center', padding:'16px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:12 }}>
                  <div style={{ fontSize:'0.85rem', fontWeight:700, color:'#ef4444' }}>This job has expired</div>
                </div>

              /* State: apply form */
              ) : applyState === 'form' || applyState === 'loading' || applyState === 'error' ? (
                <div>
                  <div className="apply-title">Write a cover letter</div>
                  <div className="apply-sub">Tell the poster why you're the right fit</div>
                  <textarea
                    className="apply-textarea"
                    placeholder={`Hi, I'm interested in this ${job.type || 'job'} opportunity. I have experience in ${job.category || 'this field'} and...`}
                    value={coverLetter}
                    onChange={e => { setCoverLetter(e.target.value); setApplyMsg(''); }}
                  />
                  {applyMsg && (
                    <div style={{ marginTop:8, marginBottom:8, fontSize:'0.8rem', fontWeight:600, color: applyState === 'error' ? '#ef4444' : '#1f8f43' }}>
                      {applyMsg}
                    </div>
                  )}
                  <button className="primary-btn" style={{ marginTop:12 }} onClick={submitApplication} disabled={applyState === 'loading'}>
                    {applyState === 'loading' ? <><span className="btn-spinner" /> Submitting...</> : 'Submit Application'}
                  </button>
                  <button className="secondary-btn" onClick={() => { setApplyState('idle'); setApplyMsg(''); }}>
                    Cancel
                  </button>
                </div>

              /* State: idle */
              ) : (
                <>
                  <button className="primary-btn" onClick={() => {
                    if (!getToken()) { window.location.href = '/login'; return; }
                    setApplyState('form');
                  }}>
                    Apply for this Job
                  </button>
                  <button className="secondary-btn" onClick={messagesPoster}>
                    Message Poster First
                  </button>
                </>
              )}

              {/* Quick stats */}
              {!isOwner && !isExpired && (
                <div style={{ marginTop:18, paddingTop:16, borderTop:'1px solid #f3f4f6', display:'flex', justifyContent:'space-around' }}>
                  {[
                    { label:'Applicants', value: job.applicant_count || 0 },
                    { label:'Days left',  value: daysLeft !== null ? daysLeft : '—' },
                    { label:'Type',       value: job.type || '—' },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign:'center' }}>
                      <div style={{ fontSize:'1rem', fontWeight:900, color:'#111' }}>{s.value}</div>
                      <div style={{ fontSize:'0.7rem', color:'#9ca3af', fontWeight:600, marginTop:2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RELATED JOBS */}
        {related.length > 0 && (
          <section>
            <h2 style={{ fontSize:'1.1rem', fontWeight:900, color:'#111', letterSpacing:'-0.03em', marginBottom:16 }}>Similar jobs</h2>
            <div className="related-list">
              {related.map(j => {
                const ts = TYPE_COLORS[j.type] || { bg:'#f3f4f6', color:'#374151' };
                return (
                  <a key={j.id} href={`/jobs/${j.id}`} className="rel-job">
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:'0.92rem', fontWeight:800, color:'#111', marginBottom:4, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{j.title}</div>
                        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
                          {j.type && <span style={{ padding:'3px 9px', borderRadius:50, fontSize:'0.7rem', fontWeight:800, background:ts.bg, color:ts.color }}>{j.type}</span>}
                          {j.category && <span style={{ fontSize:'0.75rem', color:'#9ca3af', fontWeight:600 }}>{j.category}</span>}
                        </div>
                      </div>
                      {j.budget && (
                        <div style={{ fontWeight:900, color:'#1f8f43', fontSize:'0.95rem', flexShrink:0 }}>₦{fmt(j.budget)}</div>
                      )}
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

// ── NAV ───────────────────────────────────────────────────────────────────────
function Nav() {
  const user = getUser();
  return (
    <nav style={{
      background:'#fff', borderBottom:'1px solid #e5e7eb', padding:'0 24px',
      height:62, display:'flex', alignItems:'center', justifyContent:'space-between',
      position:'sticky', top:0, zIndex:100, fontFamily:'Inter,sans-serif',
    }}>
      <a href="/" style={{ fontSize:'1.45rem', fontWeight:900, color:'#111', letterSpacing:'-0.04em' }}>
        Afri<span style={{ color:'#1f8f43' }}>Plate</span>
      </a>
      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
        <a href="/products" style={{ padding:'8px 14px', borderRadius:10, fontSize:'0.84rem', fontWeight:700, color:'#374151', background:'#f3f4f6' }}>Products</a>
        <a href="/services" style={{ padding:'8px 14px', borderRadius:10, fontSize:'0.84rem', fontWeight:700, color:'#374151', background:'#f3f4f6' }}>Services</a>
        <a href="/jobs"     style={{ padding:'8px 14px', borderRadius:10, fontSize:'0.84rem', fontWeight:700, color:'#374151', background:'#f3f4f6' }}>Jobs</a>
        {user
          ? <a href="/dashboard" style={{ padding:'8px 16px', borderRadius:10, fontSize:'0.84rem', fontWeight:800, color:'#fff', background:'#1f8f43' }}>Dashboard</a>
          : <a href="/login"     style={{ padding:'8px 16px', borderRadius:10, fontSize:'0.84rem', fontWeight:800, color:'#fff', background:'#1f8f43' }}>Sign In</a>
        }
      </div>
    </nav>
  );
}