'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { BranchBadge } from '@/components/BranchBadge';
import { ReportFilterForm } from '@/components/ReportFilterForm';
import {
  type CommissionOption,
  type PlannedReportQuery,
  fetchCommissions,
  fetchCurrentUser,
  fetchPlannedCompletedFiltered,
  fetchPlannedUpcomingFiltered,
  formatLocalIsoForApi,
} from '@/lib/api';
import {
  PLANNED_LIST_DEFAULT_FILTERS,
  getReportTimeRange,
  plannedListFiltersActive,
  type ReportFilterValue,
} from '@/lib/reportFilters';
import type { PlannedEvent } from '@/lib/types';
import { parseApiErrorMessage } from '@/lib/api';
import clsx from 'clsx';

function asNumberId(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default function PlannedPage() {
  const [tab, setTab] = useState<'upcoming' | 'completed'>('upcoming');
  const [filters, setFilters] = useState<ReportFilterValue>(PLANNED_LIST_DEFAULT_FILTERS);
  const [commissions, setCommissions] = useState<CommissionOption[]>([]);
  const [upcoming, setUpcoming] = useState<PlannedEvent[]>([]);
  const [completed, setCompleted] = useState<PlannedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const { start, end } = useMemo(
    () => getReportTimeRange(filters.timeRangeId),
    [filters.timeRangeId]
  );

  const reportQuery = useMemo((): PlannedReportQuery => {
    const { branchScope, commissionScope } = filters;
    return {
      startGteIso: formatLocalIsoForApi(start),
      startLtIso: formatLocalIsoForApi(end),
      branch: branchScope === 'all' ? 'all' : branchScope,
      commissionId:
        branchScope === 'komisyon' && commissionScope !== 'all'
          ? commissionScope
          : undefined,
    };
  }, [start, end, filters.branchScope, filters.commissionScope]);

  useEffect(() => {
    let c = false;
    void (async () => {
      try {
        const user = await fetchCurrentUser().catch(() => null);
        if (c || !user?.username) return;
        const comm = await fetchCommissions().catch(() => [] as CommissionOption[]);
        if (c) return;
        const b = user.primaryBranch;
        if (b === 'ana_kademe' || b === 'genclik' || b === 'kadin') {
          setFilters((prev) => ({
            ...prev,
            branchScope: b,
            commissionScope: 'all',
          }));
        } else if (b === 'komisyon') {
          const pc = user.primaryCommissionId;
          setFilters((prev) => ({
            ...prev,
            branchScope: 'komisyon',
            commissionScope:
              pc != null && comm.some((x) => asNumberId(x.id) === asNumberId(pc))
                ? asNumberId(pc)!
                : 'all',
          }));
        }
      } catch {
        /* */
      }
    })();
    return () => {
      c = true;
    };
  }, []);

  useEffect(() => {
    void fetchCommissions()
      .then(setCommissions)
      .catch(() => setCommissions([]));
  }, []);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const [u, comp] = await Promise.all([
        fetchPlannedUpcomingFiltered(reportQuery),
        fetchPlannedCompletedFiltered(reportQuery),
      ]);
      setUpcoming(u);
      setCompleted(comp);
    } catch (e) {
      setErr(parseApiErrorMessage(e instanceof Error ? e.message : 'Hata'));
    } finally {
      setLoading(false);
    }
  }, [reportQuery]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtersActive = plannedListFiltersActive(filters);
  const list = tab === 'upcoming' ? upcoming : completed;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="chp-page-title">Planlanan etkinlikler</h1>
        <p className="chp-page-desc">
          Tamamlananlar akışta; burada plan ve geçmiş kayıtlar.
        </p>
        {filtersActive ? (
          <p className="mt-3 inline-flex items-center gap-2 rounded-lg bg-chp-muted px-3 py-1 text-sm font-semibold text-chp-redDark">
            <span className="h-1.5 w-1.5 rounded-full bg-chp-red" aria-hidden />
            Filtre aktif
          </p>
        ) : null}
      </div>

      <ReportFilterForm
        value={filters}
        onChange={setFilters}
        commissions={commissions}
        defaultsForClear={PLANNED_LIST_DEFAULT_FILTERS}
        title="Planlanan filtre"
      />

      <div className="inline-flex rounded-xl border border-chp-border bg-white p-1 shadow-chp-sm">
        <button
          type="button"
          onClick={() => setTab('upcoming')}
          className={clsx(
            'rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
            tab === 'upcoming'
              ? 'bg-chp-red text-white shadow-chp-sm'
              : 'text-chp-inkMuted hover:bg-slate-50 hover:text-chp-ink'
          )}>
          Yaklaşan ({upcoming.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('completed')}
          className={clsx(
            'rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
            tab === 'completed'
              ? 'bg-chp-red text-white shadow-chp-sm'
              : 'text-chp-inkMuted hover:bg-slate-50 hover:text-chp-ink'
          )}>
          Tamamlanan ({completed.length})
        </button>
      </div>

      {err ? <p className="text-sm font-medium text-amber-800">{err}</p> : null}
      {loading ? (
        <p className="text-sm font-medium text-chp-inkMuted">Yükleniyor…</p>
      ) : null}

      <div className="space-y-4">
        {list.map((ev) => {
          const done = ev.status === 'completed';
          return (
            <div
              key={ev.id}
              className={clsx(
                'chp-card-elevated p-5 transition-shadow hover:shadow-chp',
                done && 'opacity-95 ring-1 ring-chp-borderStrong/60'
              )}>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <BranchBadge kind={ev.branch} label={ev.branchLabel} />
                {done ? (
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-chp-inkMuted ring-1 ring-chp-border">
                    Tamamlandı
                  </span>
                ) : null}
              </div>
              <h2 className="font-display text-lg font-bold text-chp-ink">{ev.title}</h2>
              {ev.description ? (
                <p className="mt-1 text-sm leading-relaxed text-chp-inkMuted">{ev.description}</p>
              ) : null}
              <p className="mt-2 text-xs font-medium text-chp-inkMuted">{ev.orgPath}</p>
              <p className="text-sm font-medium text-chp-ink">📅 {ev.startLabel}</p>
              <p className="text-sm font-medium text-chp-ink">📍 {ev.location}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Link
                  href={`/planned/${ev.id}`}
                  className="text-sm font-semibold text-chp-red hover:text-chp-redDark">
                  Detay
                </Link>
                {ev.isMine && !done ? (
                  <>
                    <Link
                      href={`/planned/${ev.id}/edit`}
                      className="text-sm font-semibold text-chp-red hover:text-chp-redDark">
                      Düzenle
                    </Link>
                    <Link
                      href={`/planned/${ev.id}/complete`}
                      className="rounded-lg bg-chp-red px-3 py-1.5 text-sm font-semibold text-white shadow-chp-sm hover:bg-chp-redHover">
                      Tamamla
                    </Link>
                  </>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {!loading && list.length === 0 ? (
        <div className="chp-card rounded-2xl px-6 py-10 text-center">
          <p className="text-sm font-medium text-chp-inkMuted">Kayıt yok.</p>
        </div>
      ) : null}
    </div>
  );
}
