'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/components/AuthProvider';
import { parseApiErrorMessage } from '@/lib/api';
import { getToken } from '@/lib/token';

export default function LoginPage() {
  const router = useRouter();
  const { ready, user, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (getToken() && user) router.replace('/feed');
  }, [ready, user, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const u = username.trim();
    if (!u || !password) {
      setError('Kullanıcı adı ve şifre girin.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await login(u, password);
    } catch (err) {
      setError(
        parseApiErrorMessage(err instanceof Error ? err.message : 'Giriş başarısız.')
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-chp-red text-3xl text-white">
            ★
          </div>
          <h1 className="font-display text-3xl font-bold text-neutral-900">İstanbul</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Cumhuriyet Halk Partisi · İl Başkanlığı web paneli
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-display text-xl font-bold text-neutral-900">Giriş</h2>
          <p className="mb-4 text-sm text-neutral-600">
            Mobil uygulama ile aynı hesabı kullanın (kullanıcı adı veya e-posta ile deneyin).
          </p>

          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-neutral-500">
            Kullanıcı adı
          </label>
          <input
            className="mb-4 w-full rounded-xl border border-neutral-200 px-4 py-3 text-neutral-900 outline-none focus:border-chp-red"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoCapitalize="off"
          />

          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-neutral-500">
            Şifre
          </label>
          <input
            type="password"
            className="mb-4 w-full rounded-xl border border-neutral-200 px-4 py-3 text-neutral-900 outline-none focus:border-chp-red"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          {error ? <p className="mb-4 text-sm font-semibold text-amber-700">{error}</p> : null}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-chp-red py-3.5 font-bold text-white disabled:opacity-60">
            {busy ? '…' : 'Giriş'}
          </button>
        </form>
      </div>
    </div>
  );
}
