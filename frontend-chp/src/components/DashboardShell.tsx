'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode, useEffect, useState } from 'react';

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
      className="h-5 w-5 text-slate-700"
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
      <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 shadow-header backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 lg:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50/80 md:hidden"
              onClick={() => setNavOpen((o) => !o)}
              aria-expanded={navOpen}
              aria-label={navOpen ? 'Menüyü kapat' : 'Menüyü aç'}>
              <MenuIcon open={navOpen} />
            </button>
            <Link href="/feed" className="group flex min-w-0 items-center gap-3">
              <span
                className="hidden h-10 w-1 shrink-0 rounded-full bg-chp-red shadow-sm shadow-chp-red/30 sm:block"
                aria-hidden
              />
              <span className="min-w-0">
                <span className="block font-display text-lg font-bold leading-tight tracking-tight text-slate-900 sm:text-xl">
                  CHP İstanbul
                </span>
                <span className="block text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                  İl Başkanlığı
                </span>
              </span>
            </Link>
          </div>
          <div className="hidden max-w-md flex-1 px-4 text-center sm:block">
            <p className="truncate text-xs font-medium text-slate-500">Örgüt bağlamı</p>
            <p className="truncate text-sm font-semibold text-slate-800">{orgLabel || '—'}</p>
          </div>
          <button
            type="button"
            onClick={() => logout()}
            className="shrink-0 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900">
            Çıkış
          </button>
        </div>
        <nav
          className={clsx(
            'border-t border-slate-100 bg-slate-50/50 md:block',
            navOpen ? 'block' : 'hidden'
          )}>
          <div className="mx-auto flex max-w-6xl flex-wrap gap-1 px-2 py-2 md:flex-nowrap md:gap-0.5 md:px-4 lg:px-6">
            {filteredNav.map((item) => {
              const on = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const isNotif = item.href === '/notifications';
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setNavOpen(false)}
                  className={clsx(
                    'relative rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors md:px-4',
                    on
                      ? 'bg-white text-chp-red shadow-sm ring-1 ring-slate-200/80'
                      : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
                  )}>
                  {item.label}
                  {isNotif && unread > 0 ? (
                    <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-chp-red px-1 text-[10px] font-bold text-white shadow-sm">
                      {unread > 99 ? '99+' : unread}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 lg:px-6 lg:py-10">{children}</main>
    </div>
  );
}
