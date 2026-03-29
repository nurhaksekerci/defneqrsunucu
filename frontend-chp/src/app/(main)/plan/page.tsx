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
    return <p className="text-sm font-medium text-chp-inkMuted">Yönlendiriliyor…</p>;
  }

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div>
        <h1 className="chp-page-title">Etkinlik planla</h1>
        <p className="chp-page-desc">Yeni planlanan etkinlik oluşturun.</p>
      </div>

      <form onSubmit={onSubmit} className="chp-card-elevated space-y-5 p-6 sm:p-8">
        <div>
          <label className="chp-section-label">Başlık</label>
          <input
            required
            className="chp-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="chp-section-label">Açıklama</label>
          <textarea
            className="chp-input min-h-[5rem]"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <label className="chp-section-label">Birim</label>
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
          <label className="chp-section-label">Kategori</label>
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
          <label className="chp-section-label">Başlangıç</label>
          <input
            type="datetime-local"
            required
            className="chp-input"
            value={startLocal}
            onChange={(e) => setStartLocal(e.target.value)}
          />
        </div>
        <div>
          <label className="chp-section-label">Konum</label>
          <textarea
            required
            className="chp-input min-h-[4rem]"
            rows={2}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        {err ? (
          <p className="rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
            {err}
          </p>
        ) : null}
        <button type="submit" disabled={busy} className="chp-btn-primary w-full">
          {busy ? 'Kaydediliyor…' : 'Planı oluştur'}
        </button>
      </form>
    </div>
  );
}
