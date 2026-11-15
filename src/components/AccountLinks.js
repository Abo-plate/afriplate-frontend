'use client';
import Link from 'next/link';
import { useSession } from '../app/lib/SessionProvider';

export default function AccountLinks({ variant = 'listing', onNavigate }) {
  const { isAuthed, status, logout } = useSession();
  const home = variant === 'home';
  const primary = home ? 'ap-button ap-button-green' : 'nav-btn nav-signup';
  const secondary = home ? 'ap-login' : 'nav-btn nav-login';
  if (status === 'checking') return <span role="status" className="account-loading">Checking account...</span>;
  if (isAuthed) return <>
    <Link href="/dashboard" className={primary} onClick={onNavigate}>Dashboard</Link>
    <a href="/dashboard#settings" className={secondary} onClick={onNavigate}>Profile</a>
    <button type="button" className={secondary + ' account-logout'} onClick={() => { logout(); onNavigate?.(); }}>Log out</button>
  </>;
  return <>
    <Link href="/login" className={secondary} onClick={onNavigate}>Login</Link>
    <Link href="/register" className={primary} onClick={onNavigate}>Sign up</Link>
  </>;
}
