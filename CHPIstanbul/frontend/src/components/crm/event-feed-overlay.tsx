"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import type { ApiEvent, ApiEventDetail } from "@/lib/types/api";
import { ImageOff, Loader2, X } from "lucide-react";

const REPORT_STATUS_LABEL: Record<string, string> = {
  draft: "Taslak",
  review: "İncelemede",
  published: "Yayında",
};

function eventWhereLabel(e: ApiEvent | ApiEventDetail): string {
  return e.location_kind === "address" && e.address_text.trim()
    ? e.address_text
    : `${e.district_name} · harita/adres`;
}

type Props = {
  open: boolean;
  onClose: () => void;
  events: ApiEvent[];
  anchorEventId: number | null;
};

export function EventFeedOverlay({
  open,
  onClose,
  events,
  anchorEventId,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [cache, setCache] = useState<
    Record<number, ApiEventDetail | "loading" | undefined>
  >({});

  useEffect(() => {
    if (!open) {
      setCache({});
      return;
    }
    let cancelled = false;
    const ids = [...new Set(events.map((e) => e.id))];
    ids.forEach((id) => {
      setCache((c) => ({ ...c, [id]: "loading" }));
      apiFetch<ApiEventDetail>(`/api/events/${id}/`)
        .then((d) => {
          if (!cancelled) setCache((c) => ({ ...c, [id]: d }));
        })
        .catch(() => {
          if (!cancelled) setCache((c) => ({ ...c, [id]: undefined }));
        });
    });
    return () => {
      cancelled = true;
    };
  }, [open, events]);

  useEffect(() => {
    if (!open || anchorEventId == null) return;
    const id = requestAnimationFrame(() => {
      document
        .getElementById(`feed-event-${anchorEventId}`)
        ?.scrollIntoView({ block: "start", behavior: "auto" });
    });
    return () => cancelAnimationFrame(id);
  }, [open, anchorEventId]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-[#0a0a0a] text-white"
      role="dialog"
      aria-modal="true"
      aria-label="Etkinlik akışı"
    >
      <header className="flex shrink-0 items-center justify-between border-b border-white/10 bg-black/40 px-4 py-3.5 backdrop-blur-xl supports-[backdrop-filter]:bg-black/25">
        <div className="min-w-0">
          <p className="truncate font-semibold tracking-tight text-white">
            Etkinlik akışı
          </p>
          <p className="mt-0.5 truncate text-[11px] font-medium text-white/55">
            {events.length} gönderi · görselleri yatay kaydırın · sonraki için
            dikey kaydırın
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/90 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Kapat"
        >
          <X className="h-5 w-5" strokeWidth={2} />
        </button>
      </header>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 snap-y snap-mandatory overflow-y-auto overscroll-y-contain"
      >
        {events.map((ev) => (
          <article
            key={ev.id}
            id={`feed-event-${ev.id}`}
            className="flex min-h-[100dvh] snap-start flex-col border-b border-white/[0.06] md:h-[100dvh] md:flex-row md:items-stretch"
          >
            <div className="relative flex h-[70vh] min-h-0 w-full shrink-0 flex-col bg-black md:h-auto md:min-h-0 md:w-[70%] md:flex-[0_0_70%]">
              <FeedImages event={ev} detail={cache[ev.id]} />
            </div>

            <aside className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto rounded-t-[20px] border-white/[0.06] bg-[#fafafa] text-neutral-900 md:h-full md:w-[30%] md:flex-[0_0_30%] md:flex-none md:min-h-0 md:rounded-none md:border-l md:border-neutral-200/90">
              <FeedCopy event={ev} detail={cache[ev.id]} />
            </aside>
          </article>
        ))}
      </div>
    </div>
  );
}

function FeedImages({
  event,
  detail,
}: {
  event: ApiEvent;
  detail: ApiEventDetail | "loading" | undefined;
}) {
  const urls =
    detail && detail !== "loading" && detail.report?.images?.length
      ? detail.report.images.map((x) => x.image)
      : (event.report_image_urls ?? []);

  if (detail === "loading" && urls.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
          <Loader2 className="h-7 w-7 animate-spin text-white/70" />
        </div>
        <p className="text-[13px] font-medium text-white/50">Görseller hazırlanıyor</p>
      </div>
    );
  }

  if (urls.length === 0) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center gap-4 p-10 text-center">
        <div className="rounded-full bg-white/5 p-6 ring-1 ring-white/10">
          <ImageOff className="size-11 text-white/35" strokeWidth={1.25} />
        </div>
        <p className="max-w-[220px] text-[13px] leading-relaxed text-white/45">
          Bu etkinlik için henüz görsel yok
        </p>
      </div>
    );
  }

  return <ImageCarousel eventId={event.id} urls={urls} />;
}

