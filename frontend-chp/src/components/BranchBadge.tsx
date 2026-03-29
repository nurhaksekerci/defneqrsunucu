import type { BranchKind } from '@/lib/types';
import clsx from 'clsx';

const styles: Record<BranchKind, string> = {
  ana_kademe: 'bg-red-50 text-red-800 ring-1 ring-inset ring-red-200',
  genclik: 'bg-sky-50 text-sky-900 ring-1 ring-inset ring-sky-200',
  kadin: 'bg-fuchsia-50 text-fuchsia-900 ring-1 ring-inset ring-fuchsia-200',
  komisyon: 'bg-amber-50 text-amber-900 ring-1 ring-inset ring-amber-200',
};

export function BranchBadge({
  kind,
  label,
}: {
  kind: BranchKind;
  label: string;
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold tracking-wide',
        styles[kind]
      )}>
      {label}
    </span>
  );
}
