'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/components/AuthProvider';
import {
  createPlannedEvent,
  fetchCurrentUser,
  fetchEventCategories,
  fetchOrgUnits,
  formatLocalIsoForApi,
  parseApiErrorMessage,
  type EventCategoryOption,
  type OrgUnitOption,
} from '@/lib/api';
import { EVENT_CATEGORIES } from '@/lib/constants/eventCategories';
import { hasPresidentMembershipRole } from '@/lib/userRoles';

export default function PlanPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [orgUnits, setOrgUnits] = useState<OrgUnitOption[]>([]);
  const [categories, setCategories] = useState<EventCategoryOption[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startLocal, setStartLocal] = useState('');
  const [orgUnitId, setOrgUnitId] = useState('');
  const [categoryId, setCategoryId] = useState('mahalle_saha');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (user && hasPresidentMembershipRole(user)) {
      router.replace('/report');
    }
  }, [user, router]);

  useEffect(() => {
    void Promise.all([
      fetchOrgUnits(),
      fetchEventCategories(),
      fetchCurrentUser(),
    ]).then(([ou, cats]) => {
      setOrgUnits(ou);
      setCategories(
        cats.length ? cats : EVENT_CATEGORIES.map((c) => ({ id: c.id, label: c.label }))
      );
      if (ou[0]) setOrgUnitId(ou[0].id);
    });
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !location.trim() || !orgUnitId) {
      setErr('Başlık, konum ve birim zorunlu.');
      return;
    }
    if (!startLocal) {
      setErr('Tarih ve saat seçin.');
      return;
    }
    setErr(null);
    setBusy(true);
    try {
      const startAt = formatLocalIsoForApi(new Date(startLocal));
      await createPlannedEvent({
        title: title.trim(),
        description: description.trim(),
        org_unit_id: parseInt(orgUnitId, 10),
        start_at: startAt,
        location: location.trim(),
        event_category_id: categoryId,
      });
      router.push('/planned');
    } catch (e) {
      setErr(parseApiErrorMessage(e instanceof Error ? e.message : 'Kayıt hatası'));
    } finally {
      setBusy(false);
    }
  };

  if (user && hasPresidentMembershipRole(user)) {
    return (
      <p className="text-neutral-500">Yönlendiriliyor…</p>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-neutral-900">
          Etkinlik planla
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Yeni planlanan etkinlik oluşturun.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-neutral-500">
            Başlık
          </label>
          <input
            required
            className="w-full rounded-xl border px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-neutral-500">
            Açıklama
          </label>
          <textarea
            className="w-full rounded-xl border px-3 py-2"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-neutral-500">
            Birim
          </label>
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
          <label className="mb-1 block text-xs font-bold uppercase text-neutral-500">
            Kategori
          </label>
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
          <label className="mb-1 block text-xs font-bold uppercase text-neutral-500">
            Başlangıç
          </label>
          <input
            type="datetime-local"
            required
            className="w-full rounded-xl border px-3 py-2"
            value={startLocal}
            onChange={(e) => setStartLocal(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-neutral-500">
            Konum
          </label>
          <textarea
            required
            className="w-full rounded-xl border px-3 py-2"
            rows={2}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        {err ? <p className="text-sm font-semibold text-amber-800">{err}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-chp-red py-3 font-bold text-white disabled:opacity-50">
          {busy ? '…' : 'Planı oluştur'}
        </button>
      </form>
    </div>
  );
}
