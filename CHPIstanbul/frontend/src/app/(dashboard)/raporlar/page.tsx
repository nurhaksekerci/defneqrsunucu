"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import type { ApiReport, ReportImageItem } from "@/lib/types/api";
import {
  CalendarDays,
  Download,
  Eye,
  ImageIcon,
  ImagePlus,
  LayoutGrid,
  MapPin,
  Pencil,
  UsersRound,
  X,
} from "lucide-react";
import { toast } from "sonner";

type RaporRow = ApiReport & { tarih: string };

const RAPOR_STATUS_EDIT = [
  { value: "draft" as const, label: "Taslak" },
  { value: "review" as const, label: "İncelemede" },
  { value: "published" as const, label: "Yayında" },
];

function mapToRaporRow(r: ApiReport): RaporRow {
  return {
    ...r,
    event_id: r.event_id ?? 0,
    status_code: r.status_code ?? "draft",
    can_edit: r.can_edit ?? false,
    tarih: new Date(r.updated_at).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
  };
}

type ApiDistrict = { id: number; name: string };

type ApiHat = {
  id: number;
  name: string;
  coordination_bucket?: string | null;
  coordination_line?: string | null;
};

function durumClass(d: string) {
  if (d === "Yayında")
    return "bg-emerald-50 text-emerald-900 ring-emerald-100";
  if (d === "İncelemede")
    return "bg-amber-50 text-amber-900 ring-amber-100";
  return "bg-slate-100 text-slate-700 ring-slate-200/80";
}

/** Etkinlikler / rapor oluştur ile aynı: önizleme URL’leri revoke edilmeli */
type PendingReportImage = {
  id: string;
  file: File;
  previewUrl: string;
};

function revokePendingPreviews(list: PendingReportImage[]) {
  list.forEach((i) => URL.revokeObjectURL(i.previewUrl));
}

function MetaItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-2.5 rounded-lg border border-border/80 bg-white/90 px-3 py-2.5 shadow-sm">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-chp-navy/8 text-chp-navy">
        <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
          {label}
        </p>
        <p className="truncate text-[13px] font-semibold text-foreground">
          {value}
        </p>
      </div>
    </div>
  );
}

function RaporlarPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const ilSidebar = useIlBaskanligiSidebar();
  const showIlceSidebar = Boolean(user?.show_sidebar_ilce_baskanliklari);
  const useSidebarScope = showIlceSidebar && ilSidebar != null;
  const showDistrictFilter = Boolean(user?.is_provincial_official);
  const showCoordinationFilters = Boolean(user?.hat_is_coordination);
  const showCoordinationFiltersOnPage =
    showCoordinationFilters && !useSidebarScope;
  const [filterDistrict, setFilterDistrict] = useState("");
  const [filterBucket, setFilterBucket] = useState("");
  const [filterHat, setFilterHat] = useState("");
  const [districtOptions, setDistrictOptions] = useState<ApiDistrict[]>([]);
  const [districtsLoading, setDistrictsLoading] = useState(false);
  const [hatOptions, setHatOptions] = useState<ApiHat[]>([]);
  const [hatsLoading, setHatsLoading] = useState(false);
  const [raporlar, setRaporlar] = useState<RaporRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDetailId, setActiveDetailId] = useState<number | null>(null);
  const [detail, setDetail] = useState<RaporRow | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editBody, setEditBody] = useState("");
  const [editStatus, setEditStatus] = useState<
    "draft" | "review" | "published"
  >("draft");
  const [removedImageIds, setRemovedImageIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [pendingImages, setPendingImages] = useState<PendingReportImage[]>([]);
  const [saving, setSaving] = useState(false);

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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      appendEventListFilters(qs, {
        district: showDistrictFilter ? filterDistrict : undefined,
        coordinationBucket: showCoordinationFiltersOnPage
          ? filterBucket
          : undefined,
        hat: showCoordinationFiltersOnPage ? filterHat : undefined,
      });
      appendIlBaskanligiSidebarHatFilter(qs, {
        enabled: useSidebarScope,
        scopeMode: ilSidebar?.scopeMode ?? "all",
        hatId: ilSidebar?.selectedHatId ?? null,
      });
      const q = qs.toString();
      const path = q ? `/api/reports/?${q}` : "/api/reports/";
      const raw = await apiFetch<ApiReport[]>(path);
      const list = Array.isArray(raw) ? raw : [];
      setRaporlar(list.map(mapToRaporRow));
    } catch (e) {
      setRaporlar([]);
      toast.error("Raporlar yüklenemedi", {
        description: e instanceof ApiError ? `HTTP ${e.status}` : undefined,
      });
    } finally {
      setLoading(false);
    }
  }, [
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

  const closeDetailModal = useCallback(() => {
    setPendingImages((prev) => {
      revokePendingPreviews(prev);
      return [];
    });
    setActiveDetailId(null);
    setDetail(null);
    setDetailLoading(false);
    setEditMode(false);
    setRemovedImageIds(new Set());
    setSaving(false);
  }, []);

  const openReportDetail = useCallback(
    async (id: number) => {
      setActiveDetailId(id);
      setDetail(null);
      setDetailLoading(true);
      setEditMode(false);
      setRemovedImageIds(new Set());
      setPendingImages((prev) => {
        revokePendingPreviews(prev);
        return [];
      });
      try {
        const r = await apiFetch<ApiReport>(`/api/reports/${id}/`);
        setDetail(mapToRaporRow(r));
      } catch {
        toast.error("Rapor bulunamadı veya erişiminiz yok.");
        closeDetailModal();
      } finally {
        setDetailLoading(false);
      }
    },
    [closeDetailModal],
  );

  useEffect(() => {
    const raw = searchParams.get("rapor");
    if (!raw) return;
    const id = Number(raw);
    if (!Number.isFinite(id) || id < 1) {
      router.replace("/raporlar", { scroll: false });
      return;
    }
    let cancelled = false;
    void (async () => {
      await openReportDetail(id);
      if (!cancelled) router.replace("/raporlar", { scroll: false });
    })();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams, openReportDetail]);

  const startEdit = useCallback(() => {
    if (!detail) return;
    setEditBody(detail.ozet);
    setEditStatus(detail.status_code ?? "draft");
    setRemovedImageIds(new Set());
    setPendingImages((prev) => {
      revokePendingPreviews(prev);
      return [];
    });
    setEditMode(true);
  }, [detail]);

  const cancelEdit = useCallback(() => {
    setEditMode(false);
    setRemovedImageIds(new Set());
    setPendingImages((prev) => {
      revokePendingPreviews(prev);
      return [];
    });
  }, []);

  const addPendingImages = useCallback((files: FileList | null) => {
    if (!files?.length) return;
    const added: PendingReportImage[] = [];
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
    if (added.length) setPendingImages((p) => [...p, ...added]);
  }, []);

  const removePendingImage = useCallback((id: string) => {
    setPendingImages((prev) => {
      const img = prev.find((x) => x.id === id);
      if (img) URL.revokeObjectURL(img.previewUrl);
      return prev.filter((x) => x.id !== id);
    });
  }, []);

  const saveReportEdit = useCallback(async () => {
    if (!detail?.event_id || detail.event_id < 1) {
      toast.error("Rapor etkinliğe bağlı değil; kayıt yapılamıyor.");
      return;
    }
    if (!editBody.trim()) {
      toast.error("Rapor metni boş olamaz.");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("body", editBody.trim());
      fd.append("status", editStatus);
      for (const rid of removedImageIds) {
        fd.append("remove_image_ids", String(rid));
      }
      for (const img of pendingImages) {
        const name = img.file.name?.trim() || "image";
        fd.append("images", img.file, name);
      }
      await apiFetch(`/api/events/${detail.event_id}/report/`, {
        method: "POST",
        body: fd,
      });
      toast.success("Rapor güncellendi");
      setEditMode(false);
      setRemovedImageIds(new Set());
      setPendingImages((prev) => {
        revokePendingPreviews(prev);
        return [];
      });
      await openReportDetail(detail.id);
    } catch (e) {
      toast.error("Kaydedilemedi", {
        description: e instanceof ApiError ? `HTTP ${e.status}` : undefined,
      });
    } finally {
      setSaving(false);
    }
  }, [
    detail,
    editBody,
    editStatus,
    removedImageIds,
    pendingImages,
    openReportDetail,
  ]);

  const displayImages: ReportImageItem[] = useMemo(() => {
    if (!detail?.image_items?.length) {
      return (detail?.gorseller ?? []).map((url, i) => ({
        id: -(i + 1),
        url,
      }));
    }
    return detail.image_items;
  }, [detail]);

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-6">
      <SectionCard
        title="Etkinlik raporları"
        action={
          <div className="flex flex-wrap items-end justify-end gap-2">
            {showCoordinationFiltersOnPage ? (
              <>
                <SearchableSelect
                  id="rapor-bucket"
                  label="Kol"
                  options={COORDINATION_BUCKET_OPTIONS}
                  value={filterBucket}
                  onChange={setFilterBucket}
                  emptyLabel="Tüm kollar"
                  minWidthClass="min-w-[160px]"
                />
                <SearchableSelect
                  id="rapor-hat"
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
                  minWidthClass="min-w-[180px]"
                />
              </>
            ) : null}
            {showDistrictFilter ? (
              <SearchableSelect
                id="rapor-district"
                label="İlçe"
                options={districtOptions.map((d) => ({
                  value: String(d.id),
                  label: d.name,
                }))}
                value={filterDistrict}
                onChange={setFilterDistrict}
                emptyLabel={districtsLoading ? "…" : "Tüm ilçeler"}
                disabled={districtsLoading}
                minWidthClass="min-w-[160px]"
              />
            ) : null}
            <button
              type="button"
              onClick={() =>
                toast.success("Dışa aktarma", {
                  description: "CSV dışa aktarma yakında eklenecek.",
                })
              }
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-[11px] font-semibold text-foreground transition-colors hover:border-border-strong hover:bg-slate-50"
            >
              <Download className="h-3.5 w-3.5" strokeWidth={2} />
              Dışa aktar
            </button>
          </div>
        }
      >
        <p className="border-b border-border px-5 pb-3 text-[13px] text-muted">
          Koordinasyon kullanıcıları kol ve hat; il yetkilileri ilçe süzgecini arayarak
          seçebilir.{" "}
          <Link
            href="/etkinlikler"
            className="font-medium text-chp-navy underline-offset-2 hover:underline"
          >
            Etkinlikler
          </Link>{" "}
          üzerinden tamamlanan etkinliklere rapor ekleyebilirsiniz.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-border bg-slate-50/80">
                <th className="px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                  Bağlı etkinlik
                </th>
                <th className="px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                  Hat
                </th>
                <th className="px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                  İlçe
                </th>
                <th className="px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                  Gönderen
                </th>
                <th className="px-5 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-muted">
                  Görsel
                </th>
                <th className="px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                  Durum
                </th>
                <th className="px-5 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-muted">
                  Tarih
                </th>
                <th className="px-5 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-muted">
                  Rapor
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-10 text-center text-muted"
                  >
                    Yükleniyor…
                  </td>
                </tr>
              ) : raporlar.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-10 text-center text-muted"
                  >
                    Henüz rapor yok.
                  </td>
                </tr>
              ) : (
                raporlar.map((r) => {
                  const n = r.gorseller?.length ?? 0;
                  return (
                    <tr
                      key={r.id}
                      className="border-b border-border/90 transition-colors last:border-0 hover:bg-slate-50/60"
                    >
                      <td className="px-5 py-3 font-medium text-foreground">
                        {r.etkinlik}
                      </td>
                      <td className="px-5 py-3 text-muted">{r.hat}</td>
                      <td className="px-5 py-3 text-muted">{r.ilce}</td>
                      <td className="px-5 py-3 text-muted">{r.gonderen}</td>
                      <td className="px-5 py-3 text-center">
                        {n > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200/80">
                            <ImageIcon className="h-3 w-3" aria-hidden />
                            {n}
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ${durumClass(r.durum)}`}
                        >
                          {r.durum}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-muted">
                        {r.tarih}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => void openReportDetail(r.id)}
                          className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] font-semibold text-foreground transition-colors hover:border-chp-navy/30 hover:bg-slate-50"
                        >
                          <Eye className="h-3.5 w-3.5" strokeWidth={2} />
                          Görüntüle
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <Modal
        open={activeDetailId !== null}
        onClose={closeDetailModal}
        ariaLabel="Rapor detayı"
        size="xl"
        footer={
          <div className="flex flex-wrap items-center justify-end gap-2">
            {editMode ? (
              <>
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={saving}
                  className="rounded-md border border-border bg-background px-4 py-2 text-[13px] font-semibold text-foreground hover:bg-slate-50 disabled:opacity-50"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={() => void saveReportEdit()}
                  disabled={
                    saving ||
                    !detail ||
                    !editBody.trim() ||
                    (removedImageIds.size === 0 &&
                      pendingImages.length === 0 &&
                      editBody.trim() === (detail.ozet ?? "").trim() &&
                      editStatus === (detail.status_code ?? "draft"))
                  }
                  className="rounded-md bg-chp-red px-4 py-2 text-[13px] font-semibold text-white shadow-crm-sm hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? "Kaydediliyor…" : "Kaydet"}
                </button>
              </>
            ) : (
              <>
                {detail?.can_edit ? (
                  <button
                    type="button"
                    onClick={startEdit}
                    className="inline-flex items-center gap-1.5 rounded-md border border-chp-navy/25 bg-white px-4 py-2 text-[13px] font-semibold text-chp-navy hover:bg-chp-navy/5"
                  >
                    <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                    Düzenle
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={closeDetailModal}
                  className="rounded-md bg-chp-navy px-4 py-2 text-[13px] font-semibold text-white shadow-crm-sm hover:bg-chp-navy-muted"
                >
                  Kapat
                </button>
              </>
            )}
          </div>
        }
      >
        {detailLoading && !detail ? (
          <p className="py-12 text-center text-[13px] text-muted">
            Yükleniyor…
          </p>
        ) : null}
        {detail ? (
          <div className="space-y-0">
            <div className="relative overflow-hidden rounded-lg border border-border bg-gradient-to-br from-chp-navy/[0.06] via-white to-slate-50 px-5 py-5">
              <div
                className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-chp-red/10 blur-2xl"
                aria-hidden
              />
              <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-chp-navy/80">
                    Etkinlik raporu
                  </p>
                  <h2 className="mt-1 text-lg font-semibold leading-snug tracking-tight text-foreground sm:text-xl">
                    {detail.etkinlik}
                  </h2>
                </div>
                <span
                  className={`inline-flex w-fit shrink-0 rounded-md px-2.5 py-1 text-[11px] font-bold ring-1 ${durumClass(detail.durum)}`}
                >
                  {detail.durum}
                </span>
              </div>

              <div className="relative mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <MetaItem
                  icon={CalendarDays}
                  label="Tarih"
                  value={detail.tarih}
                />
                <MetaItem icon={MapPin} label="İlçe" value={detail.ilce} />
                <MetaItem icon={LayoutGrid} label="Hat" value={detail.hat} />
                <MetaItem
                  icon={UsersRound}
                  label="Gönderen"
                  value={detail.gonderen}
                />
              </div>
            </div>

            <div className="mt-5 space-y-3 border-t border-border pt-5">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-chp-navy">
                Rapor özeti
              </h3>
              {editMode ? (
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  rows={8}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-[14px] leading-relaxed text-foreground shadow-sm outline-none ring-chp-navy/15 focus:border-chp-navy/40 focus:ring-2"
                />
              ) : (
                <p className="text-[14px] leading-[1.65] text-foreground">
                  {detail.ozet}
                </p>
              )}
              {editMode ? (
                <div className="pt-1">
                  <label
                    htmlFor="rapor-status-edit"
                    className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted"
                  >
                    Durum
                  </label>
                  <select
                    id="rapor-status-edit"
                    value={editStatus}
                    onChange={(e) =>
                      setEditStatus(
                        e.target.value as "draft" | "review" | "published",
                      )
                    }
                    className="w-full max-w-xs rounded-md border border-border bg-white px-3 py-2 text-[13px] font-medium text-foreground"
                  >
                    {RAPOR_STATUS_EDIT.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>

            <div className="mt-6 space-y-3 border-t border-border pt-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-chp-navy">
                  Ek görseller
                </h3>
                <span className="text-[11px] font-medium text-muted">
                  {editMode
                    ? `${displayImages.length} mevcut${pendingImages.length > 0 ? ` · ${pendingImages.length} eklenecek` : ""}`
                    : `${displayImages.length} dosya`}
                </span>
              </div>

              {editMode ? (
                <div>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-chp-navy/35 bg-white px-3 py-2 text-[12px] font-semibold text-chp-navy shadow-sm transition-colors hover:bg-slate-50">
                    <ImagePlus className="h-4 w-4" strokeWidth={2} />
                    Görsel ekle
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="sr-only"
                      onChange={(e) => {
                        addPendingImages(e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <p className="mt-1.5 text-[11px] leading-snug text-muted">
                    Birden fazla fotoğraf seçebilirsiniz (JPEG, PNG, WebP…).
                  </p>
                </div>
              ) : null}

              {!editMode && displayImages.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-slate-50/80 py-8 text-center">
                  <ImageIcon
                    className="mx-auto h-8 w-8 text-muted opacity-60"
                    strokeWidth={1.25}
                    aria-hidden
                  />
                  <p className="mt-2 text-[13px] font-medium text-muted">
                    Bu raporda ek görsel yok.
                  </p>
                </div>
              ) : null}

              {(pendingImages.length > 0 || displayImages.length > 0) && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {editMode
                    ? pendingImages.map((img) => (
                        <div
                          key={img.id}
                          className="group relative overflow-hidden rounded-xl border border-dashed border-chp-navy/35 bg-slate-50 shadow-sm ring-1 ring-chp-navy/10"
                        >
                          <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                            <img
                              src={img.previewUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                            <span className="absolute left-2 top-2 rounded bg-chp-navy/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                              Yeni
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removePendingImage(img.id)}
                            className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-white/95 text-foreground shadow-sm hover:bg-red-50"
                            aria-label="Kaldır"
                          >
                            <X className="h-4 w-4" strokeWidth={2} />
                          </button>
                          <p className="truncate px-2 py-1.5 text-[10px] text-muted">
                            {img.file.name}
                          </p>
                        </div>
                      ))
                    : null}
                  {displayImages.map((item, i) => {
                    const marked =
                      item.id > 0 && removedImageIds.has(item.id);
                    return (
                      <div
                        key={item.id !== 0 ? item.id : item.url}
                        className="relative"
                      >
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`group relative block overflow-hidden rounded-xl border border-border bg-slate-100 shadow-sm ring-1 ring-black/[0.04] transition-shadow hover:shadow-md ${marked ? "opacity-40" : ""}`}
                        >
                          <img
                            src={item.url}
                            alt={`Rapor görseli ${i + 1}`}
                            className="aspect-[16/10] w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                            loading="lazy"
                          />
                          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-chp-navy/80 to-transparent px-3 py-2 text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                            Tam boyutta aç →
                          </span>
                        </a>
                        {editMode && item.id > 0 ? (
                          <button
                            type="button"
                            onClick={() =>
                              setRemovedImageIds((prev) => {
                                const n = new Set(prev);
                                if (n.has(item.id)) n.delete(item.id);
                                else n.add(item.id);
                                return n;
                              })
                            }
                            className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-white/95 text-foreground shadow-sm hover:bg-red-50"
                            title={
                              marked
                                ? "Kaldırmayı iptal et"
                                : "Kaldırılacak işaretle"
                            }
                          >
                            <X className="h-4 w-4" strokeWidth={2} />
                          </button>
                        ) : null}
                        {marked ? (
                          <p className="mt-1 text-center text-[11px] font-semibold text-red-700">
                            Kaldırılacak
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function RaporlarPageFallback() {
  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-6">
      <SectionCard title="Etkinlik raporları">
        <p className="border-b border-border px-5 pb-3 text-[13px] text-muted">
          Yükleniyor…
        </p>
      </SectionCard>
    </div>
  );
}

export default function RaporlarPage() {
  return (
    <Suspense fallback={<RaporlarPageFallback />}>
      <RaporlarPageContent />
    </Suspense>
  );
}
