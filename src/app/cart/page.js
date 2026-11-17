"use client";

import { useEffect, useState, useCallback } from 'react';
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
  const load = useCallback(async () => {
    if (!isAuthed) return;
    try {
      const {
        data
      } = await cartAPI.get();
      setCart({
        ...data,
        userId: user.id
      });
    } catch {
      setError('Could not load your cart. Please retry.');
    }
  }, [isAuthed, user?.id]);
  useEffect(() => {
    setCart(null);
    setError('');
    load();
  }, [load]);
  const change = async (item, count, accept = false) => {
    setBusy(item.id);
    setError('');
    try {
      await cartAPI.update(item.id, {
        quantity: count,
        ...(accept ? {
          expected_unit_price: item.price
        } : {})
      });
      await load();
      window.dispatchEvent(new Event('afriplate:cart'));
    } catch (e) {
      setError(e.response?.data?.message || 'Could not update cart');
      await load();
    } finally {
      setBusy(null);
    }
  };
  const remove = async item => {
    setBusy(item.id);
    try {
      await cartAPI.remove(item.id);
      await load();
      window.dispatchEvent(new Event('afriplate:cart'));
    } catch {
      setError('Could not remove item. Please retry.');
    } finally {
      setBusy(null);
    }
  };
  const current = cart?.userId === user?.id ? cart : null;
  return <><MarketplaceHeader /><main className="cart-page"><h1>My cart</h1><p>Saved to your account. Prices and availability are checked with the seller’s current listing.</p>{error && <div role="alert">{error} <button onClick={() => {
          setError('');
          load();
        }}>Retry</button></div>}{status === 'checking' ? <p>Checking account…</p> : !isAuthed ? <p><a href="/login?next=%2Fcart">Log in</a> to see your saved cart.</p> : !current ? <p role="status">Loading cart…</p> : current.items.length === 0 ? <section><h2>Your cart is empty</h2><a href="/products">Browse products</a></section> : <div className="cart-layout"><div>{current.items.map(item => <article key={item.id}><div>{item.image && <img src={item.image} alt="" />}<h2><a href={'/' + (item.product_id ? 'products/' : 'services/') + (item.product_id || item.service_id)}>{item.title}</a></h2><p>By {item.seller_name}</p><p>{money(Math.round(Number(item.price) * 100))} each</p>{item.issue && <p role="status">{item.issue}</p>}{(item.price_changed || item.price_unconfirmed) && <p role="status">{item.price_unconfirmed ? 'Review current price: NGN ' + item.price : 'Price changed from NGN ' + item.unit_price_snapshot + ' to NGN ' + item.price + '.'} <button disabled={!item.available || busy === item.id} onClick={() => change(item, item.quantity, true)}>Accept current price</button></p>}<div className="cart-controls"><button aria-label={'Decrease quantity for ' + item.title} disabled={item.quantity <= 1 || busy === item.id} onClick={() => change(item, item.quantity - 1)}>−</button><span aria-label="Quantity">{item.quantity}</span><button aria-label={'Increase quantity for ' + item.title} disabled={busy === item.id || !item.available || item.product_id && item.quantity >= item.stock_quantity} onClick={() => change(item, item.quantity + 1)}>+</button><button disabled={busy === item.id} onClick={() => remove(item)}>Remove</button></div><p>Subtotal: {money(item.subtotal_kobo)} · Fee: {money(item.fee_kobo)}</p></div></article>)}</div><aside><h2>Order summary</h2><p>{current.summary.item_count} items</p><p>Subtotal <strong>{money(current.summary.subtotal_kobo)}</strong></p><p>Buyer fees <strong>{money(current.summary.fee_kobo)}</strong></p><p>Total <strong>{money(current.summary.total_kobo)}</strong></p><button disabled>Checkout unavailable</button><p>Payments are paused. Items in your cart do not reserve stock.</p></aside></div>}</main><style jsx>{`
 .cart-page{max-width:1200px;margin:auto;padding:32px 20px 100px;color:#243b2c;font-family:Inter,sans-serif}.cart-page h1{font-size:28px;font-weight:800}.cart-page>p{margin:12px 0 24px;color:#53655a}.cart-layout{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:24px}article,aside,section{background:white;border:1px solid #dce5df;border-radius:16px;padding:24px;margin-bottom:16px}article img{width:80px;height:80px;object-fit:cover;border-radius:10px;float:right}h2{font-size:19px;overflow-wrap:anywhere;margin-bottom:12px}p{margin:10px 0}a{color:#176d35}.cart-controls{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:16px 0}button{padding:10px 14px;border:1px solid #b6cbbd;border-radius:9px;color:#176d35;background:#eef8f1;cursor:pointer}button:disabled{opacity:.55;cursor:not-allowed}aside{align-self:start}aside strong{float:right}@media(max-width:760px){.cart-layout{grid-template-columns:1fr}.cart-page{padding:24px 16px 110px}article,aside{padding:18px}}
 `}</style></>;
}
