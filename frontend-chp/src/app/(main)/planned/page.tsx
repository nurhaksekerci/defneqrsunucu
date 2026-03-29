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
  parseApiErrorMessage,
} from '@/lib/api';
import {
  PLANNED_LIST_DEFAULT_FILTERS,
  getReportTimeRange,
  plannedListFiltersActive,
  type ReportFilterValue,
} from '@/lib/reportFilters';
import type { PlannedEvent } from '@/lib/types';
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
        <p className="chp-page-sub">
          Tamamlanan kayıtlar akışta görünür; burada yaklaşan ve geçmiş planları yönetirsiniz.
        </p>
        {filtersActive ? (
          <p className="mt-3 inline-flex items-center rounded-lg bg-red-50 px-3 py-1 text-xs font-semibold text-chp-redDark ring-1 ring-chp-red/15">
            Filtre uygulanıyor
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

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab('upcoming')}
          className={clsx(
            'chp-tab',
            tab === 'upcoming' ? 'chp-tab-active' : 'chp-tab-inactive'
          )}>
          Yaklaşan ({upcoming.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('completed')}
          className={clsx(
            'chp-tab',
            tab === 'completed' ? 'chp-tab-active' : 'chp-tab-inactive'
          )}>
          Tamamlanan ({completed.length})
        </button>
      </div>

      {err ? <div className="chp-alert font-medium">{err}</div> : null}
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12">
          <div
            className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-chp-red"
            aria-hidden
          />
          <p className="text-sm font-medium text-slate-600">Liste yükleniyor…</p>
        </div>
      ) : null}

      <div className="space-y-4">
        {list.map((ev) => {
          const done = ev.status === 'completed';
          return (
            <div
              key={ev.id}
              className={clsx(
                'chp-card p-5 transition-opacity',
                done && 'opacity-[0.92]'
              )}>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <BranchBadge kind={ev.branch} label={ev.branchLabel} />
                {done ? (
                  <span className="rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    Tamamlandı
                  </span>
                ) : null}
              </div>
              <h2 className="font-display text-lg font-bold text-slate-900">{ev.title}</h2>
              {ev.description ? (
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{ev.description}</p>
              ) : null}
              <p className="mt-3 text-xs font-medium text-slate-500">{ev.orgPath}</p>
              <p className="mt-1 text-sm font-medium text-slate-700">📅 {ev.startLabel}</p>
              <p className="text-sm font-medium text-slate-700">📍 {ev.location}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Link href={`/planned/${ev.id}`} className="chp-link">
                  Detay
                </Link>
                {ev.isMine && !done ? (
                  <>
                    <Link href={`/planned/${ev.id}/edit`} className="chp-link">
                      Düzenle
                    </Link>
                    <Link
                      href={`/planned/${ev.id}/complete`}
                      className="chp-btn-primary !py-2 text-sm">
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
        <div className="chp-card py-14 text-center">
          <p className="font-medium text-slate-600">Bu dönem ve filtrelerle kayıt yok.</p>
        </div>
      ) : null}
    </div>
  );
}
