/**
 * Vercel build only (VITE_SERVER_GATE=1): the server has already checked Google sign-in and the
 * batch code before this bundle was served, so the lab skips its own login screen and takes the
 * user from /api/me. The GitHub Pages build leaves this off and keeps its own Google sign-in.
 */
export const serverGateEnabled = import.meta.env.VITE_SERVER_GATE === '1';

export type ServerMe = { signedIn: boolean; email?: string; name?: string; role?: string; batch?: string };

export async function fetchServerMe(): Promise<ServerMe> {
  const r = await fetch('/api/me', { credentials: 'same-origin', cache: 'no-store' });
  if (!r.ok) return { signedIn: false };
  return r.json();
}

export function serverSignOut(): void {
  fetch('/api/logout', { method: 'POST', credentials: 'same-origin' }).finally(() => {
    window.location.href = '/';
  });
}
