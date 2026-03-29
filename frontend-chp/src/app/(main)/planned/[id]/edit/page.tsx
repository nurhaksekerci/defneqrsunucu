'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import {
  fetchEventCategories,
  fetchOrgUnits,
  fetchPlannedDetail,
  formatLocalIsoForApi,
  parseApiErrorMessage,
  updatePlannedEvent,
  type EventCategoryOption,
  type OrgUnitOption,
} from '@/lib/api';
import { EVENT_CATEGORIES } from '@/lib/constants/eventCategories';
import type { PlannedEvent } from '@/lib/types';

function isoToDatetimeLocal(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function PlannedEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id ?? '');
  const [ev, setEv] = useState<PlannedEvent | null>(null);
  const [orgUnits, setOrgUnits] = useState<OrgUnitOption[]>([]);
  const [categories, setCategories] = useState<EventCategoryOption[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startLocal, setStartLocal] = useState('');
  const [orgUnitId, setOrgUnitId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setErr(null);
    try {
      const [detail, ou, cats] = await Promise.all([
        fetchPlannedDetail(id),
        fetchOrgUnits(),
        fetchEventCategories(),
      ]);
      setEv(detail);
      setOrgUnits(ou);
      setCategories(
        cats.length ? cats : EVENT_CATEGORIES.map((c) => ({ id: c.id, label: c.label }))
      );
      setTitle(detail.title);
      setDescription(detail.description ?? '');
      setLocation(detail.location);
      setStartLocal(isoToDatetimeLocal(detail.startAt));
      setOrgUnitId(detail.orgUnitId ?? ou[0]?.id ?? '');
      setCategoryId(detail.eventCategoryId ?? 'mahalle_saha');
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
    if (!ev) return;
    if (!ev.isMine) {
      setErr('Bu planı düzenleyemezsiniz.');
      return;
    }
    const done = ev.status === 'completed';
    if (!title.trim()) {
      setErr('Başlık zorunlu.');
      return;
    }
    if (!done) {
      if (!location.trim() || !orgUnitId) {
        setErr('Konum ve birim zorunlu.');
        return;
      }
      if (!startLocal) {
        setErr('Tarih ve saat seçin.');
        return;
      }
    }
    setErr(null);
    setBusy(true);
    try {
      if (done) {
        await updatePlannedEvent(id, {
          title: title.trim(),
          description: description.trim(),
        });
      } else {
        await updatePlannedEvent(id, {
          title: title.trim(),
          description: description.trim(),
          location: location.trim(),
          startAt: formatLocalIsoForApi(new Date(startLocal)),
          orgUnitId: parseInt(orgUnitId, 10),
          eventCategoryId: categoryId,
        });
      }
      router.push(`/planned/${id}`);
    } catch (e) {
      setErr(parseApiErrorMessage(e instanceof Error ? e.message : 'Kayıt hatası'));
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

  const done = ev.status === 'completed';

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link href={`/planned/${id}`} className="text-sm font-bold text-chp-red hover:underline">
        ← Detay
      </Link>
      <div>
        <h1 className="font-display text-3xl font-bold text-neutral-900">Planı düzenle</h1>
        {done ? (
          <p className="mt-1 text-sm text-neutral-600">
            Tamamlanan etkinlikte yalnızca başlık ve açıklama güncellenebilir.
          </p>
        ) : null}
      </div>

      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-neutral-500">Başlık</label>
          <input
            required
            className="w-full rounded-xl border px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-neutral-500">Açıklama</label>
          <textarea
            className="w-full rounded-xl border px-3 py-2"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        {!done ? (
          <>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-neutral-500">Birim</label>
              <select
                className="w-full rounded-xl border px-3 py-2"
                value={orgUnitId}
                onChange={(e) => setOrgUnitId(e.target.value)}>
                {orgUnits.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-neutral-500">Kategori</label>
              <select
                className="w-full rounded-xl border px-3 py-2"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-neutral-500">Başlangıç</label>
              <input
                type="datetime-local"
                required
                className="w-full rounded-xl border px-3 py-2"
                value={startLocal}
                onChange={(e) => setStartLocal(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-neutral-500">Konum</label>
              <textarea
                required
                className="w-full rounded-xl border px-3 py-2"
                rows={2}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </>
        ) : null}
        {err ? <p className="text-sm font-semibold text-amber-800">{err}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-chp-red py-3 font-bold text-white disabled:opacity-50">
          {busy ? '…' : 'Kaydet'}
        </button>
      </form>
    </div>
  );
}
