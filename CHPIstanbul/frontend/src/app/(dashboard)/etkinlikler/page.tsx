"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SectionCard } from "@/components/crm/section-card";
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
import type { ApiEvent } from "@/lib/types/api";
import { Check, Eye, FileText, ImagePlus, Plus, X } from "lucide-react";
import { toast } from "sonner";

const IST = { lat: 41.0082, lng: 28.9784 };

const EventMapPicker = dynamic(
  () =>
    import("@/components/crm/event-map-picker").then((m) => m.EventMapPicker),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[220px] items-center justify-center rounded-md border border-border bg-slate-50 text-[13px] text-muted">
        Harita yükleniyor…
      </div>
    ),
  },
);

type ReportImage = { id: string; file: File; previewUrl: string };

type ApiDistrict = { id: number; name: string };

type ApiHat = {
  id: number;
  name: string;
  code?: string;
  coordination_bucket?: string | null;
  coordination_line?: string | null;
};

function apiErrMessage(e: unknown): string {
  if (e instanceof ApiError) {
    const b = e.body;
    if (typeof b === "string" && b.trim()) return b;
    if (b && typeof b === "object") {
      const o = b as Record<string, unknown>;
      if (typeof o.detail === "string") return o.detail;
      for (const v of Object.values(o)) {
        if (Array.isArray(v) && typeof v[0] === "string") return v[0];
        if (typeof v === "string") return v;
      }
    }
  }
  if (e instanceof Error) return e.message;
  return "İşlem başarısız";
}

function revokePreviews(list: ReportImage[]) {
  list.forEach((i) => URL.revokeObjectURL(i.previewUrl));
}

function formatEventDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const emptyNewForm = () => ({
  baslik: "",
  aciklama: "",
  datetime: "",
  konumTipi: "adres" as "adres" | "harita",
  adresMetni: "",
  districtId: "",
});

