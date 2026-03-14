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

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)   return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString('en-NG', { day:'numeric', month:'short' });
}

function Spinner() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'60px 0' }}>
      <div style={{ width:28, height:28, border:'3px solid #e5e7eb', borderTopColor:'#1f8f43', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
    </div>
  );
}

const NOTIF_ICONS = {
  order:    { icon:'🛍', bg:'#eaf8ee', color:'#1f8f43' },
  payment:  { icon:'💳', bg:'#eef2ff', color:'#6366f1' },
  message:  { icon:'💬', bg:'#f0f9ff', color:'#0284c7' },
  review:   { icon:'⭐', bg:'#fef3c7', color:'#d97706' },
  delivery: { icon:'📦', bg:'#f0fdf4', color:'#1f8f43' },
  job:      { icon:'💼', bg:'#fce7f3', color:'#db2777' },
  system:   { icon:'🔔', bg:'#f3f4f6', color:'#6b7280' },
};

function getStyle(type) {
  return NOTIF_ICONS[type] || NOTIF_ICONS.system;
}

export default function NotificationsPage() {
  const [notifs, setNotifs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('all'); // all | unread
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    if (!getToken()) { window.location.href = '/login'; return; }
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/notifications`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.ok) {
        const d = await res.json();
        setNotifs(d.notifications || d.data || []);
      }
    } catch {}
    setLoading(false);
  };

  const markRead = async (id) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    try {
      await fetch(`${API}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${getToken()}` }
      });
    } catch {}
  };

  const markAllRead = async () => {
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
    try {
      await fetch(`${API}/api/notifications/read-all`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${getToken()}` }
      });
    } catch {}
  };

  const deleteNotif = async (id) => {
    setDeleting(id);
    try {
      await fetch(`${API}/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setNotifs(prev => prev.filter(n => n.id !== id));
    } catch {}
    setDeleting(null);
  };

  const handleClick = (notif) => {
    if (!notif.is_read) markRead(notif.id);
    if (notif.link) window.location.href = notif.link;
  };

  const filtered  = tab === 'unread' ? notifs.filter(n => !n.is_read) : notifs;
  const unreadCnt = notifs.filter(n => !n.is_read).length;

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
        @keyframes fadeOut { to { opacity:0; height:0; padding:0; margin:0; } }

        .page-wrap { max-width:700px; margin:0 auto; padding:36px 24px 80px; animation:fadeUp 0.4s ease both; }

        /* HEADER */
        .page-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; flex-wrap:wrap; gap:12px; }
        .page-title  { font-size:1.5rem; font-weight:900; color:#111; letter-spacing:-0.04em; }
        .unread-badge { display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px; border-radius:50%; background:#1f8f43; color:#fff; font-size:0.7rem; font-weight:900; margin-left:8px; }

        /* TABS + ACTIONS */
        .toolbar { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; flex-wrap:wrap; gap:10px; }
        .tab-bar { display:flex; gap:6px; }
        .tab-pill { padding:8px 16px; border-radius:50px; font-size:0.82rem; font-weight:700; background:#f3f4f6; color:#6b7280; cursor:pointer; transition:all 0.18s; border:none; }
        .tab-pill.active { background:#1f8f43; color:#fff; }
        .mark-all-btn { font-size:0.8rem; font-weight:700; color:#1f8f43; background:none; border:none; cursor:pointer; padding:6px 10px; border-radius:8px; transition:background 0.18s; }
        .mark-all-btn:hover { background:#eaf8ee; }

        /* NOTIF CARD */
        .notif-card { background:#fff; border:1px solid #eceff3; border-radius:16px; padding:16px 18px; margin-bottom:10px; display:flex; align-items:flex-start; gap:14px; cursor:pointer; transition:all 0.2s; position:relative; box-shadow:0 2px 8px rgba(15,23,42,0.04); }
        .notif-card:hover { box-shadow:0 6px 20px rgba(15,23,42,0.09); transform:translateY(-1px); }
        .notif-card.unread { border-left:3px solid #1f8f43; background:#fafffe; }
        .notif-card.unread::before { content:''; position:absolute; top:18px; right:18px; width:8px; height:8px; border-radius:50%; background:#1f8f43; }

        .notif-icon-wrap { width:44px; height:44px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:1.2rem; flex-shrink:0; }
        .notif-body { flex:1; min-width:0; }
        .notif-title { font-size:0.875rem; font-weight:700; color:#111; margin-bottom:3px; line-height:1.4; }
        .notif-card.unread .notif-title { font-weight:900; }
        .notif-sub  { font-size:0.78rem; color:#6b7280; line-height:1.5; margin-bottom:5px; }
        .notif-time { font-size:0.7rem; color:#9ca3af; font-weight:600; }

        .delete-btn { width:28px; height:28px; border-radius:8px; background:none; display:flex; align-items:center; justify-content:center; color:#d1d5db; transition:all 0.18s; flex-shrink:0; margin-top:2px; }
        .delete-btn:hover { background:#fef2f2; color:#ef4444; }

        /* GROUP LABEL */
        .group-label { font-size:0.72rem; font-weight:800; color:#9ca3af; text-transform:uppercase; letter-spacing:1.5px; margin:20px 0 10px; }

        /* EMPTY */
        .empty-wrap { background:#fff; border:1px solid #eceff3; border-radius:20px; padding:60px 24px; text-align:center; }

        @media (max-width:480px) { .page-wrap { padding:20px 16px 60px; } }
      `}</style>

      <Nav />

      <div className="page-wrap">
        {/* HEADER */}
        <div className="page-header">
          <div>
            <span className="page-title">Notifications</span>
            {unreadCnt > 0 && <span className="unread-badge">{unreadCnt}</span>}
          </div>
          <a href="/dashboard" style={{ fontSize:'0.83rem', fontWeight:700, color:'#6b7280', padding:'8px 14px', background:'#f3f4f6', borderRadius:10 }}>
            Back to Dashboard
          </a>
        </div>

        {/* TOOLBAR */}
        <div className="toolbar">
          <div className="tab-bar">
            <button className={`tab-pill ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>
              All {notifs.length > 0 && `(${notifs.length})`}
            </button>
            <button className={`tab-pill ${tab === 'unread' ? 'active' : ''}`} onClick={() => setTab('unread')}>
              Unread {unreadCnt > 0 && `(${unreadCnt})`}
            </button>
          </div>
          {unreadCnt > 0 && (
            <button className="mark-all-btn" onClick={markAllRead}>
              Mark all as read
            </button>
          )}
        </div>

        {loading ? <Spinner /> : filtered.length === 0 ? (
          <div className="empty-wrap">
            <div style={{ fontSize:'2.5rem', marginBottom:12 }}>🔔</div>
            <div style={{ fontSize:'1rem', fontWeight:900, color:'#111', marginBottom:6 }}>
              {tab === 'unread' ? 'All caught up!' : 'No notifications yet'}
            </div>
            <p style={{ fontSize:'0.875rem', color:'#9ca3af' }}>
              {tab === 'unread' ? 'You have no unread notifications.' : 'Activity on your orders, messages and listings will appear here.'}
            </p>
          </div>
        ) : (
          <div>
            {groupByDate(filtered).map(({ label, items }) => (
              <div key={label}>
                <div className="group-label">{label}</div>
                {items.map(notif => {
                  const style = getStyle(notif.type);
                  return (
                    <div
                      key={notif.id}
                      className={`notif-card ${!notif.is_read ? 'unread' : ''}`}
                      onClick={() => handleClick(notif)}
                    >
                      <div className="notif-icon-wrap" style={{ background: style.bg }}>
                        {style.icon}
                      </div>
                      <div className="notif-body">
                        <div className="notif-title">{notif.title || notif.message}</div>
                        {notif.body && <div className="notif-sub">{notif.body}</div>}
                        <div className="notif-time">{timeAgo(notif.created_at)}</div>
                      </div>
                      <button
                        className="delete-btn"
                        onClick={e => { e.stopPropagation(); deleteNotif(notif.id); }}
                        disabled={deleting === notif.id}
                        title="Dismiss"
                      >
                        {deleting === notif.id
                          ? <div style={{ width:12, height:12, border:'2px solid #e5e7eb', borderTopColor:'#9ca3af', borderRadius:'50%', animation:'spin 0.65s linear infinite' }} />
                          : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        }
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// Group notifications by Today / Yesterday / This Week / Older
function groupByDate(notifs) {
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const weekAgo   = new Date(today); weekAgo.setDate(today.getDate() - 7);

  const groups = { 'Today':[], 'Yesterday':[], 'This Week':[], 'Older':[] };

  notifs.forEach(n => {
    const d = new Date(n.created_at || Date.now());
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (day >= today)         groups['Today'].push(n);
    else if (day >= yesterday) groups['Yesterday'].push(n);
    else if (day >= weekAgo)   groups['This Week'].push(n);
    else                       groups['Older'].push(n);
  });

  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }));
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