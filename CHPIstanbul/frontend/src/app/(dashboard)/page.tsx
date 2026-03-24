"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { StatCard } from "@/components/crm/stat-card";
import { SectionCard } from "@/components/crm/section-card";
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
  CalendarClock,
  CheckCircle2,
  FileWarning,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

type ApiDistrict = { id: number; name: string };

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
    "inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-tight";
  if (durum === "Planlandı")
    return `${base} bg-slate-100 text-chp-navy ring-1 ring-slate-200/80`;
  if (durum === "Tamamlandı")
    return `${base} bg-emerald-50 text-emerald-900 ring-1 ring-emerald-100`;
  return `${base} bg-chp-red-subtle text-chp-red ring-1 ring-chp-red/15`;
};

function scopeDescription(user: MeUser): string {
  if (!user) return "";
  if (user.is_provincial_official) {
    if (user.hat_is_coordination)
      return "İl yetkilisi (Ana Kademe): tüm hatlar. Kol, hat ve ilçe süzgeci kullanılabilir.";
    return `İl yetkilisi: yalnızca “${user.hat_name ?? "—"}” hattı, tüm ilçeler. İsteğe bağlı ilçe süzgeci.`;
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
  const [filterDistrict, setFilterDistrict] = useState("");
  const [districtOptions, setDistrictOptions] = useState<ApiDistrict[]>([]);
  const [districtsLoading, setDistrictsLoading] = useState(false);
  const [filterBucket, setFilterBucket] = useState("");
  const [filterHat, setFilterHat] = useState("");
  const [hatOptions, setHatOptions] = useState<ApiHat[]>([]);
  const [hatsLoading, setHatsLoading] = useState(false);
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const showDistrictFilter = Boolean(user?.is_provincial_official);
  const showCoordinationFilters = Boolean(user?.hat_is_coordination);
  const showCoordinationFiltersOnPage =
    showCoordinationFilters && !useSidebarScope;

  useEffect(() => {
    if (!showDistrictFilter) return;
    let cancelled = false;
    setDistrictsLoading(true);
    apiFetch<ApiDistrict[]>("/api/org/districts/")
      .then((data) => {
        if (!cancelled) setDistrictOptions(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) {
          setDistrictOptions([]);
          toast.error("İlçe listesi alınamadı");
        }
      })
      .finally(() => {
        if (!cancelled) setDistrictsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showDistrictFilter]);

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
      district: showDistrictFilter ? filterDistrict : undefined,
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
    filterDistrict,
    showDistrictFilter,
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
    const distHint =
      showDistrictFilter && filterDistrict
        ? "Seçilen ilçe"
        : showDistrictFilter
          ? "Tüm ilçeler"
          : monthLabel(selectedMonth);
    const scopeParts: string[] = [distHint];
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
    showDistrictFilter,
    filterDistrict,
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
        what: e.title,
        hat: e.hat_name,
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

  const showKolColumn = showDistrictFilter;
  const tableColCount = showKolColumn ? 7 : 6;

  const selectCls =
    "h-9 min-w-[160px] rounded-md border border-border bg-background px-3 text-[13px] font-medium outline-none focus:border-border-strong focus:ring-1 focus:ring-chp-navy/12";

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            Raporlama dönemi
          </p>
          <p className="text-[13px] text-muted-fg">
            {user ? scopeDescription(user) : "Yükleniyor…"}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
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
          {showDistrictFilter ? (
            <SearchableSelect
              id="dash-district"
              label="İlçe süzgeci"
              options={districtOptions.map((d) => ({
                value: String(d.id),
                label: d.name,
              }))}
              value={filterDistrict}
              onChange={setFilterDistrict}
              emptyLabel={districtsLoading ? "İlçeler…" : "Tüm ilçeler"}
              disabled={districtsLoading}
              minWidthClass="min-w-[200px]"
            />
          ) : null}
          <div className="flex flex-col gap-0.5">
            <label
              htmlFor="dash-month"
              className="text-[10px] font-semibold uppercase tracking-wider text-muted"
            >
              Ay
            </label>
            <input
              id="dash-month"
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className={`${selectCls} min-w-[148px]`}
            />
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

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionCard
            title={`Özet hareketler — ${monthLabel(selectedMonth)}`}
            action={
              <span className="text-[11px] font-medium text-muted">
                {loading ? "Yükleniyor…" : `${rows.length} kayıt`}
              </span>
            }
          >
            <div className="overflow-x-auto">
              {!loading && rows.length === 0 ? (
                <p className="px-5 py-8 text-center text-[13px] text-muted">
                  Bu ay için etkinlik yok.
                </p>
              ) : (
                <table
                  className={`w-full text-left text-[13px] ${showKolColumn ? "min-w-[640px]" : "min-w-[560px]"}`}
                >
                  <thead>
                    <tr className="border-b border-border bg-slate-50/80">
                      <th className="px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                        Etkinlik
                      </th>
                      <th className="px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                        Hat
                      </th>
                      {showKolColumn ? (
                        <th className="px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                          Koordinasyon kolu
                        </th>
                      ) : null}
                      <th className="px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                        İlçe
                      </th>
                      <th className="px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                        Yer
                      </th>
                      <th className="px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                        Durum
                      </th>
                      <th className="px-5 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-muted">
                        Tarih
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td
                          colSpan={tableColCount}
                          className="px-5 py-8 text-center text-muted"
                        >
                          Yükleniyor…
                        </td>
                      </tr>
                    ) : (
                      rows.map((row) => (
                        <tr
                          key={row.key}
                          className="border-b border-border/90 transition-colors last:border-0 hover:bg-slate-50/60"
                        >
                          <td className="px-5 py-3 font-medium text-foreground">
                            {row.what}
                          </td>
                          <td className="px-5 py-3 text-muted">{row.hat}</td>
                          {showKolColumn ? (
                            <td className="px-5 py-3 text-muted">{row.kol}</td>
                          ) : null}
                          <td className="px-5 py-3 text-muted">{row.ilce}</td>
                          <td className="px-5 py-3 text-muted">{row.where}</td>
                          <td className="px-5 py-3">
                            <span className={badge(row.durum)}>{row.durum}</span>
                          </td>
                          <td className="px-5 py-3 text-right tabular-nums text-muted">
                            {row.tarih}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </SectionCard>
        </div>

        <div className="flex flex-col gap-6">
          <SectionCard title="Hızlı işlemler">
            <ul className="divide-y divide-border">
              {[
                { label: "Yeni etkinlik oluştur", href: "/etkinlikler" },
                { label: "Raporları görüntüle", href: "/raporlar" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="flex w-full items-center justify-between px-5 py-3 text-left text-[13px] font-medium text-foreground transition-colors hover:bg-slate-50"
                  >
                    {item.label}
                    <span className="text-muted">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
