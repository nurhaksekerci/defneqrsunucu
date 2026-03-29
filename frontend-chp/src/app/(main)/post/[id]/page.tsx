'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { BranchBadge } from '@/components/BranchBadge';
import { CrmPageHeader } from '@/components/crm/CrmPageHeader';
import { FeedPostImageGallery } from '@/components/FeedPostImageGallery';
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <div
          className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-chp-red"
          aria-hidden
        />
        <p className="text-sm font-medium text-slate-600">Yükleniyor…</p>
      </div>
    );
  }
  if (err || !post) {
    return (
      <div className="chp-alert">
        {err ?? 'Gönderi bulunamadı.'}
      </div>
    );
  }

  const urls = post.imageUrls;
  const when = formatWhen(post.eventStartAt);

  return (
    <div className="space-y-6">
      <CrmPageHeader
        kicker="Gönderi"
        title={post.eventTitle || post.authorLabel || 'Etkinlik detayı'}
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Link href="/feed" className="crm-toolbar-btn text-sm no-underline">
              ← Akış
            </Link>
            {canManage ? (
              <>
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="crm-toolbar-btn text-sm">
                  Düzenle
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  className="rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-900 hover:bg-amber-100">
                  Sil
                </button>
              </>
            ) : null}
          </div>
        }
      />

      <div className="crm-panel overflow-hidden p-0">
        <FeedPostImageGallery
          imageUrls={urls}
          alt={post.eventTitle ?? post.caption ?? ''}
        />
      </div>

      <div className="space-y-2">
        <BranchBadge kind={post.branch} label={post.branchLabel} />
        <p className="text-sm font-medium text-slate-600">{post.orgPath}</p>
        <p className="crm-mono">ID {post.id}</p>
      </div>

      {(post.eventTitle || when || post.eventLocation || post.eventDescription) && (
        <div className="crm-panel space-y-3 p-5 sm:p-6">
          {post.eventTitle ? (
            <h2 className="font-display text-xl font-bold text-slate-900">{post.eventTitle}</h2>
          ) : null}
          {when ? <p className="text-sm font-semibold text-slate-600">{when}</p> : null}
          {post.eventLocation ? (
            <p className="text-sm text-slate-600">{post.eventLocation}</p>
          ) : null}
          {post.eventDescription ? (
            <p className="text-sm leading-relaxed text-slate-700">{post.eventDescription}</p>
          ) : null}
        </div>
      )}

      <div className="crm-panel flex items-center justify-between px-4 py-3">
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
          className="text-sm font-semibold text-chp-red hover:text-chp-redDark">
          {post.liked ? '♥ Beğenildi' : '♡ Beğen'} · {post.likes}
        </button>
        <span className="text-sm font-medium text-slate-500">{post.timeLabel}</span>
      </div>

      {post.caption ? (
        <p className="text-sm leading-relaxed text-slate-800">{post.caption}</p>
      ) : null}

      {editOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 backdrop-blur-[2px] sm:items-center">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-lift ring-1 ring-slate-200/80">
            <h3 className="mb-5 font-display text-xl font-bold text-slate-900">Gönderiyi düzenle</h3>
            <label className="chp-section-label !mb-1.5">Başlık</label>
            <input
              className="chp-input mb-4"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <label className="chp-section-label !mb-1.5">Açıklama</label>
            <textarea
              className="chp-input mb-4"
              rows={3}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
            <label className="chp-section-label !mb-1.5">Konum</label>
            <textarea
              className="chp-input mb-4"
              rows={2}
              value={loc}
              onChange={(e) => setLoc(e.target.value)}
            />
            <label className="chp-section-label !mb-1.5">Başlangıç (yerel)</label>
            <input
              type="datetime-local"
              className="chp-input mb-4"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
            />
            <label className="chp-section-label !mb-1.5">Birim</label>
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
            <label className="chp-section-label !mb-1.5">Kategori</label>
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
            <p className="mb-5 text-xs leading-relaxed text-slate-500">
              Bu ekranda yalnızca metin ve etkinlik alanları güncellenir.
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
