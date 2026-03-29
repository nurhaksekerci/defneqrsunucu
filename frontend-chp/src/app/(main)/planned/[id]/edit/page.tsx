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

  const done = ev.status === 'completed';

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <Link href={`/planned/${id}`} className="chp-back-link">
        ← Detay
      </Link>
      <div>
        <h1 className="chp-page-title">Planı düzenle</h1>
        {done ? (
          <p className="chp-page-sub">
            Tamamlanan etkinlikte yalnızca başlık ve açıklama güncellenebilir.
          </p>
        ) : null}
      </div>

      <form onSubmit={onSubmit} className="chp-card space-y-5 p-6 sm:p-8">
        <div>
          <label className="chp-section-label !mb-1.5">Başlık</label>
          <input
            required
            className="chp-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="chp-section-label !mb-1.5">Açıklama</label>
          <textarea
            className="chp-input"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        {!done ? (
          <>
            <div>
              <label className="chp-section-label !mb-1.5">Birim</label>
              <select
                className="chp-input"
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
              <label className="chp-section-label !mb-1.5">Kategori</label>
              <select
                className="chp-input"
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
              <label className="chp-section-label !mb-1.5">Başlangıç</label>
              <input
                type="datetime-local"
                required
                className="chp-input"
                value={startLocal}
                onChange={(e) => setStartLocal(e.target.value)}
              />
            </div>
            <div>
              <label className="chp-section-label !mb-1.5">Konum</label>
              <textarea
                required
                className="chp-input"
                rows={2}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </>
        ) : null}
        {err ? <p className="chp-alert text-sm font-medium">{err}</p> : null}
        <button type="submit" disabled={busy} className="chp-btn-primary w-full py-3.5 disabled:opacity-50">
          {busy ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
      </form>
    </div>
  );
}
