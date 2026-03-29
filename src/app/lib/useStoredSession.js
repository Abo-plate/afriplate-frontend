'use client';
import { useEffect, useState } from 'react';

function hasStoredSession() {
  if (typeof window === 'undefined') return false;
  return Boolean(localStorage.getItem('token'));
}

export function useStoredSession() {
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    const syncSession = () => setIsAuthed(hasStoredSession());

    syncSession();
    window.addEventListener('focus', syncSession);
    window.addEventListener('storage', syncSession);

    return () => {
      window.removeEventListener('focus', syncSession);
      window.removeEventListener('storage', syncSession);
    };
  }, []);

  return isAuthed;
}
