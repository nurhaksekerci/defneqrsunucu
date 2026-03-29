'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode, useEffect, useState } from 'react';

import { useAuth } from '@/components/AuthProvider';
import { fetchOrgContextLabel, fetchUnreadNotificationCount } from '@/lib/api';
import { hasPresidentMembershipRole } from '@/lib/userRoles';
import clsx from 'clsx';

const nav = [
  { href: '/feed', label: 'Akış', icon: '◇' },
  { href: '/planned', label: 'Planlanan', icon: '▤' },
  { href: '/plan', label: 'Planla', icon: '＋' },
  { href: '/report', label: 'Rapor', icon: '▦' },
  { href: '/notifications', label: 'Bildirimler', icon: '◉' },
  { href: '/profile', label: 'Profil', icon: '◎' },
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
    <div className="flex min-h-screen bg-slate-100">
      {sidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          aria-label="Menüyü kapat"
          onClick={closeSidebar}
        />
      ) : null}

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex w-56 flex-col border-r border-slate-700 bg-slate-800 transition-transform duration-200 lg:static lg:z-0 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}>
        <div className="flex h-14 items-center gap-2 border-b border-slate-700 px-4 lg:h-[3.25rem]">
          <span className="h-8 w-1 rounded-sm bg-chp-red" aria-hidden />
          <div className="min-w-0">
            <Link
              href="/feed"
              onClick={closeSidebar}
              className="block truncate text-sm font-bold tracking-tight text-white">
              CHP İstanbul
            </Link>
            <p className="truncate text-[10px] font-medium uppercase tracking-wider text-slate-400">
              Örgüt paneli
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {filteredNav.map((item) => {
            const on =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const isNotif = item.href === '/notifications';
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSidebar}
                className={clsx(
                  'relative flex items-center gap-2 rounded-r-md border-l-4 py-2.5 pl-3 pr-2 text-sm font-medium transition-colors',
                  on
                    ? 'border-chp-red bg-slate-900/70 text-white'
                    : 'border-transparent text-slate-300 hover:bg-slate-700/60 hover:text-white'
                )}>
                <span className="w-4 text-center text-xs opacity-70" aria-hidden>
                  {item.icon}
                </span>
                <span className="flex-1 truncate">{item.label}</span>
                {isNotif && unread > 0 ? (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded bg-chp-red px-1 text-[10px] font-bold text-white">
                    {unread > 99 ? '99+' : unread}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-700 p-3 text-xs text-slate-500">
          <p className="line-clamp-2 leading-snug">{orgLabel || 'Örgüt bağlamı yükleniyor…'}</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:min-h-screen">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-3 lg:px-5">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded border border-slate-200 text-slate-700 lg:hidden"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-expanded={sidebarOpen}
            aria-label={sidebarOpen ? 'Menüyü kapat' : 'Menüyü aç'}>
            <MenuIcon open={sidebarOpen} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-slate-500">Aktif örgüt</p>
            <p className="truncate text-sm font-semibold text-slate-800">{orgLabel || '—'}</p>
          </div>
          <div className="hidden text-right sm:block">
            <p className="truncate text-xs text-slate-500">Oturum</p>
            <p className="max-w-[10rem] truncate text-sm font-medium text-slate-800">
              {user?.displayName ?? user?.username ?? '—'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => logout()}
            className="shrink-0 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            Çıkış
          </button>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
