'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { jobsAPI } from '../lib/services';

const JOB_TYPES   = ['All', 'Full-time', 'Part-time', 'Remote', 'Freelance', 'Internship'];
const CATEGORIES  = ['All', 'Tech', 'Design', 'Writing', 'Marketing', 'Finance', 'Teaching', 'Media', 'Admin', 'Other'];
const UNIVERSITIES = ['All Universities', 'UNILAG', 'OAU', 'UI', 'FUTA', 'LASU', 'UNIBEN', 'ABU', 'BUK', 'UNIPORT', 'YABATECH', 'UNILORIN'];
const SORT_OPTIONS = [
  { value: 'newest',   label: 'Newest First' },
  { value: 'oldest',   label: 'Oldest First' },
  { value: 'budget_desc', label: 'Highest Budget' },
  { value: 'budget_asc',  label: 'Lowest Budget' },
];
const BUDGET_RANGES = [
  { label: 'Any budget',    min: 0,     max: Infinity },
  { label: 'Under ₦10k',   min: 0,     max: 10000 },
  { label: '₦10k – ₦50k',  min: 10000, max: 50000 },
  { label: '₦50k – ₦150k', min: 50000, max: 150000 },
  { label: 'Above ₦150k',  min: 150000, max: Infinity },
];

const TYPE_COLORS = {
  'Full-time':  { bg:'#dbeafe', color:'#1d4ed8' },
  'Part-time':  { bg:'#fef3c7', color:'#92400e' },
  'Remote':     { bg:'#f0fdf4', color:'#166534' },
  'Freelance':  { bg:'#fdf4ff', color:'#6b21a8' },
  'Internship': { bg:'#fff1f2', color:'#be123c' },
};

function SkeletonJob() {
  return (
    <div style={{ background:'#fff', border:'1px solid #eceff3', borderRadius:16, padding:'20px' }}>
      {[100, 60, 80].map((w, i) => (
        <div key={i} style={{ height:12, width:`${w}%`, borderRadius:6, background:'linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite', marginBottom:10 }} />
      ))}
    </div>
  );
}

