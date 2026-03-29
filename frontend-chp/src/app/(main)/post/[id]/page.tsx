'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { BranchBadge } from '@/components/BranchBadge';
import {
  deletePost,
  fetchEventCategories,
  fetchOrgUnits,
  fetchPost,
  likePost,
  parseApiErrorMessage,
  updatePost,
  type EventCategoryOption,
  type OrgUnitOption,
} from '@/lib/api';
import type { FeedPost } from '@/lib/types';
import { EVENT_CATEGORIES } from '@/lib/constants/eventCategories';

function formatWhen(iso?: string | null): string | null {
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

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id ?? '');
  const [post, setPost] = useState<FeedPost | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [loc, setLoc] = useState('');
  const [startAt, setStartAt] = useState('');
  const [orgUnits, setOrgUnits] = useState<OrgUnitOption[]>([]);
  const [categories, setCategories] = useState<EventCategoryOption[]>([]);
  const [orgId, setOrgId] = useState('');
  const [catId, setCatId] = useState('');
  const [imgIdx, setImgIdx] = useState(0);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setErr(null);
    try {
      const p = await fetchPost(id);
      setPost(p);
      setTitle(p.eventTitle ?? '');
      setDesc(p.eventDescription ?? '');
      setLoc(p.eventLocation ?? '');
      setStartAt(
        p.eventStartAt
          ? new Date(p.eventStartAt).toISOString().slice(0, 16)
          : ''
      );
      setOrgId(p.orgUnitId ?? '');
      setCatId(p.eventCategoryId ?? '');
    } catch (e) {
      setErr(parseApiErrorMessage(e instanceof Error ? e.message : 'Hata'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!editOpen) return;
    void Promise.all([fetchOrgUnits(), fetchEventCategories()]).then(([ou, cats]) => {
      setOrgUnits(ou);
      setCategories(
        cats.length ? cats : EVENT_CATEGORIES.map((c) => ({ id: c.id, label: c.label }))
      );
    });
  }, [editOpen]);

  const canManage = post?.canManage ?? post?.isMine;

  const onSave = async () => {
    if (!post) return;
    setSaving(true);
    try {
      const updated = await updatePost(id, {
        eventTitle: title,
        eventDescription: desc,
        eventLocation: loc.trim(),
        eventStartAt: startAt ? new Date(startAt).toISOString() : undefined,
        orgUnitId: orgId ? parseInt(orgId, 10) : undefined,
        eventCategoryId: catId || undefined,
      });
      setPost(updated);
      setEditOpen(false);
    } catch (e) {
      alert(parseApiErrorMessage(e instanceof Error ? e.message : 'Kayıt hatası'));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    if (!confirm('Gönderiyi silmek istediğinize emin misiniz?')) return;
    void deletePost(id)
      .then(() => router.push('/feed'))
      .catch((e) =>
        alert(parseApiErrorMessage(e instanceof Error ? e.message : 'Silinemedi'))
      );
  };

  if (loading) return <p className="text-sm font-medium text-chp-inkMuted">Yükleniyor…</p>;
  if (err || !post)
    return <p className="text-sm font-medium text-amber-800">{err ?? 'Bulunamadı'}</p>;

  const urls = post.imageUrls;
  const when = formatWhen(post.eventStartAt);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/feed"
          className="text-sm font-semibold text-chp-red transition-colors hover:text-chp-redDark">
          ← Akış
        </Link>
        {canManage ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="rounded-xl bg-chp-muted px-4 py-2 text-sm font-semibold text-chp-redDark ring-1 ring-chp-red/10">
              Düzenle
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="rounded-xl border border-amber-300/90 bg-amber-50/50 px-4 py-2 text-sm font-semibold text-amber-900">
              Sil
            </button>
          </div>
        ) : null}
      </div>

      <BranchBadge kind={post.branch} label={post.branchLabel} />
      <p className="text-sm font-medium text-chp-inkMuted">{post.orgPath}</p>
      <h1 className="font-display text-2xl font-bold tracking-tight text-chp-ink">
        {post.authorLabel}
      </h1>

      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-200/80 shadow-chp-sm ring-1 ring-chp-border/60">
        {urls[imgIdx] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={urls[imgIdx]} alt="" className="h-full w-full object-cover" />
        ) : null}
      </div>
      {urls.length > 1 ? (
        <div className="flex gap-2">
          {urls.map((u, i) => (
            <button
              key={u}
              type="button"
              onClick={() => setImgIdx(i)}
              className={
                i === imgIdx ? 'ring-2 ring-chp-red ring-offset-2 rounded-lg' : ''
              }>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" className="h-16 w-16 rounded-lg object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      {(post.eventTitle || when || post.eventLocation || post.eventDescription) && (
        <div className="chp-card-elevated space-y-2 p-5">
          {post.eventTitle ? (
            <h2 className="font-display text-xl font-bold text-chp-ink">{post.eventTitle}</h2>
          ) : null}
          {when ? (
            <p className="text-sm font-semibold text-chp-inkMuted">{when}</p>
          ) : null}
          {post.eventLocation ? (
            <p className="text-sm text-chp-inkMuted">{post.eventLocation}</p>
          ) : null}
          {post.eventDescription ? (
            <p className="text-sm leading-relaxed text-chp-ink">{post.eventDescription}</p>
          ) : null}
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={async () => {
            try {
              const r = await likePost(post.id, !post.liked);
              setPost((p) =>
                p ? { ...p, liked: r.liked, likes: r.likes } : p
              );
            } catch {
              /* */
            }
          }}
          className="text-sm font-semibold text-chp-red">
          {post.liked ? '♥ Beğenildi' : '♡ Beğen'} · {post.likes}
        </button>
        <span className="text-sm font-medium text-chp-inkMuted">{post.timeLabel}</span>
      </div>

      {post.caption ? (
        <p className="leading-relaxed text-chp-ink">{post.caption}</p>
      ) : null}

      {editOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-chp-ink/50 p-4 backdrop-blur-[2px] sm:items-center">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-chp-border bg-white p-6 shadow-chp-lg">
            <h3 className="mb-5 font-display text-xl font-bold text-chp-ink">
              Gönderiyi düzenle
            </h3>
            <label className="chp-section-label">Başlık</label>
            <input className="chp-input mb-4" value={title} onChange={(e) => setTitle(e.target.value)} />
            <label className="chp-section-label">Açıklama</label>
            <textarea
              className="chp-input mb-4"
              rows={3}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
            <label className="chp-section-label">Konum</label>
            <textarea
              className="chp-input mb-4"
              rows={2}
              value={loc}
              onChange={(e) => setLoc(e.target.value)}
            />
            <label className="chp-section-label">Başlangıç (yerel)</label>
            <input
              type="datetime-local"
              className="chp-input mb-4"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
            />
            <label className="chp-section-label">Birim</label>
            <select
              className="chp-input mb-4"
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}>
              <option value="">—</option>
              {orgUnits.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
            <label className="chp-section-label">Kategori</label>
            <select
              className="chp-input mb-4"
              value={catId}
              onChange={(e) => setCatId(e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            <p className="mb-5 text-xs text-chp-inkMuted">
              Görsel değişiklikleri için mobil uygulamayı kullanabilirsiniz.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="chp-btn-secondary flex-1">
                İptal
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void onSave()}
                className="chp-btn-primary flex-1 disabled:opacity-50">
                Kaydet
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
