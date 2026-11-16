"use client";

import Link from 'next/link';
import { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from '../app/lib/SessionProvider';
import { cartAPI } from '../app/lib/services';
const CartContext = createContext(null);
export function CartProvider({
  children
}) {
  const {
    isAuthed,
    user
  } = useSession();
  const [cart, setCart] = useState(null);
  useEffect(() => {
    if (!isAuthed) return;
    let active = true;
    const refresh = async () => {
      try {
        const {
          data
        } = await cartAPI.get();
        if (active) setCart({
          userId: user.id,
          count: data.summary?.item_count
        });
      } catch {
        if (active) setCart(null);
      }
    };
    refresh();
    window.addEventListener('afriplate:cart', refresh);
    window.addEventListener('focus', refresh);
    const timer = setInterval(refresh, 15000);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener('afriplate:cart', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [isAuthed, user?.id]);
  return <CartContext.Provider value={isAuthed && cart?.userId === user?.id ? cart.count : null}>{children}</CartContext.Provider>;
}
export default function CartEntry() {
  const {
    isAuthed
  } = useSession();
  const count = useContext(CartContext);
  return <Link href={isAuthed ? '/cart' : '/login?next=%2Fcart'} className="cart-entry" aria-label={'Cart' + (Number.isInteger(count) ? ', ' + count + ' items' : '')}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M3 3h2l3 12h11l2-8H6M9 20h.01M18 20h.01" strokeLinecap="round" /></svg><span>Cart</span>{count > 0 && <strong>{count > 99 ? '99+' : count}</strong>}</Link>;
}
