'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  parseApiErrorMessage,
} from '@/lib/api';
import type { NotificationItem } from '@/lib/types';
import clsx from 'clsx';

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
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="chp-page-title">Bildirimler</h1>
        {items.some((n) => n.unread) ? (
          <button
            type="button"
            onClick={() => void onReadAll()}
            className="text-sm font-semibold text-chp-red underline decoration-chp-borderStrong underline-offset-4 hover:text-chp-redDark">
            Tümünü okundu işaretle
          </button>
        ) : null}
      </div>

      {err ? <p className="text-sm font-medium text-amber-800">{err}</p> : null}
      {loading ? (
        <p className="text-sm font-medium text-chp-inkMuted">Yükleniyor…</p>
      ) : null}

      <ul className="space-y-3">
        {items.map((n) => (
          <li
            key={n.id}
            className={clsx(
              'rounded-2xl border p-5 transition-shadow',
              n.unread
                ? 'border-chp-red/20 bg-white shadow-chp ring-1 ring-chp-red/10'
                : 'chp-card'
            )}>
            <p className="font-bold text-chp-ink">{n.title}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-chp-inkMuted">{n.body}</p>
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-chp-inkMuted">{n.timeLabel}</span>
              {n.unread ? (
                <button
                  type="button"
                  onClick={() => void onRead(n.id)}
                  className="text-xs font-semibold text-chp-red hover:text-chp-redDark">
                  Okundu
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      {!loading && items.length === 0 ? (
        <div className="chp-card rounded-2xl px-6 py-12 text-center">
          <p className="text-sm font-medium text-chp-inkMuted">Bildirim yok.</p>
        </div>
      ) : null}
    </div>
  );
}
