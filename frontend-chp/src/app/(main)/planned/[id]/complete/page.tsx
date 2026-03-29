'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import {
  completePlannedEvent,
  fetchPlannedDetail,
  parseApiErrorMessage,
} from '@/lib/api';
import type { PlannedEvent } from '@/lib/types';

export default function PlannedCompletePage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id ?? '');
  const [ev, setEv] = useState<PlannedEvent | null>(null);
  const [caption, setCaption] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setErr(null);
    try {
      const detail = await fetchPlannedDetail(id);
      setEv(detail);
      setCaption(detail.title);
    } catch (e) {
      setErr(parseApiErrorMessage(e instanceof Error ? e.message : 'Hata'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ev || ev.status === 'completed' || !ev.isMine) return;
    if (files.length === 0) {
      setErr('En az bir görsel seçin.');
      return;
    }
    setErr(null);
    setBusy(true);
    try {
      const post = await completePlannedEvent(id, files, caption.trim());
      router.push(`/post/${post.id}`);
    } catch (e) {
      setErr(
        parseApiErrorMessage(
          e instanceof Error ? e.message : 'Tamamlanamadı'
        )
      );
    } finally {
      setBusy(false);
    }
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
  if (err && !ev) return <div className="chp-alert font-medium">{err}</div>;
  if (!ev) return <div className="chp-card py-12 text-center text-slate-600">Bulunamadı.</div>;
  if (!ev.isMine) {
    return (
      <div className="chp-alert">
        Bu plan size ait değil.{' '}
        <Link href={`/planned/${id}`} className="chp-link">
          Detaya dön
        </Link>
      </div>
    );
  }
  if (ev.status === 'completed') {
    return (
      <div className="chp-card p-6 text-slate-700">
        Bu etkinlik zaten tamamlanmış.{' '}
        <Link href={`/planned/${id}`} className="chp-link">
          Detaya dön
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <Link href={`/planned/${id}`} className="chp-back-link">
        ← Detay
      </Link>
      <div>
        <h1 className="chp-page-title">Etkinliği tamamla</h1>
        <p className="chp-page-sub">Görselleri yükleyin; gönderi akışta görünecek.</p>
        <p className="mt-3 font-semibold text-slate-900">{ev.title}</p>
      </div>

      <form onSubmit={onSubmit} className="chp-card space-y-5 p-6 sm:p-8">
        <div>
          <label className="chp-section-label !mb-1.5">Görseller</label>
          <input
            type="file"
            accept="image/*"
            multiple
            className="w-full rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-3 py-6 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-chp-red file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
            onChange={(e) => {
              const list = e.target.files;
              setFiles(list ? Array.from(list) : []);
            }}
          />
        </div>
        <div>
          <label className="chp-section-label !mb-1.5">Gönderi metni</label>
          <textarea
            className="chp-input"
            rows={4}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
        </div>
        {err ? <p className="chp-alert text-sm font-medium">{err}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="chp-btn-primary w-full py-3.5 disabled:opacity-50">
          {busy ? 'Gönderiliyor…' : 'Tamamla ve paylaş'}
        </button>
      </form>
    </div>
  );
}
