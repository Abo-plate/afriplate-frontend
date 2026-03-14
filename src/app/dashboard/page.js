'use client';
import { useState, useEffect, useRef } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const authFetch = (url, opts = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  return fetch(`${API}${url}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts.headers || {}) },
  });
};

function getUser() {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
}

// ── SHARED HELPERS ────────────────────────────────────────────────────────────
function fmt(n) { return Number(n || 0).toLocaleString('en-NG'); }

function Avatar({ name = '', size = 40 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg,#1f8f43,#4ade80)',
      color: '#fff', fontWeight: 800, fontSize: size * 0.38,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>{name?.[0]?.toUpperCase() || 'U'}</div>
  );
}

function StatBox({ label, value, sub, color = '#1f8f43', icon }) {
  return (
    <div style={{ background:'#fff', border:'1px solid #eceff3', borderRadius:18, padding:'20px 22px', boxShadow:'0 2px 10px rgba(15,23,42,0.04)' }}>
      <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'1px', marginBottom:8 }}>{label}</div>
      <div style={{ fontSize:'1.8rem', fontWeight:900, color:'#111', letterSpacing:'-0.04em', lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:'0.75rem', color, fontWeight:700, marginTop:6 }}>{sub}</div>}
    </div>
  );
}

function Badge({ children, color = '#1f8f43' }) {
  return <span style={{ padding:'3px 10px', borderRadius:50, fontSize:'0.68rem', fontWeight:800, background:`${color}18`, color }}>{children}</span>;
}

function Spinner() {
  return <div style={{ textAlign:'center', padding:40 }}><div style={{ width:26, height:26, border:'3px solid #e5e7eb', borderTopColor:'#1f8f43', borderRadius:'50%', animation:'spin 0.7s linear infinite', margin:'0 auto' }} /></div>;
}

function Empty({ text }) {
  return <div style={{ textAlign:'center', padding:'48px 20px', color:'#9ca3af', fontSize:'0.875rem', fontWeight:600 }}>{text}</div>;
}

function Field({ label, error, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:'block', fontSize:'0.78rem', fontWeight:700, color:'#374151', marginBottom:6 }}>{label}</label>
      {children}
      {error && <span style={{ fontSize:'0.72rem', color:'#ef4444', fontWeight:600, marginTop:4, display:'block' }}>{error}</span>}
    </div>
  );
}

function Input({ value, onChange, placeholder, type='text', err, style={} }) {
  return (
    <input value={value} onChange={onChange} placeholder={placeholder} type={type} style={{
      width:'100%', padding:'11px 14px', border:`1.5px solid ${err ? '#ef4444' : '#e5e7eb'}`,
      borderRadius:10, fontFamily:'Inter,sans-serif', fontSize:'0.875rem', outline:'none', boxSizing:'border-box', ...style,
    }} />
  );
}

function Textarea({ value, onChange, placeholder, rows=3 }) {
  return (
    <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} style={{
      width:'100%', padding:'11px 14px', border:'1.5px solid #e5e7eb', borderRadius:10,
      fontFamily:'Inter,sans-serif', fontSize:'0.875rem', outline:'none', resize:'vertical', boxSizing:'border-box',
    }} />
  );
}

function Sel({ value, onChange, children, err }) {
  return (
    <select value={value} onChange={onChange} style={{
      width:'100%', padding:'11px 14px', border:`1.5px solid ${err ? '#ef4444' : '#e5e7eb'}`,
      borderRadius:10, fontFamily:'Inter,sans-serif', fontSize:'0.875rem', outline:'none',
      background:'#fff', appearance:'none', boxSizing:'border-box',
    }}>{children}</select>
  );
}

function GreenBtn({ onClick, children, disabled, style={} }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding:'11px 22px', background:'#1f8f43', color:'#fff', border:'none',
      borderRadius:10, fontFamily:'Inter,sans-serif', fontSize:'0.875rem', fontWeight:800,
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.65 : 1,
      transition:'all 0.2s', ...style,
    }}>{children}</button>
  );
}

function BarChart({ data = [], color = '#1f8f43' }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:80 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
          <div style={{ width:'100%', height: Math.max(4, (d.value / max) * 64), background:color, borderRadius:'4px 4px 0 0', opacity: 0.6 + (i / data.length) * 0.4 }} />
          <div style={{ fontSize:'0.6rem', color:'#9ca3af', fontWeight:600 }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

const STATUS_COLOR = {
  pending:          '#ff9d3f',
  awaiting_payment: '#6366f1',
  processing:       '#0284c7',
  completed:        '#1f8f43',
  cancelled:        '#ef4444',
  delivered:        '#1f8f43',
};

// ── SHARED: MESSAGES TAB ──────────────────────────────────────────────────────
function MessagesTab() {
  const [convos, setConvos]       = useState([]);
  const [active, setActive]       = useState(null);
  const [messages, setMessages]   = useState([]);
  const [newMsg, setNewMsg]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [sending, setSending]     = useState(false);
  const bottomRef = useRef(null);
  const user = getUser();

  useEffect(() => {
    authFetch('/api/messages/conversations')
      .then(r => r.json())
      .then(d => { setConvos(d.conversations || d.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!active) return;
    authFetch(`/api/messages/${active.user_id}`)
      .then(r => r.json())
      .then(d => setMessages(d.messages || d.data || []))
      .catch(() => {});
  }, [active]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  const send = async () => {
    if (!newMsg.trim() || !active) return;
    setSending(true);
    const optimistic = { id: Date.now(), sender_id: user?.id, content: newMsg, created_at: new Date().toISOString() };
    setMessages(p => [...p, optimistic]);
    setNewMsg('');
    try {
      await authFetch('/api/messages', { method:'POST', body: JSON.stringify({ receiver_id: active.user_id, content: newMsg }) });
    } catch {}
    setSending(false);
  };

  if (loading) return <Spinner />;

  return (
    <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:0, height:560, border:'1px solid #eceff3', borderRadius:18, overflow:'hidden', background:'#fff' }}>
      {/* Convo list */}
      <div style={{ borderRight:'1px solid #f3f4f6', overflowY:'auto' }}>
        <div style={{ padding:'16px 18px', borderBottom:'1px solid #f3f4f6', fontSize:'0.82rem', fontWeight:800, color:'#374151' }}>Conversations</div>
        {convos.length === 0 ? <Empty text="No conversations" /> : convos.map(c => (
          <div key={c.user_id} onClick={() => setActive(c)} style={{
            padding:'14px 18px', cursor:'pointer', borderBottom:'1px solid #f9fafb',
            background: active?.user_id === c.user_id ? '#f0fdf4' : 'transparent',
            borderLeft: active?.user_id === c.user_id ? '3px solid #1f8f43' : '3px solid transparent',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <Avatar name={c.name || c.first_name} size={36} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:'0.83rem', fontWeight:800, color:'#111', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.name || `${c.first_name || ''} ${c.last_name || ''}`.trim()}</div>
                <div style={{ fontSize:'0.72rem', color:'#9ca3af', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginTop:2 }}>{c.last_message || '...'}</div>
              </div>
              {c.unread > 0 && <span style={{ width:18, height:18, borderRadius:'50%', background:'#1f8f43', color:'#fff', fontSize:'0.6rem', fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center' }}>{c.unread}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Chat area */}
      {!active ? (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', color:'#9ca3af', fontSize:'0.875rem', fontWeight:600 }}>Select a conversation</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
          <div style={{ padding:'14px 18px', borderBottom:'1px solid #f3f4f6', display:'flex', alignItems:'center', gap:10 }}>
            <Avatar name={active.name || active.first_name} size={34} />
            <div style={{ fontWeight:800, color:'#111', fontSize:'0.9rem' }}>{active.name || `${active.first_name || ''} ${active.last_name || ''}`.trim()}</div>
          </div>
          <div style={{ flex:1, overflowY:'auto', padding:'16px 18px', display:'flex', flexDirection:'column', gap:10 }}>
            {messages.map(m => {
              const mine = m.sender_id === user?.id;
              return (
                <div key={m.id} style={{ display:'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                  <div style={{ maxWidth:'70%', padding:'10px 14px', borderRadius: mine ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: mine ? '#1f8f43' : '#f3f4f6', color: mine ? '#fff' : '#111', fontSize:'0.875rem', lineHeight:1.5 }}>
                    {m.content}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
          <div style={{ padding:'12px 16px', borderTop:'1px solid #f3f4f6', display:'flex', gap:10 }}>
            <input value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Type a message..." style={{ flex:1, padding:'10px 14px', border:'1.5px solid #e5e7eb', borderRadius:10, fontFamily:'Inter,sans-serif', fontSize:'0.875rem', outline:'none' }} />
            <GreenBtn onClick={send} disabled={sending || !newMsg.trim()} style={{ padding:'10px 18px' }}>Send</GreenBtn>
          </div>
        </div>
      )}
    </div>
  );
}

// ── SHARED: SETTINGS TAB ──────────────────────────────────────────────────────
function SettingsTab() {
  const [form, setForm] = useState({ first_name:'', last_name:'', university:'', level:'', phone:'', bio:'' });
  const [pw, setPw]     = useState({ current:'', next:'', confirm:'' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]   = useState('');
  const [pwMsg, setPwMsg] = useState('');

  useEffect(() => {
    authFetch('/api/auth/me').then(r => r.json()).then(d => {
      const u = d.user || d.data || d;
      setForm({ first_name: u.first_name||'', last_name: u.last_name||'', university: u.university||'', level: u.level||'', phone: u.phone||'', bio: u.bio||'' });
    }).catch(() => {});
  }, []);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const saveProfile = async () => {
    setSaving(true); setMsg('');
    try {
      const res = await authFetch('/api/auth/profile', { method:'PUT', body: JSON.stringify(form) });
      const data = await res.json();
      setMsg(res.ok ? 'Profile updated!' : data.message || 'Update failed.');
    } catch { setMsg('Connection error.'); }
    setSaving(false);
  };

  const changePassword = async () => {
    if (pw.next !== pw.confirm) { setPwMsg('Passwords do not match.'); return; }
    if (pw.next.length < 8) { setPwMsg('Password must be at least 8 characters.'); return; }
    try {
      const res = await authFetch('/api/auth/change-password', { method:'PUT', body: JSON.stringify({ current_password: pw.current, new_password: pw.next }) });
      const data = await res.json();
      setPwMsg(res.ok ? 'Password changed!' : data.message || 'Failed.');
      if (res.ok) setPw({ current:'', next:'', confirm:'' });
    } catch { setPwMsg('Connection error.'); }
  };

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
      {/* Profile */}
      <div style={{ background:'#fff', border:'1px solid #eceff3', borderRadius:18, padding:24 }}>
        <div style={{ fontSize:'0.95rem', fontWeight:900, color:'#111', marginBottom:18 }}>Profile Info</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
          <Field label="First Name"><Input value={form.first_name} onChange={set('first_name')} placeholder="First name" /></Field>
          <Field label="Last Name"><Input value={form.last_name} onChange={set('last_name')} placeholder="Last name" /></Field>
        </div>
        <Field label="University"><Input value={form.university} onChange={set('university')} placeholder="e.g. University of Lagos" /></Field>
        <Field label="Level">
          <Sel value={form.level} onChange={set('level')}>
            <option value="">Select level</option>
            {['100','200','300','400','500','Postgrad'].map(l => <option key={l}>{l}</option>)}
          </Sel>
        </Field>
        <Field label="Phone Number"><Input value={form.phone} onChange={set('phone')} placeholder="e.g. 08012345678" /></Field>
        <Field label="Bio"><Textarea value={form.bio} onChange={set('bio')} placeholder="Tell buyers/sellers about yourself..." rows={3} /></Field>
        {msg && <div style={{ marginBottom:12, fontSize:'0.82rem', fontWeight:700, color: msg.includes('!') ? '#1f8f43' : '#ef4444' }}>{msg}</div>}
        <GreenBtn onClick={saveProfile} disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</GreenBtn>
      </div>

      {/* Password */}
      <div style={{ background:'#fff', border:'1px solid #eceff3', borderRadius:18, padding:24 }}>
        <div style={{ fontSize:'0.95rem', fontWeight:900, color:'#111', marginBottom:18 }}>Change Password</div>
        <Field label="Current Password"><Input type="password" value={pw.current} onChange={e => setPw(p => ({ ...p, current: e.target.value }))} placeholder="Current password" /></Field>
        <Field label="New Password"><Input type="password" value={pw.next} onChange={e => setPw(p => ({ ...p, next: e.target.value }))} placeholder="New password (min 8 chars)" /></Field>
        <Field label="Confirm New Password"><Input type="password" value={pw.confirm} onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))} placeholder="Repeat new password" /></Field>
        {pwMsg && <div style={{ marginBottom:12, fontSize:'0.82rem', fontWeight:700, color: pwMsg.includes('!') ? '#1f8f43' : '#ef4444' }}>{pwMsg}</div>}
        <GreenBtn onClick={changePassword}>Change Password</GreenBtn>

        {/* Danger zone */}
        <div style={{ marginTop:24, paddingTop:20, borderTop:'1px solid #fee2e2' }}>
          <div style={{ fontSize:'0.82rem', fontWeight:800, color:'#ef4444', marginBottom:10 }}>Danger Zone</div>
          <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} style={{ padding:'9px 18px', background:'#fef2f2', color:'#ef4444', border:'1px solid #fecaca', borderRadius:9, fontSize:'0.82rem', fontWeight:700, cursor:'pointer' }}>
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// BUYER DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
const BUYER_TABS = [
  { id:'overview',  label:'Overview',  icon:'▦' },
  { id:'orders',    label:'My Orders', icon:'◎' },
  { id:'messages',  label:'Messages',  icon:'○' },
  { id:'reviews',   label:'Reviews',   icon:'★' },
  { id:'settings',  label:'Settings',  icon:'◐' },
];

function BuyerDashboard({ user }) {
  const [tab, setTab] = useState('overview');

  return (
    <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', gap:24, maxWidth:1100, margin:'0 auto', padding:'32px 24px 80px' }}>
      {/* SIDEBAR */}
      <div>
        <div style={{ background:'#fff', border:'1px solid #eceff3', borderRadius:20, padding:20, marginBottom:16 }}>
          <div style={{ textAlign:'center', marginBottom:16 }}>
            <Avatar name={`${user?.first_name || ''} ${user?.last_name || ''}`} size={64} />
            <div style={{ fontWeight:900, color:'#111', fontSize:'0.95rem', marginTop:10 }}>{user?.first_name} {user?.last_name}</div>
            <div style={{ fontSize:'0.72rem', color:'#9ca3af', marginTop:3 }}>{user?.university || 'AfriPlate Buyer'}</div>
            <span style={{ display:'inline-block', marginTop:8, padding:'3px 10px', borderRadius:50, fontSize:'0.68rem', fontWeight:800, background:'#eef2ff', color:'#6366f1' }}>Buyer</span>
          </div>
          {BUYER_TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              width:'100%', padding:'11px 14px', borderRadius:11, display:'flex', alignItems:'center', gap:10,
              fontFamily:'Inter,sans-serif', fontSize:'0.84rem', fontWeight: tab === t.id ? 800 : 600,
              background: tab === t.id ? '#eaf8ee' : 'none', color: tab === t.id ? '#1f8f43' : '#374151',
              border:'none', cursor:'pointer', marginBottom:4, textAlign:'left', transition:'all 0.18s',
            }}>
              <span style={{ fontSize:'1rem' }}>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
        <a href="/products" style={{ display:'block', textAlign:'center', padding:'11px', background:'#1f8f43', color:'#fff', borderRadius:12, fontSize:'0.84rem', fontWeight:800, marginBottom:8 }}>Browse Products</a>
        <a href="/services" style={{ display:'block', textAlign:'center', padding:'11px', background:'#f3f4f6', color:'#374151', borderRadius:12, fontSize:'0.84rem', fontWeight:700 }}>Browse Services</a>
      </div>

      {/* CONTENT */}
      <div>
        {tab === 'overview'  && <BuyerOverview user={user} setTab={setTab} />}
        {tab === 'orders'    && <BuyerOrders />}
        {tab === 'messages'  && <MessagesTab />}
        {tab === 'reviews'   && <BuyerReviews />}
        {tab === 'settings'  && <SettingsTab />}
      </div>
    </div>
  );
}

function BuyerOverview({ user, setTab }) {
  const [stats, setStats]   = useState({ orders:0, spent:0, pending:0, reviews:0 });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await authFetch('/api/orders?role=buyer&limit=6');
        const d   = await res.json();
        const orders = d.orders || d.data || [];
        const spent = orders.filter(o => o.status === 'completed').reduce((s, o) => s + parseFloat(o.buyer_total || 0), 0);
        setStats({
          orders:  orders.length,
          spent:   spent,
          pending: orders.filter(o => ['pending','awaiting_payment','processing'].includes(o.status)).length,
          reviews: 0,
        });
        setRecent(orders.slice(0, 5));
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      {/* Welcome */}
      <div style={{ background:'linear-gradient(135deg,#1e3a5f,#2563eb)', borderRadius:20, padding:'24px 28px', marginBottom:24, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:14 }}>
        <div>
          <div style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.6)', fontWeight:600, marginBottom:4 }}>Welcome back</div>
          <div style={{ fontSize:'1.5rem', fontWeight:900, color:'#fff', letterSpacing:'-0.04em' }}>{user?.first_name || 'Student'}</div>
          <div style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.55)', marginTop:3 }}>{user?.university || 'AfriPlate Member'}</div>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <a href="/products" style={{ padding:'10px 18px', background:'rgba(255,255,255,0.15)', color:'#fff', borderRadius:11, fontSize:'0.82rem', fontWeight:700, border:'1px solid rgba(255,255,255,0.25)' }}>Browse Products</a>
          <a href="/cart" style={{ padding:'10px 18px', background:'#fff', color:'#2563eb', borderRadius:11, fontSize:'0.82rem', fontWeight:800 }}>My Cart</a>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
        <StatBox label="Total Orders"   value={stats.orders}                    sub="All time" />
        <StatBox label="Active Orders"  value={stats.pending}                   sub={stats.pending > 0 ? 'In progress' : 'None pending'} color="#ff9d3f" />
        <StatBox label="Total Spent"    value={`₦${fmt(stats.spent)}`}          sub="Completed orders" color="#6366f1" />
        <StatBox label="Reviews Left"   value={stats.reviews}                   sub="Feedback given" color="#ec4899" />
      </div>

      {/* Recent orders */}
      <div style={{ background:'#fff', border:'1px solid #eceff3', borderRadius:18, padding:22, marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <div style={{ fontSize:'0.95rem', fontWeight:900, color:'#111' }}>Recent Orders</div>
          <button onClick={() => setTab('orders')} style={{ fontSize:'0.8rem', fontWeight:700, color:'#1f8f43', background:'none', border:'none', cursor:'pointer' }}>View all →</button>
        </div>
        {recent.length === 0 ? <Empty text="No orders yet. Start shopping!" /> : recent.map(o => (
          <div key={o.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 0', borderBottom:'1px solid #f3f4f6' }}>
            <div style={{ width:40, height:40, borderRadius:10, background:'#f3f4f6', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:'1.2rem' }}>
              {o.product_id ? '📦' : o.service_id ? '🛠' : '💼'}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:'0.85rem', fontWeight:700, color:'#111', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{o.product_title || o.service_title || o.job_title || `Order #${o.id}`}</div>
              <div style={{ fontSize:'0.72rem', color:'#9ca3af', marginTop:2 }}>{o.created_at ? new Date(o.created_at).toLocaleDateString('en-NG', { day:'numeric', month:'short', year:'numeric' }) : ''}</div>
            </div>
            <div style={{ textAlign:'right', flexShrink:0 }}>
              <div style={{ fontSize:'0.88rem', fontWeight:900, color:'#111' }}>₦{fmt(o.buyer_total)}</div>
              <Badge color={STATUS_COLOR[o.status] || '#9ca3af'}>{o.status}</Badge>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ background:'#fff', border:'1px solid #eceff3', borderRadius:18, padding:22 }}>
        <div style={{ fontSize:'0.95rem', fontWeight:900, color:'#111', marginBottom:16 }}>Quick Actions</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
          {[
            { label:'Browse Products', sub:'Find what you need', href:'/products', color:'#1f8f43' },
            { label:'Browse Services', sub:'Hire campus talent', href:'/services', color:'#6366f1' },
            { label:'View Cart',       sub:'Items saved for later', href:'/cart',     color:'#ff9d3f' },
          ].map(a => (
            <a key={a.label} href={a.href} style={{
              padding:'16px 14px', border:`1.5px solid ${a.color}22`, borderRadius:14,
              background:`${a.color}08`, textDecoration:'none', display:'block',
            }}>
              <div style={{ fontSize:'0.85rem', fontWeight:800, color:a.color, marginBottom:4 }}>{a.label}</div>
              <div style={{ fontSize:'0.72rem', color:'#9ca3af' }}>{a.sub}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function BuyerOrders() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(null);

  useEffect(() => {
    authFetch('/api/orders?role=buyer')
      .then(r => r.json())
      .then(d => { setOrders(d.orders || d.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const confirmDelivery = async (orderId) => {
    setConfirming(orderId);
    try {
      const res = await authFetch(`/api/orders/${orderId}/confirm`, { method:'PUT' });
      if (res.ok) setOrders(p => p.map(o => o.id === orderId ? { ...o, status:'completed' } : o));
    } catch {}
    setConfirming(null);
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div style={{ fontSize:'1.1rem', fontWeight:900, color:'#111', marginBottom:20 }}>My Orders</div>
      {orders.length === 0 ? (
        <div style={{ background:'#fff', border:'1px solid #eceff3', borderRadius:18, padding:'60px 24px', textAlign:'center' }}>
          <div style={{ fontSize:'2.5rem', marginBottom:12 }}>🛍</div>
          <div style={{ fontWeight:800, color:'#111', marginBottom:6 }}>No orders yet</div>
          <p style={{ color:'#9ca3af', fontSize:'0.875rem', marginBottom:20 }}>Browse products and services to place your first order.</p>
          <a href="/products" style={{ padding:'10px 22px', background:'#1f8f43', color:'#fff', borderRadius:11, fontWeight:800, fontSize:'0.875rem' }}>Start Shopping</a>
        </div>
      ) : orders.map(o => (
        <div key={o.id} style={{ background:'#fff', border:'1px solid #eceff3', borderRadius:16, padding:'18px 20px', marginBottom:12, boxShadow:'0 2px 8px rgba(15,23,42,0.04)' }}>
          <div style={{ display:'flex', alignItems:'flex-start', gap:14, flexWrap:'wrap' }}>
            <div style={{ width:48, height:48, borderRadius:12, background:'#f3f4f6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem', flexShrink:0 }}>
              {o.product_id ? '📦' : o.service_id ? '🛠' : '💼'}
            </div>
            <div style={{ flex:1, minWidth:200 }}>
              <div style={{ fontSize:'0.92rem', fontWeight:800, color:'#111', marginBottom:4 }}>{o.product_title || o.service_title || o.job_title || `Order #${o.id}`}</div>
              <div style={{ fontSize:'0.75rem', color:'#9ca3af', marginBottom:8 }}>
                Order #{o.id} · {o.created_at ? new Date(o.created_at).toLocaleDateString('en-NG', { day:'numeric', month:'short', year:'numeric' }) : 'Recent'}
              </div>
              <Badge color={STATUS_COLOR[o.status] || '#9ca3af'}>{o.status}</Badge>
            </div>
            <div style={{ textAlign:'right', flexShrink:0 }}>
              <div style={{ fontSize:'1rem', fontWeight:900, color:'#1f8f43', marginBottom:8 }}>₦{fmt(o.buyer_total)}</div>
              {o.status === 'processing' && (
                <button onClick={() => confirmDelivery(o.id)} disabled={confirming === o.id} style={{
                  padding:'8px 14px', background:'#1f8f43', color:'#fff', border:'none', borderRadius:9,
                  fontSize:'0.78rem', fontWeight:800, cursor:'pointer', opacity: confirming === o.id ? 0.65 : 1,
                }}>
                  {confirming === o.id ? 'Confirming...' : 'Confirm Delivery'}
                </button>
              )}
              {o.status === 'completed' && (
                <a href={`/products/${o.product_id || ''}`} style={{ fontSize:'0.75rem', color:'#1f8f43', fontWeight:700 }}>Leave review →</a>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function BuyerReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch('/api/reviews/mine')
      .then(r => r.json())
      .then(d => { setReviews(d.reviews || d.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <div style={{ fontSize:'1.1rem', fontWeight:900, color:'#111', marginBottom:20 }}>My Reviews</div>
      {reviews.length === 0 ? <Empty text="No reviews yet. Complete an order to leave a review." /> : reviews.map(r => (
        <div key={r.id} style={{ background:'#fff', border:'1px solid #eceff3', borderRadius:14, padding:'16px 18px', marginBottom:10 }}>
          <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:'0.875rem', fontWeight:800, color:'#111', marginBottom:4 }}>{r.product_title || r.service_title || 'Item'}</div>
              <div style={{ display:'flex', gap:4, marginBottom:6 }}>
                {[1,2,3,4,5].map(s => (
                  <svg key={s} width="13" height="13" viewBox="0 0 20 20" fill={s <= r.rating ? '#ff9d3f' : '#e5e7eb'}><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                ))}
              </div>
              {r.comment && <p style={{ fontSize:'0.85rem', color:'#374151', lineHeight:1.6 }}>{r.comment}</p>}
            </div>
            <div style={{ fontSize:'0.72rem', color:'#9ca3af', flexShrink:0 }}>{r.created_at ? new Date(r.created_at).toLocaleDateString('en-NG', { day:'numeric', month:'short', year:'numeric' }) : ''}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SELLER DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
const SELLER_TABS = [
  { id:'overview',   label:'Overview',       icon:'▦' },
  { id:'listings',   label:'My Listings',    icon:'□' },
  { id:'received',   label:'Orders Received',icon:'◎' },
  { id:'wallet',     label:'Wallet',         icon:'◇' },
  { id:'purchases',  label:'My Purchases',   icon:'🛍' },
  { id:'messages',   label:'Messages',       icon:'○' },
  { id:'settings',   label:'Settings',       icon:'◐' },
];

function SellerDashboard({ user }) {
  const [tab, setTab] = useState('overview');

  return (
    <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', gap:24, maxWidth:1100, margin:'0 auto', padding:'32px 24px 80px' }}>
      {/* SIDEBAR */}
      <div>
        <div style={{ background:'#fff', border:'1px solid #eceff3', borderRadius:20, padding:20, marginBottom:16 }}>
          <div style={{ textAlign:'center', marginBottom:16 }}>
            <Avatar name={`${user?.first_name || ''} ${user?.last_name || ''}`} size={64} />
            <div style={{ fontWeight:900, color:'#111', fontSize:'0.95rem', marginTop:10 }}>{user?.first_name} {user?.last_name}</div>
            <div style={{ fontSize:'0.72rem', color:'#9ca3af', marginTop:3 }}>{user?.university || 'AfriPlate Seller'}</div>
            <span style={{ display:'inline-block', marginTop:8, padding:'3px 10px', borderRadius:50, fontSize:'0.68rem', fontWeight:800, background:'#eaf8ee', color:'#1f8f43' }}>Seller</span>
          </div>
          {SELLER_TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              width:'100%', padding:'11px 14px', borderRadius:11, display:'flex', alignItems:'center', gap:10,
              fontFamily:'Inter,sans-serif', fontSize:'0.84rem', fontWeight: tab === t.id ? 800 : 600,
              background: tab === t.id ? '#eaf8ee' : 'none', color: tab === t.id ? '#1f8f43' : '#374151',
              border:'none', cursor:'pointer', marginBottom:4, textAlign:'left', transition:'all 0.18s',
            }}>
              <span style={{ fontSize:'1rem' }}>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
        <a href={`/sellers/${user?.id}`} style={{ display:'block', textAlign:'center', padding:'11px', background:'#f3f4f6', color:'#374151', borderRadius:12, fontSize:'0.84rem', fontWeight:700 }}>
          View My Profile
        </a>
      </div>

      {/* CONTENT */}
      <div>
        {tab === 'overview'   && <SellerOverview user={user} setTab={setTab} />}
        {tab === 'listings'   && <SellerListings />}
        {tab === 'received'   && <SellerOrders />}
        {tab === 'wallet'     && <SellerWallet />}
        {tab === 'purchases'  && <BuyerOrders />}
        {tab === 'messages'   && <MessagesTab />}
        {tab === 'settings'   && <SettingsTab />}
      </div>
    </div>
  );
}

function SellerOverview({ user, setTab }) {
  const [stats, setStats]     = useState({ listings:0, orders:0, balance:0, pending_balance:0 });
  const [activity, setActivity] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [wRes, oRes, lRes] = await Promise.allSettled([
          authFetch('/api/wallet'),
          authFetch('/api/orders?role=seller&limit=6'),
          authFetch('/api/products?mine=true&limit=1'),
        ]);
        const wallet   = wRes.status === 'fulfilled' ? await wRes.value.json() : {};
        const orders   = oRes.status === 'fulfilled' ? await oRes.value.json() : {};
        const listings = lRes.status === 'fulfilled' ? await lRes.value.json() : {};

        const ordersArr = orders.orders || orders.data || [];
        const walletData = wallet.wallet || wallet.data || wallet;

        setStats({
          listings: listings.count || 0,
          orders:   ordersArr.filter(o => o.status === 'processing').length,
          balance:  walletData.balance || walletData.available_balance || 0,
          pending_balance: walletData.pending_balance || 0,
        });

        setActivity(ordersArr.slice(0, 5).map(o => ({
          text: `New order: ${o.product_title || o.service_title || 'Item'}`,
          sub:  o.status,
          time: o.created_at ? new Date(o.created_at).toLocaleDateString('en-NG', { day:'numeric', month:'short' }) : 'Recent',
          color: STATUS_COLOR[o.status] || '#9ca3af',
        })));

        setSalesData([
          { label:'Mon', value: 12000 },
          { label:'Tue', value: 28000 },
          { label:'Wed', value: 8000 },
          { label:'Thu', value: 35000 },
          { label:'Fri', value: 22000 },
          { label:'Sat', value: 45000 },
          { label:'Sun', value: 18000 },
        ]);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      {/* Welcome */}
      <div style={{ background:'linear-gradient(135deg,#0d3320,#1f8f43)', borderRadius:20, padding:'24px 28px', marginBottom:24, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:14 }}>
        <div>
          <div style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.6)', fontWeight:600, marginBottom:4 }}>Welcome back</div>
          <div style={{ fontSize:'1.5rem', fontWeight:900, color:'#fff', letterSpacing:'-0.04em' }}>{user?.first_name || 'Seller'}</div>
          <div style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.55)', marginTop:3 }}>{user?.university || 'AfriPlate Seller'}</div>
        </div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <button onClick={() => setTab('listings')} style={{ padding:'10px 18px', background:'#ff9d3f', color:'#fff', border:'none', borderRadius:11, fontSize:'0.82rem', fontWeight:800, cursor:'pointer' }}>+ List Item</button>
          <button onClick={() => setTab('wallet')} style={{ padding:'10px 18px', background:'rgba(255,255,255,0.15)', color:'#fff', border:'1px solid rgba(255,255,255,0.25)', borderRadius:11, fontSize:'0.82rem', fontWeight:700, cursor:'pointer' }}>Withdraw</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
        <StatBox label="Active Listings"    value={stats.listings}                     sub="Products & services" />
        <StatBox label="Orders to Fulfil"   value={stats.orders}                       sub={stats.orders > 0 ? 'Needs attention' : 'All clear'} color="#ff9d3f" />
        <StatBox label="Available Balance"  value={`₦${fmt(stats.balance)}`}           sub="Ready to withdraw" color="#6366f1" />
        <StatBox label="Pending Earnings"   value={`₦${fmt(stats.pending_balance)}`}  sub="Releasing soon" color="#ec4899" />
      </div>

      {/* Chart + Activity */}
      <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:20, marginBottom:20 }}>
        <div style={{ background:'#fff', border:'1px solid #eceff3', borderRadius:18, padding:22 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
            <div>
              <div style={{ fontSize:'0.95rem', fontWeight:900, color:'#111' }}>Weekly Sales</div>
              <div style={{ fontSize:'0.75rem', color:'#9ca3af' }}>Revenue this week</div>
            </div>
            <div style={{ fontSize:'1.1rem', fontWeight:900, color:'#1f8f43' }}>₦{fmt(salesData.reduce((a,b) => a + b.value, 0))}</div>
          </div>
          <BarChart data={salesData} color="#1f8f43" />
        </div>
        <div style={{ background:'#fff', border:'1px solid #eceff3', borderRadius:18, padding:22 }}>
          <div style={{ fontSize:'0.95rem', fontWeight:900, color:'#111', marginBottom:16 }}>Recent Activity</div>
          {activity.length === 0 ? <Empty text="No activity yet" /> : activity.map((a, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'9px 0', borderBottom: i < activity.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:a.color, flexShrink:0 }} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:'0.8rem', fontWeight:700, color:'#111', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{a.text}</div>
                <div style={{ fontSize:'0.7rem', color:'#9ca3af' }}>{a.time}</div>
              </div>
              <Badge color={a.color}>{a.sub}</Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ background:'#fff', border:'1px solid #eceff3', borderRadius:18, padding:22 }}>
        <div style={{ fontSize:'0.95rem', fontWeight:900, color:'#111', marginBottom:16 }}>Quick Actions</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
          {[
            { label:'List Product',    sub:'Sell items on campus',    tab:'listings',  color:'#1f8f43' },
            { label:'Offer Service',   sub:'Share your skills',       tab:'listings',  color:'#6366f1' },
            { label:'View Orders',     sub:'Orders from buyers',      tab:'received',  color:'#ff9d3f' },
            { label:'Withdraw',        sub:'Move money to bank',      tab:'wallet',    color:'#ec4899' },
          ].map(a => (
            <button key={a.label} onClick={() => setTab(a.tab)} style={{
              padding:'16px 14px', border:`1.5px solid ${a.color}22`, borderRadius:14,
              background:`${a.color}08`, cursor:'pointer', textAlign:'left', fontFamily:'Inter,sans-serif',
            }}>
              <div style={{ fontSize:'0.85rem', fontWeight:800, color:a.color, marginBottom:4 }}>{a.label}</div>
              <div style={{ fontSize:'0.72rem', color:'#9ca3af' }}>{a.sub}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SellerListings() {
  const [listingTab, setListingTab] = useState('products');
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]     = useState({ title:'', description:'', price:'', category:'', condition:'used', delivery_days:'', revisions:'' });
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const endpoint = listingTab === 'products' ? '/api/products?mine=true' : '/api/services?mine=true';
      const res  = await authFetch(endpoint);
      const data = await res.json();
      setItems(data.products || data.services || data.data || []);
    } catch { setItems([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [listingTab]);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.title.trim())   e.title    = 'Required';
    if (!form.price || isNaN(form.price)) e.price = 'Enter a valid price';
    if (!form.category.trim()) e.category = 'Required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async () => {
    if (!validate()) return;
    setSaving(true); setMsg('');
    try {
      const endpoint = listingTab === 'products' ? '/api/products' : '/api/services';
      const res = await authFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({ ...form, price: Number(form.price), images }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg(data.message || 'Failed.'); setSaving(false); return; }
      setMsg('Listed successfully!');
      setForm({ title:'', description:'', price:'', category:'', condition:'used', delivery_days:'', revisions:'' });
      setImages([]);
      setShowForm(false);
      load();
    } catch { setMsg('Connection error.'); }
    setSaving(false);
  };

  const deleteItem = async (itemId) => {
    if (!confirm('Remove this listing?')) return;
    const endpoint = listingTab === 'products' ? 'products' : 'services';
    try {
      const res = await authFetch(`/api/${endpoint}/${itemId}`, { method: 'DELETE' });
      if (res.ok) setItems(p => p.filter(i => i.id !== itemId));
    } catch {}
  };

  const PRODUCT_CATS = ['Electronics','Textbooks','Fashion','Food','Beauty','Furniture','Sports','Other'];
  const SERVICE_CATS = ['Design','Writing','Tutoring','Tech','Beauty','Photography','Music','Delivery','Other'];

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', gap:8 }}>
          {['products','services'].map(t => (
            <button key={t} onClick={() => { setListingTab(t); setShowForm(false); }} style={{
              padding:'8px 18px', borderRadius:10, fontFamily:'Inter,sans-serif',
              fontSize:'0.82rem', fontWeight:700, cursor:'pointer', border:'none',
              background: listingTab === t ? '#1f8f43' : '#f3f4f6', color: listingTab === t ? '#fff' : '#374151',
            }}>{t === 'products' ? 'Products' : 'Services'}</button>
          ))}
        </div>
        <GreenBtn onClick={() => { setShowForm(v => !v); setMsg(''); setErrors({}); }}>
          {showForm ? 'Cancel' : `+ Add ${listingTab === 'products' ? 'Product' : 'Service'}`}
        </GreenBtn>
      </div>

      {/* Create form */}
      {showForm && (
        <div style={{ background:'#fff', border:'1px solid #eceff3', borderRadius:18, padding:24, marginBottom:22 }}>
          <div style={{ fontSize:'0.95rem', fontWeight:900, color:'#111', marginBottom:18 }}>New {listingTab === 'products' ? 'Product' : 'Service'}</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <Field label="Title" error={errors.title}><Input value={form.title} onChange={set('title')} placeholder={listingTab === 'products' ? 'e.g. HP Laptop Core i5' : 'e.g. Logo Design'} err={errors.title} /></Field>
            <Field label="Price (₦)" error={errors.price}><Input value={form.price} onChange={set('price')} placeholder="e.g. 15000" type="number" err={errors.price} /></Field>
            <Field label="Category" error={errors.category}>
              <Sel value={form.category} onChange={set('category')} err={errors.category}>
                <option value="">Select category</option>
                {(listingTab === 'products' ? PRODUCT_CATS : SERVICE_CATS).map(c => <option key={c}>{c}</option>)}
              </Sel>
            </Field>
            {listingTab === 'products' && (
              <Field label="Condition">
                <Sel value={form.condition} onChange={set('condition')}>
                  <option value="used">Used</option>
                  <option value="new">Brand New</option>
                  <option value="fairly_used">Fairly Used</option>
                </Sel>
              </Field>
            )}
            {listingTab === 'services' && (
              <>
                <Field label="Delivery Days"><Input value={form.delivery_days} onChange={set('delivery_days')} placeholder="e.g. 3" type="number" /></Field>
                <Field label="Revisions"><Input value={form.revisions} onChange={set('revisions')} placeholder="e.g. 2" type="number" /></Field>
              </>
            )}
          </div>
          <Field label="Description"><Textarea value={form.description} onChange={set('description')} placeholder="Describe your listing in detail..." /></Field>

          {/* Image upload */}
          <Field label="Images (up to 4)">
            <label style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'11px 16px', border:'1.5px dashed #d1d5db', borderRadius:12, cursor: uploading || images.length >= 4 ? 'not-allowed' : 'pointer', background:'#fafafa', fontSize:'0.85rem', fontWeight:700, color:'#6b7280' }}>
              <input type="file" accept="image/*" multiple style={{ display:'none' }} disabled={uploading || images.length >= 4}
                onChange={async (e) => {
                  const files = Array.from(e.target.files).slice(0, 4 - images.length);
                  if (!files.length) return;
                  setUploading(true);
                  try {
                    const uploaded = await Promise.all(files.map(async (file) => {
                      const fd = new FormData();
                      fd.append('file', file);
                      fd.append('upload_preset', 'afriplate');
                      const r = await fetch('https://api.cloudinary.com/v1_1/dphzl25lf/image/upload', { method:'POST', body:fd });
                      const d = await r.json();
                      return d.secure_url;
                    }));
                    setImages(p => [...p, ...uploaded.filter(Boolean)]);
                  } catch {}
                  setUploading(false);
                }}
              />
              {uploading ? 'Uploading...' : images.length >= 4 ? '4 images max' : '+ Upload photos'}
            </label>
            {images.length > 0 && (
              <div style={{ display:'flex', gap:8, marginTop:10, flexWrap:'wrap' }}>
                {images.map((url, i) => (
                  <div key={i} style={{ position:'relative', width:64, height:64 }}>
                    <img src={url} style={{ width:64, height:64, borderRadius:8, objectFit:'cover', border:'1px solid #e5e7eb' }} />
                    <button onClick={() => setImages(p => p.filter((_, j) => j !== i))} style={{ position:'absolute', top:-6, right:-6, width:18, height:18, borderRadius:'50%', background:'#ef4444', color:'#fff', border:'none', cursor:'pointer', fontSize:'0.6rem', fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </Field>

          {msg && <div style={{ marginBottom:12, fontSize:'0.82rem', fontWeight:700, color: msg.includes('!') ? '#1f8f43' : '#ef4444' }}>{msg}</div>}
          <GreenBtn onClick={submit} disabled={saving || uploading}>{saving ? 'Publishing...' : 'Publish Listing'}</GreenBtn>
        </div>
      )}

      {/* Listings grid */}
      {loading ? <Spinner /> : items.length === 0 ? (
        <div style={{ background:'#fff', border:'1px solid #eceff3', borderRadius:18, padding:'48px 24px', textAlign:'center' }}>
          <div style={{ fontSize:'2rem', marginBottom:10 }}>📋</div>
          <div style={{ fontWeight:800, color:'#111', marginBottom:6 }}>No {listingTab} yet</div>
          <p style={{ color:'#9ca3af', fontSize:'0.875rem' }}>Click "+ Add" above to create your first listing.</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
          {items.map(item => (
            <div key={item.id} style={{ background:'#fff', border:'1px solid #eceff3', borderRadius:14, overflow:'hidden', boxShadow:'0 2px 8px rgba(15,23,42,0.04)' }}>
              <div style={{ height:110, background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
                {item.images?.[0]
                  ? <img src={item.images[0]} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  : <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                }
              </div>
              <div style={{ padding:'12px 14px' }}>
                <div style={{ fontSize:'0.83rem', fontWeight:700, color:'#111', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginBottom:4 }}>{item.title}</div>
                <div style={{ fontSize:'0.9rem', fontWeight:900, color:'#1f8f43', marginBottom:10 }}>₦{fmt(item.price)}</div>
                <div style={{ display:'flex', gap:8 }}>
                  <a href={`/${listingTab}/${item.id}`} style={{ flex:1, textAlign:'center', padding:'7px', background:'#f3f4f6', color:'#374151', borderRadius:8, fontSize:'0.75rem', fontWeight:700 }}>View</a>
                  <button onClick={() => deleteItem(item.id)} style={{ flex:1, padding:'7px', background:'#fef2f2', color:'#ef4444', border:'none', borderRadius:8, fontSize:'0.75rem', fontWeight:700, cursor:'pointer' }}>Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SellerOrders() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch('/api/orders?role=seller')
      .then(r => r.json())
      .then(d => { setOrders(d.orders || d.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <div style={{ fontSize:'1.1rem', fontWeight:900, color:'#111', marginBottom:20 }}>Orders Received</div>
      {orders.length === 0 ? (
        <div style={{ background:'#fff', border:'1px solid #eceff3', borderRadius:18, padding:'60px 24px', textAlign:'center' }}>
          <div style={{ fontSize:'2.5rem', marginBottom:12 }}>📬</div>
          <div style={{ fontWeight:800, color:'#111', marginBottom:6 }}>No orders yet</div>
          <p style={{ color:'#9ca3af', fontSize:'0.875rem' }}>When buyers order your products or services, they'll appear here.</p>
        </div>
      ) : orders.map(o => (
        <div key={o.id} style={{ background:'#fff', border:'1px solid #eceff3', borderRadius:16, padding:'18px 20px', marginBottom:12, boxShadow:'0 2px 8px rgba(15,23,42,0.04)' }}>
          <div style={{ display:'flex', alignItems:'flex-start', gap:14, flexWrap:'wrap' }}>
            <div style={{ width:48, height:48, borderRadius:12, background:'#f3f4f6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem', flexShrink:0 }}>
              {o.product_id ? '📦' : '🛠'}
            </div>
            <div style={{ flex:1, minWidth:200 }}>
              <div style={{ fontSize:'0.92rem', fontWeight:800, color:'#111', marginBottom:4 }}>{o.product_title || o.service_title || `Order #${o.id}`}</div>
              <div style={{ fontSize:'0.75rem', color:'#9ca3af', marginBottom:6 }}>
                From: {o.buyer_name || o.buyer_first_name || 'Buyer'} · {o.created_at ? new Date(o.created_at).toLocaleDateString('en-NG', { day:'numeric', month:'short', year:'numeric' }) : 'Recent'}
              </div>
              <Badge color={STATUS_COLOR[o.status] || '#9ca3af'}>{o.status}</Badge>
            </div>
            <div style={{ textAlign:'right', flexShrink:0 }}>
              <div style={{ fontSize:'0.75rem', color:'#9ca3af', marginBottom:2 }}>You receive</div>
              <div style={{ fontSize:'1rem', fontWeight:900, color:'#1f8f43' }}>₦{fmt(o.seller_amount)}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SellerWallet() {
  const [wallet, setWallet]   = useState(null);
  const [txns, setTxns]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount]   = useState('');
  const [bankCode, setBankCode] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [wState, setWState]   = useState('idle');
  const [wMsg, setWMsg]       = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [wRes, tRes] = await Promise.allSettled([
          authFetch('/api/wallet'),
          authFetch('/api/wallet/transactions'),
        ]);
        if (wRes.status === 'fulfilled' && wRes.value.ok) {
          const d = await wRes.value.json();
          setWallet(d.wallet || d.data || d);
        }
        if (tRes.status === 'fulfilled' && tRes.value.ok) {
          const d = await tRes.value.json();
          setTxns(d.transactions || d.data || []);
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const withdraw = async () => {
    if (!amount || Number(amount) < 500) { setWMsg('Minimum ₦500.'); return; }
    if (!accountNo || accountNo.length !== 10) { setWMsg('Enter valid 10-digit account.'); return; }
    if (!bankCode) { setWMsg('Select a bank.'); return; }
    setWState('loading'); setWMsg('');
    try {
      const res = await authFetch('/api/wallet/withdraw', { method:'POST', body: JSON.stringify({ amount: Number(amount), bank_code: bankCode, account_number: accountNo }) });
      const d   = await res.json();
      if (!res.ok) { setWMsg(d.message || 'Failed.'); setWState('error'); return; }
      setWState('success'); setWMsg('Withdrawal submitted! Arrives within 24hrs.');
      setAmount(''); setBankCode(''); setAccountNo('');
    } catch { setWMsg('Connection error.'); setWState('error'); }
  };

  const BANKS = [
    { code:'044', name:'Access Bank' }, { code:'011', name:'First Bank' }, { code:'058', name:'GTBank' },
    { code:'033', name:'UBA' }, { code:'057', name:'Zenith Bank' }, { code:'214', name:'FCMB' },
    { code:'070', name:'Fidelity Bank' }, { code:'076', name:'Polaris Bank' }, { code:'232', name:'Sterling Bank' },
    { code:'032', name:'Union Bank' }, { code:'215', name:'Unity Bank' }, { code:'035', name:'Wema Bank' },
    { code:'50211', name:'Kuda Bank' }, { code:'90115', name:'OPay' }, { code:'90110', name:'PalmPay' },
  ].sort((a,b) => a.name.localeCompare(b.name));

  if (loading) return <Spinner />;

  const w = wallet || {};
  const balance = w.balance || w.available_balance || 0;

  return (
    <div>
      <div style={{ fontSize:'1.1rem', fontWeight:900, color:'#111', marginBottom:20 }}>Wallet</div>

      {/* Balance cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:24 }}>
        <div style={{ background:'linear-gradient(135deg,#0d3320,#1f8f43)', borderRadius:18, padding:'20px 22px' }}>
          <div style={{ fontSize:'0.72rem', fontWeight:700, color:'rgba(255,255,255,0.65)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:8 }}>Available</div>
          <div style={{ fontSize:'1.7rem', fontWeight:900, color:'#fff', letterSpacing:'-0.04em' }}>₦{fmt(balance)}</div>
        </div>
        <div style={{ background:'#fff', border:'1px solid #eceff3', borderRadius:18, padding:'20px 22px' }}>
          <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'1px', marginBottom:8 }}>Pending</div>
          <div style={{ fontSize:'1.7rem', fontWeight:900, color:'#f59e0b', letterSpacing:'-0.04em' }}>₦{fmt(w.pending_balance || 0)}</div>
        </div>
        <div style={{ background:'#fff', border:'1px solid #eceff3', borderRadius:18, padding:'20px 22px' }}>
          <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'1px', marginBottom:8 }}>Total Earned</div>
          <div style={{ fontSize:'1.7rem', fontWeight:900, color:'#1f8f43', letterSpacing:'-0.04em' }}>₦{fmt(w.total_earned || 0)}</div>
        </div>
      </div>

      {/* Withdraw */}
      <div style={{ background:'#fff', border:'1px solid #eceff3', borderRadius:18, padding:22, marginBottom:22 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: showForm ? 18 : 0 }}>
          <div>
            <div style={{ fontSize:'0.95rem', fontWeight:900, color:'#111' }}>Withdraw Funds</div>
            <div style={{ fontSize:'0.75rem', color:'#9ca3af', marginTop:2 }}>Min ₦500 · Arrives within 24 hours</div>
          </div>
          <GreenBtn onClick={() => { setShowForm(v => !v); setWMsg(''); setWState('idle'); }} style={{ padding:'9px 18px' }}>
            {showForm ? 'Cancel' : 'Withdraw'}
          </GreenBtn>
        </div>
        {showForm && (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <Field label="Amount (₦)"><Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 5000" /></Field>
              <Field label="Bank">
                <Sel value={bankCode} onChange={e => setBankCode(e.target.value)}>
                  <option value="">Select bank</option>
                  {BANKS.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
                </Sel>
              </Field>
              <Field label="Account Number" style={{ gridColumn:'1/-1' }}>
                <Input value={accountNo} onChange={e => setAccountNo(e.target.value.replace(/\D/g,'').slice(0,10))} placeholder="10-digit account number" />
              </Field>
            </div>
            {wMsg && <div style={{ margin:'10px 0', fontSize:'0.82rem', fontWeight:700, color: wState === 'success' ? '#1f8f43' : '#ef4444' }}>{wMsg}</div>}
            <GreenBtn onClick={withdraw} disabled={wState === 'loading'} style={{ marginTop:12 }}>
              {wState === 'loading' ? 'Processing...' : 'Submit Withdrawal'}
            </GreenBtn>
          </div>
        )}
      </div>

      {/* Transactions */}
      <div style={{ background:'#fff', border:'1px solid #eceff3', borderRadius:18, padding:22 }}>
        <div style={{ fontSize:'0.95rem', fontWeight:900, color:'#111', marginBottom:16 }}>Transaction History</div>
        {txns.length === 0 ? <Empty text="No transactions yet" /> : txns.map(t => {
          const isCredit = t.type === 'credit' || t.amount > 0;
          return (
            <div key={t.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 0', borderBottom:'1px solid #f3f4f6' }}>
              <div style={{ width:38, height:38, borderRadius:10, background: isCredit ? '#eaf8ee' : '#fef2f2', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                {isCredit
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1f8f43" strokeWidth="2.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                }
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:'0.85rem', fontWeight:700, color:'#111', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{t.description || (isCredit ? 'Payment received' : 'Withdrawal')}</div>
                <div style={{ fontSize:'0.72rem', color:'#9ca3af', marginTop:2 }}>{t.created_at ? new Date(t.created_at).toLocaleDateString('en-NG', { day:'numeric', month:'short', year:'numeric' }) : ''}</div>
              </div>
              <div style={{ fontWeight:900, fontSize:'0.92rem', color: isCredit ? '#1f8f43' : '#ef4444' }}>
                {isCredit ? '+' : '-'}₦{fmt(Math.abs(t.amount))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD — routes to buyer or seller based on user_type
// ══════════════════════════════════════════════════════════════════════════════
export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = '/login'; return; }
    authFetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        const u = d.user || d.data || d;
        setUser(u);
        // keep localStorage in sync
        localStorage.setItem('user', JSON.stringify(u));
      })
      .catch(() => { window.location.href = '/login'; })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter,sans-serif', background:'#f7f8fa' }}>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:36, height:36, border:'3px solid #e5e7eb', borderTopColor:'#1f8f43', borderRadius:'50%', animation:'spin 0.7s linear infinite', margin:'0 auto 16px' }} />
        <div style={{ fontSize:'0.85rem', color:'#9ca3af', fontWeight:600 }}>Loading your dashboard...</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#f7f8fa', fontFamily:'Inter,sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Inter',sans-serif; }
        a { text-decoration:none; color:inherit; }
        button { font-family:'Inter',sans-serif; }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        .dash-wrap { animation:fadeUp 0.35s ease both; }
      `}</style>

      {/* TOP NAV */}
      <nav style={{ background:'#fff', borderBottom:'1px solid #e5e7eb', padding:'0 24px', height:62, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100 }}>
        <a href="/" style={{ fontSize:'1.45rem', fontWeight:900, color:'#111', letterSpacing:'-0.04em' }}>
          Afri<span style={{ color:'#1f8f43' }}>Plate</span>
        </a>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <a href="/products" style={{ padding:'8px 14px', borderRadius:10, fontSize:'0.84rem', fontWeight:700, color:'#374151', background:'#f3f4f6' }}>Products</a>
          <a href="/services" style={{ padding:'8px 14px', borderRadius:10, fontSize:'0.84rem', fontWeight:700, color:'#374151', background:'#f3f4f6' }}>Services</a>
          <a href="/jobs"     style={{ padding:'8px 14px', borderRadius:10, fontSize:'0.84rem', fontWeight:700, color:'#374151', background:'#f3f4f6' }}>Jobs</a>
          <a href="/notifications" style={{ padding:'8px 14px', borderRadius:10, fontSize:'0.84rem', fontWeight:700, color:'#374151', background:'#f3f4f6' }}>🔔</a>
          <Avatar name={`${user?.first_name || ''}`} size={34} />
        </div>
      </nav>

      <div className="dash-wrap">
        {user?.user_type === 'seller'
          ? <SellerDashboard user={user} />
          : <BuyerDashboard  user={user} />
        }
      </div>
    </div>
  );
}