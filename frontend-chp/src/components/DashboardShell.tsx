'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/components/AuthProvider';
import { fetchOrgContextLabel, fetchUnreadNotificationCount } from '@/lib/api';
import { hasPresidentMembershipRole } from '@/lib/userRoles';
import clsx from 'clsx';

const nav = [
  { href: '/feed', label: 'Akış' },
  { href: '/planned', label: 'Planlanan' },
  { href: '/plan', label: 'Planla' },
  { href: '/report', label: 'Rapor' },
  { href: '/notifications', label: 'Bildirimler' },
  { href: '/profile', label: 'Profil' },
];

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      className="h-5 w-5 text-chp-ink"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden>
      {open ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
      )}
    </svg>
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [orgLabel, setOrgLabel] = useState('');
  const [unread, setUnread] = useState(0);
  const [navOpen, setNavOpen] = useState(false);
  const hidePlan = hasPresidentMembershipRole(user);

  const initial = useMemo(() => {
    const n = user?.displayName?.trim() || user?.username || '?';
    return n.charAt(0).toUpperCase();
  }, [user]);

  useEffect(() => {
    void fetchOrgContextLabel()
      .then(setOrgLabel)
      .catch(() => setOrgLabel(''));
  }, []);

  useEffect(() => {
    void fetchUnreadNotificationCount()
      .then(setUnread)
      .catch(() => setUnread(0));
  }, [pathname]);

  const filteredNav = nav.filter((n) => !(hidePlan && n.href === '/plan'));

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-chp-border bg-white/90 shadow-chp-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-chp-border bg-white text-chp-ink md:hidden"
              onClick={() => setNavOpen((o) => !o)}
              aria-expanded={navOpen}
              aria-label={navOpen ? 'Menüyü kapat' : 'Menüyü aç'}>
              <MenuIcon open={navOpen} />
            </button>
            <Link href="/feed" className="group flex min-w-0 items-center gap-3">
              <span
                className="hidden h-10 w-1 shrink-0 rounded-full bg-chp-red sm:block"
                aria-hidden
              />
              <span className="min-w-0">
                <span className="block font-display text-lg font-bold leading-tight tracking-tight text-chp-ink sm:text-xl">
                  CHP İstanbul
                </span>
                <span className="hidden text-[11px] font-medium uppercase tracking-[0.14em] text-chp-inkMuted sm:block">
                  İl Başkanlığı
                </span>
              </span>
            </Link>
          </div>

          <p className="hidden max-w-xs truncate text-right text-xs font-medium text-chp-inkMuted lg:block xl:max-w-md">
            {orgLabel || '\u00a0'}
          </p>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div
              className="hidden h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-chp-mutedStrong to-chp-muted text-sm font-bold text-chp-redDark sm:flex"
              title={user?.displayName ?? user?.username ?? ''}>
              {initial}
            </div>
            <button
              type="button"
              onClick={() => logout()}
              className="rounded-xl border border-chp-border px-3 py-2 text-sm font-semibold text-chp-inkMuted transition-colors hover:border-chp-borderStrong hover:bg-slate-50 hover:text-chp-ink">
              Çıkış
            </button>
          </div>
        </div>

        <nav
          className={clsx(
            'border-t border-chp-border/80 bg-white/95 md:block',
            navOpen ? 'block' : 'hidden'
          )}>
          <div className="mx-auto max-w-6xl px-2 pb-3 pt-1 sm:px-6 md:flex md:items-stretch md:gap-1 md:pb-0 md:pt-0">
            <div className="flex flex-col gap-0.5 md:flex-row md:flex-wrap md:gap-1">
              {filteredNav.map((item) => {
                const on =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                const isNotif = item.href === '/notifications';
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setNavOpen(false)}
                    className={clsx(
                      'relative rounded-xl px-4 py-3 text-sm font-semibold transition-colors md:rounded-b-none md:rounded-t-lg md:py-2.5 md:pb-3',
                      on
                        ? 'bg-chp-muted text-chp-redDark md:bg-transparent md:text-chp-red'
                        : 'text-chp-inkMuted hover:bg-slate-50 hover:text-chp-ink md:hover:bg-transparent'
                    )}>
                    {on ? (
                      <span
                        className="absolute bottom-0 left-2 right-2 hidden h-0.5 rounded-full bg-chp-red md:block"
                        aria-hidden
                      />
                    ) : null}
                    <span className="relative">{item.label}</span>
                    {isNotif && unread > 0 ? (
                      <span className="absolute right-2 top-2 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-chp-red px-1 text-[10px] font-bold text-white md:right-1 md:top-1">
                        {unread > 99 ? '99+' : unread}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}
