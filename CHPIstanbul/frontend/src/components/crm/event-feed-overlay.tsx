"use client";

import { useEffect, useRef, useState } from "react";
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
      className="fixed inset-0 z-[100] flex flex-col bg-background"
      role="dialog"
      aria-modal="true"
      aria-label="Etkinlik akışı"
    >
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-surface px-4 py-3">
        <p className="text-[13px] font-semibold text-foreground">
          Etkinlikler
          <span className="ml-2 font-normal text-muted">
            ({events.length}) — aşağı kaydırarak sonrakine geçin
          </span>
        </p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-muted transition-colors hover:bg-slate-100 hover:text-foreground"
          aria-label="Kapat"
        >
          <X className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 snap-y snap-mandatory overflow-y-auto overscroll-y-contain"
      >
        {events.map((ev) => (
          <article
            key={ev.id}
            id={`feed-event-${ev.id}`}
            className="flex min-h-[100dvh] snap-start flex-col border-b border-border md:flex-row md:items-stretch"
          >
            <div className="relative flex min-h-[42vh] w-full shrink-0 flex-col bg-black md:min-h-[100dvh] md:w-[52%] lg:w-[50%]">
              <FeedImages event={ev} detail={cache[ev.id]} />
            </div>

            <div className="flex w-full flex-col gap-5 bg-surface p-5 md:w-[48%] md:min-h-[100dvh] md:max-w-none md:overflow-y-auto md:border-l md:border-border lg:w-[50%]">
              <FeedCopy event={ev} detail={cache[ev.id]} />
            </div>
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
      <div className="flex flex-1 items-center justify-center gap-2 text-white/80">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (urls.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-white/70">
        <ImageOff className="h-12 w-12 opacity-60" strokeWidth={1.25} />
        <p className="text-[13px]">Bu etkinlik için görsel yok</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-0 overflow-y-auto">
      {urls.map((url, i) => (
        <div
          key={`${event.id}-img-${i}`}
          className="flex min-h-0 w-full flex-1 items-center justify-center border-b border-white/10 last:border-b-0"
        >
          <img
            src={url}
            alt=""
            className="max-h-[min(85vh,920px)] w-full object-contain md:max-h-[min(92vh,980px)]"
          />
        </div>
      ))}
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
      <>
        <header>
          <h2 className="text-lg font-bold leading-snug tracking-tight text-foreground">
            {event.title}
          </h2>
        </header>
        <div className="flex items-center gap-2 py-4 text-[13px] text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          Ayrıntılar yükleniyor…
        </div>
      </>
    );
  }

  const d = detail ?? event;
  const report = detail?.report ?? null;

  return (
    <>
      <header>
        <h2 className="text-lg font-bold leading-snug tracking-tight text-foreground">
          {d.title}
        </h2>
        <p className="mt-2 text-[12px] text-muted">
          {new Date(d.starts_at).toLocaleString("tr-TR", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
        <p className="mt-1 text-[12px] text-muted">
          {d.hat_name} · {d.district_name}
        </p>
      </header>

      <section className="space-y-2">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          Etkinlik planı
        </h3>
        <p className="text-[12px] text-muted">
          Durum:{" "}
          <span className="font-medium text-foreground">
            {d.status === "planned" ? "Planlandı" : "Tamamlandı"}
          </span>
        </p>
        <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground">
          {d.description || "—"}
        </p>
        <p className="text-[13px] text-foreground">
          <span className="text-muted">Konum: </span>
          {eventWhereLabel(d)}
        </p>
      </section>

      <section className="space-y-2 border-t border-border pt-4">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          Rapor
        </h3>
        {report ? (
          <>
            <p className="text-[12px] text-muted">
              Durum:{" "}
              <span className="font-medium text-foreground">
                {REPORT_STATUS_LABEL[report.status] ?? report.status}
              </span>
            </p>
            <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground">
              {report.body || "—"}
            </p>
          </>
        ) : (
          <p className="text-[13px] text-muted">Bu etkinlik için rapor yok.</p>
        )}
      </section>
    </>
  );
}
