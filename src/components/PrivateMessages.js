'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { conversationLabel } from '../app/lib/conversationLabel';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from '../app/lib/SessionProvider';
import PublicSeller,{PublicAvatar} from './PublicSeller';
import {chatServiceOwner} from '../app/lib/publicSeller';
import {ServiceOfferCard,ServiceOfferComposer} from './ServiceOffers';
import {createClientId} from '../app/lib/clientId';
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
const mergeMessage=(old,message)=>({...old,...message,is_read:!!(old?.is_read||message.is_read),...(old?.service_offer&&(!message.service_offer||old.service_offer.version>message.service_offer.version)?{service_offer:old.service_offer}:{})});
const merge=(previous,incoming)=>{const rows=new Map(previous.map(m=>[m.id,m]));for(const m of incoming){if(!m||m.hidden_for_me)continue;rows.set(m.id,mergeMessage(rows.get(m.id),m));}return [...rows.values()].sort((a,b)=>a.id-b.id);};
const revision=value=>/^\d+$/.test(String(value??'0'))?BigInt(value??'0'):0n;
function Avatar({ name = '' }) {
  return <span className="chat-avatar">{name.charAt(0).toUpperCase() || 'U'}<style jsx>{`.chat-avatar{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#1f8f43,#4ade80);color:white;font-weight:800;flex-shrink:0}`}</style></span>;
}
export default function PrivateMessages({embedded=false,orderId=null}) {
  const {user,status,refresh}=useSession();
  const router=useRouter(),params=useSearchParams();
  const to=params.get('to'),product=params.get('product_id'),service=params.get('service_id');
  const [conversations,setConversations]=useState([]),[active,setActive]=useState(null),[messages,setMessages]=useState([]);
  const [text,setText]=useState(''),[attachments,setAttachments]=useState([]),[error,setError]=useState(''),[syncError,setSyncError]=useState(''),[notice,setNotice]=useState('');
  const [loading,setLoading]=useState(true),[historyLoading,setHistoryLoading]=useState(false),[sending,setSending]=useState(false),[uploading,setUploading]=useState(false),[hasMore,setHasMore]=useState(false),[loadingOlder,setLoadingOlder]=useState(false),[viewerId,setViewerId]=useState(null);
  const [menu,setMenu]=useState(null),[deleteTarget,setDeleteTarget]=useState(null),[deleting,setDeleting]=useState(false),[deleteError,setDeleteError]=useState('');
  const generation=useRef(0),pendingSend=useRef(null),bottom=useRef(null),alive=useRef(true),owner=useRef(null),startedContext=useRef(null),inboxRequest=useRef(0);
  const activeRef=useRef(null),messagesRef=useRef([]),versions=useRef(new Map()),olderLoaded=useRef(false),sessionRef=useRef({}),sendLock=useRef(false),uploadLock=useRef(false),deleteLock=useRef(false),deleteController=useRef(null),dialog=useRef(null),cancelDelete=useRef(null),actionTrigger=useRef(null),historyPanel=useRef(null);
  sessionRef.current={status,userId:user?.id};
  const operation=useRef({send:0,upload:0,remove:0,older:0}),inboxDigest=useRef(null),startEpoch=useRef(0);
  const activeId=active?.id;
  const invalidate=useCallback(()=>{generation.current++;},[]);
  const putMessages=useCallback(value=>{const rows=typeof value==='function'?value(messagesRef.current):value;messagesRef.current=rows;setMessages(rows);},[]);
  const valid=useCallback((version,conversationId)=>alive.current&&version===generation.current&&sessionRef.current.status==='authenticated'&&sessionRef.current.userId===owner.current&&(conversationId==null||activeRef.current?.id===conversationId),[]);
  const filterConversations=useCallback(rows=>rows.filter(c=>!orderId||c.order_id===Number(orderId)),[orderId]);
  const announceChange=useCallback(unread=>window.dispatchEvent(new CustomEvent('afriplate:messages-changed',{detail:{user_id:owner.current,...(Number.isSafeInteger(unread)?{unread}:{})}})),[]);
  const loadConversations=useCallback(async()=>{
    const ticket=++inboxRequest.current,viewer=owner.current;
    const data=await request('');
    if(!Array.isArray(data.conversations))throw Error('The inbox response was incomplete. Please refresh.');
    if(alive.current&&sessionRef.current.status==='authenticated'&&sessionRef.current.userId===viewer&&owner.current===viewer&&ticket===inboxRequest.current&&!data.conversations.some(c=>revision(c.visibility_version)<(versions.current.get(c.id)||0n))){setConversations(filterConversations(data.conversations));setSyncError('');const digest=JSON.stringify(data.conversations.map(c=>[c.id,c.last_message_id,c.visibility_version,c.unread]));if(digest!==inboxDigest.current){inboxDigest.current=digest;announceChange(data.conversations.reduce((sum,c)=>sum+c.unread,0));}}
  },[filterConversations,announceChange]);
  // A newer personal-deletion revision invalidates cached pages. At the same
  // revision, preserve saved messages newer than an older deletion snapshot.
  const applyHistory=useCallback((data,conversationId,{replace=false,older=false}={})=>{
    if(!Array.isArray(data.messages))throw Error('Message history was incomplete. Please refresh.');
    const next=revision(data.visibility_version),known=versions.current.get(conversationId)||0n;
    if(next<known)return false;
    const changed=next>known;
    versions.current.set(conversationId,next);
    if(replace||changed){const newer=replace&&!changed&&Number.isSafeInteger(data.snapshot_last_id)?messagesRef.current.filter(m=>m.id>data.snapshot_last_id):[];const previous=new Map(messagesRef.current.map(m=>[m.id,m]));putMessages(merge(data.messages.map(m=>mergeMessage(previous.get(m.id),m)),newer));olderLoaded.current=false;setHasMore(data.has_more===true);}
    else {putMessages(previous=>merge(previous,data.messages));if(older||!olderLoaded.current)setHasMore(data.has_more===true);}
    if(older&&!changed)olderLoaded.current=true;
    if(data.conversation_context&&activeRef.current?.id===conversationId){const next={...activeRef.current,...data.conversation_context};activeRef.current=next;setActive(next);}
    return true;
  },[putMessages]);
  const readLatest=useCallback(async(conversationId,version=generation.current)=>{
    const data=await request('/conversations/'+conversationId+'/messages');
    if(!valid(version,conversationId))return;
    if(applyHistory(data,conversationId)){setHistoryLoading(false);setSyncError('');if(data.read_count>0){announceChange();await loadConversations();}}
  },[valid,applyHistory,announceChange,loadConversations]);
  const open=useCallback(conversation=>{
    if(activeRef.current?.id===conversation.id)return;
    startEpoch.current++;invalidate();activeRef.current=conversation;setActive(conversation);putMessages([]);setText('');setAttachments([]);setHasMore(false);olderLoaded.current=false;setHistoryLoading(true);setError('');setSyncError('');setNotice('');setMenu(null);setDeleteTarget(null);pendingSend.current=null;
  },[invalidate,putMessages]);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;generation.current++;deleteController.current?.abort();};},[]);
  useEffect(()=>{
    if(status!=='guest')return;
    invalidate();owner.current=null;startedContext.current=null;versions.current.clear();activeRef.current=null;setActive(null);putMessages([]);setConversations([]);setText('');setAttachments([]);setViewerId(null);setDeleteTarget(null);pendingSend.current=null;
    if(orderId){router.replace('/login?next='+encodeURIComponent('/orders/'+orderId));return;}
    const context=new URLSearchParams();if(to)context.set('to',to);if(product)context.set('product_id',product);if(service)context.set('service_id',service);
    router.replace('/login?next='+encodeURIComponent('/messages'+(context.size?'?'+context:'')));
  },[status,router,to,product,service,orderId,invalidate,putMessages]);
  useEffect(()=>{
    if(status!=='authenticated')return;
    const changedOwner=owner.current!==user.id;
    const contextKey=JSON.stringify([user.id,orderId,to,product,service]);
    const prepare=changedOwner||startedContext.current!==contextKey;
    if(changedOwner){owner.current=user.id;inboxDigest.current=null;operation.current.send++;operation.current.upload++;operation.current.remove++;operation.current.older++;setLoadingOlder(false);deleteController.current?.abort();sendLock.current=false;uploadLock.current=false;deleteLock.current=false;setSending(false);setUploading(false);setDeleting(false);versions.current.clear();setConversations([]);setError('');setNotice('');}
    if(prepare){invalidate();activeRef.current=null;setActive(null);putMessages([]);setText('');setAttachments([]);setDeleteTarget(null);setMenu(null);pendingSend.current=null;olderLoaded.current=false;setHasMore(false);}
    if(!to&&!orderId)startedContext.current=contextKey;setViewerId(user.id);setLoading(true);
    let cancelled=false;const ticket=++startEpoch.current;
    const currentStart=()=>!cancelled&&ticket===startEpoch.current&&owner.current===user.id&&sessionRef.current.status==='authenticated'&&sessionRef.current.userId===user.id;
    const start=async()=>{
      try{
        await loadConversations();
        if(!currentStart())return;
        if(prepare&&(to||orderId)){
          if(!orderId&&Number(to)===user.id)throw Error('You cannot message yourself');
          const data=await request('/conversations',{method:'POST',body:JSON.stringify(orderId?{order_id:Number(orderId)}:{seller_id:to,product_id:product||undefined,service_id:service||undefined})});
          if(currentStart()){startedContext.current=contextKey;open(data.conversation);}
        }
      }catch(problem){if(!cancelled&&sessionRef.current.userId===user.id)setSyncError(problem.message);}
      finally{if(!cancelled)setLoading(false);}
    };
    const sync=()=>{loadConversations().catch(problem=>{if(!cancelled)setSyncError(problem.message);});const conversationId=activeRef.current?.id;if(conversationId){const version=generation.current;readLatest(conversationId,version).catch(problem=>{if(valid(version,conversationId))setSyncError(problem.message);});}};
    start();const timer=setInterval(()=>loadConversations().catch(problem=>{if(!cancelled)setSyncError(problem.message);}),5000);window.addEventListener('focus',sync);
    return()=>{cancelled=true;clearInterval(timer);window.removeEventListener('focus',sync);inboxRequest.current++;invalidate();};
  },[status,user?.id,to,product,service,orderId,loadConversations,readLatest,open,valid,invalidate,putMessages]);
  useEffect(()=>{
    if(!activeId||status!=='authenticated'||viewerId!==user.id)return;
    const version=++generation.current;setHistoryLoading(true);
    const poll=()=>readLatest(activeId,version).catch(problem=>{if(valid(version,activeId)){setSyncError(problem.message);setHistoryLoading(false);}});
    poll();const timer=setInterval(poll,5000);
    return()=>{clearInterval(timer);invalidate();};
  },[activeId,status,user?.id,viewerId,readLatest,valid,invalidate]);
  useEffect(()=>{bottom.current?.scrollIntoView({block:'nearest'});},[messages[messages.length-1]?.id]);
  useEffect(()=>{
    if(menu==null)return;
    document.getElementById('message-menu-'+menu)?.querySelector('button')?.focus({preventScroll:true});
    const outside=e=>{if(!e.target.closest?.('[data-message-actions]'))setMenu(null);};
    const escape=e=>{if(e.key==='Escape'){setMenu(null);actionTrigger.current?.focus();}};
    document.addEventListener('pointerdown',outside);document.addEventListener('focusin',outside);document.addEventListener('keydown',escape);
    return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('focusin',outside);document.removeEventListener('keydown',escape);};
  },[menu]);
  useEffect(()=>{
    if(!deleteTarget)return;
    cancelDelete.current?.focus();
    const key=e=>{
      if(e.key==='Escape'&&!deleteLock.current){e.preventDefault();setDeleteTarget(null);setDeleteError('');if(actionTrigger.current?.isConnected)actionTrigger.current.focus();}
      if(e.key==='Tab'){
        const buttons=[...dialog.current.querySelectorAll('button:not(:disabled)')];
        if(!buttons.length){e.preventDefault();return;}
        const first=buttons[0],last=buttons[buttons.length-1];
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
      }
    };
    document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key);
  },[deleteTarget]);
  const send=async()=>{
    if(sendLock.current||uploadLock.current||!activeId||(!text.trim()&&!attachments.length))return;
    const version=generation.current,conversationId=activeId,ticket=++operation.current.send;
    const payload={conversation_id:conversationId,content:text.trim(),attachment_ids:attachments.map(file=>file.id)},fingerprint=JSON.stringify(payload);
    sendLock.current=true;setSending(true);setError('');setNotice('');
    try{
      if(pendingSend.current?.fingerprint!==fingerprint)pendingSend.current={fingerprint,id:createClientId()};
      const data=await request('',{method:'POST',body:JSON.stringify({...payload,client_id:pendingSend.current.id})});
      if(!data.message?.id)throw Error('Sending could not be confirmed. Retry without changing the message.');
      if(valid(version,conversationId)){
        const next=revision(data.message.visibility_version),known=versions.current.get(conversationId)||0n;
        if(next>=known){if(next>known){putMessages([]);olderLoaded.current=false;setHasMore(false);setHistoryLoading(true);}versions.current.set(conversationId,next);if(data.message.hidden_for_me)putMessages(previous=>previous.filter(m=>m.id!==data.message.id));else putMessages(previous=>merge(previous,[data.message]));}
        setText('');setAttachments([]);pendingSend.current=null;
        if(data.message.hidden_for_me)setNotice('This message was already sent and is deleted for you.');
        announceChange();
        try{await readLatest(conversationId,version);await loadConversations();}catch(problem){if(valid(version,conversationId))setSyncError('Your message was saved, but refreshed history could not load. '+problem.message);}
      }
    }catch(problem){if(valid(version,conversationId))setError(problem.message);}
    finally{if(ticket===operation.current.send){sendLock.current=false;if(alive.current)setSending(false);}}
  };
  const offerChanged=async data=>{
    const conversationId=activeRef.current?.id,version=generation.current;
    if(!conversationId||!valid(version,conversationId))return;
    if(data.message&&typeof data.message==='object'&&data.message.conversation_id!==conversationId)return;
    if(data.offer&&data.offer.conversation_id!==conversationId)return;
    if(data.message&&typeof data.message==='object'){
      const next=revision(data.message.visibility_version),known=versions.current.get(conversationId)||0n;
      if(next>=known){if(next>known){putMessages([]);olderLoaded.current=false;}versions.current.set(conversationId,next);if(!data.message.hidden_for_me)putMessages(previous=>merge(previous,[data.message]));}
    }
    if(data.offer)putMessages(previous=>previous.map(m=>m.service_offer_id===data.offer.id?mergeMessage(m,{...m,service_offer:data.offer}):m));
    setNotice(data.offer_status==='accepted'?'Offer accepted. No payment has been taken.':typeof data.message==='string'?data.message:data.replay?'Offer already sent.':'Offer sent. No payment has been taken.');announceChange();
    try{await readLatest(conversationId,version);await loadConversations();}catch(problem){if(valid(version,conversationId))setSyncError('The offer action was saved, but the conversation could not refresh. '+problem.message);}
  };
  const attach=async event=>{
    const file=event.target.files?.[0];event.target.value='';
    if(!file||!activeId||uploadLock.current||sendLock.current)return;
    if(file.size>5242880||attachments.length>=3||!['image/png','image/jpeg','application/pdf'].includes(file.type)){setError('Choose up to three PNG, JPEG or PDF files, each no larger than 5 MB.');return;}
    const version=generation.current,conversationId=activeId,ticket=++operation.current.upload;uploadLock.current=true;setUploading(true);setError('');
    try{const form=new FormData();form.append('file',file);const data=await request('/conversations/'+conversationId+'/attachments',{method:'POST',body:form});if(valid(version,conversationId))setAttachments(previous=>[...previous,data.attachment]);}
    catch(problem){if(valid(version,conversationId))setError(problem.message);}
    finally{if(ticket===operation.current.upload){uploadLock.current=false;if(alive.current)setUploading(false);}}
  };
  const download=async file=>{
    const version=generation.current;
    try{const blob=await request('/attachments/'+file.id,{download:true});if(!valid(version))return;const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=file.filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
    catch(problem){if(valid(version))setError(problem.message);}
  };
  const older=async()=>{
    if(!messagesRef.current.length||loadingOlder)return;
    const version=generation.current,conversationId=activeId,ticket=++operation.current.older;setLoadingOlder(true);
    try{
      const data=await request('/conversations/'+conversationId+'/messages?before_id='+messagesRef.current[0].id);
      if(valid(version,conversationId)){
        const changed=revision(data.visibility_version)>(versions.current.get(conversationId)||0n);
        const applied=applyHistory(data,conversationId,{older:true});
        if(applied&&changed){setNotice('Message visibility changed on another device. Refreshing the latest history.');await readLatest(conversationId,version);}
        if(data.read_count>0){announceChange();await loadConversations();}
      }
    }catch(problem){if(valid(version,conversationId))setError(problem.message);}
    finally{if(alive.current&&ticket===operation.current.older)setLoadingOlder(false);}
  };
  const confirmDelete=async()=>{
    if(!deleteTarget||deleteLock.current)return;
    const target=deleteTarget,version=generation.current,ticket=++operation.current.remove;deleteLock.current=true;setDeleting(true);setDeleteError('');
    const controller=new AbortController();deleteController.current=controller;const timer=setTimeout(()=>controller.abort(),30000);
    try{
      const data=await request('/conversations/'+target.conversationId+'/messages/'+target.id,{method:'DELETE',signal:controller.signal});
      if(data.deleted_for_me!==true||data.message_id!==target.id||!Array.isArray(data.conversations)||!Array.isArray(data.messages))throw Error('Deletion could not be confirmed. Please retry.');
      if(valid(version,target.conversationId)){
        const newerKnown=revision(data.visibility_version)===(versions.current.get(target.conversationId)||0n)&&Number.isSafeInteger(data.snapshot_last_id)&&messagesRef.current.some(m=>m.id>data.snapshot_last_id);
        const applied=applyHistory(data,target.conversationId,{replace:true});
        if(applied&&!newerKnown){inboxRequest.current++;setConversations(filterConversations(data.conversations));announceChange(data.unread);}
        else{announceChange();loadConversations().catch(problem=>{if(valid(version,target.conversationId))setSyncError(problem.message);});}
        setDeleteTarget(null);setMenu(null);setError('');setNotice(messagesRef.current.length?'Message deleted for you.':'Message deleted for you. This thread is hidden from your inbox until another message is sent.');
        historyPanel.current?.focus({preventScroll:true});
      }
    }catch(problem){if(valid(version,target.conversationId))setDeleteError(problem.name==='AbortError'?'Deletion could not be confirmed. Retry; this action only affects your account.':problem.message);}
    finally{clearTimeout(timer);if(ticket===operation.current.remove){deleteController.current=null;deleteLock.current=false;if(alive.current)setDeleting(false);}}
  };
  if(status==='checking')return <p role="status">Checking your account...</p>;
  if(status==='unavailable')return <p role="alert">Your session could not be verified. <button onClick={refresh}>Try again</button></p>;
  if(status!=='authenticated')return null;
  if(viewerId!==user.id)return <p role="status">Loading your private inbox...</p>;
  // History carries private offer context; inbox summaries must not mask it.
  const current=active?{...(conversations.find(c=>c.id===activeId)||{}),...active}:null;
  return <section className={'page private-messages '+(embedded?'embedded ':'')+(active?'chat-open':'')}>
    {!embedded&&<nav className="nav"><Link href="/" className="brand">Afri<span>Plate</span></Link><Link href="/dashboard" className="nav-back">Dashboard</Link></nav>}
    <div className="body" inert={deleteTarget?true:undefined}>
      <aside className="convo-panel" aria-label="Conversations"><div className="convo-header"><h2>Messages</h2></div><div className="convo-list">
        {loading?<p className="empty-convos" role="status">Loading conversations...</p>:!conversations.length?<p className="empty-convos">No messages yet. A conversation appears here after a message is sent.</p>:conversations.map(c=><button key={c.id} className={'convo-item '+(activeId===c.id?'active':'')} onClick={()=>open(c)}><PublicAvatar name={c.name||c.first_name} src={c.avatar}/><span className="convo-info"><strong className="convo-name">{c.name||c.first_name||'Marketplace member'}</strong><span className="convo-context">{conversationLabel(c)}</span><span className="convo-last">{c.last_message_sender_id===user.id?'You: ':''}{c.last_message}</span></span>{c.unread>0&&<span className="unread-badge" aria-label={c.unread+' unread messages'}>{c.unread}</span>}</button>)}
      </div></aside>
      <div className="chat-panel">
        {!active?<p className="chat-placeholder">Select a conversation to start messaging.</p>:<>
          <div className="chat-header"><button className="mobile-back" onClick={()=>{startEpoch.current++;invalidate();activeRef.current=null;setActive(null);setMenu(null);}}>Back</button>
            {current?.service_owner_id?<div className="service-chat-byline"><PublicSeller seller={chatServiceOwner(current)} compact/><p className="chat-header-sub">{conversationLabel(current)}{user.id===current.service_owner_id?' | With '+(current.name||current.first_name||'buyer'):''}</p></div>:<><Avatar name={current?.name||current?.first_name}/><div><strong className="chat-header-name">{current?.name||current?.first_name||'Conversation'}</strong><p className="chat-header-sub">{conversationLabel(current)}</p></div></>}
            {current?.offer_context&&<ServiceOfferComposer key={user.id+':'+activeId} context={current.offer_context} user={user} conversationId={activeId} request={request} onChanged={offerChanged} disabled={!!deleteTarget||sending}/>}
          </div>
          {current?.offer_context?.accepted_orders?.length>0&&<div className="service-offer-orders"><strong>Agreed orders (kept separately from messages)</strong><div>{current.offer_context.accepted_orders.map(offer=><Link href={'/orders/'+offer.order_id} key={offer.id}>Order #{offer.order_id} - {offer.title_snapshot}</Link>)}</div></div>}
          <div ref={historyPanel} tabIndex={-1} className="chat-messages" aria-label="Message history">{hasMore&&<button onClick={older} disabled={loadingOlder}>{loadingOlder?'Loading earlier messages...':'Load older messages'}</button>}{!messages.length&&<p className="chat-empty" role="status">{historyLoading?'Loading conversation...':'No visible messages. A draft or upload stays private until you press Send.'}</p>}{messages.map(message=><article key={message.id} className={'msg-wrap '+(message.sender_id===user.id?'mine':'')+(message.service_offer?' service-offer-message':'')}><div className="message-content"><div className={'msg-bubble '+(message.sender_id===user.id?'mine':'theirs')}>{message.service_offer?<ServiceOfferCard key={message.service_offer.id} offer={message.service_offer} user={user} request={request} onChanged={offerChanged} conversationId={activeId}/>:message.content}{(message.attachments||[]).map(file=><button className="attachment-download" key={file.id} onClick={()=>download(file)}>Download {file.filename}</button>)}</div><div className="message-footer"><span className="message-date">{new Date(message.created_at).toLocaleString('en-NG')}{message.sender_id===user.id&&message.is_read?' | Read':''}</span><div className="message-actions" data-message-actions><button type="button" className="message-menu-button" aria-label="Message actions" aria-haspopup="menu" aria-expanded={menu===message.id} aria-controls={'message-menu-'+message.id} onClick={e=>{actionTrigger.current=e.currentTarget;setMenu(menu===message.id?null:message.id);}}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg></button>{menu===message.id&&<div className="message-action-menu" id={'message-menu-'+message.id} role="menu"><button type="button" role="menuitem" onClick={()=>{setMenu(null);setDeleteError('');setDeleteTarget({id:message.id,conversationId:activeId,isOffer:!!message.service_offer});}}>Delete for me</button></div>}</div></div></div></article>)}<div ref={bottom}/></div>
          {attachments.length>0&&<div className="attached-files">{attachments.map(file=><span key={file.id}>{file.filename}<button type="button" disabled={sending} aria-label={'Remove '+file.filename} onClick={()=>setAttachments(previous=>previous.filter(item=>item.id!==file.id))}>Remove</button></span>)}</div>}
          <div className="chat-input-wrap"><label className="attach-button">{uploading?'Uploading...':'Attach'}<input aria-label="Attach a file" type="file" accept="image/png,image/jpeg,application/pdf" onChange={attach} disabled={sending||uploading||attachments.length>=3}/></label><textarea aria-label="Message" className="chat-input" value={text} maxLength={4000} disabled={sending} onChange={event=>setText(event.target.value)} placeholder="Type a message..." onKeyDown={event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.nativeEvent.isComposing){event.preventDefault();send();}}}/><button type="button" className="send-btn" onClick={send} disabled={sending||uploading||(!text.trim()&&!attachments.length)}>{sending?'Sending...':'Send'}</button></div>
        </>}
      </div>
    </div>
    {(error||syncError)&&<p role="alert" className="error-bar">{error||syncError}</p>}
    {notice&&<p role="status" className="message-notice">{notice}</p>}
    {deleteTarget&&<div className="delete-dialog-backdrop"><section ref={dialog} role="alertdialog" aria-modal="true" aria-labelledby="delete-message-title" aria-describedby="delete-message-description" aria-busy={deleting} className="delete-dialog"><h2 id="delete-message-title">Delete for me?</h2><p id="delete-message-description">This hides the message and its attachments from your account. The other participant keeps their copy. This cannot be undone here.</p>{deleteTarget.isOffer&&<p>Deleting the chat card does not withdraw a pending offer or delete an agreed order. Order terms remain in the workspace.</p>}{deleteError&&<p role="alert" className="delete-error">{deleteError}</p>}<div className="delete-dialog-actions"><button ref={cancelDelete} type="button" disabled={deleting} onClick={()=>{setDeleteTarget(null);setDeleteError('');if(actionTrigger.current?.isConnected)actionTrigger.current.focus();}}>Cancel</button><button type="button" className="confirm-personal-delete" disabled={deleting} onClick={confirmDelete}>{deleting?'Deleting...':deleteError?'Retry delete':'Delete for me'}</button></div></section></div>}
    <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Inter',sans-serif; background:var(--ap-page-background, #f7f8fa); overflow:hidden; }
        a { text-decoration:none; color:inherit; }
        button { font-family:'Inter',sans-serif; cursor:pointer; border:none; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform:rotate(360deg); } }

        .page { display:flex; flex-direction:column; height:100vh; background:var(--ap-page-background, #f7f8fa); }

        /* TOP NAV */
        .nav { background:var(--ap-surface, #fff); border-bottom:1px solid var(--ap-border, #e5e7eb); padding:0 20px; height:60px; display:flex; align-items:center; justify-content:space-between; flex-shrink:0; z-index:10; }
        .brand { font-size:1.4rem; font-weight:900; color:var(--ap-text-strong, #111); letter-spacing:-0.04em; }
        .brand span { color:var(--ap-accent-text, #1f8f43); }
        .nav-back { display:flex; align-items:center; gap:6px; font-size:0.84rem; font-weight:700; color:var(--ap-text-muted, #6b7280); padding:7px 12px; background:var(--ap-surface-muted, #f3f4f6); border-radius:9px; }

        /* BODY */
        .body { display:flex; flex:1; overflow:hidden; max-width:1100px; width:100%; margin:0 auto; padding:20px; gap:16px; }

        /* CONVO LIST */
        .convo-panel { width:320px; flex-shrink:0; background:var(--ap-surface, #fff); border:1px solid var(--ap-border, #eceff3); border-radius:20px; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 2px 12px rgba(15,23,42,0.05); }
        .convo-header { padding:16px 18px; border-bottom:1px solid var(--ap-border, #f3f4f6); }
        .convo-header h2 { font-size:1rem; font-weight:900; color:var(--ap-text-strong, #111); }
        .convo-list { flex:1; overflow-y:auto; }
        .convo-item { padding:14px 18px; display:flex; align-items:center; gap:12px; cursor:pointer; border-bottom:1px solid var(--ap-surface-muted, #f9fafb); transition:background 0.15s; border-left:3px solid transparent; }
        .convo-item:hover { background:var(--ap-surface-muted, #f8fafc); }
        .convo-item.active { background:var(--ap-accent-surface, #f0fdf4); border-left-color:var(--ap-accent-border, #1f8f43); }
        .convo-info { flex:1; min-width:0; }
        .convo-name { font-size:0.875rem; font-weight:700; color:var(--ap-text-strong, #111); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:2px; }
        .convo-last { font-size:0.75rem; color:var(--ap-text-subtle, #9ca3af); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .convo-meta { display:flex; flex-direction:column; align-items:flex-end; gap:4px; flex-shrink:0; }
        .convo-time { font-size:0.68rem; color:var(--ap-text-subtle, #9ca3af); }
        .unread-badge { width:18px; height:18px; border-radius:50%; background:#1f8f43; color:#fff; font-size:0.62rem; font-weight:900; display:flex; align-items:center; justify-content:center; }
        .empty-convos { padding:48px 24px; text-align:center; color:var(--ap-text-subtle, #9ca3af); font-size:0.875rem; }

        /* CHAT PANEL */
        .chat-panel { flex:1; background:var(--ap-surface, #fff); border:1px solid var(--ap-border, #eceff3); border-radius:20px; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 2px 12px rgba(15,23,42,0.05); min-width:0; }
        .chat-header { padding:14px 18px; border-bottom:1px solid var(--ap-border, #f3f4f6); display:flex; align-items:center; gap:12px; flex-shrink:0; }
        .chat-header-info { flex:1; min-width:0; }
        .chat-header-name { font-size:0.95rem; font-weight:800; color:var(--ap-text-strong, #111); }
        .chat-header-sub { font-size:0.72rem; color:var(--ap-text-subtle, #9ca3af); margin-top:1px; }
        .mobile-back { display:none; background:none; padding:4px 8px; color:var(--ap-text-muted, #6b7280); font-size:0.84rem; font-weight:700; }

        .chat-messages { min-height:0; flex:1; overflow-y:auto; padding:16px 18px; display:flex; flex-direction:column; gap:10px; }
        .msg-wrap { display:flex; }
        .msg-wrap.mine { justify-content:flex-end; }
        .msg-bubble { max-width:70%; padding:10px 14px; border-radius:18px; font-size:0.875rem; line-height:1.5; animation:fadeUp 0.2s ease; }
        .msg-bubble.mine { background:#1f8f43; color:#fff; border-radius:18px 18px 4px 18px; }
        .msg-bubble.theirs { background:var(--ap-surface-muted, #f3f4f6); color:var(--ap-text-strong, #111); border-radius:18px 18px 18px 4px; }
        .msg-bubble.optimistic { opacity:0.65; }
        .msg-time { font-size:0.65rem; margin-top:4px; text-align:right; }
        .msg-time.mine { color:rgba(255,255,255,0.7); }
        .msg-time.theirs { color:var(--ap-text-subtle, #9ca3af); }

        .chat-empty { flex:1; display:flex; align-items:center; justify-content:center; flex-direction:column; gap:8px; color:var(--ap-text-subtle, #9ca3af); }
        .chat-placeholder { flex:1; display:flex; align-items:center; justify-content:center; flex-direction:column; gap:12px; color:var(--ap-text-subtle, #9ca3af); }

        .error-bar { background:var(--ap-danger-surface, #fef2f2); border:1px solid var(--ap-danger-border, #fecaca); color:var(--ap-danger-text, #dc2626); font-size:0.8rem; font-weight:600; padding:8px 16px; margin:0 18px 8px; border-radius:10px; }

        /* INPUT */
        .chat-input-wrap { min-width:0; padding:12px 16px; border-top:1px solid var(--ap-border, #f3f4f6); display:flex; gap:10px; align-items:flex-end; flex-shrink:0; }
        .chat-input { flex:1; padding:11px 14px; border:1.5px solid var(--ap-border, #e5e7eb); border-radius:14px; font-size:0.875rem; font-family:'Inter',sans-serif; outline:none; resize:none; max-height:120px; line-height:1.5; transition:border-color 0.2s; }
        .chat-input:focus { border-color:var(--ap-accent-border, #1f8f43); box-shadow:0 0 0 3px rgba(31,143,67,0.08); }
        .send-btn { width:42px; height:42px; border-radius:12px; background:#1f8f43; color:#fff; display:flex; align-items:center; justify-content:center; transition:all 0.18s; flex-shrink:0; }
        .send-btn:hover:not(:disabled) { background:#187536; transform:scale(1.05); }
        .send-btn:disabled { opacity:0.5; cursor:not-allowed; transform:none; }

        .spinner { width:22px; height:22px; border:2.5px solid var(--ap-border, #e5e7eb); border-top-color:var(--ap-accent-border, #1f8f43); border-radius:50%; animation:spin 0.7s linear infinite; margin:0 auto; }

        /* MOBILE */
        @media (max-width:640px) {
          .body { padding:0; gap:0; }
          .convo-panel { width:100%; border-radius:0; border:none; border-bottom:1px solid var(--ap-border, #eceff3); display:flex; }
          .chat-panel { border-radius:0; border:none; }
          .mobile-back { display:flex; align-items:center; gap:4px; }
          .mobile-hide { display:none; }
        }

      .page{height:100dvh;min-width:0}.body{min-height:0;min-width:0}.embedded{height:min(640px,calc(100dvh - 190px));min-height:350px}
      .convo-item{width:100%;text-align:left;background:var(--ap-surface, #fff);border-top:0;border-right:0;border-bottom:1px solid var(--ap-border, #f3f4f6);font:inherit}.convo-name,.convo-last{display:block}.convo-panel{width:280px}.chat-panel{display:flex}.convo-panel{display:flex}.message-content{max-width:85%;min-width:0}.msg-bubble{max-width:100%;white-space:pre-wrap;overflow-wrap:anywhere}.message-date{font-size:.65rem;color:var(--ap-text-muted, #6b7280);margin-top:4px}.chat-header p{margin:3px 0 0;overflow-wrap:anywhere}.chat-header>div:last-child{min-width:0}.chat-input{min-width:0;width:0;font-size:16px;min-height:44px}.send-btn{width:auto;min-width:48px;font-weight:700;padding:10px}.attachment-download{display:block;background:var(--ap-surface, #fff);color:var(--ap-accent-text, #1f8f43);border:1px solid var(--ap-border, #d1d5db);border-radius:8px;padding:6px;margin-top:6px;max-width:100%;overflow-wrap:anywhere;cursor:pointer}.attached-files{padding:8px;display:flex;flex-wrap:wrap;gap:6px;font-size:.75rem}.attached-files span{min-width:0;max-width:100%;overflow-wrap:anywhere;background:var(--ap-accent-surface, #eef9f1);padding:6px;border-radius:8px}.attached-files button{background:none;border:0;cursor:pointer}.attach-button{font-size:.72rem;font-weight:700;color:var(--ap-accent-text, #1f8f43);cursor:pointer}.attach-button{position:relative;display:flex;align-items:center;justify-content:center;min-height:44px;flex-shrink:0;max-width:76px;overflow-wrap:anywhere;padding:8px;border:1px solid var(--ap-border,#e5e7eb);border-radius:10px}.attach-button:focus-within{outline:2px solid var(--ap-accent-border,#1f8f43);outline-offset:2px}.attach-button input{position:absolute;width:1px;height:1px;opacity:0;overflow:hidden}.attach-button input::file-selector-button{font-size:10px;border:0;background:var(--ap-accent-surface, #eef9f1);padding:3px}.error-bar{margin:0;flex-shrink:0}.private-messages a{text-decoration:none}.private-messages button{cursor:pointer}
      .service-chat-byline{min-width:0;flex:1}.chat-header{flex-wrap:wrap}.service-offer-message .message-content{max-width:100%;width:min(100%,460px)}.service-offer-message .msg-bubble{padding:0;background:transparent;color:inherit}
      .convo-context{display:block;font-size:.7rem;color:var(--ap-text-muted,#66756d);margin:3px 0;overflow-wrap:anywhere}.convo-last{display:block;max-width:100%;overflow:hidden;text-overflow:ellipsis}.message-footer{display:flex;align-items:center;justify-content:space-between;gap:8px}.message-date{min-width:0;line-height:1.4;overflow-wrap:anywhere}.message-actions{position:relative;flex-shrink:0}.message-menu-button{display:grid;place-items:center;width:44px;height:40px;border-radius:9px;color:var(--ap-text-muted,#53655a);background:transparent}.message-menu-button:hover{background:var(--ap-surface-muted,#edf4ef)}.message-menu-button:focus-visible,.message-action-menu button:focus-visible,.delete-dialog button:focus-visible{outline:2px solid var(--ap-accent-text,#176d35);outline-offset:2px}.message-action-menu{position:absolute;right:0;bottom:38px;min-width:150px;z-index:20;padding:5px;border:1px solid var(--ap-border,#dce6df);border-radius:10px;background:var(--ap-surface,#fff);box-shadow:0 8px 24px #0002}.message-action-menu button{width:100%;min-height:44px;padding:10px;text-align:left;border-radius:7px;background:none;color:var(--ap-text-strong,#183d28);font:600 13px Inter,sans-serif}.error-bar{max-height:72px;overflow:auto}.message-notice{max-height:72px;overflow:auto;padding:8px 14px;flex-shrink:0;background:var(--ap-accent-surface,#edf8f0);color:var(--ap-accent-text,#176d35);font-size:.8rem;line-height:1.5}.delete-dialog-backdrop{position:fixed;inset:0;z-index:2100;background:#0007;display:flex;align-items:center;justify-content:center;padding:20px;overscroll-behavior:contain}.delete-dialog{width:100%;max-width:420px;max-height:calc(var(--mobile-viewport-height,100dvh) - 40px);overflow:auto;padding:24px;border-radius:18px;border:1px solid var(--ap-border,#dce6df);background:var(--ap-surface,#fff);color:var(--ap-text-strong,#183d28);box-shadow:0 16px 50px #0003}.delete-dialog h2{font-size:1.2rem;font-weight:800;margin:0 0 12px}.delete-dialog p{font-size:.9rem;line-height:1.6;color:var(--ap-text-muted,#53655a)}.delete-dialog-actions{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;margin-top:20px}.delete-dialog-actions button{min-height:44px;padding:10px 16px;border:1px solid var(--ap-border,#dce6df);border-radius:10px;background:var(--ap-surface-muted,#f3f6f4);color:var(--ap-text-strong,#183d28);font-weight:700}.delete-dialog-actions .confirm-personal-delete{background:var(--ap-color-primary,#1f8f43);color:#fff;border-color:transparent}.delete-dialog button:disabled{opacity:.6;cursor:wait}.delete-dialog .delete-error{padding:12px;margin-top:12px;border-radius:10px;color:var(--ap-danger-text,#b42318);background:var(--ap-danger-surface,#fef2f2)}
      @media(max-width:768px){.page{height:calc(var(--mobile-viewport-height,100dvh) - var(--mobile-nav-space))}.embedded{height:calc(var(--mobile-viewport-height,100dvh) - 190px - var(--mobile-nav-space));min-height:180px}}
      @media(max-width:640px){.body{padding:8px}.send-btn{min-width:52px;padding:8px;font-size:12px}.attach-button{max-width:64px;font-size:12px}.convo-panel{width:100%}.chat-panel{display:none}.chat-open .convo-panel{display:none}.chat-open .chat-panel{display:flex}.mobile-back{display:block}.chat-input-wrap{padding:10px;gap:8px}}
    `}</style>
  </section>;
}
