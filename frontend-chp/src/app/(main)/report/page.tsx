'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { ReportFilterForm } from '@/components/ReportFilterForm';
import {
  type CommissionOption,
  type PlannedCategoryBreakdownRow,
  type PlannedReportQuery,
  fetchCommissions,
  fetchCurrentUser,
  fetchPlannedReportBreakdown,
  formatLocalIsoForApi,
  parseApiErrorMessage,
} from '@/lib/api';
import {
  DEFAULT_REPORT_FILTERS,
  getReportTimeRange,
  reportFiltersActive,
  type ReportFilterValue,
} from '@/lib/reportFilters';
import type { BranchKind } from '@/lib/types';

const BRANCH_LABEL: Record<BranchKind, string> = {
  ana_kademe: 'Ana Kademe',
  genclik: 'Gençlik',
  kadin: 'Kadın',
  komisyon: 'Komisyon',
};

function asNumberId(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function sum(rows: PlannedCategoryBreakdownRow[]): number {
  return rows.reduce((s, r) => s + r.count, 0);
}

export default function ReportPage() {
  const [filters, setFilters] = useState<ReportFilterValue>(DEFAULT_REPORT_FILTERS);
  const [commissions, setCommissions] = useState<CommissionOption[]>([]);
  const [tam, setTam] = useState<PlannedCategoryBreakdownRow[]>([]);
  const [plan, setPlan] = useState<PlannedCategoryBreakdownRow[]>([]);
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
      const bd = await fetchPlannedReportBreakdown(reportQuery);
      setTam(bd.tamamlanan);
      setPlan(bd.planlanan);
    } catch (e) {
      setErr(parseApiErrorMessage(e instanceof Error ? e.message : 'Hata'));
    } finally {
      setLoading(false);
    }
  }, [reportQuery]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtersActive = reportFiltersActive(filters);
  const scopeSubtitle = useMemo(() => {
    const { branchScope, commissionScope } = filters;
    if (branchScope === 'all') return 'Tüm kollar';
    if (branchScope !== 'komisyon') return BRANCH_LABEL[branchScope];
    if (commissionScope === 'all') return 'Komisyon · Tümü';
    const c = commissions.find((x) => x.id === commissionScope);
    return c ? `Komisyon · ${c.name}` : 'Komisyon';
  }, [filters, commissions]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-neutral-900">Rapor</h1>
        <p className="mt-1 text-sm font-semibold text-neutral-700">{scopeSubtitle}</p>
        {filtersActive ? (
          <p className="mt-2 text-sm font-semibold text-chp-red">Filtre aktif</p>
        ) : null}
      </div>

      <ReportFilterForm
        value={filters}
        onChange={setFilters}
        commissions={commissions}
        defaultsForClear={DEFAULT_REPORT_FILTERS}
        title="Rapor filtresi"
      />

      {err ? <p className="text-amber-800">{err}</p> : null}
      {loading ? <p className="text-neutral-500">Yükleniyor…</p> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <p className="text-sm font-bold text-neutral-500">Tamamlanan</p>
          <p className="font-display text-4xl font-bold text-chp-red">{sum(tam)}</p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <p className="text-sm font-bold text-neutral-500">Planlanan</p>
          <p className="font-display text-4xl font-bold text-chp-red">{sum(plan)}</p>
        </div>
      </div>

      <p className="text-center text-xs text-neutral-500">
        Sayılar etkinlik başlangıç tarihine göre; sunucu kategori kırılımı ile uyumludur.
      </p>

      <Breakdown title="Tamamlanan · kategori" rows={tam} />
      <Breakdown title="Planlanan · kategori" rows={plan} />
    </div>
  );
}

function Breakdown({
  title,
  rows,
}: {
  title: string;
  rows: PlannedCategoryBreakdownRow[];
}) {
  return (
    <div>
      <h2 className="mb-2 font-display text-lg font-bold text-neutral-900">{title}</h2>
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        {rows.map((row, i) => (
          <div
            key={row.eventCategoryId}
            className={
              i < rows.length - 1 ? 'border-b border-neutral-100' : ''
            }>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="font-semibold text-neutral-800">{row.label}</span>
              <span className="font-display text-lg font-bold text-chp-redDark">
                {row.count}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
