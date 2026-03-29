'use client';

import { useCallback, useEffect, useState } from 'react';

import { CrmPageHeader } from '@/components/crm/CrmPageHeader';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  parseApiErrorMessage,
} from '@/lib/api';
import type { NotificationItem } from '@/lib/types';

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      setItems(await fetchNotifications());
    } catch (e) {
      setErr(parseApiErrorMessage(e instanceof Error ? e.message : 'Hata'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
      );
    } catch {
      /* */
    }
  };

  const onReadAll = async () => {
    try {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((n) => ({ ...n, unread: false })));
    } catch {
      /* */
    }
  };

  return (
    <div className="space-y-6">
      <CrmPageHeader
        kicker="İletişim"
        title="Bildirimler"
        description="GET /notifications/, okundu işaretleme ve read-all uçları mobil uygulama ile aynıdır."
        action={
          items.some((n) => n.unread) ? (
            <button
              type="button"
              onClick={() => void onReadAll()}
              className="crm-toolbar-btn text-sm">
              Tümünü okundu işaretle
            </button>
          ) : null
        }
      />

      {err ? <div className="chp-alert font-medium">{err}</div> : null}
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12">
          <div
            className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-chp-red"
            aria-hidden
          />
          <p className="text-sm font-medium text-slate-600">Yükleniyor…</p>
        </div>
      ) : null}

      <ul className="space-y-3">
        {items.map((n) => (
          <li
            key={n.id}
            className={
              n.unread
                ? 'crm-panel border-l-4 border-l-chp-red p-5'
                : 'crm-panel bg-slate-50/80 p-5'
            }>
            <p className="font-semibold text-slate-900">{n.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{n.body}</p>
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-xs font-medium text-slate-500">{n.timeLabel}</span>
              {n.unread ? (
                <button
                  type="button"
                  onClick={() => void onRead(n.id)}
                  className="text-xs font-semibold text-chp-red hover:text-chp-redDark">
                  Okundu işaretle
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      {!loading && items.length === 0 ? (
        <div className="crm-panel py-14 text-center text-sm text-slate-600">Bildirim yok.</div>
      ) : null}
    </div>
  );
}
