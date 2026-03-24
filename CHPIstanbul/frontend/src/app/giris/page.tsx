"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";

function GirisInner() {
  const { user, login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      router.replace(nextPath.startsWith("/") ? nextPath : "/");
    }
  }, [user, router, nextPath]);

  const field =
    "mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2.5 text-[13px] outline-none transition-shadow placeholder:text-muted focus:border-border-strong focus:ring-1 focus:ring-chp-navy/15";

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username.trim(), password);
      router.replace(nextPath.startsWith("/") ? nextPath : "/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Giriş başarısız.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-[44%] flex-col justify-between bg-chp-navy p-10 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
          aria-hidden
        />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-white/20 bg-white/10 text-[11px] font-bold tracking-tight">
              CHP
            </div>
            <div>
              <p className="text-[13px] font-semibold">İstanbul İl Örgütü</p>
              <p className="text-[11px] font-medium text-white/55">
                Etkinlik yönetim sistemi
              </p>
            </div>
          </div>
          <div className="mt-14 max-w-sm">
            <div className="mb-3 h-1 w-12 rounded-full bg-chp-red" />
            <h2 className="text-2xl font-semibold leading-snug tracking-tight">
              Örgüt çalışmalarını tek panelden yönetin.
            </h2>
            <p className="mt-4 text-[13px] leading-relaxed text-white/70">
              Etkinlik planlama ve raporlama; hat ve ilçe kapsamı sunucudan
              yönetilir.
            </p>
          </div>
        </div>
        <p className="relative text-[11px] text-white/45">
          Django API ile güvenli oturum (JWT).
        </p>
      </div>

      <div className="flex flex-1 flex-col justify-center bg-background px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-[400px]">
          <div className="mb-10 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-chp-navy text-[10px] font-bold text-white">
                CHP
              </div>
              <span className="text-[13px] font-semibold text-foreground">
                İstanbul İl Örgütü
              </span>
            </div>
          </div>

          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Oturum aç
          </h1>
          <p className="mt-2 text-[13px] text-muted">
            Django kullanıcı adı ve şifrenizle giriş yapın.
          </p>

          {error ? (
            <p className="mt-4 rounded-md border border-chp-red/30 bg-chp-red-subtle px-3 py-2 text-[13px] text-chp-red">
              {error}
            </p>
          ) : null}

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <div>
              <label
                htmlFor="username"
                className="text-[11px] font-semibold uppercase tracking-wider text-muted"
              >
                Kullanıcı adı
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={field}
                required
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="text-[11px] font-semibold uppercase tracking-wider text-muted"
              >
                Şifre
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={field}
                required
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-chp-red py-2.5 text-[13px] font-semibold text-white shadow-crm-sm transition-colors hover:bg-chp-red-hover disabled:opacity-60"
            >
              {submitting ? "Giriş yapılıyor…" : "Giriş yap"}
            </button>
          </form>

          <p className="mt-8 text-center text-[13px] text-muted">
            <Link
              href="/"
              className="font-semibold text-chp-navy hover:text-chp-red"
            >
              Panele dön
            </Link>{" "}
            (oturum gerekir)
          </p>
        </div>
      </div>
    </div>
  );
}

function GirisFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-[13px] text-muted">
      Yükleniyor…
    </div>
  );
}

export default function GirisPage() {
  return (
    <Suspense fallback={<GirisFallback />}>
      <GirisInner />
    </Suspense>
  );
}
