'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { BranchBadge } from '@/components/BranchBadge';
import {
  API_BASE_URL,
  type CommissionOption,
  type FeedQueryParams,
  fetchCommissions,
  fetchFeed,
  likePost,
  parseApiErrorMessage,
} from '@/lib/api';
import type { BranchKind } from '@/lib/types';
import type { FeedPost } from '@/lib/types';
import { DISTRICT_FILTER_OPTIONS } from '@/lib/constants/districts';
import { EVENT_CATEGORIES } from '@/lib/constants/eventCategories';
import clsx from 'clsx';

const DEFAULT_FEED: FeedQueryParams = {
  branchMode: 'default',
  districts: [],
  categories: [],
};

const BRANCH_CHIPS: { id: BranchKind; label: string }[] = [
  { id: 'ana_kademe', label: 'Ana Kademe' },
  { id: 'genclik', label: 'Gençlik' },
  { id: 'kadin', label: 'Kadın' },
  { id: 'komisyon', label: 'Komisyon' },
];

function formatEventWhen(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toggle<T extends string>(list: T[], id: T): T[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

export default function FeedPage() {
  const [query, setQuery] = useState<FeedQueryParams>(DEFAULT_FEED);
  const [commissions, setCommissions] = useState<CommissionOption[]>([]);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const [draftDistricts, setDraftDistricts] = useState(query.districts);
  const [draftCategories, setDraftCategories] = useState(query.categories);
  const [draftBranchMode, setDraftBranchMode] = useState(query.branchMode);
  const [draftBranch, setDraftBranch] = useState<BranchKind | null>(
    query.branchMode === 'explicit' ? query.branch ?? null : null
  );
  const [draftCommissionId, setDraftCommissionId] = useState<number | null>(
    query.commissionId ?? null
  );

  useEffect(() => {
    void fetchCommissions()
      .then(setCommissions)
      .catch(() => setCommissions([]));
  }, []);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      setPosts(await fetchFeed(query));
    } catch (e) {
      setErr(parseApiErrorMessage(e instanceof Error ? e.message : 'Hata'));
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtersActive = useMemo(() => {
    return (
      query.branchMode !== 'default' ||
      query.districts.length > 0 ||
      query.categories.length > 0
    );
  }, [query]);

  const applyFilters = () => {
    let next: FeedQueryParams = {
      branchMode: draftBranchMode,
      districts: draftDistricts,
      categories: draftCategories,
    };
    if (draftBranchMode === 'explicit' && draftBranch) {
      next = {
        ...next,
        branch: draftBranch,
        commissionId:
          draftBranch === 'komisyon' ? draftCommissionId : undefined,
      };
    }
    setQuery(next);
    setFilterOpen(false);
  };

  const clearFilters = () => {
    setDraftDistricts([]);
    setDraftCategories([]);
    setDraftBranchMode('default');
    setDraftBranch(null);
    setDraftCommissionId(null);
    setQuery(DEFAULT_FEED);
    setFilterOpen(false);
  };

  const onLike = async (post: FeedPost) => {
    const want = !post.liked;
    try {
      const r = await likePost(post.id, want);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id ? { ...p, liked: r.liked, likes: r.likes } : p
        )
      );
    } catch {
      /* */
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="chp-page-title">Akış</h1>
          <p className="chp-page-sub">Etkinlik paylaşımları ve örgüt duyuruları</p>
          {filtersActive ? (
            <p className="mt-3 inline-flex items-center rounded-lg bg-red-50 px-3 py-1 text-xs font-semibold text-chp-redDark ring-1 ring-chp-red/15">
              Filtre uygulanıyor
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => {
            setDraftDistricts([...query.districts]);
            setDraftCategories([...query.categories]);
            setDraftBranchMode(query.branchMode);
            setDraftBranch(query.branchMode === 'explicit' ? query.branch ?? null : null);
            setDraftCommissionId(query.commissionId ?? null);
            setFilterOpen(true);
          }}
          className="chp-btn-secondary shrink-0">
          Filtrele
        </button>
      </div>

      {err ? (
        <div className="chp-alert">
          <p className="font-medium">{err}</p>
          <span className="mt-2 block text-xs text-amber-800/80">API: {API_BASE_URL}</span>
        </div>
      ) : null}

      {filterOpen ? (
        <div className="chp-card p-5 sm:p-6">
          <h3 className="font-display text-lg font-bold text-slate-900">Akış filtresi</h3>
          <p className="chp-page-sub !mt-1 !mb-5">Kol, ilçe ve etkinlik kategorisi seçin</p>

          <p className="chp-section-label">Kol</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {(
              [
                ['default', 'Varsayılan'],
                ['all', 'Tümü'],
                ['explicit', 'Seç…'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setDraftBranchMode(id);
                  if (id !== 'explicit') setDraftBranch(null);
                }}
                className={clsx('chp-chip', draftBranchMode === id && 'chp-chip-active')}>
                {label}
              </button>
            ))}
          </div>

          {draftBranchMode === 'explicit' ? (
            <>
              <div className="mb-4 flex flex-wrap gap-2">
                {BRANCH_CHIPS.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setDraftBranch(b.id)}
                    className={clsx('chp-chip', draftBranch === b.id && 'chp-chip-active')}>
                    {b.label}
                  </button>
                ))}
              </div>
              {draftBranch === 'komisyon' ? (
                <select
                  className="chp-input mb-4"
                  value={draftCommissionId ?? ''}
                  onChange={(e) =>
                    setDraftCommissionId(
                      e.target.value ? Number(e.target.value) : null
                    )
                  }>
                  <option value="">Tüm komisyonlar</option>
                  {commissions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              ) : null}
            </>
          ) : null}

          <p className="chp-section-label">İlçe</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {DISTRICT_FILTER_OPTIONS.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() =>
                  setDraftDistricts((prev) => toggle(prev, d.id))
                }
                className={clsx(
                  'chp-chip',
                  draftDistricts.includes(d.id) && 'chp-chip-active'
                )}>
                {d.label}
              </button>
            ))}
          </div>

          <p className="chp-section-label">Kategori</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {EVENT_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() =>
                  setDraftCategories((prev) => toggle(prev, c.id))
                }
                className={clsx(
                  'chp-chip',
                  draftCategories.includes(c.id) && 'chp-chip-active'
                )}>
                {c.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={clearFilters} className="chp-btn-secondary flex-1">
              Temizle
            </button>
            <button type="button" onClick={applyFilters} className="chp-btn-primary flex-1">
              Uygula
            </button>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <div
            className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-chp-red"
            aria-hidden
          />
          <p className="text-sm font-medium text-slate-600">Gönderiler yükleniyor…</p>
        </div>
      ) : null}

      <div className="space-y-5">
        {posts.map((post) => {
          const when = formatEventWhen(post.eventStartAt);
          return (
            <article
              key={post.id}
              className="chp-card-interactive overflow-hidden">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-4 sm:p-5">
                <div className="min-w-0 space-y-2">
                  <BranchBadge kind={post.branch} label={post.branchLabel} />
                  <p className="text-xs font-medium text-slate-500">{post.orgPath}</p>
                  <p className="font-semibold text-slate-900">{post.authorLabel}</p>
                </div>
                <Link href={`/post/${post.id}`} className="chp-link shrink-0">
                  Detay →
                </Link>
              </div>
              <div className="relative aspect-[4/3] bg-slate-100">
                {post.imageUrls[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.imageUrls[0]}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              {(post.eventTitle || post.eventDescription || when) && (
                <div className="space-y-2 border-b border-slate-100 p-4 sm:p-5">
                  {post.eventTitle ? (
                    <h2 className="font-display text-lg font-bold text-slate-900">
                      {post.eventTitle}
                    </h2>
                  ) : null}
                  {when ? (
                    <p className="text-sm font-semibold text-slate-600">{when}</p>
                  ) : null}
                  {post.eventDescription ? (
                    <p className="text-sm leading-relaxed text-slate-600 line-clamp-4">
                      {post.eventDescription}
                    </p>
                  ) : null}
                </div>
              )}
              <div className="flex items-center justify-between px-4 py-3 sm:px-5">
                <button
                  type="button"
                  onClick={() => onLike(post)}
                  className="text-sm font-semibold text-slate-800 transition hover:text-chp-red">
                  {post.liked ? '♥ Beğenildi' : '♡ Beğen'} · {post.likes}
                </button>
                <span className="text-xs font-medium text-slate-500">{post.timeLabel}</span>
              </div>
              {post.caption ? (
                <p className="border-t border-slate-100 bg-slate-50/60 px-4 py-3 text-sm leading-relaxed text-slate-800 sm:px-5">
                  {post.caption}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>

      {!loading && posts.length === 0 ? (
        <div className="chp-card py-16 text-center">
          <p className="font-medium text-slate-600">Bu filtrelerle gösterilecek gönderi yok.</p>
          <p className="mt-2 text-sm text-slate-500">Filtreleri temizleyerek tekrar deneyin.</p>
        </div>
      ) : null}
    </div>
  );
}
