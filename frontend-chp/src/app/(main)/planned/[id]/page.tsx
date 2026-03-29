'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { BranchBadge } from '@/components/BranchBadge';
import { deletePlannedEvent, fetchPlannedDetail, parseApiErrorMessage } from '@/lib/api';
import type { PlannedEvent } from '@/lib/types';

export default function PlannedDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id ?? '');
  const [ev, setEv] = useState<PlannedEvent | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setErr(null);
    try {
      setEv(await fetchPlannedDetail(id));
    } catch (e) {
      setErr(parseApiErrorMessage(e instanceof Error ? e.message : 'Hata'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const onDelete = () => {
    if (!confirm('Planı silmek istediğinize emin misiniz?')) return;
    void deletePlannedEvent(id)
      .then(() => router.push('/planned'))
      .catch((e) =>
        alert(parseApiErrorMessage(e instanceof Error ? e.message : 'Silinemedi'))
      );
  };

  if (loading) return <p className="text-neutral-500">Yükleniyor…</p>;
  if (err || !ev) return <p className="text-amber-800">{err ?? 'Bulunamadı'}</p>;

  const done = ev.status === 'completed';

  return (
    <div className="space-y-4">
      <Link href="/planned" className="text-sm font-bold text-chp-red hover:underline">
        ← Planlanan
      </Link>
      <div className="flex flex-wrap gap-2">
        <BranchBadge kind={ev.branch} label={ev.branchLabel} />
        {done ? (
          <span className="rounded-full bg-neutral-200 px-2 py-1 text-xs font-bold">
            Tamamlandı
          </span>
        ) : null}
      </div>
      <h1 className="font-display text-2xl font-bold text-neutral-900">{ev.title}</h1>
      {ev.description ? <p className="text-neutral-700">{ev.description}</p> : null}
      <p className="text-sm text-neutral-500">{ev.orgPath}</p>
      <p className="text-neutral-800">📅 {ev.startLabel}</p>
      <p className="text-neutral-800">📍 {ev.location}</p>

      {ev.isMine ? (
        <div className="flex flex-wrap gap-2 pt-4">
          <Link
            href={`/planned/${id}/edit`}
            className="rounded-xl bg-chp-muted px-4 py-2 font-bold text-chp-redDark">
            Düzenle
          </Link>
          {!done ? (
            <Link
              href={`/planned/${id}/complete`}
              className="rounded-xl bg-chp-red px-4 py-2 font-bold text-white">
              Tamamla ve görselleri yükle
            </Link>
          ) : null}
          <button
            type="button"
            onClick={onDelete}
            className="rounded-xl border border-amber-400 px-4 py-2 font-bold text-amber-900">
            Sil
          </button>
        </div>
      ) : null}
    </div>
  );
}
