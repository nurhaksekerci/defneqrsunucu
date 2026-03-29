'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode, useEffect, useState } from 'react';

import {
  IconBell,
  IconCalendar,
  IconChart,
  IconFeed,
  IconPlus,
  IconUser,
} from '@/components/crm/NavIcons';
import { useAuth } from '@/components/AuthProvider';
import { fetchOrgContextLabel, fetchUnreadNotificationCount } from '@/lib/api';
import { hasPresidentMembershipRole } from '@/lib/userRoles';
import clsx from 'clsx';

const nav: {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  { href: '/feed', label: 'Akış', Icon: IconFeed },
  { href: '/planned', label: 'Planlanan', Icon: IconCalendar },
  { href: '/plan', label: 'Planla', Icon: IconPlus },
  { href: '/report', label: 'Rapor', Icon: IconChart },
  { href: '/notifications', label: 'Bildirimler', Icon: IconBell },
  { href: '/profile', label: 'Profil', Icon: IconUser },
];

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      className="h-5 w-5"
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex min-h-screen bg-[#f0f2f5]">
      {sidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/45 backdrop-blur-[1px] lg:hidden"
          aria-label="Menüyü kapat"
          onClick={closeSidebar}
        />
      ) : null}

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex w-[15.5rem] flex-col border-r border-slate-900/80 bg-[#0f172a] shadow-xl transition-transform duration-200 lg:static lg:z-0 lg:translate-x-0 lg:shadow-none',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}>
        <div className="flex h-[3.25rem] items-center gap-3 border-b border-white/10 px-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-chp-red text-xs font-bold text-white">
            CHP
          </div>
          <div className="min-w-0 flex-1">
            <Link
              href="/feed"
              onClick={closeSidebar}
              className="block truncate text-[13px] font-semibold tracking-tight text-white">
              İstanbul İl Başkanlığı
            </Link>
            <p className="truncate text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">
              Örgüt yönetim paneli
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-px overflow-y-auto p-2 pt-3">
          {filteredNav.map((item) => {
            const on =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const isNotif = item.href === '/notifications';
            const Icon = item.Icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSidebar}
                className={clsx(
                  'group flex items-center gap-3 rounded-md py-2.5 pl-2 pr-3 text-[13px] font-medium transition-colors',
                  on
                    ? 'border-l-2 border-chp-red bg-white/[0.08] text-white'
                    : 'border-l-2 border-transparent text-slate-400 hover:bg-white/[0.05] hover:text-slate-100'
                )}>
                <Icon
                  className={clsx(
                    'h-[18px] w-[18px] shrink-0',
                    on ? 'text-chp-red' : 'text-slate-500 group-hover:text-slate-300'
                  )}
                />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {isNotif && unread > 0 ? (
                  <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded bg-chp-red px-1 text-[10px] font-bold text-white tabular-nums">
                    {unread > 99 ? '99+' : unread}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <p className="line-clamp-3 text-[11px] leading-snug text-slate-500">
            {orgLabel || 'Örgüt bağlamı yükleniyor…'}
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:min-h-screen">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200/90 bg-white px-3 shadow-sm lg:px-6">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 lg:hidden"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-expanded={sidebarOpen}
            aria-label={sidebarOpen ? 'Menüyü kapat' : 'Menüyü aç'}>
            <MenuIcon open={sidebarOpen} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Aktif örgüt birimi
            </p>
            <p className="truncate text-sm font-semibold text-slate-800">{orgLabel || '—'}</p>
          </div>
          <div className="hidden border-l border-slate-200 pl-4 text-right sm:block">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Kullanıcı
            </p>
            <p className="max-w-[12rem] truncate text-sm font-medium text-slate-800">
              {user?.displayName ?? user?.username ?? '—'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => logout()}
            className="shrink-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
            Oturumu kapat
          </button>
        </header>

        <main className="mx-auto w-full max-w-[1440px] flex-1 overflow-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
