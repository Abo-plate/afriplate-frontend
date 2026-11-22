"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "../src/components/Marketplace";
import { useSession } from "../src/app/lib/SessionProvider";
import { API_BASE } from "../src/app/lib/endpoints";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { user, status, isAuthed } = useSession();
  const [menu, setMenu] = useState(null);
  const [hash, setHash] = useState('');
  const [unread, setUnread] = useState(null);
  const root = useRef(null);
  useEffect(() => {
    const sync = () => { setHash(window.location.hash); setMenu(null); };
    sync(); window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, [pathname]);
  useEffect(() => {
    if (!menu) return;
    const outside = event => { if (!root.current?.contains(event.target)) setMenu(null); };
    const escape = event => { if (event.key === 'Escape') { setMenu(null); root.current?.querySelector('[aria-expanded="true"]')?.focus(); } };
    document.addEventListener('pointerdown', outside); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [menu]);
  useEffect(() => {
    // Hide the bar while an editable field is focused on mobile, including keyboards
    // that resize the visual viewport rather than the layout viewport.
    const update = () => {
      const focused = document.activeElement;
      const editing = focused?.matches('textarea,[contenteditable="true"],input:not([type="button"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]):not([type="file"])');
      document.documentElement.classList.toggle('mobile-input-active', !!editing);
      document.documentElement.style.setProperty('--mobile-viewport-height', (window.visualViewport?.height || window.innerHeight) + 'px');
    };
    document.addEventListener('focusin', update); document.addEventListener('focusout', update);
    window.visualViewport?.addEventListener('resize', update); window.addEventListener('resize', update); update();
    return () => { document.removeEventListener('focusin', update); document.removeEventListener('focusout', update); window.visualViewport?.removeEventListener('resize', update); window.removeEventListener('resize',update); document.documentElement.style.removeProperty('--mobile-viewport-height'); document.documentElement.classList.remove('mobile-input-active'); };
  }, []);
  useEffect(() => {
    if (!isAuthed) return;
    let cancelled=false,controller,latest=0;
    const poll=async()=>{
      const ticket=++latest;controller?.abort();controller=new AbortController();
      try{
        const response=await fetch(API_BASE+'/messages/unread-count',{headers:{Authorization:'Bearer '+localStorage.getItem('token')},cache:'no-store',signal:controller.signal});
        if(!response.ok)throw Error();
        const data=await response.json(),count=data.unread;
        if(!cancelled&&ticket===latest)setUnread({userId:user.id,count:Number.isSafeInteger(count)&&count>=0?count:null});
      }catch{if(!cancelled&&ticket===latest)setUnread(null);}
    };
    const changed=event=>{
      if(event.detail?.user_id!==user.id)return;
      if(Number.isSafeInteger(event.detail.unread)&&event.detail.unread>=0){latest++;controller?.abort();setUnread({userId:user.id,count:event.detail.unread});}
      else poll();
    };
    poll();const timer=setInterval(poll,15000);
    window.addEventListener('afriplate:messages-changed',changed);window.addEventListener('focus',poll);
    return()=>{cancelled=true;latest++;controller?.abort();clearInterval(timer);window.removeEventListener('afriplate:messages-changed',changed);window.removeEventListener('focus',poll);};
  },[isAuthed,user?.id]);
  const explore = /^\/(products|services|jobs|sellers|university)(?:\/|$)/.test(pathname);
  const needsVendor=user?.student_membership==='non_student'&&user.vendor_status!=='approved';
  const selling = pathname==='/sell'||pathname === '/dashboard' && hash.startsWith('#sell-');
  const active = pathname === '/' ? 'Home' : explore ? 'Explore' : selling ? 'Sell' : pathname === '/messages' || hash === '#messages' ? 'Messages' : /^\/(dashboard|login|register|wallet|cart|checkout|orders|applications)(?:\/|$)/.test(pathname) ? 'Account' : null;
  const seller = user?.user_type === 'seller' || user?.role === 'seller';
  const canSell = !needsVendor && seller && user?.is_active !== false && !user?.is_banned;
  const unreadCount = unread && user && unread.userId === user.id ? unread.count : null;
  const account = isAuthed ? '/dashboard' : '/login';
  const sellLink = type => isAuthed ? '/dashboard#sell-' + type : '/login?next=' + encodeURIComponent('/dashboard#sell-' + type);
  return <div ref={root} className="mobile-navigation">
    {menu && <section id="mobile-navigation-menu" className="mobile-nav-panel" aria-label={menu === 'Explore' ? 'Explore marketplace' : 'Start selling'}>
      <div className="mobile-panel-heading"><strong>{menu === 'Explore' ? 'Explore the marketplace' : 'What would you like to list?'}</strong><button type="button" aria-label="Close navigation menu" onClick={() => setMenu(null)}><Icon name="close" /></button></div>
      {menu === 'Explore' ? <div className="mobile-panel-links">{[['Products','bag','/products','Find what you need'],['Services','book','/services','Discover campus talent'],['Jobs','work','/jobs','Find your next opportunity']].map(([label,icon,href,detail]) => <Link key={href} href={href} onClick={() => setMenu(null)}><Icon name={icon}/><span><strong>{label}</strong><small>{detail}</small></span><Icon name="arrow"/></Link>)}</div> : <>
        {status === 'checking' || status === 'unavailable' ? <p role="status">Your account must be verified before continuing. <Link href="/login" onClick={() => setMenu(null)}>Go to login</Link></p> : isAuthed && !canSell ? <p>You need an active seller account to create listings. <Link href="/dashboard#settings" onClick={() => setMenu(null)}>View account settings</Link></p> : <div className="mobile-panel-links">{[['product','bag','Sell a product','List an item for your campus'],['service','book','List a service','Share your skills']].map(([type,icon,label,detail]) => <a key={type} href={sellLink(type)} onClick={() => setMenu(null)}><Icon name={icon}/><span><strong>{label}</strong><small>{detail}{!isAuthed ? ' ? Login required' : ''}</small></span><Icon name="arrow"/></a>)}</div>}
      </>}
    </section>}
    <nav className="mobile-nav" aria-label="Main mobile navigation">
      {[['Home','home','/'],['Explore','search',null],['Sell','plus',isAuthed&&needsVendor?'/sell':null],['Messages','chat','/messages'],['Account','user',account]].map(([label,icon,href]) => {
        const content = <><span className="mobile-tab-icon"><Icon name={icon}/>{label === 'Messages' && isAuthed && unreadCount > 0 && <span className="mobile-unread" aria-label={unreadCount + ' unread messages'}>{unreadCount > 99 ? '99+' : unreadCount}</span>}</span><span>{label}</span></>;
        const className = 'nav-item' + ((menu || active) === label ? ' active' : '');
        return href ? <Link key={label} className={className} href={href} aria-current={active === label ? 'page' : undefined} onClick={() => setMenu(null)}>{content}</Link> : <button type="button" key={label} className={className} aria-current={active === label ? "page" : undefined} aria-expanded={menu === label} aria-controls="mobile-navigation-menu" onClick={() => setMenu(menu === label ? null : label)}>{content}</button>;
      })}
    </nav>
  </div>;
}
