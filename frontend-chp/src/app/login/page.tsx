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
    <div className="min-h-screen lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-chp-hero lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
          aria-hidden
        />
        <div className="relative z-10">
          <div className="mb-6 flex items-center gap-3">
            <span className="h-12 w-1.5 rounded-full bg-chp-red" aria-hidden />
            <div>
              <p className="font-display text-2xl font-bold tracking-tight text-white">
                CHP İstanbul
              </p>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/70">
                İl Başkanlığı
              </p>
            </div>
          </div>
          <h1 className="max-w-md font-display text-3xl font-bold leading-snug text-white">
            Örgüt ve etkinlik yönetimi için güvenli web paneli
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/75">
            Mobil uygulama ile aynı hesap; akış, planlanan etkinlikler ve raporlara tek oturumdan
            erişin.
          </p>
        </div>
        <p className="relative z-10 text-xs text-white/45">© {new Date().getFullYear()}</p>
      </div>

      <div className="flex min-h-screen flex-col justify-center px-4 py-12 sm:px-8 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="mb-4 flex items-center gap-3">
              <span className="h-10 w-1 rounded-full bg-chp-red" aria-hidden />
              <div>
                <p className="font-display text-xl font-bold text-chp-ink">CHP İstanbul</p>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-chp-inkMuted">
                  İl Başkanlığı
                </p>
              </div>
            </div>
          </div>

          <div className="chp-card-elevated p-8 sm:p-10">
            <h2 className="font-display text-xl font-bold text-chp-ink">Oturum aç</h2>
            <p className="mt-2 text-sm leading-relaxed text-chp-inkMuted">
              Mobil uygulama ile aynı hesabı kullanın (kullanıcı adı veya e-posta).
            </p>

            <form onSubmit={onSubmit} className="mt-8 space-y-5">
              <div>
                <label htmlFor="login-user" className="chp-section-label">
                  Kullanıcı adı
                </label>
                <input
                  id="login-user"
                  className="chp-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoCapitalize="off"
                />
              </div>

              <div>
                <label htmlFor="login-pass" className="chp-section-label">
                  Şifre
                </label>
                <input
                  id="login-pass"
                  type="password"
                  className="chp-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>

              {error ? (
                <p className="rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
                  {error}
                </p>
              ) : null}

              <button type="submit" disabled={busy} className="chp-btn-primary w-full py-3.5">
                {busy ? 'Giriş yapılıyor…' : 'Giriş yap'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
