'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from '../app/lib/SessionProvider';
import { API_BASE } from '../app/lib/endpoints';

async function request(path, options = {}) {
  const headers = { Authorization: 'Bearer ' + localStorage.getItem('token') };
  if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const response = await fetch(API_BASE + '/messages' + path, { ...options, headers, cache: 'no-store' });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) window.dispatchEvent(new Event('afriplate:session-cleared'));
    throw new Error(data.message || 'Messaging is unavailable. Please try again.');
  }
  return options.download ? response.blob() : response.json();
}
const merge = (previous, incoming) => Array.from(new Map([...previous, ...incoming].map(message => [message.id, message])).values()).sort((a,b) => a.id - b.id);
function Avatar({ name = '' }) {
  return <span className="chat-avatar">{name.charAt(0).toUpperCase() || 'U'}<style jsx>{`.chat-avatar{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#1f8f43,#4ade80);color:white;font-weight:800;flex-shrink:0}`}</style></span>;
}
export default function PrivateMessages({ embedded = false }) {
  const { user, status, refresh } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const to = params.get('to'), product = params.get('product_id'), service = params.get('service_id');
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const generation = useRef(0), pendingSend = useRef(null), bottom = useRef(null);
  const activeId = active?.id;
  const invalidate = useCallback(() => { generation.current++; }, []);
  const loadConversations = useCallback(async () => {
    const data = await request('');
    setConversations(data.conversations || []);
  }, []);
  useEffect(() => {
    if (status !== 'guest') return;
    const context = new URLSearchParams();
    if (to) context.set('to', to);
    if (product) context.set('product_id', product);
    if (service) context.set('service_id', service);
    router.replace('/login?next=' + encodeURIComponent('/messages' + (context.size ? '?' + context : '')));
  }, [status, router, to, product, service]);
  useEffect(() => {
    if (status !== 'authenticated') return;
    let cancelled = false;
    const start = async () => {
      try {
        await loadConversations();
        if (to) {
          if (Number(to) === user.id) throw new Error('You cannot message yourself');
          const data = await request('/conversations', { method: 'POST', body: JSON.stringify({ seller_id: to, product_id: product || undefined, service_id: service || undefined }) });
          if (!cancelled) { setActive({ ...data.conversation, user_id: Number(to) }); await loadConversations(); }
        }
      } catch (problem) { if (!cancelled) setError(problem.message); }
      finally { if (!cancelled) setLoading(false); }
    };
    start();
    const timer = setInterval(() => loadConversations().catch(() => {}), 5000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [status, user?.id, to, product, service, loadConversations]);
  useEffect(() => {
    if (!activeId || status !== 'authenticated') return;
    const version = ++generation.current;
    const fetchMessages = async () => {
      try {
        const data = await request('/conversations/' + activeId + '/messages');
        if (version !== generation.current) return;
        setMessages(previous => merge(previous, data.messages || []));
        setHasMore(data.has_more === true);
        setConversations(previous => previous.map(conversation => conversation.id === activeId ? { ...conversation, unread: 0 } : conversation));
      } catch (problem) { if (version === generation.current) setError(problem.message); }
    };
    fetchMessages(); const timer = setInterval(fetchMessages, 5000);
    return () => { invalidate(); clearInterval(timer); };
  }, [activeId, status, invalidate]);
  useEffect(() => { bottom.current?.scrollIntoView({ block: 'nearest' }); }, [messages.length]);
  const open = conversation => {
    invalidate(); setActive(conversation); setMessages([]); setText(''); setAttachments([]); setHasMore(false); setError(''); pendingSend.current = null;
  };
  const send = async () => {
    if (sending || uploading || !activeId || (!text.trim() && !attachments.length)) return;
    const version = generation.current;
    const payload = { conversation_id: activeId, content: text.trim(), attachment_ids: attachments.map(file => file.id) };
    const fingerprint = JSON.stringify(payload);
    if (pendingSend.current?.fingerprint !== fingerprint) pendingSend.current = { fingerprint, id: crypto.randomUUID() };
    setSending(true); setError('');
    try {
      const data = await request('', { method: 'POST', body: JSON.stringify({ ...payload, client_id: pendingSend.current.id }) });
      if (generation.current === version) { setMessages(previous => merge(previous, [data.message])); setText(''); setAttachments([]); pendingSend.current = null; await loadConversations(); }
    } catch (problem) { if (generation.current === version) setError(problem.message); }
    finally { setSending(false); }
  };
  const attach = async event => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file || !activeId) return;
    if (file.size > 5242880 || attachments.length >= 3 || !['image/png','image/jpeg','application/pdf'].includes(file.type)) { setError('Choose up to three PNG, JPEG or PDF files, each no larger than 5 MB.'); return; }
    const version = generation.current;
    setUploading(true); setError('');
    try {
      const form = new FormData(); form.append('file', file);
      const data = await request('/conversations/' + activeId + '/attachments', { method: 'POST', body: form });
      if (version === generation.current) setAttachments(previous => [...previous, data.attachment]);
    } catch (problem) { if (version === generation.current) setError(problem.message); }
    finally { setUploading(false); }
  };
  const download = async file => {
    try {
      const blob = await request('/attachments/' + file.id, { download: true });
      const url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url; link.download = file.filename; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (problem) { setError(problem.message); }
  };
  const older = async () => {
    if (!messages.length || loadingOlder) return;
    const version = generation.current; setLoadingOlder(true);
    try {
      const data = await request('/conversations/' + activeId + '/messages?before_id=' + messages[0].id);
      if (version === generation.current) { setMessages(previous => merge(data.messages || [], previous)); setHasMore(data.has_more === true); }
    } catch (problem) { setError(problem.message); }
    finally { setLoadingOlder(false); }
  };
  if (status === 'checking') return <p role="status">Checking your account...</p>;
  if (status === 'unavailable') return <p role="alert">Your session could not be verified. <button onClick={refresh}>Try again</button></p>;
  if (status !== 'authenticated') return null;
  const current = conversations.find(conversation => conversation.id === activeId) || active;
  return <section className={'page private-messages ' + (embedded ? 'embedded ' : '') + (active ? 'chat-open' : '')}>
    {!embedded && <nav className="nav"><Link href="/" className="brand">Afri<span>Plate</span></Link><Link href="/dashboard" className="nav-back">Dashboard</Link></nav>}
    <div className="body">
      <aside className="convo-panel" aria-label="Conversations"><div className="convo-header"><h2>Messages</h2></div><div className="convo-list">
        {loading ? <p className="empty-convos" role="status">Loading conversations...</p> : conversations.length === 0 ? <p className="empty-convos">No messages yet. Message a seller from a listing.</p> : conversations.map(conversation => <button key={conversation.id} className={'convo-item ' + (activeId === conversation.id ? 'active' : '')} onClick={() => open(conversation)}><Avatar name={conversation.name || conversation.first_name}/><span className="convo-info"><strong className="convo-name">{conversation.name || conversation.first_name || 'Marketplace member'}</strong><span className="convo-last">{conversation.product_title || conversation.service_title || conversation.last_message || 'New conversation'}</span></span>{conversation.unread > 0 && <span className="unread-badge" aria-label={conversation.unread + ' unread messages'}>{conversation.unread}</span>}</button>)}
      </div></aside>
      <div className="chat-panel">
        {!active ? <p className="chat-placeholder">Select a conversation to start messaging.</p> : <>
          <div className="chat-header"><button className="mobile-back" onClick={() => { invalidate(); setActive(null); }}>Back</button><Avatar name={current?.name || current?.first_name}/><div><strong className="chat-header-name">{current?.name || current?.first_name || 'Conversation'}</strong><p className="chat-header-sub">{current?.product_title || current?.service_title || ''}</p></div></div>
          <div className="chat-messages" aria-label="Message history">{hasMore && <button onClick={older} disabled={loadingOlder}>Load older messages</button>}{!messages.length && <p className="chat-empty">Start the conversation below.</p>}{messages.map(message => <article key={message.id} className={'msg-wrap ' + (message.sender_id === user.id ? 'mine' : '')}><div className="message-content"><div className={'msg-bubble ' + (message.sender_id === user.id ? 'mine' : 'theirs')}>{message.content}{(message.attachments || []).map(file => <button className="attachment-download" key={file.id} onClick={() => download(file)}>Download {file.filename}</button>)}</div><div className="message-date">{new Date(message.created_at).toLocaleString('en-NG')}{message.sender_id === user.id && message.is_read ? ' | Read' : ''}</div></div></article>)}<div ref={bottom}/></div>
          {attachments.length > 0 && <div className="attached-files">{attachments.map(file => <span key={file.id}>{file.filename}<button aria-label={'Remove ' + file.filename} onClick={() => setAttachments(previous => previous.filter(item => item.id !== file.id))}> ?</button></span>)}</div>}
          <div className="chat-input-wrap"><label className="attach-button">Attach<input aria-label="Attach a file" type="file" accept="image/png,image/jpeg,application/pdf" onChange={attach} disabled={sending || uploading || attachments.length >= 3}/></label><textarea aria-label="Message" className="chat-input" value={text} maxLength={4000} onChange={event => setText(event.target.value)} placeholder="Type a message..." onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send(); } }}/><button className="send-btn" onClick={send} disabled={sending || uploading || (!text.trim() && !attachments.length)}>{uploading ? 'Uploading...' : sending ? 'Sending...' : 'Send'}</button></div>
        </>}
      </div>
    </div>
    {error && <p role="alert" className="error-bar">{error}</p>}
    <style jsx>{`
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

      .page{height:100dvh;min-width:0}.body{min-height:0;min-width:0}.embedded{height:min(640px,calc(100dvh - 190px));min-height:350px}
      .convo-item{width:100%;text-align:left;background:#fff;border-top:0;border-right:0;border-bottom:1px solid #f3f4f6;font:inherit}.convo-name,.convo-last{display:block}.convo-panel{width:280px}.chat-panel{display:flex}.convo-panel{display:flex}.message-content{max-width:85%;min-width:0}.msg-bubble{max-width:100%;white-space:pre-wrap;overflow-wrap:anywhere}.message-date{font-size:.65rem;color:#6b7280;margin-top:4px}.chat-header p{margin:3px 0 0}.chat-input{min-width:0}.send-btn{width:auto;min-width:48px;font-weight:700;padding:10px}.attachment-download{display:block;background:#fff;color:#1f8f43;border:1px solid #d1d5db;border-radius:8px;padding:6px;margin-top:6px;max-width:100%;overflow-wrap:anywhere;cursor:pointer}.attached-files{padding:8px;display:flex;flex-wrap:wrap;gap:6px;font-size:.75rem}.attached-files span{background:#eef9f1;padding:6px;border-radius:8px}.attached-files button{background:none;border:0;cursor:pointer}.attach-button{font-size:.72rem;font-weight:700;color:#1f8f43;cursor:pointer}.attach-button input{display:block;width:55px;font-size:0}.attach-button input::file-selector-button{font-size:10px;border:0;background:#eef9f1;padding:3px}.error-bar{margin:0;flex-shrink:0}.private-messages a{text-decoration:none}.private-messages button{cursor:pointer}
      @media(max-width:767px){.page{height:calc(100dvh - 70px - env(safe-area-inset-bottom,0px))}.embedded{height:calc(100dvh - 190px - env(safe-area-inset-bottom,0px))}}
      @media(max-width:640px){.body{padding:10px}.convo-panel{width:100%}.chat-panel{display:none}.chat-open .convo-panel{display:none}.chat-open .chat-panel{display:flex}.mobile-back{display:block}.chat-input-wrap{padding:10px;gap:8px}}
    `}</style>
  </section>;
}
