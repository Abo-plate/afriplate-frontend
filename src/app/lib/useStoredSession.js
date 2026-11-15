'use client';
import { useSession } from './SessionProvider';

// Compatibility for existing marketplace callers; the provider validates /auth/me.
export function useStoredSession() {
  return useSession().isAuthed;
}
