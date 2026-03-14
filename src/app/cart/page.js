'use client';
import { useState, useEffect } from 'react';

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

function Spinner() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'60px 0' }}>
      <div style={{ width:28, height:28, border:'3px solid #e5e7eb', borderTopColor:'#1f8f43', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
    </div>
  );
}

export default function CartPage() {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [removing, setRemoving] = useState(null); // id being removed

  useEffect(() => {
    if (!getToken()) { window.location.href = '/login'; return; }
    loadCart();
  }, []);

  const loadCart = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/cart`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.ok) {
        const d = await res.json();
        setItems(d.items || d.data || []);
      }
    } catch {}
    setLoading(false);
  };

  const removeItem = async (cartItemId) => {
    setRemoving(cartItemId);
    try {
      await fetch(`${API}/api/cart/${cartItemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setItems(prev => prev.filter(i => i.id !== cartItemId));
    } catch {}
    setRemoving(null);
  };

  const checkoutItem = (item) => {
    const type = item.product_id ? 'product' : 'service';
    const id   = item.product_id || item.service_id;
    window.location.href = `/checkout?type=${type}&id=${id}`;
  };

  const checkoutAll = () => {
    // For now go to checkout with first item; multi-item checkout can be added later
    if (items.length === 0) return;
    checkoutItem(items[0]);
  };

  // Totals
  const FEE = { product: 0.005, service: 0.02 };
  const subtotal = items.reduce((s, i) => s + parseFloat(i.price || 0), 0);
  const fees     = items.reduce((s, i) => {
    const rate = i.product_id ? FEE.product : FEE.service;
    return s + parseFloat(i.price || 0) * rate;
  }, 0);
  const total = subtotal + fees;

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
        @keyframes fadeOut { to { opacity:0; transform:translateX(20px); } }

        .page-wrap { max-width:900px; margin:0 auto; padding:36px 24px 80px; animation:fadeUp 0.4s ease both; }
        .page-title { font-size:1.5rem; font-weight:900; color:#111; letter-spacing:-0.04em; margin-bottom:6px; }
        .page-sub   { font-size:0.85rem; color:#9ca3af; margin-bottom:28px; }

        .cart-grid { display:grid; grid-template-columns:1fr 300px; gap:24px; }

        /* ITEM CARD */
        .item-card { background:#fff; border:1px solid #eceff3; border-radius:16px; padding:18px 20px; margin-bottom:12px; display:flex; gap:16px; align-items:flex-start; transition:all 0.2s; box-shadow:0 2px 8px rgba(15,23,42,0.04); }
        .item-card:hover { box-shadow:0 6px 20px rgba(15,23,42,0.08); }
        .item-img { width:76px; height:76px; border-radius:12px; background:linear-gradient(135deg,#f8fafc,#f1f5f9); border:1px solid #eceff3; overflow:hidden; flex-shrink:0; display:flex; align-items:center; justify-content:center; }
        .item-img img { width:100%; height:100%; object-fit:cover; }
        .item-info { flex:1; min-width:0; }
        .item-type { font-size:0.68rem; font-weight:800; text-transform:uppercase; letter-spacing:1.2px; margin-bottom:4px; }
        .item-title { font-size:0.95rem; font-weight:800; color:#111; margin-bottom:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .item-seller { font-size:0.75rem; color:#9ca3af; margin-bottom:8px; }
        .item-price { font-size:1rem; font-weight:900; color:#1f8f43; }
        .item-fee   { font-size:0.72rem; color:#9ca3af; margin-top:2px; }
        .item-actions { display:flex; flex-direction:column; gap:8px; align-items:flex-end; flex-shrink:0; }

        /* BTNS */
        .checkout-item-btn { padding:'9px 16px'; border-radius:10px; background:'#1f8f43'; color:'#fff'; font-size:'0.8rem'; font-weight:800; white-space:nowrap; }
        .remove-btn { padding:7px 12px; border-radius:8px; background:#fef2f2; color:#ef4444; font-size:0.75rem; font-weight:700; transition:background 0.18s; display:flex; align-items:center; gap:5px; }
        .remove-btn:hover { background:#fee2e2; }
        .remove-btn:disabled { opacity:0.5; cursor:not-allowed; }

        /* SUMMARY */
        .summary-card { background:#fff; border:1px solid #eceff3; border-radius:20px; padding:22px 24px; box-shadow:0 4px 16px rgba(15,23,42,0.05); position:sticky; top:80px; }
        .sum-title { font-size:0.78rem; font-weight:800; color:#374151; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:18px; }
        .sum-row { display:flex; justify-content:space-between; font-size:0.85rem; color:#6b7280; padding:7px 0; }
        .sum-row.total { color:#111; font-weight:900; font-size:1rem; border-top:2px solid #f3f4f6; padding-top:14px; margin-top:6px; }

        .pay-btn { width:100%; padding:14px; border-radius:13px; background:#1f8f43; color:#fff; font-size:0.95rem; font-weight:900; box-shadow:0 8px 22px rgba(31,143,67,0.22); transition:all 0.22s; margin-top:16px; }
        .pay-btn:hover:not(:disabled) { background:#187536; transform:translateY(-2px); }
        .pay-btn:disabled { opacity:0.5; cursor:not-allowed; transform:none; }

        /* EMPTY */
        .empty-wrap { background:#fff; border:1px solid #eceff3; border-radius:20px; padding:60px 24px; text-align:center; }

        @media (max-width:700px) {
          .cart-grid { grid-template-columns:1fr; }
          .summary-card { position:static; }
          .item-card { flex-wrap:wrap; }
        }
        @media (max-width:480px) { .page-wrap { padding:20px 16px 60px; } }
      `}</style>

      <Nav />

      <div className="page-wrap">
        <div className="page-title">My Cart</div>
        <div className="page-sub">{items.length} item{items.length !== 1 ? 's' : ''} saved</div>

        {loading ? <Spinner /> : items.length === 0 ? (
          <div className="empty-wrap">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#e5e7eb" strokeWidth="1.5" style={{ marginBottom:16 }}>
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            <div style={{ fontSize:'1.1rem', fontWeight:900, color:'#111', marginBottom:8 }}>Your cart is empty</div>
            <p style={{ fontSize:'0.875rem', color:'#9ca3af', marginBottom:24 }}>Browse products and services and add them to your cart.</p>
            <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
              <a href="/products" style={{ padding:'10px 20px', background:'#1f8f43', color:'#fff', borderRadius:11, fontWeight:800, fontSize:'0.875rem' }}>Browse Products</a>
              <a href="/services" style={{ padding:'10px 20px', background:'#f3f4f6', color:'#374151', borderRadius:11, fontWeight:700, fontSize:'0.875rem' }}>Browse Services</a>
            </div>
          </div>
        ) : (
          <div className="cart-grid">
            {/* ITEMS LIST */}
            <div>
              {items.map(item => {
                const isProduct = !!item.product_id;
                const feeRate   = isProduct ? 0.005 : 0.02;
                const price     = parseFloat(item.price || 0);
                const fee       = parseFloat((price * feeRate).toFixed(2));
                const itemTotal = price + fee;
                const href      = isProduct ? `/products/${item.product_id}` : `/services/${item.service_id}`;

                return (
                  <div key={item.id} className="item-card">
                    {/* Image */}
                    <a href={href} className="item-img">
                      {item.image
                        ? <img src={item.image} alt={item.title} />
                        : <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                      }
                    </a>

                    {/* Info */}
                    <div className="item-info">
                      <div className="item-type" style={{ color: isProduct ? '#1f8f43' : '#6366f1' }}>
                        {isProduct ? 'Product' : 'Service'}
                      </div>
                      <a href={href} className="item-title">{item.title}</a>
                      <div className="item-seller">by {item.seller_name || 'Seller'}</div>
                      <div className="item-price">₦{fmt(price)}</div>
                      <div className="item-fee">+₦{fmt(fee)} service fee · Total ₦{fmt(itemTotal)}</div>
                    </div>

                    {/* Actions */}
                    <div className="item-actions">
                      <button
                        onClick={() => checkoutItem(item)}
                        style={{ padding:'9px 16px', borderRadius:10, background:'#1f8f43', color:'#fff', fontSize:'0.8rem', fontWeight:800, whiteSpace:'nowrap', boxShadow:'0 4px 12px rgba(31,143,67,0.2)' }}
                      >
                        Buy Now
                      </button>
                      <button
                        className="remove-btn"
                        onClick={() => removeItem(item.id)}
                        disabled={removing === item.id}
                      >
                        {removing === item.id
                          ? <div style={{ width:12, height:12, border:'2px solid #fca5a5', borderTopColor:'#ef4444', borderRadius:'50%', animation:'spin 0.65s linear infinite' }} />
                          : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                        }
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* SUMMARY */}
            <div>
              <div className="summary-card">
                <div className="sum-title">Order Summary</div>

                <div className="sum-row"><span>Items ({items.length})</span><span style={{ fontWeight:700, color:'#111' }}>₦{fmt(subtotal)}</span></div>
                <div className="sum-row"><span>Service fees</span><span>₦{fmt(fees)}</span></div>
                <div className="sum-row total"><span>Total</span><span style={{ color:'#1f8f43', fontSize:'1.1rem' }}>₦{fmt(total)}</span></div>

                <button className="pay-btn" onClick={checkoutAll} disabled={items.length === 0}>
                  Checkout {items.length > 1 ? `(${items.length} items)` : ''}
                </button>

                {items.length > 1 && (
                  <p style={{ fontSize:'0.72rem', color:'#9ca3af', textAlign:'center', marginTop:10, lineHeight:1.5 }}>
                    Each item is paid separately. Clicking checkout will start with the first item.
                  </p>
                )}

                <div style={{ marginTop:16, paddingTop:16, borderTop:'1px solid #f3f4f6' }}>
                  <div style={{ display:'flex', justifyContent:'center', gap:16 }}>
                    {[
                      { icon:'🔒', label:'SSL Secure' },
                      { icon:'🛡', label:'Escrow' },
                      { icon:'✅', label:'Paystack' },
                    ].map(b => (
                      <div key={b.label} style={{ textAlign:'center' }}>
                        <div style={{ fontSize:'1rem' }}>{b.icon}</div>
                        <div style={{ fontSize:'0.65rem', color:'#9ca3af', fontWeight:700, marginTop:2 }}>{b.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ marginTop:12 }}>
                <a href="/products" style={{ display:'block', textAlign:'center', fontSize:'0.82rem', fontWeight:700, color:'#1f8f43', padding:'10px' }}>
                  Continue Shopping
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
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