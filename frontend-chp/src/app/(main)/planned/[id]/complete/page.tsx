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

  if (loading) return <p className="text-neutral-500">Yükleniyor…</p>;
  if (err && !ev) return <p className="text-amber-800">{err}</p>;
  if (!ev) return <p className="text-neutral-500">Bulunamadı.</p>;
  if (!ev.isMine) {
    return (
      <p className="text-amber-800">
        Bu plan size ait değil.{' '}
        <Link href={`/planned/${id}`} className="font-bold text-chp-red underline">
          Detaya dön
        </Link>
      </p>
    );
  }
  if (ev.status === 'completed') {
    return (
      <p className="text-neutral-600">
        Bu etkinlik zaten tamamlanmış.{' '}
        <Link href={`/planned/${id}`} className="font-bold text-chp-red underline">
          Detaya dön
        </Link>
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link href={`/planned/${id}`} className="text-sm font-bold text-chp-red hover:underline">
        ← Detay
      </Link>
      <div>
        <h1 className="font-display text-3xl font-bold text-neutral-900">Etkinliği tamamla</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Görselleri yükleyin; gönderi akışta görünecek.
        </p>
        <p className="mt-2 font-semibold text-neutral-800">{ev.title}</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-neutral-500">
            Görseller
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            className="w-full text-sm"
            onChange={(e) => {
              const list = e.target.files;
              setFiles(list ? Array.from(list) : []);
            }}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-neutral-500">
            Gönderi metni
          </label>
          <textarea
            className="w-full rounded-xl border px-3 py-2"
            rows={4}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
        </div>
        {err ? <p className="text-sm font-semibold text-amber-800">{err}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-chp-red py-3 font-bold text-white disabled:opacity-50">
          {busy ? '…' : 'Tamamla ve paylaş'}
        </button>
      </form>
    </div>
  );
}
