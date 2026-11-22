'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const SessionContext = createContext(null);
const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '').replace(/\/$/, '');
export const SESSION_CLEARED = 'afriplate:session-cleared';

export function SessionProvider({ children }) {
  const [session, setSession] = useState({ user: null, status: 'checking' });
  const version = useRef(0);
  const pending = useRef(null);
  const cancelPending = useCallback(() => {
    version.current++;
    pending.current?.abort();
  }, []);
  const logout = useCallback(() => {
    version.current++;
    pending.current?.abort();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setSession({ user: null, status: 'guest' });
  }, []);
  const refresh = useCallback(async () => {
    const request = ++version.current;
    pending.current?.abort();
    const token = localStorage.getItem('token');
    if (!token) { logout(); return; }
    const controller = new AbortController();
    pending.current = controller;
    setSession(current => current.status === 'authenticated' ? current : { user: null, status: 'checking' });
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(API + '/api/auth/me', {
        headers: { Authorization: 'Bearer ' + token }, signal: controller.signal, cache: 'no-store',
      });
      if (request !== version.current) return;
      if (response.status === 401 || response.status === 403 || response.status === 404) { logout(); return; }
      if (!response.ok) throw new Error('Session validation unavailable');
      const data = await response.json();
      if (request !== version.current) return;
      if (!data.user?.id) throw new Error('Invalid session response');
      localStorage.setItem('user', JSON.stringify(data.user));
      setSession({ user: data.user, status: 'authenticated' });
    } catch {
      if (request === version.current) setSession({ user: null, status: 'unavailable' });
    } finally { clearTimeout(timeout); }
  }, [logout]);
  const completeLogin = useCallback((token, user) => {
    if (!token || !user?.id) throw new Error('Invalid login response');
    version.current++;
    pending.current?.abort();
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    // Only call after a successful server login; stored tokens alone are never trusted.
    setSession({ user, status: 'authenticated' });
  }, []);
  useEffect(() => {
    const sync = event => {
      if (!event || event.type !== 'storage' || event.key === 'token' || event.key === null) refresh();
    };
    refresh();
    window.addEventListener('storage', sync);
    window.addEventListener('focus', sync);
    window.addEventListener(SESSION_CLEARED, logout);
    window.addEventListener('afriplate:selling-access-changed',sync);
    return () => {
      cancelPending();
      window.removeEventListener('storage', sync);
      window.removeEventListener('focus', sync);
      window.removeEventListener(SESSION_CLEARED, logout);
      window.removeEventListener('afriplate:selling-access-changed',sync);
    };
  }, [refresh, logout, cancelPending]);
  return <SessionContext.Provider value={{ ...session, isAuthed: session.status === 'authenticated', completeLogin, logout, refresh }}>{children}</SessionContext.Provider>;
}
export function useSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error('SessionProvider is required');
  return session;
}