export default function EtkinliklerPage() {
  const { user } = useAuth();
  const ilSidebar = useIlBaskanligiSidebar();
  const showIlceSidebar = Boolean(user?.show_sidebar_ilce_baskanliklari);
  const useSidebarScope = showIlceSidebar && ilSidebar != null;
  const [tab, setTab] = useState<"planlanan" | "tamamlanan">("planlanan");
  const [rows, setRows] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("");
  const [filterBucket, setFilterBucket] = useState("");
  const [filterHat, setFilterHat] = useState("");
  const [hatOptions, setHatOptions] = useState<ApiHat[]>([]);
  const [hatsLoading, setHatsLoading] = useState(false);

  const [newOpen, setNewOpen] = useState(false);
  const [newForm, setNewForm] = useState(emptyNewForm);
  const [mapCoords, setMapCoords] = useState(IST);
  const [savingNew, setSavingNew] = useState(false);
  const [districtOptions, setDistrictOptions] = useState<ApiDistrict[]>([]);
  const [districtsLoading, setDistrictsLoading] = useState(false);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportFor, setReportFor] = useState<ApiEvent | null>(null);
  const [reportBody, setReportBody] = useState("");
  const [reportImages, setReportImages] = useState<ReportImage[]>([]);
  const [savingReport, setSavingReport] = useState(false);

  const [completingId, setCompletingId] = useState<number | null>(null);

  const onMapPick = useCallback((lat: number, lng: number) => {
    setMapCoords({ lat, lng });
  }, []);

  const needsDistrictPick = Boolean(
    user?.is_provincial_official && !user?.district_name,
  );
  const showDistrictFilter = Boolean(user?.is_provincial_official);
  const showCoordinationFilters = Boolean(user?.hat_is_coordination);
  const showCoordinationFiltersOnPage =
    showCoordinationFilters && !useSidebarScope;

  useEffect(() => {
    if (!user?.is_provincial_official) return;
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
  }, [user?.is_provincial_official]);

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

  const load = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams();
    qs.set("status", tab === "planlanan" ? "planned" : "completed");
    if (dateFrom) qs.set("date_from", dateFrom);
    if (dateTo) qs.set("date_to", dateTo);
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
    try {
      const data = await apiFetch<ApiEvent[]>(`/api/events/?${qs.toString()}`);
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setRows([]);
      toast.error("Etkinlikler yüklenemedi", {
        description: apiErrMessage(e),
      });
    } finally {
      setLoading(false);
    }
  }, [
    tab,
    dateFrom,
    dateTo,
    showDistrictFilter,
    filterDistrict,
    showCoordinationFiltersOnPage,
    filterBucket,
    filterHat,
    useSidebarScope,
    ilSidebar?.scopeMode,
    ilSidebar?.selectedHatId,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  const closeNewModal = () => {
    setNewOpen(false);
    setNewForm(emptyNewForm());
    setMapCoords(IST);
  };

  const tamamla = async (row: ApiEvent) => {
    setCompletingId(row.id);
    try {
      await apiFetch(`/api/events/${row.id}/complete/`, { method: "POST" });
      toast.success("Etkinlik tamamlandı", {
        description: `"${row.title}" tamamlananlar listesine taşındı.`,
      });
      await load();
    } catch (e) {
      toast.error("Tamamlanamadı", { description: apiErrMessage(e) });
    } finally {
      setCompletingId(null);
    }
  };

  const openReport = (row: ApiEvent) => {
    setReportImages((prev) => {
      revokePreviews(prev);
      return [];
    });
    setReportFor(row);
    setReportBody("");
    setReportOpen(true);
  };

  const closeReportModal = () => {
    setReportImages((prev) => {
      revokePreviews(prev);
      return [];
    });
    setReportOpen(false);
    setReportFor(null);
  };

  const addReportFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const added: ReportImage[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        toast.error("Sadece görsel", {
          description: `${file.name} görsel dosyası değil.`,
        });
        continue;
      }
      added.push({
        id: `${Date.now()}-${file.name}-${Math.random().toString(36).slice(2)}`,
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }
    if (added.length) {
      setReportImages((prev) => [...prev, ...added]);
    }
  };

  const removeReportImage = (id: string) => {
    setReportImages((prev) => {
      const img = prev.find((x) => x.id === id);
      if (img) URL.revokeObjectURL(img.previewUrl);
      return prev.filter((x) => x.id !== id);
    });
  };

  const submitReport = async () => {
    if (!reportFor) return;
    if (!reportBody.trim()) {
      toast.error("Rapor metni gerekli", {
        description: "Lütfen özet alanını doldurun.",
      });
      return;
    }
    setSavingReport(true);
    try {
      const fd = new FormData();
      fd.append("body", reportBody.trim());
      for (const img of reportImages) {
        fd.append("images", img.file, img.file.name || "image");
      }
      await apiFetch(`/api/events/${reportFor.id}/report/`, {
        method: "POST",
        body: fd,
      });
      revokePreviews(reportImages);
      setReportImages([]);
      setReportOpen(false);
      setReportFor(null);
      toast.success("Rapor kaydedildi");
      await load();
    } catch (e) {
      toast.error("Rapor gönderilemedi", { description: apiErrMessage(e) });
    } finally {
      setSavingReport(false);
    }
  };

  const submitNew = async () => {
    if (!newForm.baslik.trim() || !newForm.datetime) {
      toast.error("Eksik alan", {
        description: "Başlık ve tarih zorunludur.",
      });
      return;
    }
    if (!newForm.aciklama.trim()) {
      toast.error("Açıklama gerekli", {
        description: "Etkinlik açıklamasını yazın.",
      });
      return;
    }
    if (newForm.konumTipi === "adres" && !newForm.adresMetni.trim()) {
      toast.error("Adres gerekli", {
        description: "Konum için adres metnini girin veya haritayı seçin.",
      });
      return;
    }
    if (needsDistrictPick && !newForm.districtId) {
      toast.error("İlçe seçin", {
        description: "İl yetkilisi olarak etkinlik için ilçe seçmelisiniz.",
      });
      return;
    }

    const starts_at = new Date(newForm.datetime).toISOString();
    const location_kind = newForm.konumTipi === "adres" ? "address" : "map";

    setSavingNew(true);
    try {
      const payload: Record<string, unknown> = {
        title: newForm.baslik.trim(),
        description: newForm.aciklama.trim(),
        starts_at,
        location_kind,
        address_text:
          newForm.konumTipi === "adres" ? newForm.adresMetni.trim() : "",
        latitude:
          newForm.konumTipi === "harita" ? String(mapCoords.lat) : null,
        longitude:
          newForm.konumTipi === "harita" ? String(mapCoords.lng) : null,
      };
      if (needsDistrictPick) {
        payload.district = Number(newForm.districtId);
      }
      await apiFetch("/api/events/", {
        method: "POST",
        json: payload,
      });
      closeNewModal();
      toast.success("Etkinlik oluşturuldu");
      await load();
    } catch (e) {
      toast.error("Kaydedilemedi", { description: apiErrMessage(e) });
    } finally {
      setSavingNew(false);
    }
  };

  const field =
    "mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-border-strong focus:ring-1 focus:ring-chp-navy/12";

  const segBtn = (active: boolean) =>
    `rounded px-3 py-1.5 text-[12px] font-semibold transition-colors ${
      active
        ? "bg-chp-navy text-white shadow-crm-sm"
        : "text-muted hover:text-foreground"
    }`;

  const displayRows = useMemo(
    () =>
      [...rows].sort(
        (a, b) =>
          new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime(),
      ),
    [rows],
  );

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="inline-flex rounded-md border border-border bg-surface p-0.5 shadow-crm-sm">
          {(
            [
              ["planlanan", "Planlanan"],
              ["tamamlanan", "Tamamlanan"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`rounded px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
                tab === key
                  ? "bg-chp-navy text-white shadow-crm-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-3">
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label
                htmlFor="f-from"
                className="block text-[10px] font-semibold uppercase tracking-wider text-muted"
              >
                Başlangıç
              </label>
              <input
                id="f-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className={`${field} mt-1 h-9 w-[148px]`}
              />
            </div>
            <div>
              <label
                htmlFor="f-to"
                className="block text-[10px] font-semibold uppercase tracking-wider text-muted"
              >
                Bitiş
              </label>
              <input
                id="f-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className={`${field} mt-1 h-9 w-[148px]`}
              />
            </div>
            {showCoordinationFiltersOnPage ? (
              <>
                <SearchableSelect
                  id="evt-bucket"
                  label="Kol"
                  options={COORDINATION_BUCKET_OPTIONS}
                  value={filterBucket}
                  onChange={setFilterBucket}
                  emptyLabel="Tüm kollar"
                  minWidthClass="min-w-[180px]"
                />
                <SearchableSelect
                  id="evt-hat"
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
                  minWidthClass="min-w-[200px]"
                />
              </>
            ) : null}
            {showDistrictFilter ? (
              <SearchableSelect
                id="evt-filter-district"
                label="İlçe"
                options={districtOptions.map((d) => ({
                  value: String(d.id),
                  label: d.name,
                }))}
                value={filterDistrict}
                onChange={setFilterDistrict}
                emptyLabel={districtsLoading ? "…" : "Tüm ilçeler"}
                disabled={districtsLoading}
                minWidthClass="min-w-[180px]"
              />
            ) : null}
            {(dateFrom || dateTo || filterDistrict || filterBucket || filterHat) && (
              <button
                type="button"
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                  setFilterDistrict("");
                  setFilterBucket("");
                  setFilterHat("");
                  toast.message("Filtreler temizlendi");
                }}
                className="h-9 rounded-md border border-border px-3 text-[12px] font-semibold text-muted hover:bg-slate-50"
              >
                Sıfırla
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setNewForm(emptyNewForm());
              setMapCoords(IST);
              setNewOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-chp-navy bg-chp-navy px-4 py-2 text-[13px] font-semibold text-white shadow-crm-sm transition-colors hover:bg-chp-navy-muted"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            Yeni etkinlik
          </button>
        </div>
      </div>

      <SectionCard
        title={
          tab === "planlanan" ? "Planlanan etkinlikler" : "Tamamlanan etkinlikler"
        }
        action={
          <span className="text-[11px] font-medium text-muted">
            {loading ? "…" : displayRows.length} kayıt
            {(dateFrom || dateTo || filterDistrict || filterBucket || filterHat) &&
              " · filtreli"}
          </span>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-border bg-slate-50/80">
                <th className="px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                  Başlık
                </th>
                <th className="px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                  Hat
                </th>
                <th className="px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                  İlçe
                </th>
                <th className="px-5 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-muted">
                  Tarih
                </th>
                <th className="px-5 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-muted">
                  İşlem
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-muted"
                  >
                    Yükleniyor…
                  </td>
                </tr>
              ) : displayRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-muted"
                  >
                    Bu filtreye uygun kayıt yok.
                  </td>
                </tr>
              ) : tab === "planlanan" ? (
                displayRows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border/90 transition-colors last:border-0 hover:bg-slate-50/60"
                  >
                    <td className="px-5 py-3 font-medium text-foreground">
                      {row.title}
                    </td>
                    <td className="px-5 py-3 text-muted">{row.hat_name}</td>
                    <td className="px-5 py-3 text-muted">
                      {row.district_name}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-muted">
                      {formatEventDate(row.starts_at)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        disabled={completingId === row.id}
                        onClick={() => void tamamla(row)}
                        className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-900 transition-colors hover:bg-emerald-100 disabled:opacity-50"
                      >
                        <Check className="h-3.5 w-3.5" />
                        {completingId === row.id ? "…" : "Tamamlandı"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                displayRows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border/90 transition-colors last:border-0 hover:bg-slate-50/60"
                  >
                    <td className="px-5 py-3 font-medium text-foreground">
                      {row.title}
                    </td>
                    <td className="px-5 py-3 text-muted">{row.hat_name}</td>
                    <td className="px-5 py-3 text-muted">
                      {row.district_name}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-muted">
                      {formatEventDate(row.starts_at)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {row.has_report && row.report_id != null ? (
                        <Link
                          href={`/raporlar?rapor=${row.report_id}`}
                          className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-900 transition-colors hover:bg-emerald-100"
                        >
                          <Eye className="h-3.5 w-3.5" strokeWidth={2} />
                          Rapor Gör
                        </Link>
                      ) : row.has_report ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800">
                          <FileText className="h-3.5 w-3.5" />
                          Rapor var
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openReport(row)}
                          className="inline-flex items-center gap-1 rounded-md border border-chp-red/30 bg-chp-red-subtle px-2.5 py-1 text-[11px] font-semibold text-chp-red transition-colors hover:bg-chp-red-muted"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Rapor oluştur
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <Modal
        open={newOpen}
        onClose={closeNewModal}
        title="Yeni etkinlik"
        description={
          needsDistrictPick
            ? "Hat profilinizden kullanılır; ilçeyi bu etkinlik için aşağıdan seçin. Konum bilgisini iletin."
            : "Hat ve ilçe, profilinizdeki atamaya göre sunucuda otomatik yazılır. Konum bilgisini aşağıda iletin."
        }
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeNewModal}
              disabled={savingNew}
              className="rounded-md border border-border px-3 py-2 text-[13px] font-semibold text-muted hover:bg-slate-100 disabled:opacity-50"
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={() => void submitNew()}
              disabled={savingNew}
              className="rounded-md bg-chp-navy px-3 py-2 text-[13px] font-semibold text-white hover:bg-chp-navy-muted disabled:opacity-50"
            >
              {savingNew ? "Kaydediliyor…" : "Kaydet"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {needsDistrictPick ? (
            <div>
              <label
                htmlFor="evt-district"
                className="text-[11px] font-semibold uppercase tracking-wider text-muted"
              >
                Etkinlik ilçesi
              </label>
              <select
                id="evt-district"
                className={`${field} mt-1`}
                value={newForm.districtId}
                onChange={(e) =>
                  setNewForm((f) => ({ ...f, districtId: e.target.value }))
                }
                disabled={districtsLoading}
              >
                <option value="">
                  {districtsLoading ? "Yükleniyor…" : "İlçe seçin"}
                </option>
                {districtOptions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Başlık
            </label>
            <input
              className={field}
              value={newForm.baslik}
              onChange={(e) =>
                setNewForm((f) => ({ ...f, baslik: e.target.value }))
              }
              placeholder="Etkinlik adı"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Açıklama
            </label>
            <textarea
              className={`${field} min-h-[88px] resize-y`}
              value={newForm.aciklama}
              onChange={(e) =>
                setNewForm((f) => ({ ...f, aciklama: e.target.value }))
              }
              placeholder="Etkinliğin kapsamı, hedef kitle, notlar…"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Tarih ve saat
            </label>
            <input
              type="datetime-local"
              className={field}
              value={newForm.datetime}
              onChange={(e) =>
                setNewForm((f) => ({ ...f, datetime: e.target.value }))
              }
            />
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Konum
            </p>
            <div className="mt-2 inline-flex rounded-md border border-border bg-slate-50/80 p-0.5">
              <button
                type="button"
                className={segBtn(newForm.konumTipi === "adres")}
                onClick={() =>
                  setNewForm((f) => ({ ...f, konumTipi: "adres" }))
                }
              >
                Adres yaz
              </button>
              <button
                type="button"
                className={segBtn(newForm.konumTipi === "harita")}
                onClick={() =>
                  setNewForm((f) => ({ ...f, konumTipi: "harita" }))
                }
              >
                Haritadan seç
              </button>
            </div>

            {newForm.konumTipi === "adres" ? (
              <div className="mt-3">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Açık adres
                </label>
                <textarea
                  className={`${field} min-h-[72px] resize-y`}
                  value={newForm.adresMetni}
                  onChange={(e) =>
                    setNewForm((f) => ({ ...f, adresMetni: e.target.value }))
                  }
                  placeholder="Mahalle, sokak, kapı no, ilçe…"
                />
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                <p className="text-[12px] leading-snug text-muted">
                  Haritaya tıklayın veya işareti sürükleyin. Koordinatlar kayıtla
                  birlikte API&apos;ye gönderilir.
                </p>
                <EventMapPicker onPick={onMapPick} />
                <p className="text-[11px] tabular-nums text-muted">
                  Seçilen: {mapCoords.lat.toFixed(5)}, {mapCoords.lng.toFixed(5)}
                </p>
              </div>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        open={reportOpen}
        onClose={closeReportModal}
        title="Rapor oluştur"
        description={reportFor ? `Etkinlik: ${reportFor.title}` : undefined}
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeReportModal}
              disabled={savingReport}
              className="rounded-md border border-border px-3 py-2 text-[13px] font-semibold text-muted hover:bg-slate-100 disabled:opacity-50"
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={() => void submitReport()}
              disabled={savingReport}
              className="rounded-md bg-chp-red px-3 py-2 text-[13px] font-semibold text-white hover:bg-chp-red-hover disabled:opacity-50"
            >
              {savingReport ? "Gönderiliyor…" : "Kaydet"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Özet ve sonuçlar
            </label>
            <textarea
              className={`${field} mt-1 min-h-[120px] resize-y`}
              value={reportBody}
              onChange={(e) => setReportBody(e.target.value)}
              placeholder="Yapılanlar, katılım, notlar…"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Görseller
            </label>
            <p className="mt-0.5 text-[12px] text-muted">
              Birden fazla fotoğraf seçebilirsiniz (JPEG, PNG, WebP…).
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-[12px] font-semibold text-foreground transition-colors hover:bg-slate-50">
                <ImagePlus className="h-4 w-4" strokeWidth={2} />
                Görsel ekle
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    addReportFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
              {reportImages.length > 0 && (
                <span className="text-[11px] text-muted">
                  {reportImages.length} dosya
                </span>
              )}
            </div>
            {reportImages.length > 0 && (
              <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {reportImages.map((img) => (
                  <li
                    key={img.id}
                    className="group relative overflow-hidden rounded-md border border-border bg-slate-50"
                  >
                    <img
                      src={img.previewUrl}
                      alt=""
                      className="aspect-video w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeReportImage(img.id)}
                      className="absolute right-1 top-1 rounded-md bg-chp-navy/85 p-1 text-white opacity-100 shadow-sm sm:opacity-0 sm:group-hover:opacity-100"
                      aria-label="Kaldır"
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={2} />
                    </button>
                    <p className="truncate px-2 py-1 text-[10px] text-muted">
                      {img.file.name}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
