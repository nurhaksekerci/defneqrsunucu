"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { StatCard } from "@/components/crm/stat-card";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useAuth } from "@/contexts/auth-context";
import { useIlBaskanligiSidebar } from "@/contexts/il-baskanligi-sidebar-context";
import { apiFetch, ApiError } from "@/lib/api-client";
import { COORDINATION_BUCKET_OPTIONS } from "@/lib/coordination-buckets";
import {
  appendEventListFilters,
  appendIlBaskanligiSidebarHatFilter,
} from "@/lib/event-list-filters";
import {
  hatSelectGroupsForKol,
  hatsVisibleUnderKol,
} from "@/lib/filter-hats-by-bucket";
import type { MeUser } from "@/contexts/auth-context";
import type { ApiEvent } from "@/lib/types/api";
import {
  ArrowRight,
  CalendarClock,
  CalendarRange,
  CheckCircle2,
  FileWarning,
  LayoutDashboard,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

type ApiHat = {
  id: number;
  name: string;
  code?: string;
  coordination_bucket?: string | null;
  coordination_line?: string | null;
};

function monthRange(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date_from: `${y}-${pad(m)}-01`,
    date_to: `${y}-${pad(m)}-${pad(last)}`,
  };
}

function monthLabel(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, (m ?? 1) - 1, 1);
  return d.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
}

function defaultMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function activityStatus(e: ApiEvent): string {
  if (e.status === "planned") return "Planlandı";
  if (e.status === "completed" && !e.has_report) return "Rapor eksik";
  return "Tamamlandı";
}

const badge = (durum: string) => {
  const base =
    "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-tight";
  if (durum === "Planlandı")
    return `${base} bg-slate-100/90 text-chp-navy ring-1 ring-slate-200/70`;
  if (durum === "Tamamlandı")
    return `${base} bg-emerald-50 text-emerald-900 ring-1 ring-emerald-100`;
  return `${base} bg-chp-red-subtle text-chp-red ring-1 ring-chp-red/15`;
};