function ImageCarousel({ eventId, urls }: { eventId: number; urls: string[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const updateActive = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const w = el.clientWidth;
    if (w <= 0) return;
    const i = Math.round(el.scrollLeft / w);
    setActive(Math.min(Math.max(0, i), urls.length - 1));
  }, [urls.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateActive();
    el.addEventListener("scroll", updateActive, { passive: true });
    const ro = new ResizeObserver(updateActive);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateActive);
      ro.disconnect();
    };
  }, [updateActive, urls.length]);

  return (
    <div className="relative flex h-full min-h-0 w-full flex-1 flex-col">
      <div
        ref={scrollRef}
        className="flex h-full min-h-0 w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden [-webkit-overflow-scrolling:touch]"
        aria-label="Görseller — yatay kaydırın"
      >
        {urls.map((url, i) => (
          <div
            key={`${eventId}-img-${i}`}
            className="flex h-full w-full shrink-0 snap-center snap-always flex-[0_0_100%] flex-col items-center justify-center bg-black"
          >
            <img
              src={url}
              alt=""
              className="h-full max-h-full w-full max-w-full object-contain"
            />
          </div>
        ))}
      </div>
      {urls.length > 1 ? (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-4 pt-10"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)",
          }}
        >
          <div
            className="pointer-events-auto flex gap-1.5 rounded-full bg-black/35 px-2.5 py-0.5 backdrop-blur-md"
            role="tablist"
            aria-label="Görsel sırası"
          >
            {urls.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === active ? "w-5 bg-white" : "w-1.5 bg-white/40"
                }`}
                aria-hidden
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FeedCopy({
  event,
  detail,
}: {
  event: ApiEvent;
  detail: ApiEventDetail | "loading" | undefined;
}) {
  if (detail === "loading") {
    return (
      <div className="flex min-h-0 flex-1 flex-col p-5">
        <div className="flex items-start gap-3 border-b border-neutral-200/80 pb-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-neutral-200 to-neutral-300 text-[13px] font-bold text-neutral-600">
            ?
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold leading-none tracking-tight text-neutral-950">
              {event.title}
            </p>
            <p className="mt-2 flex items-center gap-2 text-[12px] text-neutral-500">
              <Loader2 className="size-3.5 shrink-0 animate-spin" />
              Yükleniyor…
            </p>
          </div>
        </div>
      </div>
    );
  }

  const d = detail ?? event;
  const report = detail?.report ?? null;

  return (
    <div className="flex min-h-0 flex-1 flex-col p-5">
      <div className="shrink-0 border-b border-neutral-200/80 pb-4">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-chp-red/90 to-chp-navy text-[12px] font-bold text-white shadow-sm ring-2 ring-white">
            E
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold leading-snug tracking-tight text-neutral-950">
              {d.title}
            </h2>
            <p className="mt-1.5 text-[12px] leading-snug text-neutral-500">
              {new Date(d.starts_at).toLocaleString("tr-TR", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
              <span className="mx-1.5 text-neutral-300">·</span>
              {d.hat_name}
              <span className="mx-1.5 text-neutral-300">·</span>
              {d.district_name}
            </p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pt-4">
        <section>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Etkinlik
          </p>
          <p className="text-[12px] text-neutral-500">
            <span className="font-medium text-neutral-800">
              {d.status === "planned" ? "Planlandı" : "Tamamlandı"}
            </span>
          </p>
          <p className="mt-3 whitespace-pre-wrap text-[14px] leading-[1.55] text-neutral-900">
            {d.description || "—"}
          </p>
          <p className="mt-3 text-[13px] leading-snug text-neutral-600">
            <span className="text-neutral-400">Konum</span>{" "}
            {eventWhereLabel(d)}
          </p>
        </section>

        <section className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Rapor
          </p>
          {report ? (
            <>
              <p className="mb-2 text-[12px] text-neutral-500">
                <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-700">
                  {REPORT_STATUS_LABEL[report.status] ?? report.status}
                </span>
              </p>
              <p className="whitespace-pre-wrap text-[14px] leading-[1.55] text-neutral-800">
                {report.body || "—"}
              </p>
            </>
          ) : (
            <p className="text-[13px] text-neutral-500">
              Bu etkinlik için rapor yok.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
