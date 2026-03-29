'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { CrmPageHeader } from '@/components/crm/CrmPageHeader';
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
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <div
          className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-chp-red"
          aria-hidden
        />
        <p className="text-sm font-medium text-slate-600">Yönlendiriliyor…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <CrmPageHeader
        kicker="Planlama"
        title="Etkinlik planla"
        description="Mobil uygulamadaki Planla sekmesi ile aynı işlem: POST /planned/ (createPlannedEvent)."
      />

      <form onSubmit={onSubmit} className="crm-panel space-y-5 p-6 sm:p-8">
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
          <textarea className="chp-input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
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
        {err ? <p className="chp-alert text-sm font-medium">{err}</p> : null}
        <button type="submit" disabled={busy} className="chp-btn-primary w-full py-3.5">
          {busy ? 'Kaydediliyor…' : 'Planı oluştur'}
        </button>
      </form>
    </div>
  );
}
