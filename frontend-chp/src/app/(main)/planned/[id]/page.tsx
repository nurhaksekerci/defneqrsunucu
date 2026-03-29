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
  if (err || !ev) {
    return <div className="chp-alert font-medium">{err ?? 'Bulunamadı'}</div>;
  }

  const done = ev.status === 'completed';

  return (
    <div className="space-y-6">
      <Link href="/planned" className="chp-back-link">
        ← Planlanan etkinliklere dön
      </Link>

      <div className="chp-card space-y-5 p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <BranchBadge kind={ev.branch} label={ev.branchLabel} />
          {done ? (
            <span className="rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
              Tamamlandı
            </span>
          ) : null}
        </div>
        <p className="crm-mono">{ev.id}</p>
        {ev.description ? (
          <p className="text-sm leading-relaxed text-slate-600">{ev.description}</p>
        ) : null}
        <div className="space-y-1 border-t border-slate-100 pt-4 text-sm">
          <p className="font-medium text-slate-500">{ev.orgPath}</p>
          <p className="font-medium text-slate-800">📅 {ev.startLabel}</p>
          <p className="font-medium text-slate-800">📍 {ev.location}</p>
        </div>

        {ev.isMine ? (
          <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-5">
            <Link href={`/planned/${id}/edit`} className="crm-toolbar-btn text-sm no-underline">
              Düzenle
            </Link>
            {!done ? (
              <Link
                href={`/planned/${id}/complete`}
                className="crm-toolbar-btn-primary text-sm no-underline">
                Tamamla ve görselleri yükle
              </Link>
            ) : null}
            <button
              type="button"
              onClick={onDelete}
              className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900 transition hover:bg-amber-100">
              Sil
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
