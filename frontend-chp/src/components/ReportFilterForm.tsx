'use client';

import type { CommissionOption } from '@/lib/api';
import type { BranchKind } from '@/lib/types';
import {
  PLANNED_LIST_DEFAULT_FILTERS,
  REPORT_TIME_RANGES,
  type ReportFilterValue,
  type ReportBranchScope,
} from '@/lib/reportFilters';
import clsx from 'clsx';

const KOL_ROW: { id: ReportBranchScope; label: string }[] = [
  { id: 'all', label: 'Tümü' },
  { id: 'ana_kademe', label: 'Ana Kademe' },
  { id: 'genclik', label: 'Gençlik' },
  { id: 'kadin', label: 'Kadın' },
  { id: 'komisyon', label: 'Komisyon' },
];

type Props = {
  value: ReportFilterValue;
  onChange: (v: ReportFilterValue) => void;
  commissions: CommissionOption[];
  defaultsForClear?: ReportFilterValue;
  title?: string;
};

export function ReportFilterForm({
  value,
  onChange,
  commissions,
  defaultsForClear = PLANNED_LIST_DEFAULT_FILTERS,
  title = 'Filtre',
}: Props) {
  const sorted = [...commissions].sort((a, b) =>
    a.name.localeCompare(b.name, 'tr')
  );

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <h3 className="mb-3 font-display text-lg font-bold text-neutral-900">{title}</h3>
      <p className="mb-3 text-xs font-bold uppercase text-neutral-500">Zaman aralığı</p>
      <div className="mb-4 flex flex-wrap gap-2">
        {REPORT_TIME_RANGES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange({ ...value, timeRangeId: t.id })}
            className={clsx(
              'rounded-full border px-3 py-1.5 text-sm font-semibold',
              value.timeRangeId === t.id
                ? 'border-chp-red bg-chp-muted text-chp-redDark'
                : 'border-neutral-200'
            )}>
            {t.label}
          </button>
        ))}
      </div>
      <p className="mb-3 text-xs font-bold uppercase text-neutral-500">Kol</p>
      <div className="mb-4 flex flex-wrap gap-2">
        {KOL_ROW.map((row) => (
          <button
            key={row.id}
            type="button"
            onClick={() =>
              onChange({
                ...value,
                branchScope: row.id,
                commissionScope: row.id === 'komisyon' ? value.commissionScope : 'all',
              })
            }
            className={clsx(
              'rounded-full border px-3 py-1.5 text-sm font-semibold',
              value.branchScope === row.id
                ? 'border-chp-red bg-chp-muted text-chp-redDark'
                : 'border-neutral-200'
            )}>
            {row.label}
          </button>
        ))}
      </div>
      {value.branchScope === 'komisyon' ? (
        <>
          <p className="mb-3 text-xs font-bold uppercase text-neutral-500">Komisyon</p>
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onChange({ ...value, commissionScope: 'all' })}
              className={clsx(
                'rounded-full border px-3 py-1.5 text-sm font-semibold',
                value.commissionScope === 'all'
                  ? 'border-chp-red bg-chp-muted text-chp-redDark'
                  : 'border-neutral-200'
              )}>
              Tümü
            </button>
            {sorted.map((co) => (
              <button
                key={co.id}
                type="button"
                onClick={() => onChange({ ...value, commissionScope: co.id })}
                className={clsx(
                  'rounded-full border px-3 py-1.5 text-sm font-semibold',
                  value.commissionScope === co.id
                    ? 'border-chp-red bg-chp-muted text-chp-redDark'
                    : 'border-neutral-200'
                )}>
                {co.name}
              </button>
            ))}
          </div>
        </>
      ) : null}
      <button
        type="button"
        onClick={() => onChange({ ...defaultsForClear })}
        className="text-sm font-semibold text-neutral-600 underline">
        Filtreyi sıfırla
      </button>
    </div>
  );
}