export default function JobsPage() {
  const [items, setItems]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [view, setView]               = useState('list');
  const [jobType, setJobType]         = useState('All');
  const [category, setCategory]       = useState('All');
  const [university, setUniversity]   = useState('All Universities');
  const [sort, setSort]               = useState('newest');
  const [budgetRange, setBudgetRange] = useState(0);
  const [search, setSearch]           = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage]               = useState(1);
  const [hasMore, setHasMore]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const loaderRef = useRef(null);

  const fetchJobs = useCallback(async (reset = true) => {
    if (reset) { setLoading(true); setError(''); setPage(1); }
    try {
      const params = {
        limit: 15, page: reset ? 1 : page,
        ...(jobType !== 'All' && { type: jobType }),
        ...(category !== 'All' && { category }),
        ...(university !== 'All Universities' && { university }),
        ...(sort && { sort }),
        ...(search && { q: search }),
        ...(BUDGET_RANGES[budgetRange].max !== Infinity && { max_budget: BUDGET_RANGES[budgetRange].max }),
        ...(BUDGET_RANGES[budgetRange].min > 0 && { min_budget: BUDGET_RANGES[budgetRange].min }),
      };
      const res = await jobsAPI.getAll(params);
      const data = res.data?.jobs || res.data?.data || res.data || [];
      if (reset) setItems(data); else setItems(p => [...p, ...data]);
      setHasMore(data.length === 15);
    } catch { setError('Failed to load jobs. Please try again.'); }
    finally { setLoading(false); setLoadingMore(false); }
  }, [jobType, category, university, sort, budgetRange, search, page]);

  useEffect(() => { fetchJobs(true); }, [jobType, category, university, sort, budgetRange, search]);

  useEffect(() => {
    const observer = new IntersectionObserver(async ([entry]) => {
      if (entry.isIntersecting && !loadingMore && hasMore && !loading) {
        setLoadingMore(true); setPage(p => p + 1); await fetchJobs(false);
      }
    }, { threshold: 0.1 });
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loadingMore, hasMore, loading]);

  const clearFilters = () => { setJobType('All'); setCategory('All'); setUniversity('All Universities'); setBudgetRange(0); };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Inter',sans-serif; background:#f7f8fa; color:#1f2937; }
        a { color:inherit; text-decoration:none; }
        button { font-family:'Inter',sans-serif; cursor:pointer; border:none; }
        input, select { font-family:'Inter',sans-serif; }

        @keyframes shimmer { 0% { background-position:200% 0; } 100% { background-position:-200% 0; } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform:rotate(360deg); } }

        .nav { background:#fff; border-bottom:1px solid #e5e7eb; position:sticky; top:0; z-index:100; }
        .nav-inner { max-width:1320px; margin:0 auto; padding:0 24px; height:70px; display:flex; align-items:center; justify-content:space-between; gap:16px; }
        .brand { font-size:1.6rem; font-weight:900; letter-spacing:-0.04em; color:#111; }
        .brand span { color:#1f8f43; }
        .nav-links { display:flex; gap:24px; list-style:none; }
        .nav-links a { font-size:0.9rem; font-weight:600; color:#6b7280; transition:color 0.2s; }
        .nav-links a:hover, .nav-links a.active { color:#1f8f43; }
        .nav-right { display:flex; align-items:center; gap:10px; }
        .nav-btn { padding:9px 18px; border-radius:10px; font-size:0.875rem; font-weight:700; }
        .nav-login  { background:#f3f4f6; color:#374151; }
        .nav-signup { background:#1f8f43; color:#fff; box-shadow:0 4px 14px rgba(31,143,67,0.22); }

        /* HERO */
        .hero-strip { background:linear-gradient(135deg,#1e1b4b,#3730a3); padding:32px 24px; }
        .hero-strip-inner { max-width:1320px; margin:0 auto; display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap; }
        .hero-strip h1 { font-size:clamp(1.6rem,2.5vw,2.2rem); font-weight:900; color:#fff; letter-spacing:-0.04em; margin-bottom:4px; }
        .hero-strip p { color:rgba(255,255,255,0.7); font-size:0.9rem; }
        .post-btn { padding:12px 24px; background:#ff9d3f; color:#fff; border-radius:12px; font-size:0.875rem; font-weight:800; box-shadow:0 4px 16px rgba(255,157,63,0.3); transition:all 0.2s; white-space:nowrap; }
        .post-btn:hover { background:#e8892e; transform:translateY(-2px); }

        /* TYPE PILLS (horizontal scroll) */
        .type-bar { background:#fff; border-bottom:1px solid #e5e7eb; padding:12px 24px; }
        .type-bar-inner { max-width:1320px; margin:0 auto; display:flex; gap:8px; overflow-x:auto; scrollbar-width:none; }
        .type-bar-inner::-webkit-scrollbar { display:none; }
        .type-pill { padding:8px 18px; border-radius:50px; border:1.5px solid #e5e7eb; background:#fff; color:#6b7280; font-size:0.82rem; font-weight:700; white-space:nowrap; transition:all 0.18s; flex-shrink:0; }
        .type-pill:hover { border-color:#1f8f43; color:#1f8f43; }
        .type-pill.active { background:#1f8f43; color:#fff; border-color:#1f8f43; }

        .page { max-width:1320px; margin:0 auto; padding:28px 24px; display:grid; grid-template-columns:260px 1fr; gap:24px; align-items:start; }

        .sidebar { background:#fff; border:1px solid #e5e7eb; border-radius:20px; padding:22px; position:sticky; top:90px; }
        .sidebar-title { font-size:0.72rem; font-weight:800; color:#9ca3af; text-transform:uppercase; letter-spacing:1.2px; margin-bottom:16px; }
        .filter-group { margin-bottom:24px; }
        .filter-label { font-size:0.8rem; font-weight:700; color:#374151; margin-bottom:10px; display:block; }

        .filter-pills { display:flex; flex-wrap:wrap; gap:6px; }
        .f-pill { padding:6px 12px; border-radius:50px; border:1.5px solid #e5e7eb; background:#fff; color:#6b7280; font-size:0.78rem; font-weight:600; transition:all 0.18s; }
        .f-pill:hover { border-color:#1f8f43; color:#1f8f43; }
        .f-pill.active { background:#eaf8ee; border-color:#1f8f43; color:#1f8f43; font-weight:700; }

        .price-options { display:flex; flex-direction:column; gap:6px; }
        .price-opt { display:flex; align-items:center; gap:8px; padding:7px 10px; border-radius:10px; border:1.5px solid #e5e7eb; background:#fff; color:#6b7280; font-size:0.8rem; font-weight:600; transition:all 0.18s; text-align:left; }
        .price-opt:hover { border-color:#1f8f43; color:#1f8f43; }
        .price-opt.active { background:#eaf8ee; border-color:#1f8f43; color:#1f8f43; }
        .price-dot { width:8px; height:8px; border-radius:50%; border:2px solid currentColor; flex-shrink:0; }
        .price-opt.active .price-dot { background:currentColor; }

        .uni-select { width:100%; padding:10px 12px; border:1.5px solid #e5e7eb; border-radius:10px; font-size:0.83rem; color:#374151; outline:none; background:#fff; appearance:none; }
        .uni-select:focus { border-color:#1f8f43; box-shadow:0 0 0 3px rgba(31,143,67,0.08); }
        .clear-btn { width:100%; padding:10px; border-radius:10px; background:#f3f4f6; color:#6b7280; font-size:0.82rem; font-weight:700; margin-top:4px; transition:all 0.18s; }
        .clear-btn:hover { background:#fee2e2; color:#dc2626; }

        .main { min-width:0; }
        .top-bar { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:18px; flex-wrap:wrap; }
        .search-wrap { display:flex; gap:8px; flex:1; min-width:200px; }
        .filter-toggle { display:none; padding:10px 16px; background:#fff; border:1.5px solid #e5e7eb; border-radius:12px; font-size:0.875rem; font-weight:700; color:#374151; gap:6px; align-items:center; }
        .search-input { flex:1; padding:11px 16px; border:1.5px solid #e5e7eb; border-radius:12px; font-size:0.875rem; outline:none; background:#fff; }
        .search-input:focus { border-color:#1f8f43; box-shadow:0 0 0 3px rgba(31,143,67,0.08); }
        .search-btn { padding:11px 20px; background:#1f8f43; color:#fff; border-radius:12px; font-size:0.875rem; font-weight:700; transition:background 0.2s; }
        .search-btn:hover { background:#187536; }
        .right-bar { display:flex; align-items:center; gap:8px; }
        .sort-select { padding:9px 12px; border:1.5px solid #e5e7eb; border-radius:10px; font-size:0.82rem; color:#374151; outline:none; background:#fff; }
        .view-btn { width:36px; height:36px; border-radius:9px; border:1.5px solid #e5e7eb; background:#fff; display:flex; align-items:center; justify-content:center; font-size:1rem; transition:all 0.18s; }
        .view-btn.active { background:#1f8f43; border-color:#1f8f43; color:#fff; }

        .results-info { font-size:0.82rem; color:#6b7280; margin-bottom:16px; }
        .results-info span { color:#111; font-weight:700; }

        /* JOB LIST CARD */
        .jobs-list { display:flex; flex-direction:column; gap:12px; }
        .job-card {
          background:#fff; border:1px solid #eceff3; border-radius:18px;
          padding:22px; display:flex; gap:18px;
          transition:all 0.22s; animation:fadeUp 0.4s ease both;
          cursor:pointer; position:relative;
        }
        .job-card:hover { border-color:#d1fae5; box-shadow:0 12px 32px rgba(15,23,42,0.08); transform:translateY(-2px); }
        .job-logo { width:52px; height:52px; border-radius:14px; background:linear-gradient(135deg,#eaf8ee,#d1fae5); display:flex; align-items:center; justify-content:center; font-size:1.5rem; flex-shrink:0; }
        .job-body { flex:1; min-width:0; }
        .job-top { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:8px; flex-wrap:wrap; }
        .job-title { font-size:1rem; font-weight:800; color:#111; margin-bottom:3px; }
        .job-company { font-size:0.82rem; color:#6b7280; font-weight:500; }
        .job-budget { font-size:1rem; font-weight:900; color:#1f8f43; white-space:nowrap; }
        .job-tags { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:10px; }
        .job-tag { padding:4px 10px; border-radius:50px; font-size:0.7rem; font-weight:700; }
        .job-desc { font-size:0.83rem; color:#6b7280; line-height:1.6; margin-bottom:14px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        .job-footer { display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; }
        .job-meta { display:flex; align-items:center; gap:14px; }
        .job-meta-item { display:flex; align-items:center; gap:5px; font-size:0.75rem; color:#9ca3af; }
        .job-actions { display:flex; gap:8px; }
        .btn-apply { padding:9px 20px; border-radius:10px; background:#1f8f43; color:#fff; font-size:0.82rem; font-weight:800; transition:background 0.2s; }
        .btn-apply:hover { background:#187536; }
        .btn-save { padding:9px 12px; border-radius:10px; background:#f3f4f6; color:#6b7280; font-size:0.82rem; font-weight:700; transition:all 0.18s; }
        .btn-save:hover { background:#eaf8ee; color:#1f8f43; }
        .new-badge { position:absolute; top:16px; right:16px; padding:3px 8px; background:#dcfce7; color:#166534; border-radius:50px; font-size:0.65rem; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; }

        /* GRID VIEW */
        .jobs-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:14px; }
        .job-grid-card { background:#fff; border:1px solid #eceff3; border-radius:18px; padding:20px; animation:fadeUp 0.4s ease both; transition:all 0.22s; }
        .job-grid-card:hover { border-color:#d1fae5; box-shadow:0 12px 32px rgba(15,23,42,0.08); transform:translateY(-3px); }

        .empty { text-align:center; padding:64px 24px; }
        .empty-icon { font-size:3rem; margin-bottom:14px; }
        .empty h3 { font-size:1.1rem; font-weight:800; color:#111; margin-bottom:6px; }
        .empty p { font-size:0.875rem; color:#6b7280; }
        .error-state { text-align:center; padding:64px 24px; }
        .retry-btn { margin-top:16px; padding:10px 24px; border-radius:10px; background:#1f8f43; color:#fff; font-weight:700; font-size:0.875rem; }

        .loader { text-align:center; padding:32px; color:#9ca3af; font-size:0.875rem; }
        .spinner { width:26px; height:26px; border:3px solid #e5e7eb; border-top-color:#1f8f43; border-radius:50%; animation:spin 0.7s linear infinite; margin:0 auto 8px; }

        .overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,0.4); z-index:200; }
        .overlay.show { display:block; }
        .sidebar-mobile { display:none; position:fixed; left:0; top:0; bottom:0; width:280px; background:#fff; z-index:201; overflow-y:auto; padding:22px; transform:translateX(-100%); transition:transform 0.3s; }
        .sidebar-mobile.open { transform:translateX(0); }
        .close-sidebar { float:right; background:none; font-size:1.4rem; color:#6b7280; padding:4px; }

        @media (max-width:1024px) { .page { grid-template-columns:220px 1fr; } .jobs-grid { grid-template-columns:1fr; } }
        @media (max-width:768px) { .page { grid-template-columns:1fr; } .sidebar { display:none; } .filter-toggle { display:flex; } .nav-links { display:none; } }
        @media (max-width:480px) { .page { padding:16px; } .job-card { flex-direction:column; } }
      `}</style>

      <nav className="nav">
        <div className="nav-inner">
          <a href="/" className="brand">Afri<span>Plate</span></a>
          <ul className="nav-links">
            <li><a href="/products">Products</a></li>
            <li><a href="/services">Services</a></li>
            <li><a href="/jobs" className="active">Jobs</a></li>
          </ul>
          <div className="nav-right">
            <a href="/login"    className="nav-btn nav-login">Login</a>
            <a href="/register" className="nav-btn nav-signup">Sign Up</a>
          </div>
        </div>
      </nav>

      <div className="hero-strip">
        <div className="hero-strip-inner">
          <div>
            <h1>Student Jobs & Gigs 💼</h1>
            <p>Find part-time work, internships and freelance gigs on your campus</p>
          </div>
          <a href="/jobs/create" className="post-btn">+ Post a Job</a>
        </div>
      </div>

      {/* JOB TYPE PILLS */}
      <div className="type-bar">
        <div className="type-bar-inner">
          {JOB_TYPES.map(t => (
            <button key={t} className={`type-pill ${jobType === t ? 'active' : ''}`} onClick={() => setJobType(t)}>{t}</button>
          ))}
        </div>
      </div>

      <div className={`overlay ${sidebarOpen ? 'show' : ''}`} onClick={() => setSidebarOpen(false)} />
      <div className={`sidebar-mobile ${sidebarOpen ? 'open' : ''}`}>
        <button className="close-sidebar" onClick={() => setSidebarOpen(false)}>✕</button>
        <div style={{ marginTop:32 }}>
          <JobSidebar category={category} setCategory={setCategory} university={university} setUniversity={setUniversity} budgetRange={budgetRange} setBudgetRange={setBudgetRange} onClear={clearFilters} />
        </div>
      </div>

      <div className="page">
        <aside className="sidebar">
          <div className="sidebar-title">Filters</div>
          <JobSidebar category={category} setCategory={setCategory} university={university} setUniversity={setUniversity} budgetRange={budgetRange} setBudgetRange={setBudgetRange} onClear={clearFilters} />
        </aside>

        <main className="main">
          <div className="top-bar">
            <div className="search-wrap">
              <button className="filter-toggle" onClick={() => setSidebarOpen(true)}>⚙️ Filters</button>
              <input className="search-input" placeholder="Search jobs, skills, companies..." value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && setSearch(searchInput.trim())} />
              <button className="search-btn" onClick={() => setSearch(searchInput.trim())}>Search</button>
            </div>
            <div className="right-bar">
              <select className="sort-select" value={sort} onChange={e => setSort(e.target.value)}>
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <button className={`view-btn ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>☰</button>
              <button className={`view-btn ${view === 'grid' ? 'active' : ''}`} onClick={() => setView('grid')}>⊞</button>
            </div>
          </div>

          {!loading && !error && <p className="results-info">Showing <span>{items.length}</span> job{items.length !== 1 ? 's' : ''}{jobType !== 'All' ? ` · ${jobType}` : ''}</p>}

          {loading && <div className="jobs-list">{Array.from({ length: 6 }).map((_, i) => <SkeletonJob key={i} />)}</div>}

          {error && !loading && (
            <div className="error-state">
              <div style={{ fontSize:'2.5rem', marginBottom:12 }}>😕</div>
              <p style={{ color:'#6b7280' }}>{error}</p>
              <button className="retry-btn" onClick={() => fetchJobs(true)}>Try Again</button>
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="empty"><div className="empty-icon">💼</div><h3>No jobs found</h3><p>Try adjusting your filters or search query</p></div>
          )}

          {!loading && !error && items.length > 0 && view === 'list' && (
            <div className="jobs-list">
              {items.map((job, i) => <JobCard key={job.id} job={job} delay={i * 0.04} />)}
            </div>
          )}

          {!loading && !error && items.length > 0 && view === 'grid' && (
            <div className="jobs-grid">
              {items.map((job, i) => <JobGridCard key={job.id} job={job} delay={i * 0.04} />)}
            </div>
          )}

          <div ref={loaderRef} className="loader">
            {loadingMore ? <><div className="spinner" /><p>Loading more...</p></> :
             hasMore && items.length > 0 ? <p>Scroll for more</p> :
             items.length > 0 ? <p style={{ color:'#d1d5db' }}>— End of results —</p> : null}
          </div>
        </main>
      </div>
    </>
  );
}

function JobSidebar({ category, setCategory, university, setUniversity, budgetRange, setBudgetRange, onClear }) {
  return (
    <>
      <div className="filter-group">
        <span className="filter-label">Category</span>
        <div className="filter-pills">
          {CATEGORIES.map(c => (
            <button key={c} className={`f-pill ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>{c}</button>
          ))}
        </div>
      </div>
      <div className="filter-group">
        <span className="filter-label">Budget / Salary</span>
        <div className="price-options">
          {BUDGET_RANGES.map((r, i) => (
            <button key={r.label} className={`price-opt ${budgetRange === i ? 'active' : ''}`} onClick={() => setBudgetRange(i)}>
              <span className="price-dot" />{r.label}
            </button>
          ))}
        </div>
      </div>
      <div className="filter-group">
        <span className="filter-label">University</span>
        <select className="uni-select" value={university} onChange={e => setUniversity(e.target.value)}>
          {UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>
      <button className="clear-btn" onClick={onClear}>✕ Clear all filters</button>
    </>
  );
}

function JobCard({ job, delay }) {
  const [saved, setSaved] = useState(false);
  const typeStyle = TYPE_COLORS[job.type] || { bg:'#f3f4f6', color:'#374151' };
  const isNew = job.created_at && (Date.now() - new Date(job.created_at).getTime()) < 86400000 * 2;
  return (
    <div className="job-card" style={{ animationDelay:`${delay}s` }}>
      {isNew && <span className="new-badge">New</span>}
      <div className="job-logo">💼</div>
      <div className="job-body">
        <div className="job-top">
          <div>
            <div className="job-title">{job.title}</div>
            <div className="job-company">{job.company || job.poster_name} · {job.university || job.location}</div>
          </div>
          {job.budget && <div className="job-budget">₦{Number(job.budget).toLocaleString()}</div>}
        </div>
        <div className="job-tags">
          <span className="job-tag" style={{ background:typeStyle.bg, color:typeStyle.color }}>{job.type || 'Freelance'}</span>
          {job.category && <span className="job-tag" style={{ background:'#f3f4f6', color:'#374151' }}>{job.category}</span>}
          {job.skills?.slice(0,2).map(s => <span key={s} className="job-tag" style={{ background:'#eff6ff', color:'#1d4ed8' }}>{s}</span>)}
        </div>
        <p className="job-desc">{job.description}</p>
        <div className="job-footer">
          <div className="job-meta">
            <span className="job-meta-item">📅 {job.created_at ? new Date(job.created_at).toLocaleDateString('en-NG', { day:'numeric', month:'short' }) : 'Recent'}</span>
            {job.applicants !== undefined && <span className="job-meta-item">👥 {job.applicants} applied</span>}
            {job.deadline && <span className="job-meta-item">⏰ Closes {new Date(job.deadline).toLocaleDateString('en-NG', { day:'numeric', month:'short' })}</span>}
          </div>
          <div className="job-actions">
            <button className="btn-save" onClick={() => setSaved(v => !v)}>{saved ? '❤️' : '🤍'}</button>
            <a href={`/jobs/${job.id}`} className="btn-apply">Apply Now →</a>
          </div>
        </div>
      </div>
    </div>
  );
}

function JobGridCard({ job, delay }) {
  const typeStyle = TYPE_COLORS[job.type] || { bg:'#f3f4f6', color:'#374151' };
  return (
    <div className="job-grid-card" style={{ animationDelay:`${delay}s` }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
        <div style={{ width:42, height:42, borderRadius:12, background:'linear-gradient(135deg,#eaf8ee,#d1fae5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem', flexShrink:0 }}>💼</div>
        <div>
          <div style={{ fontWeight:800, fontSize:'0.9rem', color:'#111' }}>{job.title}</div>
          <div style={{ fontSize:'0.75rem', color:'#9ca3af' }}>{job.company || job.poster_name}</div>
        </div>
      </div>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:10 }}>
        <span className="job-tag" style={{ background:typeStyle.bg, color:typeStyle.color }}>{job.type || 'Freelance'}</span>
        {job.category && <span className="job-tag" style={{ background:'#f3f4f6', color:'#374151' }}>{job.category}</span>}
      </div>
      <p style={{ fontSize:'0.8rem', color:'#6b7280', lineHeight:1.55, marginBottom:14, display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{job.description}</p>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        {job.budget ? <span style={{ fontWeight:900, color:'#1f8f43', fontSize:'0.95rem' }}>₦{Number(job.budget).toLocaleString()}</span> : <span />}
        <a href={`/jobs/${job.id}`} className="btn-apply">Apply →</a>
      </div>
    </div>
  );
}