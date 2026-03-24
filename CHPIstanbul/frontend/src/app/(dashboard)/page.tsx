"use client";

import { useEffect, useMemo, useState } from "react";
import { StatCard } from "@/components/crm/stat-card";
import { Modal } from "@/components/ui/modal";
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
import type { ApiEvent, ApiEventDetail } from "@/lib/types/api";
import {
  CalendarClock,
  CalendarRange,
  CheckCircle2,
  FileWarning,
  ImageOff,
  Images,
  LayoutDashboard,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

type ApiHat = {
  id: number;
  name: string;
  code?: string;
  coordination_bucket?: string | null;
  coordination_line?: string | null;
};

type PeriodPreset = "today" | "week" | "month";

/** Pazartesi–Pazar içinde bugün; başlangıç tarihi (starts_at) ile eşleşir. */
function periodRange(preset: PeriodPreset): { date_from: string; date_to: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const ymd = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (preset === "today") {
    const t = ymd(now);
    return { date_from: t, date_to: t };
  }
  if (preset === "month") {
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const last = new Date(y, m, 0).getDate();
    return {
      date_from: `${y}-${pad(m)}-01`,
      date_to: `${y}-${pad(m)}-${pad(last)}`,
    };
  }
  const day = now.getDay();
  const diffToMonday = (day + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { date_from: ymd(monday), date_to: ymd(sunday) };
}

function periodShortLabel(preset: PeriodPreset): string {
  const { date_from, date_to } = periodRange(preset);
  if (preset === "today") {
    const d = new Date(`${date_from}T12:00:00`);
    return d.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  if (preset === "month") {
    const d = new Date(`${date_from}T12:00:00`);
    return d.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
  }
  const a = new Date(`${date_from}T12:00:00`);
  const b = new Date(`${date_to}T12:00:00`);
  return `${a.toLocaleDateString("tr-TR", { day: "numeric", month: "short" })} – ${b.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}`;
}

type MetricFilter = "all" | "planned" | "completed" | "report_missing";

const REPORT_STATUS_LABEL: Record<string, string> = {
  draft: "Taslak",
  review: "İncelemede",
  published: "Yayında",
};

function activityStatus(e: ApiEvent): string {
  if (e.status === "planned") return "Planlandı";
  if (e.status === "completed" && !e.has_report) return "Rapor eksik";
  return "Tamamlandı";
}

function eventWhereLabel(e: ApiEvent): string {
  return e.location_kind === "address" && e.address_text.trim()
    ? e.address_text
    : `${e.district_name} · harita/adres`;
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
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>("month");
  const [filterBucket, setFilterBucket] = useState("");
  const [filterHat, setFilterHat] = useState("");
  const [hatOptions, setHatOptions] = useState<ApiHat[]>([]);
  const [hatsLoading, setHatsLoading] = useState(false);
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [metricFilter, setMetricFilter] = useState<MetricFilter>("all");
  const [detailEventId, setDetailEventId] = useState<number | null>(null);
  const [detail, setDetail] = useState<ApiEventDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

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
    const { date_from, date_to } = periodRange(periodPreset);
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
    periodPreset,
    filterBucket,
    filterHat,
    showCoordinationFiltersOnPage,
    useSidebarScope,
    ilSidebar?.scopeMode,
    ilSidebar?.selectedHatId,
  ]);

  useEffect(() => {
    if (detailEventId == null) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    setDetail(null);
    apiFetch<ApiEventDetail>(`/api/events/${detailEventId}/`)
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error("Etkinlik detayı alınamadı", {
            description:
              err instanceof ApiError ? `Sunucu ${err.status}` : undefined,
          });
          setDetailEventId(null);
        }
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [detailEventId]);

  const filteredEvents = useMemo(() => {
    if (metricFilter === "all") return events;
    if (metricFilter === "planned")
      return events.filter((e) => e.status === "planned");
    if (metricFilter === "completed")
      return events.filter((e) => e.status === "completed");
    return events.filter(
      (e) => e.status === "completed" && !e.has_report,
    );
  }, [events, metricFilter]);

  const stats = useMemo(() => {
    const plan = events.filter((e) => e.status === "planned").length;
    const done = events.filter((e) => e.status === "completed").length;
    const missing = events.filter(
      (e) => e.status === "completed" && !e.has_report,
    ).length;
    const scopeParts: string[] = [periodShortLabel(periodPreset)];
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
      hintPlan:
        periodPreset === "today"
          ? "Bugün — başlangıç tarihine göre"
          : periodPreset === "week"
            ? "Bu hafta (Pt–Pz) — başlangıç tarihine göre"
            : "Bu ay — başlangıç tarihine göre",
      hintTam: scopeParts.join(" · "),
      hintRapor: "Tamamlanan, raporu olmayan",
    };
  }, [
    events,
    periodPreset,
    showCoordinationFilters,
    useSidebarScope,
    ilSidebar,
    filterBucket,
    filterHat,
    hatOptions,
  ]);

  const rows = useMemo(
    () =>
      filteredEvents.map((e) => ({
        key: e.id,
        /** Örgüt hattı adı (ilçe başkanlığı hatları için doğrudan eşleşir) */
        ilceBaskanligi: e.hat_name,
        what: e.title,
        kol: e.coordination_kolu ?? "—",
        ilce: e.district_name,
        where: eventWhereLabel(e),
        durum: activityStatus(e),
        tarih: new Date(e.starts_at).toLocaleDateString("tr-TR", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        thumbs: e.report_image_urls ?? [],
      })),
    [filteredEvents],
  );

  const tableColCount = (showKolColumn ? 7 : 6) + 1;

  return (
    <div className="mx-auto flex max-w-[1320px] flex-col gap-8 pb-4">
      <div className="rounded-2xl border border-border/80 bg-surface p-6 shadow-sm ring-1 ring-black/[0.04] sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
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
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                Dönem
              </span>
              <div
                className="flex flex-wrap gap-1 rounded-xl border border-border/80 bg-background p-1 shadow-sm"
                role="group"
                aria-label="Dönem süzgeci"
              >
                {(
                  [
                    { id: "today" as const, label: "Bugün" },
                    { id: "week" as const, label: "Bu hafta" },
                    { id: "month" as const, label: "Bu ay" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPeriodPreset(opt.id)}
                    className={`rounded-lg px-3 py-2 text-[12px] font-semibold transition-colors ${
                      periodPreset === opt.id
                        ? "bg-chp-navy text-white shadow-sm"
                        : "text-foreground hover:bg-slate-100"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Planlanan etkinlik"
          value={loading ? "…" : stats.planlanan}
          hint={stats.hintPlan}
          icon={CalendarClock}
          accent="navy"
          selected={metricFilter === "planned"}
          onClick={() =>
            setMetricFilter((f) => (f === "planned" ? "all" : "planned"))
          }
        />
        <StatCard
          label="Tamamlanan"
          value={loading ? "…" : stats.tamamlanan}
          hint={stats.hintTam}
          icon={CheckCircle2}
          accent="success"
          selected={metricFilter === "completed"}
          onClick={() =>
            setMetricFilter((f) => (f === "completed" ? "all" : "completed"))
          }
        />
        <StatCard
          label="Rapor bekleyen"
          value={loading ? "…" : stats.raporBekleyen}
          hint={stats.hintRapor}
          icon={FileWarning}
          accent="red"
          selected={metricFilter === "report_missing"}
          onClick={() =>
            setMetricFilter((f) =>
              f === "report_missing" ? "all" : "report_missing",
            )
          }
        />
      </div>

      <section className="overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-sm ring-1 ring-black/[0.03]">
            <div className="flex flex-col gap-2 border-b border-border/80 bg-slate-50/90 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
                  {metricFilter === "completed"
                    ? "Tamamlanan etkinlikler"
                    : "Özet hareketler"}
                </h2>
                {metricFilter !== "all" ? (
                  <button
                    type="button"
                    onClick={() => setMetricFilter("all")}
                    className="rounded-full border border-border bg-white px-2.5 py-0.5 text-[11px] font-semibold text-foreground shadow-sm transition-colors hover:bg-slate-50"
                  >
                    Tümü
                  </button>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted">
                <CalendarRange className="h-3.5 w-3.5 opacity-70" aria-hidden />
                <span>{periodShortLabel(periodPreset)}</span>
                {metricFilter !== "all" ? (
                  <span className="text-[11px] text-foreground/80">
                    {metricFilter === "planned"
                      ? "Yalnız planlanan"
                      : metricFilter === "completed"
                        ? "Yalnız tamamlanan"
                        : "Raporu eksik tamamlanan"}
                  </span>
                ) : null}
                <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-foreground">
                  {loading
                    ? "…"
                    : metricFilter === "completed"
                      ? filteredEvents.length
                      : rows.length}
                </span>
              </div>
            </div>
            <div
              className={
                metricFilter === "completed" ? "" : "overflow-x-auto"
              }
            >
              {loading && metricFilter === "completed" ? (
                <div className="flex items-center justify-center gap-2 py-16 text-[13px] text-muted">
                  <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2} />
                  Yükleniyor…
                </div>
              ) : !loading &&
                metricFilter === "completed" &&
                filteredEvents.length === 0 ? (
                <p className="px-6 py-14 text-center text-[14px] text-muted">
                  {events.length === 0
                    ? "Bu dönem için kayıt yok."
                    : "Bu süzgeç için kayıt yok. Tümünü göstermek için üstteki “Tümü”ye veya kartı yeniden tıklayın."}
                </p>
              ) : !loading && metricFilter === "completed" ? (
                <div className="grid grid-cols-2 gap-1.5 p-2 sm:grid-cols-3 sm:gap-2 sm:p-4 md:grid-cols-4 md:gap-2">
                  {filteredEvents.map((e) => {
                    const urls = e.report_image_urls ?? [];
                    const cover = urls[0];
                    const hasMore = urls.length > 1;
                    return (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => setDetailEventId(e.id)}
                        className={`group relative aspect-square overflow-hidden rounded-md border border-border/70 text-left shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-chp-navy/30 ${
                          cover ? "bg-slate-100" : "bg-slate-50"
                        }`}
                        title={e.title}
                      >
                        {cover ? (
                          <>
                            <img
                              src={cover}
                              alt=""
                              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                            />
                            <div
                              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent opacity-80 transition-opacity group-hover:opacity-100"
                              aria-hidden
                            />
                            {hasMore ? (
                              <div className="absolute right-2 top-2 rounded bg-black/45 p-1 text-white backdrop-blur-[2px]">
                                <Images
                                  className="h-3.5 w-3.5"
                                  strokeWidth={2}
                                />
                              </div>
                            ) : null}
                            <div className="absolute inset-x-0 bottom-0 p-2.5 pt-8">
                              <p className="line-clamp-2 text-[11px] font-semibold leading-snug text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]">
                                {e.title}
                              </p>
                              <p className="mt-0.5 line-clamp-1 text-[10px] text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                                {e.hat_name} · {e.district_name}
                              </p>
                            </div>
                          </>
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-3 text-center">
                            <ImageOff
                              className="h-9 w-9 shrink-0 text-muted"
                              strokeWidth={1.5}
                              aria-hidden
                            />
                            <span className="line-clamp-3 text-[11px] font-semibold leading-snug text-foreground">
                              {e.title}
                            </span>
                            <span className="line-clamp-2 text-[10px] text-muted">
                              {e.hat_name} · {e.district_name}
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : !loading && rows.length === 0 ? (
                <p className="px-6 py-14 text-center text-[14px] text-muted">
                  {events.length === 0
                    ? "Bu dönem için kayıt yok."
                    : "Bu süzgeç için kayıt yok. Tümünü göstermek için üstteki “Tümü”ye veya kartı yeniden tıklayın."}
                </p>
              ) : metricFilter !== "completed" ? (
                <table
                  className={`w-full text-left text-[13px] ${showKolColumn ? "min-w-[720px]" : "min-w-[640px]"}`}
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
                        Görseller
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
                            {row.thumbs.length > 0 ? (
                              <div className="flex max-w-[168px] flex-wrap gap-1">
                                {row.thumbs.slice(0, 6).map((url, i) => (
                                  <button
                                    key={`${row.key}-t-${i}`}
                                    type="button"
                                    onClick={() => setDetailEventId(row.key)}
                                    className="h-9 w-9 shrink-0 overflow-hidden rounded-md border border-border/80 bg-slate-100 ring-offset-2 transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chp-navy/30"
                                    title="Raporu aç"
                                  >
                                    <img
                                      src={url}
                                      alt=""
                                      className="h-full w-full object-cover"
                                    />
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
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
              ) : null}
            </div>
      </section>

      <Modal
        open={detailEventId != null}
        onClose={() => {
          setDetailEventId(null);
          setDetail(null);
        }}
        title={detail?.title ?? "Etkinlik"}
        description={
          detail
            ? `${new Date(detail.starts_at).toLocaleString("tr-TR", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })} · ${detail.hat_name} · ${detail.district_name}`
            : undefined
        }
        size="xl"
        ariaLabel="Etkinlik planı ve rapor"
      >
        {detailLoading ? (
          <div className="flex items-center justify-center gap-2 py-14 text-[13px] text-muted">
            <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2} />
            Yükleniyor…
          </div>
        ) : detail ? (
          <div className="space-y-8">
            <section className="space-y-3">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                Etkinlik planı
              </h3>
              <dl className="grid gap-2 text-[13px] sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <dt className="text-[11px] font-medium text-muted">Durum</dt>
                  <dd className="mt-0.5 font-medium text-foreground">
                    {detail.status === "planned" ? "Planlandı" : "Tamamlandı"}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-[11px] font-medium text-muted">Açıklama</dt>
                  <dd className="mt-0.5 whitespace-pre-wrap text-foreground">
                    {detail.description || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-medium text-muted">Konum</dt>
                  <dd className="mt-0.5 text-foreground">
                    {eventWhereLabel(detail)}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="space-y-3 border-t border-border pt-6">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                Rapor
              </h3>
              {detail.report ? (
                <div className="space-y-4">
                  <p className="text-[12px] text-muted">
                    Durum:{" "}
                    <span className="font-medium text-foreground">
                      {REPORT_STATUS_LABEL[detail.report.status] ??
                        detail.report.status}
                    </span>
                  </p>
                  <div className="whitespace-pre-wrap text-[13px] text-foreground">
                    {detail.report.body || "—"}
                  </div>
                  {detail.report.images.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {detail.report.images.map((img) => (
                        <a
                          key={img.id}
                          href={img.image}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block overflow-hidden rounded-lg border border-border bg-slate-100"
                        >
                          <img
                            src={img.image}
                            alt=""
                            className="aspect-auto max-h-48 w-full object-contain"
                          />
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="text-[13px] text-muted">Bu etkinlik için rapor yok.</p>
              )}
            </section>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
