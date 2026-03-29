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
    <div className="min-h-screen bg-[#fafafa]">
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg border border-neutral-200 p-2 md:hidden"
              onClick={() => setNavOpen((o) => !o)}
              aria-label="Menü">
              ☰
            </button>
            <Link href="/feed" className="font-display text-xl font-bold text-chp-red">
              CHP İstanbul
            </Link>
          </div>
          <p className="hidden max-w-md truncate text-sm text-neutral-600 sm:block">
            {orgLabel || ' '}
          </p>
          <button
            type="button"
            onClick={() => logout()}
            className="text-sm font-semibold text-neutral-600 hover:text-chp-red">
            Çıkış
          </button>
        </div>
        <nav
          className={clsx(
            'border-t border-neutral-100 bg-white md:block',
            navOpen ? 'block' : 'hidden'
          )}>
          <div className="mx-auto flex max-w-6xl flex-wrap gap-1 px-2 py-2 md:flex-nowrap">
            {filteredNav.map((item) => {
              const on = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const isNotif = item.href === '/notifications';
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setNavOpen(false)}
                  className={clsx(
                    'relative rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                    on
                      ? 'bg-chp-muted text-chp-redDark'
                      : 'text-neutral-700 hover:bg-neutral-100'
                  )}>
                  {item.label}
                  {isNotif && unread > 0 ? (
                    <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-chp-red px-1 text-[10px] font-bold text-white">
                      {unread > 99 ? '99+' : unread}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
