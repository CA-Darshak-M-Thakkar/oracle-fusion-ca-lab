import React, { useEffect, useRef, useState } from 'react';
import { useERP } from '../context/ERPContext';
import { GOOGLE_CLIENT_ID } from '../config/auth';

function decodeJwt(token: string): { name?: string; email?: string; email_verified?: boolean } {
  const part = token.split('.')[1] || '';
  const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
  return JSON.parse(json);
}

export const LoginScreen: React.FC<{
  fontScale: string;
  onFont: (v: string) => void;
  dark: boolean;
  onToggleTheme: () => void;
}> = ({ fontScale, onFont, dark, onToggleTheme }) => {
  const { signIn } = useERP();
  const btnRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [googleReady, setGoogleReady] = useState(false);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    const existing = document.querySelector('script[data-gis="1"]');
    const boot = () => {
      const google = (window as unknown as { google?: { accounts: { id: { initialize: (c: unknown) => void; renderButton: (el: HTMLElement, o: unknown) => void } } } }).google;
      if (!google || !btnRef.current) return;
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (resp: { credential: string }) => {
          try {
            const payload = decodeJwt(resp.credential);
            if (!payload.email) {
              setError('Google did not return an email. Try again.');
              return;
            }
            if (payload.email_verified === false) {
              setError('This Google email is not verified.');
              return;
            }
            signIn({ name: payload.name || payload.email, email: payload.email });
          } catch {
            setError('Could not read the Google sign-in. Use the name and email form if it is shown.');
          }
        },
      });
      google.accounts.id.renderButton(btnRef.current, {
        theme: 'filled_blue',
        size: 'large',
        text: 'signin_with',
        width: 360,
        shape: 'rectangular',
      });
      setGoogleReady(true);
    };
    if (existing) {
      boot();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.dataset.gis = '1';
    script.onload = boot;
    script.onerror = () => setError('Google sign-in did not load. Check the network and try again.');
    document.body.appendChild(script);
  }, [signIn]);

  const submitFallback = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    if (cleanName.length < 3) {
      setError('Enter your full name (at least 3 letters).');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Enter a real email, such as name@gmail.com.');
      return;
    }
    setError('');
    signIn({ name: cleanName, email: cleanEmail });
  };

  return (
    <div className="login-screen min-h-screen px-4 py-8">
      <div className="mx-auto flex max-w-xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-lg text-sky-300">AICITSS classroom</p>
            <h1 className="text-4xl font-semibold leading-tight">Oracle Fusion practice</h1>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-lg">
              Text
              <select className="ml-2 rounded bg-slate-800 px-2 py-2 text-lg" value={fontScale} onChange={(e) => onFont(e.target.value)}>
                <option value="100">100%</option>
                <option value="125">125%</option>
                <option value="150">150%</option>
              </select>
            </label>
            <button type="button" className="rounded bg-slate-700 px-3 py-2 text-lg" onClick={onToggleTheme}>
              {dark ? 'Light theme' : 'Dark theme'}
            </button>
          </div>
        </div>

        <div className="login-card rounded-xl border p-6 sm:p-8">
          <p className="text-xl leading-snug">
            Sign in with the Google account you use in class. We take your name and email only, and mark you present.
          </p>

          {GOOGLE_CLIENT_ID ? (
            <div className="mt-6">
              <div ref={btnRef} className="min-h-[44px]" />
              {!googleReady && <p className="mt-3 text-lg">Loading Google sign-in…</p>}
            </div>
          ) : (
            <form onSubmit={submitFallback} className="mt-6 space-y-4">
              <p className="text-lg leading-snug">
                Google sign-in is not switched on yet (no client ID). Use your name and email. The teacher’s email still opens teacher mode.
              </p>
              <label className="block text-lg">
                Full name
                <input className="mt-1 w-full rounded border border-slate-500 bg-slate-900 px-3 py-3 text-xl" value={name} onChange={(e) => setName(e.target.value)} placeholder="Priya Shah" />
              </label>
              <label className="block text-lg">
                Email
                <input className="mt-1 w-full rounded border border-slate-500 bg-slate-900 px-3 py-3 text-xl" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@gmail.com" inputMode="email" />
              </label>
              <button type="submit" className="w-full rounded-md bg-amber-400 px-4 py-3 text-xl font-semibold text-slate-950">
                Sign in
              </button>
            </form>
          )}

          {error && <p className="mt-4 rounded border border-rose-400 bg-rose-950 px-3 py-2 text-lg text-rose-100">{error}</p>}

          <p className="mt-5 text-base leading-snug text-slate-300">
            Signing in records your name, email and whether you are a Student or the Teacher on the class sheet. Do not type a password here.
          </p>
        </div>
      </div>
    </div>
  );
};
