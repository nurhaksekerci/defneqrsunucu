'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { BranchBadge } from '@/components/BranchBadge';
import { CrmPageHeader } from '@/components/crm/CrmPageHeader';
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
    <div className="space-y-6">
      <CrmPageHeader
        kicker="Planlama"
        title="Planlanan etkinlikler"
        description="Mobil uygulamadaki Planlanan sekmesi ile aynı veri: yaklaşan ve tamamlanan kayıtlar, filtreler ve plan düzenleme / tamamlama bağlantıları."
      />

      {filtersActive ? (
        <p className="-mt-2 inline-block rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-900">
          Filtre aktif
        </p>
      ) : null}

      <ReportFilterForm
        value={filters}
        onChange={setFilters}
        commissions={commissions}
        defaultsForClear={PLANNED_LIST_DEFAULT_FILTERS}
        title="Liste filtresi"
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab('upcoming')}
          className={clsx(
            'crm-tab px-4 py-2 text-sm font-semibold',
            tab === 'upcoming' ? 'crm-tab-active' : 'crm-tab-inactive'
          )}>
          Yaklaşan ({upcoming.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('completed')}
          className={clsx(
            'crm-tab px-4 py-2 text-sm font-semibold',
            tab === 'completed' ? 'crm-tab-active' : 'crm-tab-inactive'
          )}>
          Tamamlanan ({completed.length})
        </button>
      </div>

      {err ? <div className="chp-alert font-medium">{err}</div> : null}
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <div
            className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-chp-red"
            aria-hidden
          />
          <p className="text-sm font-medium text-slate-600">Kayıtlar yükleniyor…</p>
        </div>
      ) : null}

      {!loading && list.length > 0 ? (
        <div className="crm-table-wrap">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Durum</th>
                <th>Kol</th>
                <th>Başlık</th>
                <th>Başlangıç</th>
                <th>Konum</th>
                <th className="text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {list.map((ev) => {
                const done = ev.status === 'completed';
                return (
                  <tr key={ev.id}>
                    <td>
                      {done ? (
                        <span className="rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                          Tamamlandı
                        </span>
                      ) : (
                        <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                          Planlandı
                        </span>
                      )}
                    </td>
                    <td>
                      <BranchBadge kind={ev.branch} label={ev.branchLabel} />
                    </td>
                    <td>
                      <p className="max-w-[240px] font-semibold text-slate-900 lg:max-w-md">
                        {ev.title}
                      </p>
                      <p className="crm-mono mt-0.5">{ev.id.slice(0, 12)}…</p>
                    </td>
                    <td className="whitespace-nowrap text-slate-700">{ev.startLabel}</td>
                    <td>
                      <p className="max-w-[200px] truncate text-slate-600 lg:max-w-xs">
                        {ev.location}
                      </p>
                    </td>
                    <td className="text-right">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <Link href={`/planned/${ev.id}`} className="crm-toolbar-btn !py-1.5 text-xs">
                          Detay
                        </Link>
                        {ev.isMine && !done ? (
                          <>
                            <Link
                              href={`/planned/${ev.id}/edit`}
                              className="crm-toolbar-btn !py-1.5 text-xs">
                              Düzenle
                            </Link>
                            <Link
                              href={`/planned/${ev.id}/complete`}
                              className="crm-toolbar-btn-primary !py-1.5 text-xs">
                              Tamamla
                            </Link>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {!loading && list.length === 0 ? (
        <div className="crm-panel py-14 text-center text-sm text-slate-600">
          Bu dönem ve filtrelerle kayıt bulunmuyor.
        </div>
      ) : null}
    </div>
  );
}
