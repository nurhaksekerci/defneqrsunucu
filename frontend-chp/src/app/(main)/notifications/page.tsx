'use client';

import { useCallback, useEffect, useState } from 'react';

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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-3xl font-bold text-neutral-900">Bildirimler</h1>
        {items.some((n) => n.unread) ? (
          <button
            type="button"
            onClick={() => void onReadAll()}
            className="text-sm font-bold text-chp-red hover:underline">
            Tümünü okundu işaretle
          </button>
        ) : null}
      </div>

      {err ? <p className="text-amber-800">{err}</p> : null}
      {loading ? <p className="text-neutral-500">Yükleniyor…</p> : null}

      <ul className="space-y-3">
        {items.map((n) => (
          <li
            key={n.id}
            className={
              n.unread
                ? 'rounded-2xl border border-chp-muted bg-white p-4 shadow-sm'
                : 'rounded-2xl border border-neutral-200 bg-neutral-50 p-4'
            }>
            <p className="font-bold text-neutral-900">{n.title}</p>
            <p className="mt-1 text-sm text-neutral-700">{n.body}</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-neutral-500">{n.timeLabel}</span>
              {n.unread ? (
                <button
                  type="button"
                  onClick={() => void onRead(n.id)}
                  className="text-xs font-bold text-chp-red hover:underline">
                  Okundu
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      {!loading && items.length === 0 ? (
        <p className="text-neutral-500">Bildirim yok.</p>
      ) : null}
    </div>
  );
}
