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

  if (loading) return <p className="text-sm font-medium text-chp-inkMuted">Yükleniyor…</p>;
  if (err || !ev)
    return <p className="text-sm font-medium text-amber-800">{err ?? 'Bulunamadı'}</p>;

  const done = ev.status === 'completed';

  return (
    <div className="space-y-6">
      <Link
        href="/planned"
        className="inline-flex text-sm font-semibold text-chp-red hover:text-chp-redDark">
        ← Planlanan
      </Link>
      <div className="chp-card-elevated space-y-5 p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <BranchBadge kind={ev.branch} label={ev.branchLabel} />
          {done ? (
            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-chp-inkMuted ring-1 ring-chp-border">
              Tamamlandı
            </span>
          ) : null}
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-chp-ink">{ev.title}</h1>
        {ev.description ? (
          <p className="leading-relaxed text-chp-inkMuted">{ev.description}</p>
        ) : null}
        <p className="text-sm font-medium text-chp-inkMuted">{ev.orgPath}</p>
        <div className="space-y-1 border-t border-chp-border pt-4 text-sm font-medium text-chp-ink">
          <p>📅 {ev.startLabel}</p>
          <p>📍 {ev.location}</p>
        </div>

        {ev.isMine ? (
          <div className="flex flex-wrap gap-2 border-t border-chp-border pt-5">
            <Link
              href={`/planned/${id}/edit`}
              className="chp-btn-secondary">
              Düzenle
            </Link>
            {!done ? (
              <Link href={`/planned/${id}/complete`} className="chp-btn-primary">
                Tamamla ve görselleri yükle
              </Link>
            ) : null}
            <button
              type="button"
              onClick={onDelete}
              className="rounded-xl border border-amber-300/90 bg-amber-50/50 px-4 py-2.5 text-sm font-semibold text-amber-900">
              Sil
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
