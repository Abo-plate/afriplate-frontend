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

// ── HELPERS ───────────────────────────────────────────────────────────────────
function fmt(n) { return Number(n || 0).toLocaleString('en-NG'); }

function Stars({ rating = 0, size = 14 }) {
  return (
    <span style={{ display:'inline-flex', gap:2 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 20 20" fill={i <= Math.round(rating) ? '#ff9d3f' : '#e5e7eb'}>
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </span>
  );
}

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

function Badge({ children, color = '#1f8f43' }) {
  return (
    <span style={{
      padding: '4px 10px', borderRadius: 50, fontSize: '0.72rem', fontWeight: 800,
      background: `${color}18`, color,
    }}>{children}</span>
  );
}

function Spinner() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'80px 0' }}>
      <div style={{ width:32, height:32, border:'3px solid #e5e7eb', borderTopColor:'#1f8f43', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function ServicePage() {
  const { id } = useParams();
  const [service, setService]       = useState(null);
  const [reviews, setReviews]       = useState([]);
  const [related, setRelated]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeImg, setActiveImg]   = useState(0);
  const [tab, setTab]               = useState('description');
  const [orderState, setOrderState] = useState('idle'); // idle | loading | success | error
  const [orderMsg, setOrderMsg]     = useState('');
  const user = getUser();

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const [sRes, rRes] = await Promise.allSettled([
          fetch(`${API}/api/services/${id}`),
          fetch(`${API}/api/reviews/service/${id}`),
        ]);
        if (sRes.status === 'fulfilled' && sRes.value.ok) {
          const d = await sRes.value.json();
          setService(d.service || d.data || d);
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

  useEffect(() => {
    if (!service?.category) return;
    fetch(`${API}/api/services?category=${encodeURIComponent(service.category)}&limit=4`)
      .then(r => r.json())
      .then(d => setRelated((d.services || d.data || []).filter(s => s.id !== service.id).slice(0, 4)))
      .catch(() => {});
  }, [service]);

  const placeOrder = async () => {
    if (!getToken()) { window.location.href = '/login'; return; }
    window.location.href = `/checkout?type=service&id=${id}`;
  };

  const messageSeller = () => {
    if (!getToken()) { window.location.href = '/login'; return; }
    window.location.href = `/dashboard?tab=messages&to=${service?.seller_id}`;
  };

  if (loading) return (
    <div style={{ minHeight:'100vh', fontFamily:'Inter,sans-serif', background:'#f7f8fa' }}>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
      <Nav />
      <Spinner />
    </div>
  );

  if (!service) return (
    <div style={{ minHeight:'100vh', fontFamily:'Inter,sans-serif', background:'#f7f8fa' }}>
      <Nav />
      <div style={{ maxWidth:640, margin:'80px auto', textAlign:'center', padding:'0 24px' }}>
        <div style={{ fontSize:'3rem', marginBottom:16 }}>404</div>
        <h2 style={{ fontSize:'1.4rem', fontWeight:900, color:'#111', marginBottom:8 }}>Service not found</h2>
        <p style={{ color:'#6b7280', marginBottom:24 }}>This listing may have been removed or is no longer active.</p>
        <a href="/services" style={{ padding:'12px 24px', background:'#1f8f43', color:'#fff', borderRadius:12, fontWeight:800, fontSize:'0.9rem', textDecoration:'none' }}>Browse Services</a>
      </div>
    </div>
  );

  const images = service.images?.length ? service.images : [null];
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) : null;

  // fee breakdown — service: buyer pays +2%
  const BUYER_FEE_RATE = 0.02;
  const price    = parseFloat(service.price || 0);
  const buyerFee = parseFloat((price * BUYER_FEE_RATE).toFixed(2));
  const total    = parseFloat((price + buyerFee).toFixed(2));

  const sellerName = service.seller_name ||
    `${service.seller_first_name || ''} ${service.seller_last_name || ''}`.trim() || 'Seller';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Inter',sans-serif; background:#f7f8fa; color:#1f2937; }
        a { color:inherit; text-decoration:none; }
        button { font-family:'Inter',sans-serif; cursor:pointer; border:none; }

        @keyframes spin   { to { transform:rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }

        .page-wrap { max-width:1160px; margin:0 auto; padding:32px 24px 80px; animation:fadeUp 0.4s ease both; }

        .breadcrumb { display:flex; align-items:center; gap:6px; margin-bottom:24px; font-size:0.8rem; color:#9ca3af; flex-wrap:wrap; }
        .breadcrumb a { color:#9ca3af; font-weight:600; transition:color 0.15s; }
        .breadcrumb a:hover { color:#1f8f43; }
        .breadcrumb span { color:#d1d5db; }

        .main-grid { display:grid; grid-template-columns:1fr 380px; gap:32px; margin-bottom:48px; }

        /* GALLERY */
        .gallery { display:flex; flex-direction:column; gap:12px; }
        .main-img-wrap { width:100%; aspect-ratio:16/9; border-radius:20px; overflow:hidden; background:linear-gradient(135deg,#f8fafc,#f1f5f9); border:1px solid #eceff3; position:relative; display:flex; align-items:center; justify-content:center; }
        .main-img-wrap img { width:100%; height:100%; object-fit:cover; }
        .thumbnails { display:flex; gap:8px; flex-wrap:wrap; }
        .thumb { width:72px; height:72px; border-radius:10px; overflow:hidden; border:2px solid transparent; cursor:pointer; background:#f1f5f9; flex-shrink:0; transition:border-color 0.18s; }
        .thumb.active { border-color:#1f8f43; }
        .thumb img { width:100%; height:100%; object-fit:cover; }

        /* SELLER CARD */
        .seller-card { background:#fff; border:1px solid #eceff3; border-radius:20px; padding:22px; box-shadow:0 4px 24px rgba(15,23,42,0.05); }
        .seller-header { display:flex; align-items:center; gap:14px; margin-bottom:16px; padding-bottom:16px; border-bottom:1px solid #f3f4f6; }
        .seller-info h3 { font-size:1rem; font-weight:900; color:#111; margin-bottom:3px; }
        .seller-info p { font-size:0.78rem; color:#9ca3af; }
        .seller-stats { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-bottom:16px; }
        .stat-box { background:#f8fafc; border-radius:10px; padding:10px; text-align:center; }
        .stat-val { font-size:1rem; font-weight:900; color:#111; }
        .stat-lbl { font-size:0.68rem; color:#9ca3af; font-weight:600; margin-top:2px; }

        /* ORDER CARD */
        .order-card { background:#fff; border:1px solid #eceff3; border-radius:20px; padding:22px; box-shadow:0 4px 24px rgba(15,23,42,0.05); }
        .svc-title { font-size:1.4rem; font-weight:900; color:#111; letter-spacing:-0.04em; line-height:1.2; margin-bottom:10px; }
        .svc-meta { display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:16px; }
        .svc-price { font-size:1.9rem; font-weight:900; color:#1f8f43; letter-spacing:-0.04em; }

        /* DELIVERY BADGE */
        .delivery-strip { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:18px; }
        .d-chip { display:flex; align-items:center; gap:6px; padding:8px 12px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; font-size:0.78rem; font-weight:700; color:#1f8f43; }

        /* FEE */
        .fee-row { display:flex; justify-content:space-between; font-size:0.83rem; color:#6b7280; margin-bottom:6px; }
        .fee-row.total { color:#111; font-weight:900; font-size:0.95rem; border-top:1px solid #f3f4f6; padding-top:10px; margin-top:4px; }

        /* BTNS */
        .order-btn { width:100%; padding:15px; border-radius:14px; font-size:0.95rem; font-weight:900; transition:all 0.22s; display:flex; align-items:center; justify-content:center; gap:8px; }
        .order-primary { background:#1f8f43; color:#fff; box-shadow:0 8px 24px rgba(31,143,67,0.2); }
        .order-primary:hover { background:#187536; transform:translateY(-2px); }
        .order-secondary { background:#f3f4f6; color:#374151; margin-top:10px; }
        .order-secondary:hover { background:#e5e7eb; }
        .order-btn:disabled { opacity:0.65; cursor:not-allowed; transform:none !important; }
        .btn-spinner { width:16px; height:16px; border:2px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; animation:spin 0.65s linear infinite; }

        /* TABS */
        .tab-btn { padding:12px 20px; font-size:0.9rem; font-weight:700; background:none; border:none; border-bottom:2px solid transparent; margin-bottom:-2px; cursor:pointer; transition:all 0.18s; text-transform:capitalize; }

        /* REVIEW */
        .review-item { padding:20px 0; border-bottom:1px solid #f3f4f6; }
        .review-item:last-child { border-bottom:none; }

        /* RELATED */
        .related-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
        .rel-card { background:#fff; border:1px solid #eceff3; border-radius:16px; overflow:hidden; transition:all 0.22s; box-shadow:0 2px 8px rgba(15,23,42,0.04); }
        .rel-card:hover { transform:translateY(-4px); box-shadow:0 12px 32px rgba(15,23,42,0.1); }
        .rel-img { height:120px; background:linear-gradient(135deg,#f8fafc,#f1f5f9); display:flex; align-items:center; justify-content:center; overflow:hidden; }
        .rel-img img { width:100%; height:100%; object-fit:cover; }
        .rel-body { padding:12px 14px; }
        .rel-title { font-size:0.83rem; font-weight:700; color:#111; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:3px; }
        .rel-price { font-size:0.88rem; font-weight:900; color:'#1f8f43'; }

        @media (max-width:900px) {
          .main-grid { grid-template-columns:1fr; }
          .related-grid { grid-template-columns:repeat(2,1fr); }
        }
        @media (max-width:560px) {
          .page-wrap { padding:20px 16px 60px; }
          .svc-title { font-size:1.2rem; }
          .svc-price { font-size:1.6rem; }
        }
      `}</style>

      <Nav />

      <div className="page-wrap">
        {/* BREADCRUMB */}
        <div className="breadcrumb">
          <a href="/">Home</a>
          <span>/</span>
          <a href="/services">Services</a>
          {service.category && <><span>/</span><a href={`/services?category=${encodeURIComponent(service.category)}`}>{service.category}</a></>}
          <span>/</span>
          <span style={{ color:'#374151', fontWeight:600 }}>{service.title}</span>
        </div>

        {/* MAIN GRID */}
        <div className="main-grid">

          {/* LEFT — GALLERY + DETAILS */}
          <div className="gallery">
            {/* Main image */}
            <div className="main-img-wrap">
              {images[activeImg]
                ? <img src={images[activeImg]} alt={service.title} />
                : (
                  <div style={{ textAlign:'center', color:'#d1d5db' }}>
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z"/><path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/><path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z"/><path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z"/><path d="M14 14.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5z"/><path d="M15.5 19H14v1.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z"/><path d="M10 9.5C10 8.67 9.33 8 8.5 8h-5C2.67 8 2 8.67 2 9.5S2.67 11 3.5 11h5c.83 0 1.5-.67 1.5-1.5z"/><path d="M8.5 5H10V3.5C10 2.67 9.33 2 8.5 2S7 2.67 7 3.5 7.67 5 8.5 5z"/></svg>
                    <p style={{ fontSize:'0.85rem', fontWeight:600, marginTop:10 }}>No preview image</p>
                  </div>
                )
              }
              {service.category && (
                <div style={{ position:'absolute', top:14, left:14 }}>
                  <Badge color="#6366f1">{service.category}</Badge>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="thumbnails">
                {images.map((img, i) => (
                  <div key={i} className={`thumb ${activeImg === i ? 'active' : ''}`} onClick={() => setActiveImg(i)}>
                    {img ? <img src={img} alt={`View ${i+1}`} /> : <div style={{ width:'100%', height:'100%', background:'#f1f5f9' }} />}
                  </div>
                ))}
              </div>
            )}

            {/* Description / Reviews tabs */}
            <div style={{ background:'#fff', border:'1px solid #eceff3', borderRadius:20, padding:24, marginTop:8 }}>
              <div style={{ display:'flex', gap:0, borderBottom:'2px solid #f3f4f6', marginBottom:24 }}>
                {['description','reviews'].map(t => (
                  <button key={t} className="tab-btn" onClick={() => setTab(t)} style={{
                    color: tab === t ? '#1f8f43' : '#6b7280',
                    borderBottomColor: tab === t ? '#1f8f43' : 'transparent',
                  }}>
                    {t}{t === 'reviews' && reviews.length > 0 ? ` (${reviews.length})` : ''}
                  </button>
                ))}
              </div>

              {tab === 'description' && (
                <div>
                  <p style={{ fontSize:'0.9rem', color:'#374151', lineHeight:1.8, whiteSpace:'pre-wrap' }}>
                    {service.description || 'No description provided.'}
                  </p>
                  {/* What's included */}
                  {service.includes?.length > 0 && (
                    <div style={{ marginTop:20 }}>
                      <div style={{ fontSize:'0.82rem', fontWeight:800, color:'#111', marginBottom:10, textTransform:'uppercase', letterSpacing:'1px' }}>What's included</div>
                      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                        {service.includes.map((item, i) => (
                          <div key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <div style={{ width:18, height:18, borderRadius:'50%', background:'#eaf8ee', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                              <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#1f8f43" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </div>
                            <span style={{ fontSize:'0.85rem', color:'#374151' }}>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {service.tags?.length > 0 && (
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:16 }}>
                      {service.tags.map(tag => (
                        <span key={tag} style={{ padding:'4px 10px', borderRadius:50, background:'#f3f4f6', fontSize:'0.78rem', fontWeight:600, color:'#374151' }}>{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'reviews' && (
                <div>
                  {reviews.length === 0 ? (
                    <div style={{ textAlign:'center', padding:'32px 0', color:'#9ca3af' }}>
                      <div style={{ fontSize:'2rem', marginBottom:8 }}>★</div>
                      <p style={{ fontWeight:600, fontSize:'0.875rem' }}>No reviews yet</p>
                    </div>
                  ) : reviews.map(r => (
                    <div key={r.id} className="review-item">
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                        <Avatar name={r.reviewer_name || r.user_name} size={36} />
                        <div>
                          <div style={{ fontSize:'0.85rem', fontWeight:800, color:'#111' }}>{r.reviewer_name || r.user_name || 'Student'}</div>
                          <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:2 }}>
                            <Stars rating={r.rating} />
                            <span style={{ fontSize:'0.72rem', color:'#9ca3af' }}>
                              {r.created_at ? new Date(r.created_at).toLocaleDateString('en-NG', { day:'numeric', month:'short', year:'numeric' }) : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                      {r.comment && <p style={{ fontSize:'0.875rem', color:'#374151', lineHeight:1.65 }}>{r.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT — ORDER + SELLER PANELS */}
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

            {/* ORDER CARD */}
            <div className="order-card">
              {service.category && <div style={{ fontSize:'0.72rem', fontWeight:800, color:'#6366f1', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:10 }}>{service.category}</div>}
              <h1 className="svc-title">{service.title}</h1>

              <div className="svc-meta">
                <span className="svc-price">₦{fmt(service.price)}</span>
                {avgRating && (
                  <span style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <Stars rating={avgRating} />
                    <span style={{ fontSize:'0.8rem', fontWeight:700, color:'#374151' }}>{avgRating}</span>
                    <span style={{ fontSize:'0.78rem', color:'#9ca3af' }}>({reviews.length})</span>
                  </span>
                )}
              </div>

              {/* Delivery info chips */}
              <div className="delivery-strip">
                {service.delivery_days && (
                  <div className="d-chip">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1f8f43" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                    {service.delivery_days} day{service.delivery_days > 1 ? 's' : ''} delivery
                  </div>
                )}
                {service.revisions && (
                  <div className="d-chip">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1f8f43" strokeWidth="2.5"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 .49-4"/></svg>
                    {service.revisions} revision{service.revisions > 1 ? 's' : ''}
                  </div>
                )}
                <div className="d-chip">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1f8f43" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  Escrow protected
                </div>
              </div>

              {/* Fee breakdown */}
              <div style={{ background:'#f8fafc', borderRadius:12, padding:'14px 16px', marginBottom:20 }}>
                <div className="fee-row"><span>Service price</span><span style={{ fontWeight:700, color:'#111' }}>₦{fmt(price)}</span></div>
                <div className="fee-row"><span>Service fee (2%)</span><span>₦{fmt(buyerFee)}</span></div>
                <div className="fee-row total"><span>You pay</span><span style={{ color:'#1f8f43' }}>₦{fmt(total)}</span></div>
              </div>

              {/* Feedback */}
              {orderState === 'success' && (
                <div style={{ background:'#eaf8ee', border:'1px solid #bbf7d0', borderRadius:10, padding:'12px 14px', fontSize:'0.83rem', fontWeight:600, color:'#1f8f43', marginBottom:14 }}>{orderMsg}</div>
              )}
              {orderState === 'error' && (
                <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'12px 14px', fontSize:'0.83rem', fontWeight:600, color:'#dc2626', marginBottom:14 }}>{orderMsg}</div>
              )}

              {/* Action buttons */}
              {user?.id === service.seller_id ? (
                <div style={{ textAlign:'center', padding:'12px', background:'#f8fafc', borderRadius:12, fontSize:'0.83rem', color:'#9ca3af', fontWeight:600 }}>
                  This is your service
                </div>
              ) : service.status === 'active' || service.is_active !== false ? (
                <>
                  <button className="order-btn order-primary" onClick={placeOrder} disabled={orderState === 'loading'}>
                    {orderState === 'loading'
                      ? <><span className="btn-spinner" /> Processing...</>
                      : `Order Now — ₦${fmt(total)}`}
                  </button>
                  <button className="order-btn order-secondary" onClick={messageSeller}>
                    Message Seller First
                  </button>
                </>
              ) : (
                <div style={{ textAlign:'center', padding:'14px', background:'#f8fafc', borderRadius:12, fontSize:'0.85rem', color:'#9ca3af', fontWeight:600 }}>
                  This service is currently unavailable
                </div>
              )}
            </div>

            {/* SELLER CARD */}
            <div className="seller-card">
              <div className="seller-header">
                <Avatar name={sellerName} size={52} />
                <div className="seller-info">
                  <h3>{sellerName}</h3>
                  <p>{service.seller_university || 'AfriPlate Seller'}</p>
                  {avgRating && (
                    <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:4 }}>
                      <Stars rating={avgRating} size={12} />
                      <span style={{ fontSize:'0.75rem', fontWeight:700, color:'#374151' }}>{avgRating}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="seller-stats">
                <div className="stat-box">
                  <div className="stat-val">{reviews.length}</div>
                  <div className="stat-lbl">Reviews</div>
                </div>
                <div className="stat-box">
                  <div className="stat-val">{service.delivery_days || '—'}</div>
                  <div className="stat-lbl">Delivery days</div>
                </div>
                <div className="stat-box">
                  <div className="stat-val">{service.seller_university ? service.seller_university.split(' ')[0] : '—'}</div>
                  <div className="stat-lbl">University</div>
                </div>
              </div>

              <button onClick={messageSeller} style={{
                width:'100%', padding:'11px', borderRadius:12, background:'#eaf8ee',
                color:'#1f8f43', fontWeight:800, fontSize:'0.88rem', border:'none', cursor:'pointer',
                transition:'background 0.18s',
              }}>
                Message {sellerName.split(' ')[0]}
              </button>
            </div>

            {/* SAFETY NOTICE */}
            <div style={{ background:'#fff', border:'1px solid #eceff3', borderRadius:16, padding:18 }}>
              <div style={{ fontSize:'0.78rem', fontWeight:800, color:'#374151', marginBottom:10, textTransform:'uppercase', letterSpacing:'1px' }}>Buyer Protection</div>
              {[
                ['Escrow payment', 'Funds released only after you confirm delivery'],
                ['Verified campus seller', 'All sellers are verified university students'],
                ['Revision guarantee', service.revisions ? `Up to ${service.revisions} revisions included` : 'Contact seller for revision policy'],
              ].map(([title, sub]) => (
                <div key={title} style={{ display:'flex', gap:10, marginBottom:10 }}>
                  <div style={{ width:20, height:20, borderRadius:'50%', background:'#eaf8ee', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#1f8f43" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <div>
                    <div style={{ fontSize:'0.8rem', fontWeight:700, color:'#111' }}>{title}</div>
                    <div style={{ fontSize:'0.72rem', color:'#9ca3af', lineHeight:1.4, marginTop:1 }}>{sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RELATED SERVICES */}
        {related.length > 0 && (
          <section>
            <h2 style={{ fontSize:'1.15rem', fontWeight:900, color:'#111', letterSpacing:'-0.03em', marginBottom:20 }}>More services like this</h2>
            <div className="related-grid">
              {related.map(s => (
                <a key={s.id} href={`/services/${s.id}`} className="rel-card">
                  <div className="rel-img">
                    {s.images?.[0]
                      ? <img src={s.images[0]} alt={s.title} />
                      : <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5"><path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z"/></svg>
                    }
                  </div>
                  <div className="rel-body">
                    <div className="rel-title">{s.title}</div>
                    <div style={{ fontSize:'0.88rem', fontWeight:900, color:'#1f8f43' }}>₦{fmt(s.price)}</div>
                    {s.delivery_days && <div style={{ fontSize:'0.72rem', color:'#9ca3af', marginTop:2 }}>{s.delivery_days}d delivery</div>}
                  </div>
                </a>
              ))}
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
      <a href="/" style={{ fontSize:'1.45rem', fontWeight:900, color:'#111', letterSpacing:'-0.04em', textDecoration:'none' }}>
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