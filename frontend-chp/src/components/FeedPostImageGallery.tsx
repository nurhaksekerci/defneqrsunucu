'use client';

import { useCallback, useState } from 'react';

type Props = {
  imageUrls: string[];
  alt?: string;
};

/** Akışta tüm görselleri detaya girmeden önizleme + küçük resim şeridi */
export function FeedPostImageGallery({ imageUrls, alt = '' }: Props) {
  const urls = imageUrls.filter(Boolean);
  const [active, setActive] = useState(0);

  const safeIdx = Math.min(active, Math.max(0, urls.length - 1));
  const main = urls[safeIdx];

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (urls.length <= 1) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setActive((i) => (i + 1) % urls.length);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setActive((i) => (i - 1 + urls.length) % urls.length);
      }
    },
    [urls.length]
  );

  if (urls.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center bg-slate-100 text-sm text-slate-400">
        Görsel yok
      </div>
    );
  }

  return (
    <div
      className="border-b border-slate-200 bg-slate-50 outline-none focus-visible:ring-2 focus-visible:ring-chp-red/40"
      onKeyDown={onKeyDown}
      role="region"
      aria-label={`Görseller, ${urls.length} adet`}
      tabIndex={0}>
      <div className="relative aspect-[16/9] max-h-[min(420px,50vh)] w-full bg-slate-200/80 lg:aspect-[21/9] lg:max-h-[320px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={main}
          alt={alt}
          className="h-full w-full object-contain"
        />
        {urls.length > 1 ? (
          <>
            <div className="pointer-events-none absolute right-2 top-2 rounded bg-slate-900/75 px-2 py-0.5 text-xs font-medium text-white">
              {safeIdx + 1} / {urls.length}
            </div>
            <button
              type="button"
              aria-label="Önceki görsel"
              className="absolute left-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded border border-slate-300 bg-white/95 text-slate-700 shadow-sm hover:bg-white lg:flex"
              onClick={() =>
                setActive((i) => (i - 1 + urls.length) % urls.length)
              }>
              ‹
            </button>
            <button
              type="button"
              aria-label="Sonraki görsel"
              className="absolute right-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded border border-slate-300 bg-white/95 text-slate-700 shadow-sm hover:bg-white lg:flex"
              onClick={() => setActive((i) => (i + 1) % urls.length)}>
              ›
            </button>
          </>
        ) : null}
      </div>
      {urls.length > 1 ? (
        <div className="flex gap-1.5 overflow-x-auto border-t border-slate-200 bg-white p-2">
          {urls.map((u, i) => (
            <button
              key={`${u}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              className={`relative h-14 w-20 shrink-0 overflow-hidden rounded border-2 transition ${
                i === safeIdx
                  ? 'border-chp-red ring-1 ring-chp-red/30'
                  : 'border-slate-200 opacity-80 hover:border-slate-400 hover:opacity-100'
              }`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
