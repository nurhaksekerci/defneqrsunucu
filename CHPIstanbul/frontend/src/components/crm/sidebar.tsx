"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarRange,
  FileBarChart,
  Settings,
  LogIn,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

const nav = [
  { href: "/", label: "Pano", icon: LayoutDashboard },
  { href: "/etkinlikler", label: "Etkinlikler", icon: CalendarRange },
  { href: "/raporlar", label: "Raporlar", icon: FileBarChart },
  { href: "/ayarlar", label: "Ayarlar", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.replace("/giris");
  };

  return (
    <aside className="flex w-[260px] shrink-0 flex-col bg-chp-navy text-white">
      <div className="relative flex h-[52px] items-center gap-3 border-b border-white/[0.08] px-4">
        <div
          className="absolute inset-y-0 left-0 w-1 bg-chp-red"
          aria-hidden
        />
        <div className="ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/15 bg-white/[0.07] text-[11px] font-bold tracking-tight">
          CHP
        </div>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[13px] font-semibold tracking-tight text-white">
            İstanbul İl Örgütü
          </p>
          <p className="truncate text-[11px] font-medium text-white/50">
            Etkinlik yönetim sistemi
          </p>
        </div>
      </div>

      <div className="px-3 pt-5">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
          Menü
        </p>
        <nav className="flex flex-col gap-0.5">
          {nav.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/"
                ? pathname === "/"
                : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`group relative flex items-center gap-3 rounded-md py-2 pl-3 pr-3 text-[13px] font-medium transition-colors ${
                  active
                    ? "bg-[var(--sidebar-active)] text-white"
                    : "text-white/70 hover:bg-[var(--sidebar-hover)] hover:text-white"
                }`}
              >
                {active ? (
                  <span
                    className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-chp-red"
                    aria-hidden
                  />
                ) : null}
                <Icon
                  className={`h-[17px] w-[17px] shrink-0 ${
                    active ? "text-white" : "text-white/45 group-hover:text-white/75"
                  }`}
                  strokeWidth={1.75}
                />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto border-t border-white/[0.08] p-3">
        {user ? (
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-[13px] font-medium text-white/55 transition-colors hover:bg-[var(--sidebar-hover)] hover:text-white"
          >
            <LogOut className="h-[17px] w-[17px] shrink-0 opacity-80" strokeWidth={1.75} />
            Çıkış yap
          </button>
        ) : (
          <Link
            href="/giris"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium text-white/55 transition-colors hover:bg-[var(--sidebar-hover)] hover:text-white"
          >
            <LogIn className="h-[17px] w-[17px] shrink-0 opacity-80" strokeWidth={1.75} />
            Oturum aç
          </Link>
        )}
      </div>
    </aside>
  );
}
