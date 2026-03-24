"use client";

import { FormEvent, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useIlBaskanligiSidebar } from "@/contexts/il-baskanligi-sidebar-context";
import { NotificationDropdown } from "./notification-dropdown";

type HeaderProps = {
  title: string;
  description?: string;
};

export function CrmHeader({ title, description }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const ilSidebar = useIlBaskanligiSidebar();
  const [query, setQuery] = useState("");

  const displayName =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim() ||
    user?.username ||
    "Kullanıcı";

  const initial = displayName.slice(0, 1).toUpperCase();

  useEffect(() => {
    if (pathname.startsWith("/arama")) {
      setQuery(searchParams.get("q") ?? "");
    }
  }, [pathname, searchParams]);

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/arama?q=${encodeURIComponent(q)}`);
  };

  return (
    <header className="sticky top-0 z-10 shrink-0 border-b border-border bg-surface/95 backdrop-blur-md">
      <div className="h-0.5 w-full bg-chp-red" aria-hidden />
      <div className="flex min-h-[56px] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6">
        <div className="min-w-0 shrink-0 sm:max-w-[min(100%,280px)] lg:max-w-[320px]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            İstanbul İl Örgütü
          </p>
          <h1 className="truncate text-[17px] font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {description ? (
            <p className="hidden truncate text-[12px] text-muted lg:block">
              {description}
            </p>
          ) : null}
          {user?.show_sidebar_ilce_baskanliklari && ilSidebar ? (
            <p className="mt-0.5 hidden max-w-full truncate text-[12px] font-medium text-chp-red/95 lg:block">
              {ilSidebar.scopeMode === "all"
                ? "Görünüm: Tüm İstanbul"
                : `Görünüm: ${ilSidebar.selectedHatName ?? "İlçe başkanlığı"}`}
            </p>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
          <form
            onSubmit={submitSearch}
            className="relative w-full sm:w-[220px] md:w-[248px] lg:w-[272px]"
            role="search"
          >
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <input
              type="search"
              name="q"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Etkinlik, rapor veya ilçe ara…"
              className="h-9 w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-[13px] outline-none transition-shadow placeholder:text-muted focus:border-border-strong focus:ring-1 focus:ring-chp-navy/12"
              aria-label="Ara"
              autoComplete="off"
            />
          </form>

          <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-3">
            <div className="flex items-center gap-2 border-l border-border pl-3 sm:pl-4">
              <NotificationDropdown />
              <div className="hidden h-9 items-center gap-2 rounded-md border border-border bg-background pl-1 pr-2.5 sm:flex">
                <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-chp-navy text-[11px] font-semibold text-white">
                  {initial}
                </div>
                <div className="hidden text-left leading-tight lg:block">
                  <p className="max-w-[140px] truncate text-[12px] font-semibold text-foreground">
                    {displayName}
                  </p>
                  <p className="max-w-[140px] truncate text-[10px] text-muted">
                    {user?.hat_name && user?.district_name
                      ? `${user.hat_name} · ${user.district_name}`
                      : "Profil"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
