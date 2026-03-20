'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { servicesAPI } from '../lib/services';

const CATEGORIES = ['All', 'Design', 'Writing', 'Tutoring', 'Tech', 'Beauty', 'Photography', 'Music', 'Delivery', 'Other'];
const UNIVERSITIES = ['All Universities', 'UNILAG', 'OAU', 'UI', 'FUTA', 'LASU', 'UNIBEN', 'ABU', 'BUK', 'UNIPORT', 'YABATECH', 'UNILORIN'];
const SORT_OPTIONS = [
  { value: 'newest',    label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc',label: 'Price: High to Low' },
  { value: 'popular',   label: 'Most Popular' },
  { value: 'rating',    label: 'Top Rated' },
];
const PRICE_RANGES = [
  { label: 'Any price',    min: 0,     max: Infinity },
  { label: 'Under ₦3k',   min: 0,     max: 3000 },
  { label: '₦3k – ₦10k',  min: 3000,  max: 10000 },
  { label: '₦10k – ₦30k', min: 10000, max: 30000 },
  { label: 'Above ₦30k',  min: 30000, max: Infinity },
];
const CATEGORY_ICONS = { Design:'🎨', Writing:'✍️', Tutoring:'📚', Tech:'💻', Beauty:'💇', Photography:'📸', Music:'🎵', Delivery:'🚴', Other:'🛠️', All:'⚡' };

function getUser() {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
}

function SkeletonCard() {
  return (
    <div style={{ background:'#fff', border:'1px solid #eceff3', borderRadius:20, overflow:'hidden' }}>
      <div style={{ height:160, background:'linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite' }} />
      <div style={{ padding:'14px 16px' }}>
        <div style={{ height:12, borderRadius:6, background:'linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite', marginBottom:8 }} />
        <div style={{ height:12, width:'55%', borderRadius:6, background:'linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite' }} />
      </div>
    </div>
  );
}

export default function ServicesPage() {
  const [items, setItems]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [view, setView]               = useState('grid');
  const [category, setCategory]       = useState('All');
  const [university, setUniversity]   = useState('All Universities');
  const [sort, setSort]               = useState('newest');
  const [priceRange, setPriceRange]   = useState(0);
  const [search, setSearch]           = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage]               = useState(1);
  const [hasMore, setHasMore]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser]               = useState(null);
  const loaderRef = useRef(null);

  useEffect(() => { setUser(getUser()); }, []);

  const fetchServices = useCallback(async (reset = true) => {
    if (reset) { setLoading(true); setError(''); setPage(1); }
    try {
      const params = {
        limit: 12, page: reset ? 1 : page,
        ...(category !== 'All' && { category }),
        ...(university !== 'All Universities' && { university }),
        ...(sort && { sort }),
        ...(search && { q: search }),
        ...(PRICE_RANGES[priceRange].max !== Infinity && { max_price: PRICE_RANGES[priceRange].max }),
        ...(PRICE_RANGES[priceRange].min > 0 && { min_price: PRICE_RANGES[priceRange].min }),
      };
      const res = await servicesAPI.getAll(params);
      const data = res.data?.services || res.data?.data || res.data || [];
      if (reset) setItems(data); else setItems(p => [...p, ...data]);
      setHasMore(data.length === 12);
    } catch { setError('Failed to load services. Please try again.'); }
    finally { setLoading(false); setLoadingMore(false); }
  }, [category, university, sort, priceRange, search, page]);

  useEffect(() => { fetchServices(true); }, [category, university, sort, priceRange, search]);

  useEffect(() => {
    const observer = new IntersectionObserver(async ([entry]) => {
      if (entry.isIntersecting && !loadingMore && hasMore && !loading) {
        setLoadingMore(true); setPage(p => p + 1); await fetchServices(false);
      }
    }, { threshold: 0.1 });
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loadingMore, hasMore, loading]);

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

        .hero-strip { background:linear-gradient(135deg,#0d3320,#1f8f43); padding:32px 24px; }
        .hero-strip-inner { max-width:1320px; margin:0 auto; display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap; }
        .hero-strip h1 { font-size:clamp(1.6rem,2.5vw,2.2rem); font-weight:900; color:#fff; letter-spacing:-0.04em; margin-bottom:4px; }
        .hero-strip p { color:rgba(255,255,255,0.7); font-size:0.9rem; }
        .post-btn { padding:12px 24px; background:#fff; color:#1f8f43; border-radius:12px; font-size:0.875rem; font-weight:800; transition:all 0.2s; white-space:nowrap; }
        .post-btn:hover { background:#eaf8ee; transform:translateY(-2px); }

        .page { max-width:1320px; margin:0 auto; padding:28px 24px; display:grid; grid-template-columns:260px 1fr; gap:24px; align-items:start; }
        .sidebar { background:#fff; border:1px solid #e5e7eb; border-radius:20px; padding:22px; position:sticky; top:90px; }
        .sidebar-title { font-size:0.72rem; font-weight:800; color:#9ca3af; text-transform:uppercase; letter-spacing:1.2px; margin-bottom:16px; }
        .filter-group { margin-bottom:24px; }
        .filter-label { font-size:0.8rem; font-weight:700; color:#374151; margin-bottom:10px; display:block; }
        .cat-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
        .cat-btn { display:flex; flex-direction:column; align-items:center; gap:3px; padding:10px 6px; border-radius:12px; border:1.5px solid #e5e7eb; background:#fff; color:#6b7280; font-size:0.72rem; font-weight:600; transition:all 0.18s; }
        .cat-btn:hover { border-color:#1f8f43; color:#1f8f43; }
        .cat-btn.active { background:#eaf8ee; border-color:#1f8f43; color:#1f8f43; }
        .cat-icon { font-size:1.2rem; }
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
        .services-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
        .svc-card { background:#fff; border:1px solid #eceff3; border-radius:20px; overflow:hidden; display:flex; flex-direction:column; box-shadow:0 2px 10px rgba(15,23,42,0.04); transition:transform 0.22s, box-shadow 0.22s; animation:fadeUp 0.4s ease both; }
        .svc-card:hover { transform:translateY(-5px); box-shadow:0 16px 36px rgba(15,23,42,0.09); }
        .svc-banner { height:130px; display:flex; align-items:center; justify-content:center; font-size:3rem; position:relative; }
        .svc-cat-badge { position:absolute; top:10px; left:10px; padding:4px 10px; border-radius:50px; background:rgba(31,143,67,0.12); color:#1f8f43; font-size:0.68rem; font-weight:800; text-transform:uppercase; letter-spacing:0.4px; }
        .svc-body { padding:14px 16px 16px; flex:1; display:flex; flex-direction:column; }
        .svc-title { font-size:0.9rem; font-weight:700; color:#111; margin-bottom:8px; line-height:1.35; }
        .svc-price-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
        .svc-price { font-size:1rem; font-weight:900; color:#1f8f43; }
        .svc-price span { font-size:0.72rem; font-weight:500; color:#9ca3af; }
        .stars { font-size:0.75rem; color:#f59e0b; }
        .svc-meta { display:flex; align-items:center; gap:6px; margin-bottom:12px; }
        .meta-avatar { width:22px; height:22px; border-radius:50%; background:linear-gradient(135deg,#1f8f43,#4ade80); color:#fff; font-size:0.6rem; font-weight:800; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .meta-name { font-size:0.75rem; font-weight:600; color:#374151; }
        .meta-uni  { font-size:0.7rem; color:#9ca3af; }
        .svc-footer { display:flex; gap:8px; margin-top:auto; }
        .btn-hire { flex:1; padding:9px; border-radius:10px; background:#1f8f43; color:#fff; font-size:0.8rem; font-weight:700; text-align:center; transition:background 0.18s; }
        .btn-hire:hover { background:#187536; }
        .btn-view { padding:9px 12px; border-radius:10px; background:#eaf8ee; color:#1f8f43; font-size:0.8rem; font-weight:700; transition:all 0.18s; }
        .btn-view:hover { background:#1f8f43; color:#fff; }
        .services-list { display:flex; flex-direction:column; gap:12px; }
        .svc-list-card { background:#fff; border:1px solid #eceff3; border-radius:16px; padding:16px; display:flex; gap:16px; align-items:center; transition:all 0.2s; animation:fadeUp 0.4s ease both; }
        .svc-list-card:hover { border-color:#d1fae5; box-shadow:0 8px 24px rgba(15,23,42,0.07); }
        .svc-list-icon { width:72px; height:72px; border-radius:14px; background:linear-gradient(135deg,#eaf8ee,#d1fae5); display:flex; align-items:center; justify-content:center; font-size:2rem; flex-shrink:0; }
        .svc-list-info { flex:1; min-width:0; }
        .svc-list-title { font-size:0.93rem; font-weight:700; color:#111; margin-bottom:4px; }
        .svc-list-sub { font-size:0.78rem; color:#9ca3af; }
        .svc-list-price { font-size:1rem; font-weight:900; color:#1f8f43; flex-shrink:0; }
        .list-actions { display:flex; gap:8px; flex-shrink:0; }
        .empty { text-align:center; padding:64px 24px; }
        .empty-icon { font-size:3rem; margin-bottom:14px; }
        .empty h3 { font-size:1.1rem; font-weight:800; color:#111; margin-bottom:6px; }
        .empty p { font-size:0.875rem; color:#6b7280; }
        .error-state { text-align:center; padding:64px 24px; }
        .retry-btn { margin-top:16px; padding:10px 24px; border-radius:10px; background:#1f8f43; color:#fff; font-weight:700; font-size:0.875rem; }
        .loader { text-align:center; padding:32px; color:#9ca3af; font-size:0.875rem; }
        .spinner { width:26px; height:26px; border:3px solid #e5e7eb; border-top-color:#1f8f43; border-radius:50%; animation:spin 0.7s linear infinite; margin:0 auto 8px; }
        .filter-toggle { display:none; padding:10px 16px; background:#fff; border:1.5px solid #e5e7eb; border-radius:12px; font-size:0.875rem; font-weight:700; color:#374151; gap:6px; align-items:center; }
        .overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,0.4); z-index:200; }
        .overlay.show { display:block; }
        .sidebar-mobile { display:none; position:fixed; left:0; top:0; bottom:0; width:280px; background:#fff; z-index:201; overflow-y:auto; padding:22px; transform:translateX(-100%); transition:transform 0.3s; }
        .sidebar-mobile.open { transform:translateX(0); }
        .close-sidebar { float:right; background:none; font-size:1.4rem; color:#6b7280; padding:4px; }
        @media (max-width:1024px) { .page { grid-template-columns:220px 1fr; } .services-grid { grid-template-columns:repeat(2,1fr); } }
        @media (max-width:768px) { .page { grid-template-columns:1fr; } .sidebar { display:none; } .filter-toggle { display:flex; } .services-grid { grid-template-columns:repeat(2,1fr); } .nav-links { display:none; } }
        @media (max-width:480px) { .services-grid { grid-template-columns:1fr; } .page { padding:16px; } }
      `}</style>

      <nav className="nav">
        <div className="nav-inner">
          <a href="/" className="brand">Afri<span>Plate</span></a>
          <ul className="nav-links">
            <li><a href="/products">Products</a></li>
            <li><a href="/services" className="active">Services</a></li>
            <li><a href="/jobs">Jobs</a></li>
          </ul>
          <div className="nav-right">
            {user ? (
              <a href="/dashboard" className="nav-btn nav-signup">Dashboard</a>
            ) : (
              <>
                <a href="/login"    className="nav-btn nav-login">Login</a>
                <a href="/register" className="nav-btn nav-signup">Sign Up</a>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="hero-strip">
        <div className="hero-strip-inner">
          <div>
            <h1>Student Services</h1>
            <p>Hire talented students for design, tech, tutoring and more</p>
          </div>
          {user ? (
            <a href="/dashboard" className="post-btn">+ Offer a Service</a>
          ) : (
            <a href="/register" className="post-btn">Get Started</a>
          )}
        </div>
      </div>

      <div className={`overlay ${sidebarOpen ? 'show' : ''}`} onClick={() => setSidebarOpen(false)} />
      <div className={`sidebar-mobile ${sidebarOpen ? 'open' : ''}`}>
        <button className="close-sidebar" onClick={() => setSidebarOpen(false)}>✕</button>
        <div style={{ marginTop:32 }}>
          <SvcSidebar category={category} setCategory={setCategory} university={university} setUniversity={setUniversity} priceRange={priceRange} setPriceRange={setPriceRange} onClear={() => { setCategory('All'); setUniversity('All Universities'); setPriceRange(0); }} />
        </div>
      </div>

      <div className="page">
        <aside className="sidebar">
          <div className="sidebar-title">Filters</div>
          <SvcSidebar category={category} setCategory={setCategory} university={university} setUniversity={setUniversity} priceRange={priceRange} setPriceRange={setPriceRange} onClear={() => { setCategory('All'); setUniversity('All Universities'); setPriceRange(0); }} />
        </aside>

        <main className="main">
          <div className="top-bar">
            <div className="search-wrap">
              <button className="filter-toggle" onClick={() => setSidebarOpen(true)}>⚙️ Filters</button>
              <input className="search-input" placeholder="Search services..." value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && setSearch(searchInput.trim())} />
              <button className="search-btn" onClick={() => setSearch(searchInput.trim())}>Search</button>
            </div>
            <div className="right-bar">
              <select className="sort-select" value={sort} onChange={e => setSort(e.target.value)}>
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <button className={`view-btn ${view === 'grid' ? 'active' : ''}`} onClick={() => setView('grid')}>⊞</button>
              <button className={`view-btn ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>☰</button>
            </div>
          </div>

          {!loading && !error && <p className="results-info">Showing <span>{items.length}</span> service{items.length !== 1 ? 's' : ''}{category !== 'All' ? ` in ${category}` : ''}</p>}

          {loading && <div className="services-grid">{Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}</div>}

          {error && !loading && (
            <div className="error-state">
              <div style={{ fontSize:'2.5rem', marginBottom:12 }}>😕</div>
              <p style={{ color:'#6b7280' }}>{error}</p>
              <button className="retry-btn" onClick={() => fetchServices(true)}>Try Again</button>
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="empty"><div className="empty-icon">🛠️</div><h3>No services found</h3><p>Try adjusting your filters or search</p></div>
          )}

          {!loading && !error && items.length > 0 && view === 'grid' && (
            <div className="services-grid">
              {items.map((item, i) => <ServiceCard key={item.id} item={item} delay={i * 0.04} />)}
            </div>
          )}

          {!loading && !error && items.length > 0 && view === 'list' && (
            <div className="services-list">
              {items.map((item, i) => <ServiceListCard key={item.id} item={item} delay={i * 0.04} />)}
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

function SvcSidebar({ category, setCategory, university, setUniversity, priceRange, setPriceRange, onClear }) {
  return (
    <>
      <div className="filter-group">
        <span className="filter-label">Category</span>
        <div className="cat-grid">
          {CATEGORIES.map(c => (
            <button key={c} className={`cat-btn ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>
              <span className="cat-icon">{CATEGORY_ICONS[c]}</span>{c}
            </button>
          ))}
        </div>
      </div>
      <div className="filter-group">
        <span className="filter-label">Price Range</span>
        <div className="price-options">
          {PRICE_RANGES.map((r, i) => (
            <button key={r.label} className={`price-opt ${priceRange === i ? 'active' : ''}`} onClick={() => setPriceRange(i)}>
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

function ServiceCard({ item, delay }) {
  const icon = CATEGORY_ICONS[item.category] || '🛠️';
  return (
    <div className="svc-card" style={{ animationDelay:`${delay}s` }}>
      <div className="svc-banner" style={{ background:`linear-gradient(135deg,#eaf8ee,#d1fae5)` }}>
        <span style={{ fontSize:'3rem' }}>{icon}</span>
        <span className="svc-cat-badge">{item.category || 'Service'}</span>
      </div>
      <div className="svc-body">
        <div className="svc-title">{item.title}</div>
        <div className="svc-price-row">
          <div className="svc-price">₦{Number(item.price).toLocaleString()} <span>/ service</span></div>
          <div className="stars">{'★'.repeat(Math.min(5, Math.round(item.rating || 5)))}</div>
        </div>
        <div className="svc-meta">
          <div className="meta-avatar">{item.seller_name?.[0]?.toUpperCase() || 'S'}</div>
          <div>
            <div className="meta-name">{item.seller_name || 'Provider'}</div>
            <div className="meta-uni">{item.university || ''}</div>
          </div>
        </div>
        <div className="svc-footer">
          <a href={`/messages?to=${item.seller_id}`} className="btn-hire">Hire Now</a>
          <a href={`/services/${item.id}`} className="btn-view">Details</a>
        </div>
      </div>
    </div>
  );
}

function ServiceListCard({ item, delay }) {
  const icon = CATEGORY_ICONS[item.category] || '🛠️';
  return (
    <div className="svc-list-card" style={{ animationDelay:`${delay}s` }}>
      <div className="svc-list-icon">{icon}</div>
      <div className="svc-list-info">
        <div className="svc-list-title">{item.title}</div>
        <div className="svc-list-sub">{item.seller_name} · {item.university} · {item.category}</div>
      </div>
      <div className="svc-list-price">₦{Number(item.price).toLocaleString()}</div>
      <div className="list-actions">
        <a href={`/messages?to=${item.seller_id}`} className="btn-hire" style={{ padding:'8px 14px' }}>Hire</a>
        <a href={`/services/${item.id}`} className="btn-view" style={{ padding:'8px 12px' }}>View</a>
      </div>
    </div>
  );
}