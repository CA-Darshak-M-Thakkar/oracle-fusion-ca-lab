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
  const [error, setError] = useState('');
  const [googleReady, setGoogleReady] = useState(false);

  useEffect(() => {
    const boot = () => {
      const google = (window as unknown as {
        google?: { accounts: { id: { initialize: (c: unknown) => void; renderButton: (el: HTMLElement, o: unknown) => void } } };
      }).google;
      if (!google || !btnRef.current) {
        setError('Google sign-in did not load. Check your connection and refresh the page.');
        return;
      }
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (resp: { credential: string }) => {
          try {
            const payload = decodeJwt(resp.credential);
            if (!payload.email) {
              setError('Google did not return an email. Try Sign in with Google again.');
              return;
            }
            if (payload.email_verified === false) {
              setError('This Google email is not verified. Use a verified Google account.');
              return;
            }
            signIn({ name: payload.name || payload.email, email: payload.email });
          } catch {
            setError('Google sign-in could not be read. Refresh the page and try again.');
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
      setError('');
    };

    const existing = document.querySelector('script[data-gis="1"]');
    if (existing) {
      boot();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.dataset.gis = '1';
    script.onload = boot;
    script.onerror = () => setError('Google sign-in did not load. Check your connection and refresh the page.');
    document.body.appendChild(script);
  }, [signIn]);

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

          <div className="mt-6">
            <div ref={btnRef} className="min-h-[44px]" />
            {!googleReady && !error && <p className="mt-3 text-lg">Loading Google sign-in…</p>}
          </div>

          {error && (
            <p className="mt-4 rounded border border-rose-400 bg-rose-950 px-3 py-3 text-lg leading-snug text-rose-100" role="alert">
              {error}
            </p>
          )}

          <p className="mt-5 text-base leading-snug text-slate-300">
            Signing in records your name, email and whether you are a Student or the Teacher on the class sheet. Do not type a password here.
          </p>
          <p className="mt-3 text-base">
            <a className="text-sky-300 underline" href="./privacy.html">Privacy</a>
            <span className="mx-2 text-slate-500">·</span>
            <a className="text-sky-300 underline" href="./terms.html">Terms</a>
          </p>
        </div>
      </div>
    </div>
  );
};
