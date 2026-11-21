"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from '../lib/SessionProvider';
import { cartAPI } from '../lib/services';
import { MarketplaceHeader } from '../../components/Marketplace';
const money = kobo => 'NGN ' + (kobo / 100).toLocaleString('en-NG', {
  minimumFractionDigits: 2
});
export default function CartPage() {
  const {
    isAuthed,
    status,
    user
  } = useSession();
  const [cart, setCart] = useState(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(null);
  const version=useRef(0),locked=useRef(false),context=useRef(null),active=useRef(true);
  context.current={userId:user?.id,isAuthed};
  useEffect(()=>{active.current=true;return()=>{active.current=false;version.current++;};},[]);
  const load=useCallback(async()=>{
    if(!isAuthed)return false;
    const request=++version.current;
    try{
      const {data}=await cartAPI.get();
      if(!Array.isArray(data.items)||!Number.isSafeInteger(data.summary?.item_count))throw Error('Invalid cart response');
      if(active.current&&request===version.current&&context.current.isAuthed&&context.current.userId===user.id){setCart({...data,userId:user.id});return true;}
    }catch{if(active.current&&request===version.current)setError('Could not refresh your cart. Retry.');}
    return false;
  },[isAuthed,user?.id]);
  useEffect(()=>{setCart(null);setError('');load();return()=>{version.current++;};},[load]);
  const mutate=async(item,count,accept=false,removing=false)=>{
    if(locked.current||!isAuthed)return;
    const viewer=user.id,current=()=>active.current&&context.current.isAuthed&&context.current.userId===viewer;
    locked.current=true;setBusy(item.id);setError('');
    try{
      if(removing)await cartAPI.remove(item.id);
      else{
        const {data}=await cartAPI.update(item.id,{quantity:count,expected_user_id:viewer,...(accept?{expected_unit_price:item.price}:{})});
        if(data.item?.id!==item.id||data.item.user_id!==viewer||data.item.quantity!==count)throw Error('Invalid cart confirmation');
      }
      if(!current())return;
      window.dispatchEvent(new Event('afriplate:cart'));
      if(!await load()&&current())setError('Saved, but the cart could not refresh. Refresh before changing it again.');
    }catch(problem){
      if(!current())return;
      const message=problem.response?.status===401?'Your session expired. Sign in again.':problem.response?.data?.message||'Cart change not confirmed. Refresh before retrying.';
      if(problem.response?.status===409)await load();
      if(current())setError(message);
    }finally{locked.current=false;if(active.current)setBusy(null);}
  };
  const change=(item,count,accept=false)=>mutate(item,count,accept);
  const remove=item=>mutate(item,null,false,true);
  const current = cart?.userId === user?.id ? cart : null;
  return <><MarketplaceHeader /><main className="cart-page"><h1>My cart</h1><p>Your saved cart</p>{error && <div role="alert">{error} <button disabled={busy!==null} onClick={() => {setError('');load();}}>Retry</button></div>}{status === 'checking' ? <p>Checking account…</p> : !isAuthed ? <p><a href="/login?next=%2Fcart">Log in</a> to see your saved cart.</p> : !current ? <p role="status">Loading cart…</p> : current.items.length === 0 ? <section><h2>Your cart is empty</h2><a href="/products">Browse products</a></section> : <div className="cart-layout"><div>{current.items.map(item => <article key={item.id}><div>{item.image && <img src={item.image} alt="" />}<h2><a href={'/' + (item.product_id ? 'products/' : 'services/') + (item.product_id || item.service_id)}>{item.title}</a></h2><p>By {item.seller_name}</p><p>{money(Math.round(Number(item.price) * 100))} each</p>{item.issue && <p role="status">{item.issue}</p>}{(item.price_changed || item.price_unconfirmed) && <p role="status">{item.price_unconfirmed ? 'Review current price: NGN ' + item.price : 'Price changed from NGN ' + item.unit_price_snapshot + ' to NGN ' + item.price + '.'} <button disabled={!item.available || busy !== null} onClick={() => change(item, item.quantity, true)}>Accept current price</button></p>}<div className="cart-controls"><button aria-label={'Decrease quantity for ' + item.title} disabled={item.quantity <= 1 || busy !== null} onClick={() => change(item, item.quantity - 1)}>−</button><span aria-label="Quantity">{item.quantity}</span><button aria-label={'Increase quantity for ' + item.title} disabled={busy !== null || !item.available || item.product_id && item.quantity >= item.stock_quantity} onClick={() => change(item, item.quantity + 1)}>+</button><button disabled={busy !== null} onClick={() => remove(item)}>Remove</button></div><p>Subtotal: {money(item.subtotal_kobo)} · Fee: {money(item.fee_kobo)}</p></div></article>)}</div><aside><h2>Order summary</h2><p>{current.summary.item_count} items</p><p>Subtotal <strong>{money(current.summary.subtotal_kobo)}</strong></p><p>Buyer fees <strong>{money(current.summary.fee_kobo)}</strong></p><p>Total <strong>{money(current.summary.total_kobo)}</strong></p><button disabled>Checkout unavailable</button><p>Items in your cart do not reserve stock.</p></aside></div>}</main><style jsx>{`
 .cart-page{max-width:1200px;margin:auto;padding:32px 20px 100px;color:var(--ap-text-strong, #243b2c);font-family:Inter,sans-serif}.cart-page h1{font-size:28px;font-weight:800}.cart-page>p{margin:12px 0 24px;color:var(--ap-text-muted, #53655a)}.cart-layout{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:24px}article,aside,section{background:var(--ap-surface, white);border:1px solid var(--ap-border, #dce5df);border-radius:16px;padding:24px;margin-bottom:16px}article img{width:80px;height:80px;object-fit:cover;border-radius:10px;float:right}h2{font-size:19px;overflow-wrap:anywhere;margin-bottom:12px}p{margin:10px 0}a{color:var(--ap-accent-text, #176d35)}.cart-controls{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:16px 0}button{padding:10px 14px;border:1px solid var(--ap-border, #b6cbbd);border-radius:9px;color:var(--ap-accent-text, #176d35);background:var(--ap-accent-surface, #eef8f1);cursor:pointer}button:disabled{opacity:.55;cursor:not-allowed}aside{align-self:start}aside strong{float:right}@media(max-width:760px){.cart-layout{grid-template-columns:1fr}.cart-page{padding:24px 16px 110px}article,aside{padding:18px}}
 `}</style></>;
}
