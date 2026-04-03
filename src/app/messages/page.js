'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
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

function authFetch(url, opts = {}) {
  return fetch(`${API}${url}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, ...(opts.headers || {}) },
  });
}

function Avatar({ name = '', size = 40 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg,#1f8f43,#4ade80)',
      color: '#fff', fontWeight: 800, fontSize: size * 0.38,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>{(name?.[0] || 'U').toUpperCase()}</div>
  );
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return new Date(dateStr).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

function MessagesInner() {
  const searchParams   = useSearchParams();
  const toUserId       = searchParams.get('to');
  const user           = getUser();

  const [convos, setConvos]         = useState([]);
  const [active, setActive]         = useState(null);
  const [messages, setMessages]     = useState([]);
  const [newMsg, setNewMsg]         = useState('');
  const [sending, setSending]       = useState(false);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMsgs, setLoadingMsgs]     = useState(false);
  const [error, setError]           = useState('');
  const [mobileView, setMobileView] = useState('list'); // list | chat
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);

  // Load conversations
  const loadConvos = async () => {
    try {
      const res  = await authFetch('/api/messages');
      const data = await res.json();
      setConvos(data.conversations || []);
    } catch {}
    setLoadingConvos(false);
  };

  useEffect(() => {
    if (!getToken()) { window.location.href = '/login'; return; }
    loadConvos();
  }, []);

  // If ?to= param, start/open conversation with that user
  useEffect(() => {
    if (!toUserId || loadingConvos) return;

    const existing = convos.find(c => String(c.user_id) === String(toUserId));
    if (existing) {
      openConvo(existing);
    } else {
      // Create new conversation
      startConvoWith(toUserId);
    }
  }, [toUserId, loadingConvos]);

  const startConvoWith = async (receiverId) => {
    try {
      const res  = await authFetch('/api/messages', {
        method: 'POST',
        body: JSON.stringify({ receiver_id: parseInt(receiverId), content: 'Hi, I am interested in your listing.' }),
      });
      const data = await res.json();
      await loadConvos();
      // Find the new convo and open it
      const res2  = await authFetch('/api/messages');
      const data2 = await res2.json();
      setConvos(data2.conversations || []);
      const newConvo = (data2.conversations || []).find(c => String(c.user_id) === String(receiverId));
      if (newConvo) openConvo(newConvo);
    } catch {}
  };

  const openConvo = async (convo) => {
    setActive(convo);
    setMobileView('chat');
    setLoadingMsgs(true);
    setError('');
    try {
      const res  = await authFetch(`/api/messages/${convo.id}`);
      const data = await res.json();
      setMessages(data.messages || []);
      // Mark as read — update unread count locally
      setConvos(prev => prev.map(c => c.id === convo.id ? { ...c, unread: 0 } : c));
    } catch { setError('Failed to load messages.'); }
    setLoadingMsgs(false);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMsg.trim() || !active || sending) return;
    const content = newMsg.trim();
    setSending(true);
    setNewMsg('');

    // Optimistic update
    const optimistic = {
      id: Date.now(),
      sender_id: user?.id,
      content,
      created_at: new Date().toISOString(),
      optimistic: true,
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      const res  = await authFetch('/api/messages', {
        method: 'POST',
        body: JSON.stringify({ conversation_id: active.id, content }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Remove optimistic, show error
        setMessages(prev => prev.filter(m => m.id !== optimistic.id));
        setError(data.message || 'Message blocked.');
      } else {
        // Replace optimistic with real message
        setMessages(prev => prev.map(m => m.id === optimistic.id ? data.message : m));
        // Update last message in convo list
        setConvos(prev => prev.map(c => c.id === active.id ? { ...c, last_message: content } : c));
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      setError('Failed to send message.');
    }
    setSending(false);
    inputRef.current?.focus();
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Inter',sans-serif; background:#f7f8fa; overflow:hidden; }
        a { text-decoration:none; color:inherit; }
        button { font-family:'Inter',sans-serif; cursor:pointer; border:none; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform:rotate(360deg); } }

        .page { display:flex; flex-direction:column; height:100vh; background:#f7f8fa; }

        /* TOP NAV */
        .nav { background:#fff; border-bottom:1px solid #e5e7eb; padding:0 20px; height:60px; display:flex; align-items:center; justify-content:space-between; flex-shrink:0; z-index:10; }
        .brand { font-size:1.4rem; font-weight:900; color:#111; letter-spacing:-0.04em; }
        .brand span { color:#1f8f43; }
        .nav-back { display:flex; align-items:center; gap:6px; font-size:0.84rem; fontWeight:700; color:#6b7280; padding:7px 12px; background:#f3f4f6; border-radius:9px; }

        /* BODY */
        .body { display:flex; flex:1; overflow:hidden; max-width:1100px; width:100%; margin:0 auto; padding:20px; gap:16px; }

        /* CONVO LIST */
        .convo-panel { width:320px; flex-shrink:0; background:#fff; border:1px solid #eceff3; border-radius:20px; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 2px 12px rgba(15,23,42,0.05); }
        .convo-header { padding:16px 18px; border-bottom:1px solid #f3f4f6; }
        .convo-header h2 { font-size:1rem; font-weight:900; color:#111; }
        .convo-list { flex:1; overflow-y:auto; }
        .convo-item { padding:14px 18px; display:flex; align-items:center; gap:12px; cursor:pointer; border-bottom:1px solid #f9fafb; transition:background 0.15s; border-left:3px solid transparent; }
        .convo-item:hover { background:#f8fafc; }
        .convo-item.active { background:#f0fdf4; border-left-color:#1f8f43; }
        .convo-info { flex:1; min-width:0; }
        .convo-name { font-size:0.875rem; font-weight:700; color:#111; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:2px; }
        .convo-last { font-size:0.75rem; color:#9ca3af; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .convo-meta { display:flex; flex-direction:column; align-items:flex-end; gap:4px; flex-shrink:0; }
        .convo-time { font-size:0.68rem; color:#9ca3af; }
        .unread-badge { width:18px; height:18px; border-radius:50%; background:#1f8f43; color:#fff; font-size:0.62rem; font-weight:900; display:flex; align-items:center; justify-content:center; }
        .empty-convos { padding:48px 24px; text-align:center; color:#9ca3af; font-size:0.875rem; }

        /* CHAT PANEL */
        .chat-panel { flex:1; background:#fff; border:1px solid #eceff3; border-radius:20px; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 2px 12px rgba(15,23,42,0.05); min-width:0; }
        .chat-header { padding:14px 18px; border-bottom:1px solid #f3f4f6; display:flex; align-items:center; gap:12px; flex-shrink:0; }
        .chat-header-info { flex:1; min-width:0; }
        .chat-header-name { font-size:0.95rem; font-weight:800; color:#111; }
        .chat-header-sub { font-size:0.72rem; color:#9ca3af; margin-top:1px; }
        .mobile-back { display:none; background:none; padding:4px 8px; color:#6b7280; font-size:0.84rem; font-weight:700; }

        .chat-messages { flex:1; overflow-y:auto; padding:16px 18px; display:flex; flex-direction:column; gap:10px; }
        .msg-wrap { display:flex; }
        .msg-wrap.mine { justify-content:flex-end; }
        .msg-bubble { max-width:70%; padding:10px 14px; border-radius:18px; font-size:0.875rem; line-height:1.5; animation:fadeUp 0.2s ease; }
        .msg-bubble.mine { background:#1f8f43; color:#fff; border-radius:18px 18px 4px 18px; }
        .msg-bubble.theirs { background:#f3f4f6; color:#111; border-radius:18px 18px 18px 4px; }
        .msg-bubble.optimistic { opacity:0.65; }
        .msg-time { font-size:0.65rem; margin-top:4px; text-align:right; }
        .msg-time.mine { color:rgba(255,255,255,0.7); }
        .msg-time.theirs { color:#9ca3af; }

        .chat-empty { flex:1; display:flex; align-items:center; justify-content:center; flex-direction:column; gap:8px; color:#9ca3af; }
        .chat-placeholder { flex:1; display:flex; align-items:center; justify-content:center; flex-direction:column; gap:12px; color:#9ca3af; }

        .error-bar { background:#fef2f2; border:1px solid #fecaca; color:#dc2626; font-size:0.8rem; font-weight:600; padding:8px 16px; margin:0 18px 8px; border-radius:10px; }

        /* INPUT */
        .chat-input-wrap { padding:12px 16px; border-top:1px solid #f3f4f6; display:flex; gap:10px; align-items:flex-end; flex-shrink:0; }
        .chat-input { flex:1; padding:11px 14px; border:1.5px solid #e5e7eb; border-radius:14px; font-size:0.875rem; font-family:'Inter',sans-serif; outline:none; resize:none; max-height:120px; line-height:1.5; transition:border-color 0.2s; }
        .chat-input:focus { border-color:#1f8f43; box-shadow:0 0 0 3px rgba(31,143,67,0.08); }
        .send-btn { width:42px; height:42px; border-radius:12px; background:#1f8f43; color:#fff; display:flex; align-items:center; justify-content:center; transition:all 0.18s; flex-shrink:0; }
        .send-btn:hover:not(:disabled) { background:#187536; transform:scale(1.05); }
        .send-btn:disabled { opacity:0.5; cursor:not-allowed; transform:none; }

        .spinner { width:22px; height:22px; border:2.5px solid #e5e7eb; border-top-color:#1f8f43; border-radius:50%; animation:spin 0.7s linear infinite; margin:0 auto; }

        /* MOBILE */
        @media (max-width:640px) {
          .body { padding:0; gap:0; }
          .convo-panel { width:100%; border-radius:0; border:none; border-bottom:1px solid #eceff3; display:flex; }
          .chat-panel { border-radius:0; border:none; }
          .mobile-back { display:flex; align-items:center; gap:4px; }
          .mobile-hide { display:none; }
        }
      `}</style>

      <div className="page">
        {/* NAV */}
        <nav className="nav">
          <a href="/" className="brand">Afri<span>Plate</span></a>
          <a href="/dashboard" className="nav-back">
            ← Dashboard
          </a>
        </nav>

        <div className="body">
          {/* CONVO LIST — hidden on mobile when chat is open */}
          <div className="convo-panel" style={{ display: mobileView === 'chat' ? 'none' : 'flex' }} id="convo-panel">
            <div className="convo-header">
              <h2>Messages</h2>
            </div>
            <div className="convo-list">
              {loadingConvos ? (
                <div style={{ padding:32, textAlign:'center' }}><div className="spinner" /></div>
              ) : convos.length === 0 ? (
                <div className="empty-convos">
                  <div style={{ fontSize:'2rem', marginBottom:8 }}>💬</div>
                  <div style={{ fontWeight:700, color:'#374151', marginBottom:4 }}>No messages yet</div>
                  <div>Browse products and tap "Ask Seller" to start a conversation.</div>
                </div>
              ) : convos.map(c => (
                <div key={c.id} className={`convo-item ${active?.id === c.id ? 'active' : ''}`} onClick={() => openConvo(c)}>
                  <Avatar name={c.name || c.first_name} size={42} />
                  <div className="convo-info">
                    <div className="convo-name">{c.name || `${c.first_name || ''} ${c.last_name || ''}`.trim()}</div>
                    <div className="convo-last">{c.last_message || (c.product_title || c.service_title || 'New conversation')}</div>
                  </div>
                  <div className="convo-meta">
                    <span className="convo-time">{timeAgo(c.created_at)}</span>
                    {c.unread > 0 && <span className="unread-badge">{c.unread}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CHAT PANEL */}
          <div className="chat-panel" style={{ display: mobileView === 'list' && window?.innerWidth < 640 ? 'none' : 'flex' }}>
            {!active ? (
              <div className="chat-placeholder">
                <div style={{ fontSize:'3rem' }}>💬</div>
                <div style={{ fontWeight:800, color:'#374151', fontSize:'1rem' }}>Select a conversation</div>
                <div style={{ fontSize:'0.875rem' }}>Choose from the list to start messaging</div>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="chat-header">
                  <button className="mobile-back" onClick={() => setMobileView('list')}>← Back</button>
                  <Avatar name={active.name || active.first_name} size={38} />
                  <div className="chat-header-info">
                    <div className="chat-header-name">{active.name || `${active.first_name || ''} ${active.last_name || ''}`.trim()}</div>
                    {(active.product_title || active.service_title) && (
                      <div className="chat-header-sub">Re: {active.product_title || active.service_title}</div>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="chat-messages">
                  {loadingMsgs ? (
                    <div style={{ textAlign:'center', padding:32 }}><div className="spinner" /></div>
                  ) : messages.length === 0 ? (
                    <div className="chat-empty">
                      <div style={{ fontSize:'2rem' }}>👋</div>
                      <div style={{ fontWeight:700, color:'#374151' }}>Say hello!</div>
                      <div style={{ fontSize:'0.8rem' }}>Start the conversation below.</div>
                    </div>
                  ) : messages.map(m => {
                    const mine = String(m.sender_id) === String(user?.id);
                    return (
                      <div key={m.id} className={`msg-wrap ${mine ? 'mine' : ''}`}>
                        <div>
                          <div className={`msg-bubble ${mine ? 'mine' : 'theirs'} ${m.optimistic ? 'optimistic' : ''}`}>
                            {m.content}
                          </div>
                          <div className={`msg-time ${mine ? 'mine' : 'theirs'}`}>
                            {timeAgo(m.created_at)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                {/* Error bar */}
                {error && (
                  <div className="error-bar">
                    {error} <button onClick={() => setError('')} style={{ background:'none', color:'#dc2626', fontWeight:800, marginLeft:8 }}>✕</button>
                  </div>
                )}

                {/* Input */}
                <div className="chat-input-wrap">
                  <textarea
                    ref={inputRef}
                    className="chat-input"
                    placeholder="Type a message..."
                    value={newMsg}
                    onChange={e => setNewMsg(e.target.value)}
                    onKeyDown={handleKey}
                    rows={1}
                  />
                  <button className="send-btn" onClick={sendMessage} disabled={sending || !newMsg.trim()}>
                    {sending
                      ? <div style={{ width:16, height:16, border:'2px solid rgba(255,255,255,0.35)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.65s linear infinite' }} />
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    }
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ width:32, height:32, border:'3px solid #e5e7eb', borderTopColor:'#1f8f43', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
      </div>
    }>
      <MessagesInner />
    </Suspense>
  );
}