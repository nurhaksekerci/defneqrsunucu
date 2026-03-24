"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  CalendarRange,
  FileBarChart,
  Settings,
  LogIn,
  LogOut,
  MapPinned,
  Users,
  CalendarDays,
  X,
  LucideIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api-client";
import {
  bolgeTabLabel,
  electionZoneLabel,
} from "@/lib/election-zone-labels";

const nav: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Pano", icon: LayoutDashboard },
  { href: "/etkinlikler", label: "Etkinlikler", icon: CalendarRange },
  { href: "/raporlar", label: "Raporlar", icon: FileBarChart },
  { href: "/ayarlar", label: "Ayarlar", icon: Settings },
];

type ApiHatSidebar = {
  id: number;
  code: string;
  name: string;
  election_zone?: number | null;
  coordination_line?: string | null;
  coordination_bucket?: string | null;
  event_count?: number;
  profile_count?: number;
};

const ZONE_TABS = [1, 2, 3] as const;

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [hats, setHats] = useState<ApiHatSidebar[]>([]);
  const [hatsLoading, setHatsLoading] = useState(false);
  const [zoneTab, setZoneTab] = useState<(typeof ZONE_TABS)[number]>(1);
  const [selectedHatId, setSelectedHatId] = useState<number | null>(null);

  const showBolgeSidebar = Boolean(user?.show_sidebar_ilce_baskanliklari);

  useEffect(() => {
    if (!showBolgeSidebar) {
      setHats([]);
      setSelectedHatId(null);
      return;
    }
    let cancelled = false;
    setHatsLoading(true);
    const qs = new URLSearchParams({
      coordination_line: "ilce_baskanligi",
      coordination_bucket: "ana_kademe",
    });
    apiFetch<ApiHatSidebar[]>(`/api/org/hats/?${qs.toString()}`)
      .then((data) => {
        if (!cancelled) setHats(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setHats([]);
      })
      .finally(() => {
        if (!cancelled) setHatsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showBolgeSidebar]);

  const hatsInActiveZone = useMemo(() => {
    return hats
      .filter((h) => h.election_zone === zoneTab)
      .sort((a, b) => a.name.localeCompare(b.name, "tr"));
  }, [hats, zoneTab]);

  const selectedHat = useMemo(
    () => hats.find((h) => h.id === selectedHatId) ?? null,
    [hats, selectedHatId],
  );

  useEffect(() => {
    if (
      selectedHatId != null &&
      selectedHat &&
      selectedHat.election_zone !== zoneTab
    ) {
      setSelectedHatId(null);
    }
  }, [zoneTab, selectedHatId, selectedHat]);

  const handleLogout = () => {
    logout();
    router.replace("/giris");
  };

  return (
    <aside className="flex min-h-screen w-[260px] shrink-0 flex-col bg-chp-navy text-white">
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

      {showBolgeSidebar ? (
        <div className="flex min-h-0 flex-1 flex-col border-t border-white/[0.08]">
          <div className="shrink-0 px-3 pt-4">
            <p className="mb-2 flex items-center gap-2 px-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
              <MapPinned className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Ana Kademe · İlçe başkanlıkları
            </p>
            <div
              className="flex rounded-md border border-white/10 bg-white/[0.04] p-0.5"
              role="tablist"
              aria-label="Seçim bölgesi"
            >
              {ZONE_TABS.map((z) => {
                const active = zoneTab === z;
                return (
                  <button
                    key={z}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setZoneTab(z)}
                    className={`min-w-0 flex-1 rounded px-1 py-1.5 text-center text-[11px] font-semibold transition-colors ${
                      active
                        ? "bg-chp-red text-white shadow-sm"
                        : "text-white/65 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    {bolgeTabLabel(z)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 pt-2">
            {hatsLoading ? (
              <p className="px-1 py-2 text-[12px] text-white/45">Yükleniyor…</p>
            ) : hatsInActiveZone.length === 0 ? (
              <p className="px-1 py-2 text-[12px] leading-snug text-white/45">
                Bu bölgede kayıtlı Ana Kademe ilçe başkanlığı hattı yok veya
                seçim bölgesi atanmamış. Hatları yönetim panelinden kontrol
                edin.
              </p>
            ) : (
              <ul className="space-y-0.5">
                {hatsInActiveZone.map((h) => {
                  const sel = selectedHatId === h.id;
                  return (
                    <li key={h.id}>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedHatId(sel ? null : h.id)
                        }
                        className={`w-full rounded-md px-2 py-1.5 text-left text-[12px] leading-snug transition-colors ${
                          sel
                            ? "bg-[var(--sidebar-active)] text-white"
                            : "text-white/75 hover:bg-[var(--sidebar-hover)] hover:text-white"
                        }`}
                      >
                        {h.name}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {selectedHat ? (
            <div className="shrink-0 border-t border-white/[0.08] bg-black/20 p-3">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-chp-red/95">
                    Özet
                  </p>
                  <p className="truncate text-[13px] font-semibold text-white">
                    {selectedHat.name}
                  </p>
                  <p className="text-[11px] text-white/50">
                    {electionZoneLabel(selectedHat.election_zone)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedHatId(null)}
                  className="shrink-0 rounded p-1 text-white/45 hover:bg-white/10 hover:text-white"
                  aria-label="Özeti kapat"
                >
                  <X className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>
              <dl className="space-y-2 text-[12px]">
                <div className="flex items-center justify-between gap-2">
                  <dt className="flex items-center gap-1.5 text-white/50">
                    <span className="font-mono text-[10px] text-white/35">
                      kod
                    </span>
                  </dt>
                  <dd className="truncate font-mono text-white/90">
                    {selectedHat.code || "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="flex items-center gap-1.5 text-white/50">
                    <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                    Etkinlik
                  </dt>
                  <dd className="tabular-nums text-white/90">
                    {selectedHat.event_count ?? 0}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="flex items-center gap-1.5 text-white/50">
                    <Users className="h-3.5 w-3.5 shrink-0" />
                    Profil
                  </dt>
                  <dd className="tabular-nums text-white/90">
                    {selectedHat.profile_count ?? 0}
                  </dd>
                </div>
              </dl>
            </div>
          ) : null}
        </div>
      ) : null}

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