function scopeDescription(user: MeUser): string {
  if (!user) return "";
  if (user.is_provincial_official) {
    if (user.hat_is_coordination)
      return "İl yetkilisi (Ana Kademe): tüm hatlar; kol ve hat süzgeci kullanılabilir.";
    return `İl yetkilisi: yalnızca “${user.hat_name ?? "—"}” hattı, tüm ilçeler.`;
  }
  if (user.hat_is_coordination)
    return `İlçe koordinasyonu: ${user.district_name ?? "ilçeniz"} kapsamında tüm hatlar; kol ve hat süzgeci kullanılabilir.`;
  return `İlçe kullanıcısı: ${user.district_name ?? "—"} · ${user.hat_name ?? "—"}.`;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const ilSidebar = useIlBaskanligiSidebar();
  const showIlceSidebar = Boolean(user?.show_sidebar_ilce_baskanliklari);
  const useSidebarScope = showIlceSidebar && ilSidebar != null;
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [filterBucket, setFilterBucket] = useState("");
  const [filterHat, setFilterHat] = useState("");
  const [hatOptions, setHatOptions] = useState<ApiHat[]>([]);
  const [hatsLoading, setHatsLoading] = useState(false);
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const showCoordinationFilters = Boolean(user?.hat_is_coordination);
  const showCoordinationFiltersOnPage =
    showCoordinationFilters && !useSidebarScope;
  const showKolColumn = Boolean(user?.is_provincial_official);

  useEffect(() => {
    if (!showCoordinationFiltersOnPage) return;
    let cancelled = false;
    setHatsLoading(true);
    apiFetch<ApiHat[]>("/api/org/hats/")
      .then((data) => {
        if (!cancelled) setHatOptions(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) {
          setHatOptions([]);
          toast.error("Hat listesi alınamadı");
        }
      })
      .finally(() => {
        if (!cancelled) setHatsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showCoordinationFiltersOnPage]);

  const hatOptionGroups = useMemo(() => {
    if (!filterBucket) return null;
    return hatSelectGroupsForKol(hatOptions, filterBucket);
  }, [filterBucket, hatOptions]);

  useEffect(() => {
    if (!filterHat) return;
    const allowed = filterBucket
      ? hatsVisibleUnderKol(hatOptions, filterBucket)
      : hatOptions;
    if (!allowed.some((h) => String(h.id) === filterHat)) {
      setFilterHat("");
    }
  }, [filterBucket, hatOptions, filterHat]);

  useEffect(() => {
    const { date_from, date_to } = monthRange(selectedMonth);
    const qs = new URLSearchParams();
    qs.set("date_from", date_from);
    qs.set("date_to", date_to);
    appendEventListFilters(qs, {
      coordinationBucket: showCoordinationFiltersOnPage ? filterBucket : undefined,
      hat: showCoordinationFiltersOnPage ? filterHat : undefined,
    });
    appendIlBaskanligiSidebarHatFilter(qs, {
      enabled: useSidebarScope,
      scopeMode: ilSidebar?.scopeMode ?? "all",
      hatId: ilSidebar?.selectedHatId ?? null,
    });
    let cancelled = false;
    setLoading(true);
    apiFetch<ApiEvent[]>(`/api/events/?${qs.toString()}`)
      .then((data) => {
        if (!cancelled) setEvents(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!cancelled) {
          setEvents([]);
          toast.error("Pano verisi alınamadı", {
            description:
              err instanceof ApiError
                ? `Sunucu ${err.status}`
                : "Bağlantıyı kontrol edin.",
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    selectedMonth,
    filterBucket,
    filterHat,
    showCoordinationFiltersOnPage,
    useSidebarScope,
    ilSidebar?.scopeMode,
    ilSidebar?.selectedHatId,
  ]);

  const stats = useMemo(() => {
    const plan = events.filter((e) => e.status === "planned").length;
    const done = events.filter((e) => e.status === "completed").length;
    const missing = events.filter(
      (e) => e.status === "completed" && !e.has_report,
    ).length;
    const hats = new Set(events.map((e) => e.hat_name)).size;
    const avg = hats > 0 ? (done / hats).toFixed(1) : "—";
    const scopeParts: string[] = [monthLabel(selectedMonth)];
    if (useSidebarScope && ilSidebar) {
      if (ilSidebar.scopeMode === "all") {
        scopeParts.push("Tüm İstanbul");
      } else {
        scopeParts.push(ilSidebar.selectedHatName ?? "Seçilen hat");
      }
    } else if (showCoordinationFilters) {
      if (filterBucket) {
        const b = COORDINATION_BUCKET_OPTIONS.find((x) => x.value === filterBucket);
        scopeParts.push(b?.label ?? filterBucket);
      }
      if (filterHat) {
        const h = hatOptions.find((x) => String(x.id) === filterHat);
        scopeParts.push(h ? h.name : "Seçilen hat");
      }
    }
    return {
      planlanan: String(plan),
      tamamlanan: String(done),
      raporBekleyen: String(missing),
      hatOrt: avg,
      hintPlan: "Seçilen ay (başlangıç tarihi)",
      hintTam: scopeParts.join(" · "),
      hintRapor: "Tamamlanan, raporu olmayan",
      hintHat: hats > 0 ? `${hats} farklı hat` : "—",
    };
  }, [
    events,
    selectedMonth,
    showCoordinationFilters,
    useSidebarScope,
    ilSidebar,
    filterBucket,
    filterHat,
    hatOptions,
  ]);

  const rows = useMemo(
    () =>
      events.map((e) => ({
        key: e.id,
        /** Örgüt hattı adı (ilçe başkanlığı hatları için doğrudan eşleşir) */
        ilceBaskanligi: e.hat_name,
        what: e.title,
        kol: e.coordination_kolu ?? "—",
        ilce: e.district_name,
        where:
          e.location_kind === "address" && e.address_text.trim()
            ? e.address_text
            : `${e.district_name} · harita/adres`,
        durum: activityStatus(e),
        tarih: new Date(e.starts_at).toLocaleDateString("tr-TR", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
      })),
    [events],
  );

  const tableColCount = showKolColumn ? 7 : 6;

  const selectCls =
    "h-10 min-w-[160px] rounded-xl border border-border/90 bg-background px-3 text-[13px] font-medium shadow-sm outline-none transition-shadow focus:border-chp-navy/25 focus:ring-2 focus:ring-chp-navy/10";

  return (
    <div className="mx-auto flex max-w-[1320px] flex-col gap-8 pb-4">
      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-slate-50/95 via-white to-slate-50/80 p-6 shadow-sm ring-1 ring-black/[0.04] sm:p-8">
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-chp-red/[0.07] blur-3xl"
          aria-hidden
        />
        <div className="pointer-events-none absolute -bottom-24 -left-12 h-48 w-48 rounded-full bg-chp-navy/[0.04] blur-3xl" aria-hidden />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 text-chp-red/90">
              <LayoutDashboard className="h-4 w-4" strokeWidth={2} aria-hidden />
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">
                Pano
              </p>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-[1.85rem]">
              Etkinlik özeti
            </h1>
            <p className="mt-2 text-[14px] leading-relaxed text-muted">
              {user ? scopeDescription(user) : "Yükleniyor…"}
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border/60 bg-white/70 p-3 shadow-sm backdrop-blur-sm">
            {showCoordinationFiltersOnPage ? (
              <>
                <SearchableSelect
                  id="dash-bucket"
                  label="Kol"
                  options={COORDINATION_BUCKET_OPTIONS}
                  value={filterBucket}
                  onChange={setFilterBucket}
                  emptyLabel="Tüm kollar"
                  disabled={false}
                  minWidthClass="min-w-[200px]"
                />
                <SearchableSelect
                  id="dash-hat"
                  label="Hat"
                  options={
                    hatOptionGroups != null
                      ? []
                      : hatOptions.map((h) => ({
                          value: String(h.id),
                          label: h.name,
                        }))
                  }
                  optionGroups={hatOptionGroups}
                  value={filterHat}
                  onChange={setFilterHat}
                  emptyLabel={
                    filterBucket ? "Koldaki tüm hatlar" : "Tüm hatlar"
                  }
                  disabled={hatsLoading}
                  minWidthClass="min-w-[220px]"
                />
              </>
            ) : null}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="dash-month"
                className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted"
              >
                Dönem
              </label>
              <input
                id="dash-month"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className={`${selectCls} min-w-[158px]`}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Planlanan etkinlik"
          value={loading ? "…" : stats.planlanan}
          hint={stats.hintPlan}
          icon={CalendarClock}
          accent="navy"
        />
        <StatCard
          label="Tamamlanan (ay)"
          value={loading ? "…" : stats.tamamlanan}
          hint={stats.hintTam}
          icon={CheckCircle2}
          accent="success"
        />
        <StatCard
          label="Rapor bekleyen"
          value={loading ? "…" : stats.raporBekleyen}
          hint={stats.hintRapor}
          icon={FileWarning}
          accent="red"
        />
        <StatCard
          label="Hat başına ortalama"
          value={loading ? "…" : stats.hatOrt}
          hint={stats.hintHat}
          icon={TrendingUp}
          accent="navy"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <section className="overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-sm ring-1 ring-black/[0.03]">
            <div className="flex flex-col gap-1 border-b border-border/80 bg-slate-50/90 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
                Özet hareketler
              </h2>
              <div className="flex items-center gap-2 text-[12px] text-muted">
                <CalendarRange className="h-3.5 w-3.5 opacity-70" aria-hidden />
                <span>{monthLabel(selectedMonth)}</span>
                <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-foreground">
                  {loading ? "…" : rows.length}
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              {!loading && rows.length === 0 ? (
                <p className="px-6 py-14 text-center text-[14px] text-muted">
                  Bu dönem için kayıt yok.
                </p>
              ) : (
                <table
                  className={`w-full text-left text-[13px] ${showKolColumn ? "min-w-[640px]" : "min-w-[560px]"}`}
                >
                  <thead>
                    <tr className="border-b border-border/80 bg-white">
                      <th className="min-w-[140px] px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-muted sm:px-6">
                        İlçe başkanlığı
                      </th>
                      <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted sm:px-6">
                        Etkinlik
                      </th>
                      {showKolColumn ? (
                        <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted sm:px-6">
                          Kol
                        </th>
                      ) : null}
                      <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted sm:px-6">
                        İlçe
                      </th>
                      <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted sm:px-6">
                        Yer
                      </th>
                      <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted sm:px-6">
                        Durum
                      </th>
                      <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-muted sm:px-6">
                        Tarih
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {loading ? (
                      <tr>
                        <td
                          colSpan={tableColCount}
                          className="px-6 py-12 text-center text-[13px] text-muted"
                        >
                          Yükleniyor…
                        </td>
                      </tr>
                    ) : (
                      rows.map((row) => (
                        <tr
                          key={row.key}
                          className="border-b border-border/60 transition-colors last:border-0 hover:bg-slate-50/80"
                        >
                          <td className="max-w-[220px] px-5 py-3.5 text-[13px] font-medium text-foreground sm:px-6">
                            {row.ilceBaskanligi}
                          </td>
                          <td className="px-5 py-3.5 font-medium text-foreground sm:px-6">
                            {row.what}
                          </td>
                          {showKolColumn ? (
                            <td className="px-5 py-3.5 text-muted sm:px-6">
                              {row.kol}
                            </td>
                          ) : null}
                          <td className="px-5 py-3.5 text-muted sm:px-6">
                            {row.ilce}
                          </td>
                          <td className="max-w-[200px] truncate px-5 py-3.5 text-muted sm:px-6">
                            {row.where}
                          </td>
                          <td className="px-5 py-3.5 sm:px-6">
                            <span className={badge(row.durum)}>{row.durum}</span>
                          </td>
                          <td className="px-5 py-3.5 text-right tabular-nums text-muted sm:px-6">
                            {row.tarih}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section className="overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-white to-slate-50/90 shadow-sm ring-1 ring-black/[0.03]">
            <div className="border-b border-border/70 px-5 py-4">
              <h2 className="text-[14px] font-semibold tracking-tight text-foreground">
                Hızlı işlemler
              </h2>
              <p className="mt-1 text-[12px] text-muted">
                Sık kullanılan sayfalar
              </p>
            </div>
            <ul className="divide-y divide-border/70 p-2">
              {[
                {
                  label: "Etkinlikler",
                  hint: "Planla veya tamamla",
                  href: "/etkinlikler",
                },
                {
                  label: "Raporlar",
                  hint: "Etkinlik sonrası raporlar",
                  href: "/raporlar",
                },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="group flex items-center justify-between gap-3 rounded-xl px-3 py-3.5 text-left transition-colors hover:bg-white"
                  >
                    <div>
                      <p className="text-[13px] font-semibold text-foreground">
                        {item.label}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted">{item.hint}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
