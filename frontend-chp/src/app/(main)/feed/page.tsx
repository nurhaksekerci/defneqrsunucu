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
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-neutral-900">Akış</h1>
          <p className="mt-1 text-sm text-neutral-600">Etkinlik paylaşımları</p>
          {filtersActive ? (
            <p className="mt-2 text-sm font-semibold text-chp-red">Filtre aktif</p>
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
          className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-bold text-neutral-800 hover:border-chp-red hover:text-chp-red">
          Filtre
        </button>
      </div>

      {err ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {err}
          <span className="mt-2 block text-xs text-neutral-600">API: {API_BASE_URL}</span>
        </p>
      ) : null}

      {filterOpen ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 font-bold text-neutral-900">Akış filtresi</h3>
          <p className="mb-4 text-sm text-neutral-600">Kol, ilçe ve etkinlik kategorisi</p>

          <p className="mb-2 text-xs font-bold uppercase text-neutral-500">Kol</p>
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
                className={clsx(
                  'rounded-full border px-3 py-1.5 text-sm font-semibold',
                  draftBranchMode === id
                    ? 'border-chp-red bg-chp-muted text-chp-redDark'
                    : 'border-neutral-200'
                )}>
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
                    className={clsx(
                      'rounded-full border px-3 py-1.5 text-sm font-semibold',
                      draftBranch === b.id
                        ? 'border-chp-red bg-chp-muted text-chp-redDark'
                        : 'border-neutral-200'
                    )}>
                    {b.label}
                  </button>
                ))}
              </div>
              {draftBranch === 'komisyon' ? (
                <select
                  className="mb-4 w-full rounded-xl border border-neutral-200 px-3 py-2"
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

          <p className="mb-2 text-xs font-bold uppercase text-neutral-500">İlçe</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {DISTRICT_FILTER_OPTIONS.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() =>
                  setDraftDistricts((prev) => toggle(prev, d.id))
                }
                className={clsx(
                  'rounded-full border px-3 py-1.5 text-sm font-semibold',
                  draftDistricts.includes(d.id)
                    ? 'border-chp-red bg-chp-muted text-chp-redDark'
                    : 'border-neutral-200'
                )}>
                {d.label}
              </button>
            ))}
          </div>

          <p className="mb-2 text-xs font-bold uppercase text-neutral-500">Kategori</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {EVENT_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() =>
                  setDraftCategories((prev) => toggle(prev, c.id))
                }
                className={clsx(
                  'rounded-full border px-3 py-1.5 text-sm font-semibold',
                  draftCategories.includes(c.id)
                    ? 'border-chp-red bg-chp-muted text-chp-redDark'
                    : 'border-neutral-200'
                )}>
                {c.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={clearFilters}
              className="flex-1 rounded-xl border border-neutral-200 py-2.5 font-semibold text-neutral-700">
              Temizle
            </button>
            <button
              type="button"
              onClick={applyFilters}
              className="flex-1 rounded-xl bg-chp-red py-2.5 font-bold text-white">
              Uygula
            </button>
          </div>
        </div>
      ) : null}

      {loading ? (
        <p className="text-center text-neutral-500">Yükleniyor…</p>
      ) : null}

      <div className="space-y-4">
        {posts.map((post) => {
          const when = formatEventWhen(post.eventStartAt);
          return (
            <article
              key={post.id}
              className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
              <div className="flex items-start justify-between gap-2 border-b border-neutral-100 p-4">
                <div className="min-w-0 space-y-1">
                  <BranchBadge kind={post.branch} label={post.branchLabel} />
                  <p className="text-xs text-neutral-500">{post.orgPath}</p>
                  <p className="font-semibold text-neutral-900">{post.authorLabel}</p>
                </div>
                <Link
                  href={`/post/${post.id}`}
                  className="shrink-0 text-sm font-bold text-chp-red hover:underline">
                  Detay →
                </Link>
              </div>
              <div className="relative aspect-[4/3] bg-neutral-200">
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
                <div className="space-y-1 border-b border-neutral-100 p-4">
                  {post.eventTitle ? (
                    <h2 className="font-display text-lg font-bold text-neutral-900">
                      {post.eventTitle}
                    </h2>
                  ) : null}
                  {when ? (
                    <p className="text-sm font-semibold text-neutral-600">{when}</p>
                  ) : null}
                  {post.eventDescription ? (
                    <p className="text-sm text-neutral-600 line-clamp-4">
                      {post.eventDescription}
                    </p>
                  ) : null}
                </div>
              )}
              <div className="flex items-center justify-between p-4">
                <button
                  type="button"
                  onClick={() => onLike(post)}
                  className="text-sm font-bold text-neutral-800">
                  {post.liked ? '♥ Beğenildi' : '♡ Beğen'} · {post.likes}
                </button>
                <span className="text-xs text-neutral-500">{post.timeLabel}</span>
              </div>
              {post.caption ? (
                <p className="border-t border-neutral-100 px-4 py-3 text-sm text-neutral-800">
                  {post.caption}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>

      {!loading && posts.length === 0 ? (
        <p className="text-center text-neutral-500">Gönderi yok.</p>
      ) : null}
    </div>
  );
}
