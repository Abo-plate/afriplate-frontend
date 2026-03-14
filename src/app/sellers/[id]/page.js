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

function Avatar({ name = '', size = 40, img }) {
  if (img) return <img src={img} alt={name} style={{ width:size, height:size, borderRadius:'50%', objectFit:'cover', flexShrink:0 }} />;
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%',
      background:'linear-gradient(135deg,#1f8f43,#4ade80)',
      color:'#fff', fontWeight:800, fontSize:size * 0.38,
      display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
    }}>
      {name?.[0]?.toUpperCase() || 'U'}
    </div>
  );
}

function Stars({ rating = 0, size = 14 }) {
  return (
    <span style={{ display:'inline-flex', gap:2 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 20 20"
          fill={i <= Math.round(rating) ? '#ff9d3f' : '#e5e7eb'}>
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </span>
  );
}

function Spinner() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'80px 0' }}>
      <div style={{ width:32, height:32, border:'3px solid #e5e7eb', borderTopColor:'#1f8f43', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
    </div>
  );
}

export default function SellerProfilePage() {
  const { id } = useParams();
  const [seller, setSeller]       = useState(null);
  const [products, setProducts]   = useState([]);
  const [services, setServices]   = useState([]);
  const [reviews, setReviews]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState('products');
  const currentUser = getUser();
  const isOwnProfile = currentUser?.id === Number(id);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const [uRes, pRes, sRes, rRes] = await Promise.allSettled([
          fetch(`${API}/api/users/${id}`),
          fetch(`${API}/api/products?seller_id=${id}&limit=12`),
          fetch(`${API}/api/services?seller_id=${id}&limit=12`),
          fetch(`${API}/api/reviews/seller/${id}`),
        ]);
        if (uRes.status === 'fulfilled' && uRes.value.ok) {
          const d = await uRes.value.json();
          setSeller(d.user || d.data || d);
        }
        if (pRes.status === 'fulfilled' && pRes.value.ok) {
          const d = await pRes.value.json();
          setProducts(d.products || d.data || []);
        }
        if (sRes.status === 'fulfilled' && sRes.value.ok) {
          const d = await sRes.value.json();
          setServices(d.services || d.data || []);
        }
        if (rRes.status === 'fulfilled' && rRes.value.ok) {
          const d = await rRes.value.json();
          setReviews(d.reviews || d.data || []);
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, [id]);

  const messageSeller = () => {
    if (!getToken()) { window.location.href = '/login'; return; }
    window.location.href = `/dashboard?tab=messages&to=${id}`;
  };

  if (loading) return (
    <div style={{ minHeight:'100vh', fontFamily:'Inter,sans-serif', background:'#f7f8fa' }}>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
      <Nav />
      <Spinner />
    </div>
  );

  if (!seller) return (
    <div style={{ minHeight:'100vh', fontFamily:'Inter,sans-serif', background:'#f7f8fa' }}>
      <Nav />
      <div style={{ maxWidth:640, margin:'80px auto', textAlign:'center', padding:'0 24px' }}>
        <h2 style={{ fontSize:'1.4rem', fontWeight:900, color:'#111', marginBottom:8 }}>Seller not found</h2>
        <p style={{ color:'#6b7280', marginBottom:24 }}>This profile may no longer exist.</p>
        <a href="/" style={{ padding:'12px 24px', background:'#1f8f43', color:'#fff', borderRadius:12, fontWeight:800, fontSize:'0.9rem', textDecoration:'none' }}>Go Home</a>
      </div>
    </div>
  );

  const fullName = `${seller.first_name || ''} ${seller.last_name || ''}`.trim() || 'AfriPlate User';
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : null;
  const memberSince = seller.created_at
    ? new Date(seller.created_at).toLocaleDateString('en-NG', { month:'long', year:'numeric' })
    : null;

  const tabItems = [
    { key:'products', label:'Products', count:products.length },
    { key:'services', label:'Services', count:services.length },
    { key:'reviews',  label:'Reviews',  count:reviews.length  },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Inter',sans-serif; background:#f7f8fa; color:#1f2937; }
        a { color:inherit; text-decoration:none; }
        button { font-family:'Inter',sans-serif; cursor:pointer; border:none; }

        @keyframes spin   { to { transform:rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }

        .page-wrap { max-width:1100px; margin:0 auto; padding:0 24px 80px; animation:fadeUp 0.4s ease both; }

        /* HERO BANNER */
        .profile-hero {
          background:linear-gradient(135deg,#0d3320 0%,#1f8f43 60%,#2aad55 100%);
          height:180px; position:relative; overflow:hidden;
        }
        .profile-hero::after {
          content:''; position:absolute; inset:0;
          background:url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }

        /* PROFILE HEADER */
        .profile-header { background:#fff; border:1px solid #eceff3; border-top:none; border-radius:0 0 20px 20px; padding:0 28px 24px; margin-bottom:28px; box-shadow:0 4px 20px rgba(15,23,42,0.06); }
        .avatar-wrap { position:relative; display:inline-block; margin-top:-44px; margin-bottom:12px; }
        .avatar-wrap .avatar-ring { border:4px solid #fff; border-radius:50%; display:inline-block; }
        .bvn-badge { position:absolute; bottom:2px; right:2px; width:22px; height:22px; border-radius:50%; background:#1f8f43; border:2px solid #fff; display:flex; align-items:center; justify-content:center; }

        .profile-top { display:flex; align-items:flex-end; justify-content:space-between; flex-wrap:wrap; gap:14px; }
        .profile-name { font-size:1.5rem; font-weight:900; color:#111; letter-spacing:-0.04em; margin-bottom:4px; }
        .profile-uni  { font-size:0.83rem; color:#6b7280; font-weight:600; }
        .profile-actions { display:flex; gap:10px; flex-wrap:wrap; }

        .msg-btn { padding:'10px 20px'; border-radius:11px; background:'#1f8f43'; color:'#fff'; font-size:'0.88rem'; font-weight:800; }
        .edit-btn { padding:'10px 20px'; border-radius:11px; background:'#f3f4f6'; color:'#374151'; font-size:'0.88rem'; font-weight:700; }

        /* STATS STRIP */
        .stats-strip { display:flex; gap:0; border-top:1px solid #f3f4f6; margin-top:18px; padding-top:18px; flex-wrap:wrap; }
        .stat-item { flex:1; min-width:100px; text-align:center; padding:0 16px; border-right:1px solid #f3f4f6; }
        .stat-item:last-child { border-right:none; }
        .stat-val { font-size:1.25rem; font-weight:900; color:#111; }
        .stat-lbl { font-size:0.72rem; color:#9ca3af; font-weight:600; margin-top:2px; }

        /* MAIN GRID */
        .main-grid { display:grid; grid-template-columns:1fr 300px; gap:24px; }

        /* TABS */
        .tab-bar { display:flex; gap:0; background:#fff; border:1px solid #eceff3; border-radius:14px; padding:6px; margin-bottom:20px; }
        .tab-btn { flex:1; padding:9px; border-radius:10px; font-size:0.84rem; font-weight:700; color:#6b7280; background:none; border:none; cursor:pointer; transition:all 0.18s; }
        .tab-btn.active { background:#1f8f43; color:#fff; }

        /* PRODUCT / SERVICE GRID */
        .listing-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
        .listing-card { background:#fff; border:1px solid #eceff3; border-radius:16px; overflow:hidden; transition:all 0.22s; box-shadow:0 2px 8px rgba(15,23,42,0.04); }
        .listing-card:hover { transform:translateY(-4px); box-shadow:0 12px 28px rgba(15,23,42,0.1); }
        .listing-img { height:130px; background:linear-gradient(135deg,#f8fafc,#f1f5f9); display:flex; align-items:center; justify-content:center; overflow:hidden; position:relative; }
        .listing-img img { width:100%; height:100%; object-fit:cover; }
        .listing-body { padding:12px 14px; }
        .listing-title { font-size:0.83rem; font-weight:700; color:#111; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:4px; }
        .listing-price { font-size:0.9rem; font-weight:900; color:#1f8f43; }

        /* REVIEWS */
        .review-card { background:#fff; border:1px solid #eceff3; border-radius:16px; padding:18px 20px; margin-bottom:12px; }

        /* SIDEBAR */
        .sidebar-card { background:#fff; border:1px solid #eceff3; border-radius:16px; padding:20px; margin-bottom:16px; }
        .sidebar-title { font-size:0.72rem; font-weight:800; color:#374151; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:14px; }

        /* EMPTY */
        .empty { text-align:center; padding:'40px 20px'; color:'#9ca3af'; }

        @media (max-width:860px) { .main-grid { grid-template-columns:1fr; } }
        @media (max-width:600px) {
          .listing-grid { grid-template-columns:repeat(2,1fr); }
          .profile-header { padding:0 16px 20px; }
          .stats-strip { gap:0; }
          .stat-item { padding:0 8px; }
        }
      `}</style>

      <Nav />

      <div style={{ marginBottom:0 }}>
        {/* HERO BANNER */}
        <div className="profile-hero" />

        <div className="page-wrap">
          {/* PROFILE HEADER */}
          <div className="profile-header">
            <div className="profile-top">
              <div>
                <div className="avatar-wrap">
                  <div className="avatar-ring">
                    <Avatar name={fullName} size={88} img={seller.avatar} />
                  </div>
                  {seller.is_bvn_verified && (
                    <div className="bvn-badge">
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </div>
                <div className="profile-name">{fullName}</div>
                <div className="profile-uni">
                  {seller.university || 'AfriPlate Member'}
                  {memberSince && <span style={{ color:'#d1d5db', margin:'0 6px' }}>·</span>}
                  {memberSince && <span>Member since {memberSince}</span>}
                </div>
                {avgRating && (
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:6 }}>
                    <Stars rating={avgRating} size={14} />
                    <span style={{ fontSize:'0.82rem', fontWeight:800, color:'#374151' }}>{avgRating}</span>
                    <span style={{ fontSize:'0.78rem', color:'#9ca3af' }}>({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
                  </div>
                )}
              </div>

              <div className="profile-actions">
                {isOwnProfile ? (
                  <a href="/dashboard?tab=profile" style={{ padding:'10px 20px', borderRadius:11, background:'#f3f4f6', color:'#374151', fontSize:'0.88rem', fontWeight:700 }}>
                    Edit Profile
                  </a>
                ) : (
                  <>
                    <button onClick={messageSeller} style={{ padding:'10px 20px', borderRadius:11, background:'#1f8f43', color:'#fff', fontSize:'0.88rem', fontWeight:800, boxShadow:'0 6px 18px rgba(31,143,67,0.2)' }}>
                      Message
                    </button>
                    <a href={`/products?seller_id=${id}`} style={{ padding:'10px 20px', borderRadius:11, background:'#f3f4f6', color:'#374151', fontSize:'0.88rem', fontWeight:700 }}>
                      View All Listings
                    </a>
                  </>
                )}
              </div>
            </div>

            {/* STATS STRIP */}
            <div className="stats-strip">
              {[
                { val: products.length + services.length, lbl: 'Listings' },
                { val: reviews.length,                    lbl: 'Reviews'  },
                { val: avgRating ? `${avgRating} / 5`  : '—', lbl: 'Rating' },
                { val: seller.is_bvn_verified ? 'Verified' : 'Unverified', lbl: 'BVN Status', color: seller.is_bvn_verified ? '#1f8f43' : '#9ca3af' },
                { val: seller.level || '—',               lbl: 'Level'    },
              ].map(s => (
                <div key={s.lbl} className="stat-item">
                  <div className="stat-val" style={{ color: s.color || '#111' }}>{s.val}</div>
                  <div className="stat-lbl">{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>

          {/* MAIN GRID */}
          <div className="main-grid">

            {/* LEFT — LISTINGS + REVIEWS */}
            <div>
              {/* TAB BAR */}
              <div className="tab-bar">
                {tabItems.map(t => (
                  <button key={t.key} className={`tab-btn ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
                    {t.label} {t.count > 0 && `(${t.count})`}
                  </button>
                ))}
              </div>

              {/* PRODUCTS TAB */}
              {activeTab === 'products' && (
                products.length === 0
                  ? <EmptyState icon="📦" text="No products listed yet" />
                  : <div className="listing-grid">
                      {products.map(p => (
                        <a key={p.id} href={`/products/${p.id}`} className="listing-card">
                          <div className="listing-img">
                            {p.images?.[0]
                              ? <img src={p.images[0]} alt={p.title} />
                              : <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                            }
                            {p.condition && (
                              <div style={{ position:'absolute', top:8, left:8, padding:'3px 8px', borderRadius:50, fontSize:'0.65rem', fontWeight:800, background: p.condition === 'new' ? '#eaf8ee' : '#eef2ff', color: p.condition === 'new' ? '#1f8f43' : '#6366f1' }}>
                                {p.condition === 'new' ? 'New' : 'Used'}
                              </div>
                            )}
                          </div>
                          <div className="listing-body">
                            <div className="listing-title">{p.title}</div>
                            <div className="listing-price">₦{fmt(p.price)}</div>
                          </div>
                        </a>
                      ))}
                    </div>
              )}

              {/* SERVICES TAB */}
              {activeTab === 'services' && (
                services.length === 0
                  ? <EmptyState icon="🛠" text="No services offered yet" />
                  : <div className="listing-grid">
                      {services.map(s => (
                        <a key={s.id} href={`/services/${s.id}`} className="listing-card">
                          <div className="listing-img">
                            {s.images?.[0]
                              ? <img src={s.images[0]} alt={s.title} />
                              : <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5"><path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z"/></svg>
                            }
                          </div>
                          <div className="listing-body">
                            <div className="listing-title">{s.title}</div>
                            <div className="listing-price">₦{fmt(s.price)}</div>
                            {s.delivery_days && <div style={{ fontSize:'0.7rem', color:'#9ca3af', marginTop:2 }}>{s.delivery_days}d delivery</div>}
                          </div>
                        </a>
                      ))}
                    </div>
              )}

              {/* REVIEWS TAB */}
              {activeTab === 'reviews' && (
                reviews.length === 0
                  ? <EmptyState icon="⭐" text="No reviews yet" />
                  : <div>
                      {reviews.map(r => (
                        <div key={r.id} className="review-card">
                          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                            <Avatar name={r.reviewer_name || r.user_name} size={38} />
                            <div style={{ flex:1 }}>
                              <div style={{ fontSize:'0.85rem', fontWeight:800, color:'#111' }}>{r.reviewer_name || r.user_name || 'Student'}</div>
                              <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:2 }}>
                                <Stars rating={r.rating} />
                                <span style={{ fontSize:'0.72rem', color:'#9ca3af' }}>
                                  {r.created_at ? new Date(r.created_at).toLocaleDateString('en-NG', { day:'numeric', month:'short', year:'numeric' }) : ''}
                                </span>
                              </div>
                            </div>
                            {r.product_title || r.service_title ? (
                              <span style={{ fontSize:'0.72rem', color:'#9ca3af', fontWeight:600, textAlign:'right', maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                {r.product_title || r.service_title}
                              </span>
                            ) : null}
                          </div>
                          {r.comment && <p style={{ fontSize:'0.875rem', color:'#374151', lineHeight:1.7 }}>{r.comment}</p>}
                        </div>
                      ))}
                    </div>
              )}
            </div>

            {/* RIGHT SIDEBAR */}
            <div>
              {/* BIO */}
              {seller.bio && (
                <div className="sidebar-card">
                  <div className="sidebar-title">About</div>
                  <p style={{ fontSize:'0.875rem', color:'#374151', lineHeight:1.75 }}>{seller.bio}</p>
                </div>
              )}

              {/* INFO */}
              <div className="sidebar-card">
                <div className="sidebar-title">Info</div>
                {[
                  { icon:'🎓', label:'University', val: seller.university },
                  { icon:'📚', label:'Level',      val: seller.level },
                  { icon:'📅', label:'Joined',     val: memberSince },
                  { icon:'✅', label:'BVN',         val: seller.is_bvn_verified ? 'Verified' : 'Not verified', color: seller.is_bvn_verified ? '#1f8f43' : '#9ca3af' },
                ].filter(r => r.val).map(row => (
                  <div key={row.label} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                    <span style={{ fontSize:'1rem', flexShrink:0 }}>{row.icon}</span>
                    <div>
                      <div style={{ fontSize:'0.7rem', color:'#9ca3af', fontWeight:600 }}>{row.label}</div>
                      <div style={{ fontSize:'0.83rem', fontWeight:700, color: row.color || '#111' }}>{row.val}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* RATING BREAKDOWN */}
              {reviews.length > 0 && (
                <div className="sidebar-card">
                  <div className="sidebar-title">Rating Breakdown</div>
                  <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
                    <div style={{ fontSize:'2.5rem', fontWeight:900, color:'#111', lineHeight:1 }}>{avgRating}</div>
                    <div>
                      <Stars rating={avgRating} size={16} />
                      <div style={{ fontSize:'0.75rem', color:'#9ca3af', marginTop:3 }}>{reviews.length} review{reviews.length !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                  {[5,4,3,2,1].map(star => {
                    const count = reviews.filter(r => Math.round(r.rating) === star).length;
                    const pct   = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
                    return (
                      <div key={star} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                        <span style={{ fontSize:'0.75rem', fontWeight:700, color:'#374151', width:8 }}>{star}</span>
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="#ff9d3f"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                        <div style={{ flex:1, height:6, background:'#f3f4f6', borderRadius:3, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${pct}%`, background:'#ff9d3f', borderRadius:3, transition:'width 0.4s' }} />
                        </div>
                        <span style={{ fontSize:'0.72rem', color:'#9ca3af', fontWeight:600, width:24, textAlign:'right' }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* CTA */}
              {!isOwnProfile && (
                <button onClick={messageSeller} style={{
                  width:'100%', padding:'13px', borderRadius:13, background:'#1f8f43',
                  color:'#fff', fontSize:'0.9rem', fontWeight:800,
                  boxShadow:'0 8px 20px rgba(31,143,67,0.2)', transition:'all 0.2s',
                }}>
                  Message {seller.first_name || 'Seller'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div style={{ textAlign:'center', padding:'48px 20px', color:'#9ca3af', background:'#fff', border:'1px solid #eceff3', borderRadius:16 }}>
      <div style={{ fontSize:'2.2rem', marginBottom:10 }}>{icon}</div>
      <p style={{ fontWeight:600, fontSize:'0.875rem' }}>{text}</p>
    </div>
  );
}

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