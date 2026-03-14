'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

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
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'80px 0' }}>
      <div style={{ width:32, height:32, border:'3px solid #e5e7eb', borderTopColor:'#1f8f43', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const type       = searchParams.get('type');       // product | service
  const itemId     = searchParams.get('id');         // product/service id
  const orderId    = searchParams.get('order_id');   // if order already created

  const [item, setItem]           = useState(null);
  const [order, setOrder]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [step, setStep]           = useState('summary'); // summary | paying | success | error
  const [msg, setMsg]             = useState('');
  const user = getUser();

  // Redirect if not logged in
  useEffect(() => {
    if (!getToken()) window.location.href = '/login';
  }, []);

  // Load item details
  useEffect(() => {
    if (!type || !itemId) { setLoading(false); return; }
    const endpoint = type === 'product' ? 'products' : 'services';
    fetch(`${API}/api/${endpoint}/${itemId}`)
      .then(r => r.json())
      .then(d => setItem(d.product || d.service || d.data || d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [type, itemId]);

  // If order_id passed (coming back from failed payment), load the order
  useEffect(() => {
    if (!orderId || !getToken()) return;
    fetch(`${API}/api/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
      .then(r => r.json())
      .then(d => setOrder(d.order || d.data || d))
      .catch(() => {});
  }, [orderId]);

  const createOrderAndPay = async () => {
    setStep('paying'); setMsg('');
    try {
      // Step 1 — create order (skip if already have one)
      let currentOrder = order;
      if (!currentOrder) {
        const oRes = await fetch(`${API}/api/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
          body: JSON.stringify({
            [`${type}_id`]: itemId,
            type,
          }),
        });
        const oData = await oRes.json();
        if (!oRes.ok) { setMsg(oData.message || 'Could not create order.'); setStep('error'); return; }
        currentOrder = oData.order;
        setOrder(currentOrder);
      }

      // Step 2 — initiate Paystack payment
      const pRes = await fetch(`${API}/api/payments/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ order_id: currentOrder.id }),
      });
      const pData = await pRes.json();
      if (!pRes.ok) { setMsg(pData.message || 'Could not initiate payment.'); setStep('error'); return; }

      // Step 3 — redirect to Paystack
      window.location.href = pData.payment_url;

    } catch {
      setMsg('Connection error. Please try again.');
      setStep('error');
    }
  };

  if (loading) return (
    <div style={{ minHeight:'100vh', fontFamily:'Inter,sans-serif', background:'#f7f8fa' }}>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
      <Nav />
      <Spinner />
    </div>
  );

  if (!item && !order) return (
    <div style={{ minHeight:'100vh', fontFamily:'Inter,sans-serif', background:'#f7f8fa' }}>
      <Nav />
      <div style={{ maxWidth:500, margin:'80px auto', textAlign:'center', padding:'0 24px' }}>
        <div style={{ fontSize:'3rem', marginBottom:12 }}>⚠️</div>
        <h2 style={{ fontSize:'1.3rem', fontWeight:900, color:'#111', marginBottom:8 }}>Nothing to checkout</h2>
        <p style={{ color:'#6b7280', marginBottom:24 }}>Go back and select a product or service first.</p>
        <a href="/" style={{ padding:'12px 24px', background:'#1f8f43', color:'#fff', borderRadius:12, fontWeight:800, fontSize:'0.9rem', textDecoration:'none' }}>Browse AfriPlate</a>
      </div>
    </div>
  );

  // Compute fees from item if no order yet
  const FEE_RATES = { product: 0.005, service: 0.02, job: 0.01 };
  const price      = parseFloat(order?.amount    || item?.price || 0);
  const buyerFee   = parseFloat(order?.buyer_fee  || (price * (FEE_RATES[type] || 0.01)).toFixed(2));
  const total      = parseFloat(order?.buyer_total || (price + buyerFee).toFixed(2));
  const sellerGets = parseFloat(order?.seller_amount || 0);

  const itemTitle = order?.product_title || order?.service_title || order?.job_title || item?.title || 'Item';
  const itemImg   = item?.images?.[0] || null;
  const sellerName = item
    ? `${item.seller_first_name || item.first_name || ''} ${item.seller_last_name || item.last_name || ''}`.trim() || 'Seller'
    : 'Seller';

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

        .page-wrap { max-width:860px; margin:0 auto; padding:40px 24px 80px; animation:fadeUp 0.4s ease both; }
        .checkout-grid { display:grid; grid-template-columns:1fr 340px; gap:24px; }

        /* LEFT */
        .card { background:#fff; border:1px solid #eceff3; border-radius:20px; padding:26px; box-shadow:0 4px 20px rgba(15,23,42,0.05); margin-bottom:16px; }
        .card-title { font-size:0.78rem; font-weight:800; color:#374151; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:18px; }

        /* ITEM PREVIEW */
        .item-row { display:flex; gap:16px; align-items:center; }
        .item-img { width:80px; height:80px; border-radius:12px; background:linear-gradient(135deg,#f8fafc,#f1f5f9); border:1px solid #eceff3; overflow:hidden; flex-shrink:0; display:flex; align-items:center; justify-content:center; }
        .item-img img { width:100%; height:100%; object-fit:cover; }
        .item-name { font-size:1rem; font-weight:800; color:#111; margin-bottom:5px; }
        .item-seller { font-size:0.78rem; color:#9ca3af; font-weight:600; }
        .item-type-badge { display:inline-block; margin-top:6px; padding:'3px 9px'; border-radius:50px; font-size:'0.7rem'; font-weight:800; }

        /* BUYER INFO */
        .buyer-row { display:flex; align-items:center; gap:12px; }
        .buyer-avatar { width:44px; height:44px; border-radius:'50%'; background:'linear-gradient(135deg,#1f8f43,#4ade80)'; color:'#fff'; fontWeight:800; display:'flex'; alignItems:'center'; justifyContent:'center'; fontSize:'1.1rem'; flexShrink:0; }
        .info-row { display:flex; justify-content:space-between; font-size:0.85rem; padding:'8px 0'; border-bottom:'1px solid #f9fafb'; }
        .info-label { color:#6b7280; font-weight:600; }
        .info-val   { color:#111; font-weight:700; }

        /* FEE BREAKDOWN */
        .fee-row { display:flex; justify-content:space-between; font-size:0.85rem; color:#6b7280; padding:'8px 0'; }
        .fee-row.total { color:#111; font-weight:900; font-size:1rem; border-top:2px solid #f3f4f6; padding-top:14px; margin-top:6px; }
        .fee-divider { border:none; border-top:1px solid #f3f4f6; margin:'4px 0'; }

        /* RIGHT — SUMMARY */
        .summary-card { background:#fff; border:1px solid #eceff3; border-radius:20px; padding:24px; box-shadow:0 4px 20px rgba(15,23,42,0.05); position:sticky; top:80px; }

        /* PAY BTN */
        .pay-btn { width:100%; padding:16px; border-radius:14px; background:#1f8f43; color:#fff; font-size:1rem; font-weight:900; box-shadow:0 10px 28px rgba(31,143,67,0.25); transition:all 0.22s; display:flex; align-items:center; justify-content:center; gap:10px; margin-bottom:12px; }
        .pay-btn:hover:not(:disabled) { background:#187536; transform:translateY(-2px); }
        .pay-btn:disabled { opacity:0.65; cursor:not-allowed; transform:none; }
        .btn-spinner { width:18px; height:18px; border:2px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; animation:spin 0.65s linear infinite; }

        .cancel-btn { width:100%; padding:12px; border-radius:12px; background:#f3f4f6; color:#374151; font-size:0.88rem; font-weight:700; transition:background 0.18s; }
        .cancel-btn:hover { background:#e5e7eb; }

        /* STEPS */
        .steps { display:flex; align-items:center; margin-bottom:32px; }
        .step-dot { width:30px; height:30px; border-radius:'50%'; display:'flex'; alignItems:'center'; justifyContent:'center'; font-size:'0.75rem'; fontWeight:900; flexShrink:0; }
        .step-line { flex:1; height:2px; background:#e5e7eb; }
        .step-line.done { background:#1f8f43; }

        @media (max-width:720px) {
          .checkout-grid { grid-template-columns:1fr; }
          .summary-card { position:static; }
        }
        @media (max-width:480px) { .page-wrap { padding:24px 16px 60px; } }
      `}</style>

      <Nav />

      <div className="page-wrap">
        {/* PAGE TITLE + STEPS */}
        <div style={{ marginBottom:28 }}>
          <h1 style={{ fontSize:'1.5rem', fontWeight:900, color:'#111', letterSpacing:'-0.04em', marginBottom:6 }}>Checkout</h1>
          <p style={{ fontSize:'0.85rem', color:'#9ca3af' }}>Review your order before paying</p>
        </div>

        {/* Step indicator */}
        <div style={{ display:'flex', alignItems:'center', gap:0, marginBottom:32 }}>
          {[
            { label:'Review Order', done: true, active: step === 'summary' },
            { label:'Pay Securely', done: step === 'success', active: step === 'paying' },
            { label:'Confirmed',    done: false, active: step === 'success' },
          ].map((s, i, arr) => (
            <div key={s.label} style={{ display:'flex', alignItems:'center', flex: i < arr.length - 1 ? 1 : 'none' }}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                <div style={{
                  width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:'0.72rem', fontWeight:900, flexShrink:0,
                  background: s.done || s.active ? '#1f8f43' : '#f3f4f6',
                  color: s.done || s.active ? '#fff' : '#9ca3af',
                }}>
                  {s.done ? '✓' : i + 1}
                </div>
                <span style={{ fontSize:'0.7rem', fontWeight:700, color: s.active ? '#1f8f43' : '#9ca3af', whiteSpace:'nowrap' }}>{s.label}</span>
              </div>
              {i < arr.length - 1 && (
                <div style={{ flex:1, height:2, background: s.done ? '#1f8f43' : '#e5e7eb', margin:'0 8px', marginBottom:20 }} />
              )}
            </div>
          ))}
        </div>

        <div className="checkout-grid">
          {/* LEFT COLUMN */}
          <div>
            {/* ITEM DETAILS */}
            <div className="card">
              <div className="card-title">Order Details</div>
              <div className="item-row">
                <div className="item-img">
                  {itemImg
                    ? <img src={itemImg} alt={itemTitle} />
                    : <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                  }
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div className="item-name">{itemTitle}</div>
                  <div className="item-seller">Sold by {sellerName}</div>
                  <span style={{
                    display:'inline-block', marginTop:6, padding:'3px 9px', borderRadius:50,
                    fontSize:'0.7rem', fontWeight:800,
                    background: type === 'product' ? '#eaf8ee' : type === 'service' ? '#eef2ff' : '#fef3c7',
                    color:       type === 'product' ? '#1f8f43' : type === 'service' ? '#6366f1' : '#d97706',
                  }}>
                    {type === 'product' ? 'Product' : type === 'service' ? 'Service' : 'Job'}
                  </span>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontSize:'1.2rem', fontWeight:900, color:'#1f8f43' }}>₦{fmt(price)}</div>
                </div>
              </div>
            </div>

            {/* BUYER DETAILS */}
            <div className="card">
              <div className="card-title">Your Details</div>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                <div style={{ width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg,#1f8f43,#4ade80)', color:'#fff', fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', flexShrink:0 }}>
                  {user?.name?.[0]?.toUpperCase() || user?.first_name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <div style={{ fontSize:'0.92rem', fontWeight:800, color:'#111' }}>{user?.name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Student'}</div>
                  <div style={{ fontSize:'0.78rem', color:'#9ca3af' }}>{user?.email}</div>
                </div>
              </div>
              {[
                { label:'University', val: user?.university || '—' },
                { label:'Phone',      val: user?.phone      || '—' },
              ].map(row => (
                <div key={row.label} style={{ display:'flex', justifyContent:'space-between', fontSize:'0.85rem', padding:'8px 0', borderBottom:'1px solid #f9fafb' }}>
                  <span style={{ color:'#6b7280', fontWeight:600 }}>{row.label}</span>
                  <span style={{ color:'#111', fontWeight:700 }}>{row.val}</span>
                </div>
              ))}
            </div>

            {/* ESCROW NOTICE */}
            <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:16, padding:18 }}>
              <div style={{ fontSize:'0.78rem', fontWeight:800, color:'#1f8f43', textTransform:'uppercase', letterSpacing:'1px', marginBottom:10 }}>How escrow works</div>
              {[
                'Your payment is held securely by AfriPlate',
                'Funds are only released when you confirm delivery',
                'If something goes wrong, contact support for a refund',
              ].map((t, i) => (
                <div key={i} style={{ display:'flex', gap:10, marginBottom:8 }}>
                  <div style={{ width:20, height:20, borderRadius:'50%', background:'#1f8f43', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.65rem', fontWeight:900, flexShrink:0 }}>{i + 1}</div>
                  <span style={{ fontSize:'0.82rem', color:'#374151', lineHeight:1.5 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN — SUMMARY + PAY */}
          <div>
            <div className="summary-card">
              <div style={{ fontSize:'0.78rem', fontWeight:800, color:'#374151', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:18 }}>Order Summary</div>

              {/* Fee breakdown */}
              <div style={{ marginBottom:20 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.85rem', color:'#6b7280', padding:'8px 0' }}>
                  <span>Item price</span>
                  <span style={{ fontWeight:700, color:'#111' }}>₦{fmt(price)}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.85rem', color:'#6b7280', padding:'8px 0' }}>
                  <span>Service fee ({type === 'product' ? '0.5%' : type === 'service' ? '2%' : '1%'})</span>
                  <span>₦{fmt(buyerFee)}</span>
                </div>
                <hr style={{ border:'none', borderTop:'1px solid #f3f4f6', margin:'4px 0' }} />
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'1rem', fontWeight:900, color:'#111', padding:'12px 0 0' }}>
                  <span>Total</span>
                  <span style={{ color:'#1f8f43', fontSize:'1.2rem' }}>₦{fmt(total)}</span>
                </div>
              </div>

              {/* Error message */}
              {step === 'error' && (
                <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'12px 14px', fontSize:'0.82rem', fontWeight:600, color:'#dc2626', marginBottom:14 }}>
                  {msg}
                </div>
              )}

              {/* Pay button */}
              <button
                className="pay-btn"
                onClick={createOrderAndPay}
                disabled={step === 'paying'}
              >
                {step === 'paying'
                  ? <><span className="btn-spinner" /> Processing...</>
                  : <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                      Pay ₦{fmt(total)} with Paystack
                    </>
                }
              </button>

              <button className="cancel-btn" onClick={() => window.history.back()}>
                Cancel
              </button>

              {/* Trust badges */}
              <div style={{ display:'flex', justifyContent:'center', gap:16, marginTop:18, paddingTop:16, borderTop:'1px solid #f3f4f6' }}>
                {[
                  { icon:'🔒', label:'SSL Secure' },
                  { icon:'🛡', label:'Escrow' },
                  { icon:'✅', label:'Paystack' },
                ].map(b => (
                  <div key={b.label} style={{ textAlign:'center' }}>
                    <div style={{ fontSize:'1.1rem' }}>{b.icon}</div>
                    <div style={{ fontSize:'0.65rem', color:'#9ca3af', fontWeight:700, marginTop:2 }}>{b.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Nav() {
  return (
    <nav style={{
      background:'#fff', borderBottom:'1px solid #e5e7eb', padding:'0 24px',
      height:62, display:'flex', alignItems:'center', justifyContent:'space-between',
      position:'sticky', top:0, zIndex:100, fontFamily:'Inter,sans-serif',
    }}>
      <a href="/" style={{ fontSize:'1.45rem', fontWeight:900, color:'#111', letterSpacing:'-0.04em' }}>
        Afri<span style={{ color:'#1f8f43' }}>Plate</span>
      </a>
      <div style={{ fontSize:'0.82rem', color:'#9ca3af', fontWeight:600, display:'flex', alignItems:'center', gap:6 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1f8f43" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        Secured by Paystack
      </div>
    </nav>
  );
}