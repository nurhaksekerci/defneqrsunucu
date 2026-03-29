/** Mobil `ReportFilterModal` ile aynı zaman aralığı mantığı. */

export type ReportTimeRangeId = 'today' | 'week' | 'month' | 'last_month' | 'year';
export type ReportBranchScope = 'all' | import('@/lib/types').BranchKind;

export type ReportFilterValue = {
  timeRangeId: ReportTimeRangeId;
  branchScope: ReportBranchScope;
  commissionScope: 'all' | number;
};

export const DEFAULT_REPORT_FILTERS: ReportFilterValue = {
  timeRangeId: 'week',
  branchScope: 'all',
  commissionScope: 'all',
};

export const PLANNED_LIST_DEFAULT_FILTERS: ReportFilterValue = {
  timeRangeId: 'year',
  branchScope: 'all',
  commissionScope: 'all',
};

export const REPORT_TIME_RANGES: { id: ReportTimeRangeId; label: string }[] = [
  { id: 'today', label: 'Bugün' },
  { id: 'week', label: 'Bu hafta' },
  { id: 'month', label: 'Bu ay' },
  { id: 'last_month', label: 'Geçen ay' },
  { id: 'year', label: 'Bu yıl' },
];

function startOfDayLocal(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function getReportTimeRange(
  range: ReportTimeRangeId,
  now = new Date()
): { start: Date; end: Date } {
  const n = new Date(now);
  switch (range) {
    case 'today': {
      const start = startOfDayLocal(n);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      return { start, end };
    }
    case 'week': {
      const start = startOfDayLocal(n);
      const day = (start.getDay() + 6) % 7;
      start.setDate(start.getDate() - day);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      return { start, end };
    }
    case 'month': {
      const start = startOfDayLocal(n);
      start.setDate(1);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      return { start, end };
    }
    case 'last_month': {
      const start = startOfDayLocal(n);
      start.setDate(1);
      start.setMonth(start.getMonth() - 1);
      const end = startOfDayLocal(n);
      end.setDate(1);
      return { start, end };
    }
    case 'year': {
      const start = startOfDayLocal(n);
      start.setMonth(0);
      start.setDate(1);
      const end = new Date(start);
      end.setFullYear(end.getFullYear() + 1);
      return { start, end };
    }
  }
  throw new Error(`Unknown time range: ${range}`);
}

export function reportFiltersActive(v: ReportFilterValue): boolean {
  return (
    v.timeRangeId !== DEFAULT_REPORT_FILTERS.timeRangeId ||
    v.branchScope !== DEFAULT_REPORT_FILTERS.branchScope ||
    (v.branchScope === 'komisyon' && v.commissionScope !== 'all')
  );
}

export function plannedListFiltersActive(v: ReportFilterValue): boolean {
  return (
    v.timeRangeId !== PLANNED_LIST_DEFAULT_FILTERS.timeRangeId ||
    v.branchScope !== PLANNED_LIST_DEFAULT_FILTERS.branchScope ||
    (v.branchScope === 'komisyon' && v.commissionScope !== 'all')
  );
}
