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
    <div className="min-h-screen lg:grid lg:min-h-0 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-chp-ink px-10 py-12 text-white lg:flex xl:px-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="absolute left-0 top-0 h-full w-1.5 bg-chp-red" aria-hidden />
        <div className="relative z-10 max-w-md">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
            Cumhuriyet Halk Partisi
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold leading-tight tracking-tight xl:text-[2.75rem]">
            İstanbul İl Başkanlığı
          </h1>
          <p className="mt-6 text-base leading-relaxed text-white/85">
            Örgüt içi paylaşımlar, planlanan etkinlikler ve raporlara güvenli erişim için kurumsal web
            paneli.
          </p>
        </div>
        <p className="relative z-10 text-xs text-white/45">
          © {new Date().getFullYear()} · Resmi kurumsal kullanım
        </p>
      </div>

      <div className="flex min-h-screen flex-col justify-center px-4 py-12 sm:px-8">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="mb-4 flex items-center gap-3">
              <span className="h-12 w-1.5 rounded-full bg-chp-red shadow-md shadow-chp-red/40" />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  CHP İstanbul
                </p>
                <p className="font-display text-2xl font-bold text-slate-900">İl Başkanlığı</p>
              </div>
            </div>
            <p className="text-sm text-slate-600">Örgüt paneline giriş</p>
          </div>

          <form onSubmit={onSubmit} className="chp-card p-6 shadow-lift sm:p-8">
            <h2 className="font-display text-xl font-bold text-slate-900">Güvenli giriş</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Kullanıcı adı veya e-posta ve şifrenizle giriş yapın.
            </p>

            <div className="mt-8 space-y-5">
              <div>
                <label className="chp-section-label !mb-1.5">Kullanıcı adı</label>
                <input
                  className="chp-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoCapitalize="off"
                />
              </div>
              <div>
                <label className="chp-section-label !mb-1.5">Şifre</label>
                <input
                  type="password"
                  className="chp-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error ? (
              <p className="chp-alert mt-6 text-sm font-medium">{error}</p>
            ) : null}

            <button type="submit" disabled={busy} className="chp-btn-primary mt-8 w-full py-3.5">
              {busy ? 'Giriş yapılıyor…' : 'Panele giriş yap'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
