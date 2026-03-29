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
    <div className="chp-card-elevated p-5 sm:p-6">
      <h3 className="font-display text-lg font-bold text-chp-ink">{title}</h3>
      <p className="chp-section-label mt-4">Zaman aralığı</p>
      <div className="mb-5 flex flex-wrap gap-2">
        {REPORT_TIME_RANGES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange({ ...value, timeRangeId: t.id })}
            className={clsx(
              'chp-chip',
              value.timeRangeId === t.id && 'chp-chip-active'
            )}>
            {t.label}
          </button>
        ))}
      </div>
      <p className="chp-section-label">Kol</p>
      <div className="mb-5 flex flex-wrap gap-2">
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
              'chp-chip',
              value.branchScope === row.id && 'chp-chip-active'
            )}>
            {row.label}
          </button>
        ))}
      </div>
      {value.branchScope === 'komisyon' ? (
        <>
          <p className="chp-section-label">Komisyon</p>
          <div className="mb-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onChange({ ...value, commissionScope: 'all' })}
              className={clsx(
                'chp-chip',
                value.commissionScope === 'all' && 'chp-chip-active'
              )}>
              Tümü
            </button>
            {sorted.map((co) => (
              <button
                key={co.id}
                type="button"
                onClick={() => onChange({ ...value, commissionScope: co.id })}
                className={clsx(
                  'chp-chip',
                  value.commissionScope === co.id && 'chp-chip-active'
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
        className="text-sm font-semibold text-chp-inkMuted underline decoration-chp-borderStrong underline-offset-4 transition-colors hover:text-chp-red">
        Filtreyi sıfırla
      </button>
    </div>
  );
}
