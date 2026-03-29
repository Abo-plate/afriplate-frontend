'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { productsAPI } from '../lib/services';
import { useStoredSession } from '../lib/useStoredSession';

const CATEGORIES = ['All', 'Electronics', 'Textbooks', 'Fashion', 'Food', 'Beauty', 'Furniture', 'Sports', 'Other'];
const UNIVERSITIES = ['All Universities', 'UNILAG', 'OAU', 'UI', 'FUTA', 'LASU', 'UNIBEN', 'ABU', 'BUK', 'UNIPORT', 'YABATECH', 'UNILORIN'];
const SORT_OPTIONS = [
  { value: 'newest',   label: 'Newest First' },
  { value: 'oldest',   label: 'Oldest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'popular',  label: 'Most Popular' },
];
const PRICE_RANGES = [
  { label: 'Any price', min: 0, max: Infinity },
  { label: 'Under ₦5k', min: 0, max: 5000 },
  { label: '₦5k – ₦20k', min: 5000, max: 20000 },
  { label: '₦20k – ₦50k', min: 20000, max: 50000 },
  { label: '₦50k – ₦150k', min: 50000, max: 150000 },
  { label: 'Above ₦150k', min: 150000, max: Infinity },
];

// ── Skeleton card ──
function SkeletonCard() {
  return (
    <div style={{ background:'#fff', border:'1px solid #eceff3', borderRadius:20, overflow:'hidden' }}>
      <div style={{ height:180, background:'linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite' }} />
      <div style={{ padding:'14px 16px' }}>
        <div style={{ height:12, borderRadius:6, background:'linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite', marginBottom:8 }} />
        <div style={{ height:12, width:'60%', borderRadius:6, background:'linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite' }} />
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const isAuthed = useStoredSession();
  const [items, setItems]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [view, setView]             = useState('grid');
  const [category, setCategory]     = useState('All');
  const [university, setUniversity] = useState('All Universities');
  const [sort, setSort]             = useState('newest');
  const [priceRange, setPriceRange] = useState(0);
  const [search, setSearch]         = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage]             = useState(1);
  const [hasMore, setHasMore]       = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const loaderRef = useRef(null);

  const fetchProducts = useCallback(async (reset = true) => {
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
      const res = await productsAPI.getAll(params);
      const data = res.data?.products || res.data?.data || res.data || [];
      if (reset) { setItems(data); } else { setItems(p => [...p, ...data]); }
      setHasMore(data.length === 12);
    } catch { setError('Failed to load products. Please try again.'); }
    finally { setLoading(false); setLoadingMore(false); }
  }, [category, university, sort, priceRange, search, page]);

  useEffect(() => { fetchProducts(true); }, [category, university, sort, priceRange, search]);

  // infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(async ([entry]) => {
      if (entry.isIntersecting && !loadingMore && hasMore && !loading) {
        setLoadingMore(true);
        setPage(p => p + 1);
        await fetchProducts(false);
      }
    }, { threshold: 0.1 });
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loadingMore, hasMore, loading]);

  const handleSearch = () => setSearch(searchInput.trim());

  const selectedRange = PRICE_RANGES[priceRange];

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

        /* NAV */
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

        /* LAYOUT */
        .page { max-width:1320px; margin:0 auto; padding:28px 24px; display:grid; grid-template-columns:260px 1fr; gap:24px; align-items:start; }

        /* SIDEBAR */
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

        /* MAIN */
        .main { min-width:0; }
        .top-bar { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:18px; flex-wrap:wrap; }
        .search-wrap { display:flex; gap:8px; flex:1; min-width:200px; }
        .search-input { flex:1; padding:11px 16px; border:1.5px solid #e5e7eb; border-radius:12px; font-size:0.875rem; color:#111; outline:none; background:#fff; }
        .search-input:focus { border-color:#1f8f43; box-shadow:0 0 0 3px rgba(31,143,67,0.08); }
        .search-btn { padding:11px 20px; background:#1f8f43; color:#fff; border-radius:12px; font-size:0.875rem; font-weight:700; transition:background 0.2s; }
        .search-btn:hover { background:#187536; }

        .right-bar { display:flex; align-items:center; gap:8px; }
        .sort-select { padding:9px 12px; border:1.5px solid #e5e7eb; border-radius:10px; font-size:0.82rem; color:#374151; outline:none; background:#fff; }
        .sort-select:focus { border-color:#1f8f43; }
        .view-btn { width:36px; height:36px; border-radius:9px; border:1.5px solid #e5e7eb; background:#fff; display:flex; align-items:center; justify-content:center; font-size:1rem; transition:all 0.18s; }
        .view-btn.active { background:#1f8f43; border-color:#1f8f43; color:#fff; }

        .results-info { font-size:0.82rem; color:#6b7280; font-weight:500; margin-bottom:16px; }
        .results-info span { color:#111; font-weight:700; }

        /* GRID */
        .products-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
        .product-card {
          background:#fff; border:1px solid #eceff3; border-radius:20px; overflow:hidden;
          display:flex; flex-direction:column;
          box-shadow:0 2px 10px rgba(15,23,42,0.04);
          transition:transform 0.22s, box-shadow 0.22s, border-color 0.22s;
          animation:fadeUp 0.4s ease both;
        }
        .product-card:hover { transform:translateY(-5px); box-shadow:0 16px 36px rgba(15,23,42,0.09); border-color:#dbeafe; }
        .card-image { height:180px; background:linear-gradient(135deg,#f8fafc,#f1f5f9); display:flex; align-items:center; justify-content:center; font-size:3.5rem; position:relative; overflow:hidden; }
        .card-image img { width:100%; height:100%; object-fit:cover; position:absolute; inset:0; }
        .card-badge { position:absolute; top:10px; left:10px; padding:4px 10px; border-radius:50px; font-size:0.68rem; font-weight:800; text-transform:uppercase; letter-spacing:0.4px; }
        .badge-new { background:#dcfce7; color:#166534; }
        .badge-used { background:#fef3c7; color:#92400e; }
        .save-btn { position:absolute; top:10px; right:10px; width:32px; height:32px; border-radius:50%; background:rgba(255,255,255,0.9); display:flex; align-items:center; justify-content:center; font-size:0.95rem; box-shadow:0 2px 8px rgba(0,0,0,0.1); transition:transform 0.2s; }
        .save-btn:hover { transform:scale(1.15); }
        .card-body { padding:14px 16px 16px; flex:1; display:flex; flex-direction:column; }
        .card-title { font-size:0.9rem; font-weight:700; color:#111; margin-bottom:5px; line-height:1.35; }
        .card-price { font-size:1.05rem; font-weight:900; color:#1f8f43; margin-bottom:10px; }
        .card-meta { display:flex; align-items:center; gap:6px; margin-bottom:12px; }
        .meta-avatar { width:22px; height:22px; border-radius:50%; background:linear-gradient(135deg,#1f8f43,#4ade80); color:#fff; font-size:0.6rem; font-weight:800; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .meta-name { font-size:0.75rem; font-weight:600; color:#374151; }
        .meta-uni  { font-size:0.7rem; color:#9ca3af; }
        .card-footer { display:flex; gap:8px; margin-top:auto; }
        .btn-view { flex:1; padding:9px; border-radius:10px; background:#eaf8ee; color:#1f8f43; font-size:0.8rem; font-weight:700; text-align:center; transition:all 0.18s; }
        .btn-view:hover { background:#1f8f43; color:#fff; }
        .btn-chat { padding:9px 12px; border-radius:10px; background:#fff3e8; color:#ff9d3f; font-size:0.8rem; font-weight:700; transition:all 0.18s; }
        .btn-chat:hover { background:#ff9d3f; color:#fff; }

        /* LIST VIEW */
        .products-list { display:flex; flex-direction:column; gap:12px; }
        .list-card { background:#fff; border:1px solid #eceff3; border-radius:16px; padding:16px; display:flex; gap:16px; align-items:center; transition:all 0.2s; animation:fadeUp 0.4s ease both; }
        .list-card:hover { border-color:#d1fae5; box-shadow:0 8px 24px rgba(15,23,42,0.07); }
        .list-thumb { width:72px; height:72px; border-radius:14px; background:linear-gradient(135deg,#f8fafc,#f1f5f9); display:flex; align-items:center; justify-content:center; font-size:2rem; flex-shrink:0; overflow:hidden; }
        .list-thumb img { width:100%; height:100%; object-fit:cover; }
        .list-info { flex:1; min-width:0; }
        .list-title { font-size:0.93rem; font-weight:700; color:#111; margin-bottom:4px; }
        .list-sub { font-size:0.78rem; color:#9ca3af; }
        .list-price { font-size:1.05rem; font-weight:900; color:#1f8f43; flex-shrink:0; }
        .list-actions { display:flex; gap:8px; flex-shrink:0; }

        /* EMPTY / ERROR */
        .empty { text-align:center; padding:64px 24px; }
        .empty-icon { font-size:3rem; margin-bottom:14px; }
        .empty h3 { font-size:1.1rem; font-weight:800; color:#111; margin-bottom:6px; }
        .empty p { font-size:0.875rem; color:#6b7280; }

        .error-state { text-align:center; padding:64px 24px; }
        .retry-btn { margin-top:16px; padding:10px 24px; border-radius:10px; background:#1f8f43; color:#fff; font-weight:700; font-size:0.875rem; }

        /* LOADER */
        .loader { text-align:center; padding:32px; color:#9ca3af; font-size:0.875rem; }
        .spinner { width:26px; height:26px; border:3px solid #e5e7eb; border-top-color:#1f8f43; border-radius:50%; animation:spin 0.7s linear infinite; margin:0 auto 8px; }
        @keyframes spin { to { transform:rotate(360deg); } }

        /* MOBILE FILTER TOGGLE */
        .filter-toggle { display:none; padding:10px 16px; background:#fff; border:1.5px solid #e5e7eb; border-radius:12px; font-size:0.875rem; font-weight:700; color:#374151; gap:6px; align-items:center; }

        /* OVERLAY */
        .overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,0.4); z-index:200; }
        .sidebar-mobile { display:none; position:fixed; left:0; top:0; bottom:0; width:280px; background:#fff; z-index:201; overflow-y:auto; padding:22px; transform:translateX(-100%); transition:transform 0.3s ease; }
        .sidebar-mobile.open { transform:translateX(0); }
        .close-sidebar { float:right; background:none; font-size:1.4rem; color:#6b7280; padding:4px; }

        @media (max-width:1024px) {
          .page { grid-template-columns:220px 1fr; }
          .products-grid { grid-template-columns:repeat(2,1fr); }
        }
        @media (max-width:768px) {
          .page { grid-template-columns:1fr; }
          .sidebar { display:none; }
          .filter-toggle { display:flex; }
          .overlay.show { display:block; }
          .sidebar-mobile { display:block; }
          .products-grid { grid-template-columns:repeat(2,1fr); }
          .nav-links { display:none; }
        }
        @media (max-width:480px) {
          .products-grid { grid-template-columns:1fr; }
          .page { padding:16px; }
        }
      `}</style>

      {/* NAV */}
      <nav className="nav">
        <div className="nav-inner">
          <a href="/" className="brand">Afri<span>Plate</span></a>
          <ul className="nav-links">
            <li><a href="/products" className="active">Products</a></li>
            <li><a href="/services">Services</a></li>
            <li><a href="/jobs">Jobs</a></li>
          </ul>
          <div className="nav-right">
            {isAuthed ? (
              <a href="/dashboard" className="nav-btn nav-signup">Dashboard</a>
            ) : (
              <>
                <a href="/login" className="nav-btn nav-login">Login</a>
                <a href="/register" className="nav-btn nav-signup">Sign Up</a>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* MOBILE SIDEBAR OVERLAY */}
      <div className={`overlay ${sidebarOpen ? 'show' : ''}`} onClick={() => setSidebarOpen(false)} />
      <div className={`sidebar-mobile ${sidebarOpen ? 'open' : ''}`}>
        <button className="close-sidebar" onClick={() => setSidebarOpen(false)}>✕</button>
        <div style={{ marginTop:32 }}>
          <SidebarContent category={category} setCategory={setCategory} university={university} setUniversity={setUniversity} priceRange={priceRange} setPriceRange={setPriceRange}
            onClear={() => { setCategory('All'); setUniversity('All Universities'); setPriceRange(0); }} />
        </div>
      </div>

      <div className="page">
        {/* SIDEBAR DESKTOP */}
        <aside className="sidebar">
          <div className="sidebar-title">Filters</div>
          <SidebarContent category={category} setCategory={setCategory} university={university} setUniversity={setUniversity} priceRange={priceRange} setPriceRange={setPriceRange}
            onClear={() => { setCategory('All'); setUniversity('All Universities'); setPriceRange(0); }} />
        </aside>

        {/* MAIN */}
        <main className="main">
          <div className="top-bar">
            <div className="search-wrap">
              <button className="filter-toggle" onClick={() => setSidebarOpen(true)}>⚙️ Filters</button>
              <input className="search-input" placeholder="Search products..." value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()} />
              <button className="search-btn" onClick={handleSearch}>Search</button>
            </div>
            <div className="right-bar">
              <select className="sort-select" value={sort} onChange={e => setSort(e.target.value)}>
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <button className={`view-btn ${view === 'grid' ? 'active' : ''}`} onClick={() => setView('grid')}>⊞</button>
              <button className={`view-btn ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>☰</button>
            </div>
          </div>

          {!loading && !error && (
            <p className="results-info">
              Showing <span>{items.length}</span> product{items.length !== 1 ? 's' : ''}
              {category !== 'All' ? ` in ${category}` : ''}
              {search ? ` for "${search}"` : ''}
            </p>
          )}

          {loading && (
            <div className={view === 'grid' ? 'products-grid' : 'products-list'}>
              {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {error && !loading && (
            <div className="error-state">
              <div style={{ fontSize:'2.5rem', marginBottom:12 }}>😕</div>
              <p style={{ color:'#6b7280' }}>{error}</p>
              <button className="retry-btn" onClick={() => fetchProducts(true)}>Try Again</button>
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="empty">
              <div className="empty-icon">📦</div>
              <h3>No products found</h3>
              <p>Try adjusting your filters or search query</p>
            </div>
          )}

          {!loading && !error && items.length > 0 && view === 'grid' && (
            <div className="products-grid">
              {items.map((item, i) => (
                <ProductCard key={item.id} item={item} delay={i * 0.04} />
              ))}
            </div>
          )}

          {!loading && !error && items.length > 0 && view === 'list' && (
            <div className="products-list">
              {items.map((item, i) => (
                <ProductListCard key={item.id} item={item} delay={i * 0.04} />
              ))}
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

function SidebarContent({ category, setCategory, university, setUniversity, priceRange, setPriceRange, onClear }) {
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

function ProductCard({ item, delay }) {
  const [saved, setSaved] = useState(false);
  return (
    <div className="product-card" style={{ animationDelay:`${delay}s` }}>
      <div className="card-image">
        {item.images?.[0] ? <img src={item.images[0]} alt={item.title} /> : <span>📦</span>}
        <span className={`card-badge ${item.condition === 'new' ? 'badge-new' : 'badge-used'}`}>
          {item.condition || 'Used'}
        </span>
        <button className="save-btn" onClick={() => setSaved(v => !v)}>{saved ? '❤️' : '🤍'}</button>
      </div>
      <div className="card-body">
        <div className="card-title">{item.title}</div>
        <div className="card-price">₦{Number(item.price).toLocaleString()}</div>
        <div className="card-meta">
          <div className="meta-avatar">{item.seller_name?.[0]?.toUpperCase() || 'S'}</div>
          <div>
            <div className="meta-name">{item.seller_name || 'Seller'}</div>
            <div className="meta-uni">{item.university || ''}</div>
          </div>
        </div>
        <div className="card-footer">
          <a href={`/products/${item.id}`} className="btn-view">View →</a>
          <a href={`/messages?to=${item.seller_id}`} className="btn-chat">💬</a>
        </div>
      </div>
    </div>
  );
}

function ProductListCard({ item, delay }) {
  return (
    <div className="list-card" style={{ animationDelay:`${delay}s` }}>
      <div className="list-thumb">
        {item.images?.[0] ? <img src={item.images[0]} alt={item.title} /> : '📦'}
      </div>
      <div className="list-info">
        <div className="list-title">{item.title}</div>
        <div className="list-sub">{item.seller_name} · {item.university} · {item.condition || 'Used'}</div>
      </div>
      <div className="list-price">₦{Number(item.price).toLocaleString()}</div>
      <div className="list-actions">
        <a href={`/products/${item.id}`} className="btn-view" style={{ padding:'8px 14px' }}>View</a>
        <a href={`/messages?to=${item.seller_id}`} className="btn-chat" style={{ padding:'8px 12px' }}>💬</a>
      </div>
    </div>
  );
}
