'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { CrmPageHeader } from '@/components/crm/CrmPageHeader';
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
      <CrmPageHeader
        kicker="Analiz"
        title="Planlama raporu"
        description={`Mobil uygulamadaki Rapor sekmesi ile aynı uç: GET planned/ kırılımı. Kapsam: ${scopeSubtitle}.`}
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
        defaultsForClear={DEFAULT_REPORT_FILTERS}
        title="Rapor filtresi"
      />

      {err ? <div className="chp-alert font-medium">{err}</div> : null}
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12">
          <div
            className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-chp-red"
            aria-hidden
          />
          <p className="text-sm font-medium text-slate-600">Rapor yükleniyor…</p>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="crm-panel border-l-4 border-l-chp-red p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Tamamlanan etkinlik
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-chp-red">{sum(tam)}</p>
        </div>
        <div className="crm-panel border-l-4 border-l-slate-400 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Planlanan etkinlik
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-slate-800">{sum(plan)}</p>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-slate-500">
        Toplamlar etkinlik başlangıç zamanına göre; kategori satırları sunucu yanıtıyla uyumludur.
      </p>

      <Breakdown title="Tamamlanan — kategori dağılımı" rows={tam} />
      <Breakdown title="Planlanan — kategori dağılımı" rows={plan} />
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
    <section>
      <h2 className="mb-2 text-sm font-bold text-slate-900">{title}</h2>
      <div className="crm-table-wrap">
        <table className="crm-table crm-table-compact">
          <thead>
            <tr>
              <th>Kategori</th>
              <th className="w-28 text-right">Adet</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={2} className="py-8 text-center text-sm text-slate-500">
                  Veri yok
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.eventCategoryId}>
                  <td className="font-medium text-slate-800">{row.label}</td>
                  <td className="text-right font-mono text-sm font-semibold tabular-nums text-chp-redDark">
                    {row.count}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
