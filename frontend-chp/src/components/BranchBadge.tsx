import type { BranchKind } from '@/lib/types';
import clsx from 'clsx';

const styles: Record<BranchKind, string> = {
  ana_kademe: 'border-red-200 bg-red-50 text-red-900',
  genclik: 'border-sky-200 bg-sky-50 text-sky-900',
  kadin: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-900',
  komisyon: 'border-amber-200 bg-amber-50 text-amber-950',
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
        'inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold tracking-wide',
        styles[kind]
      )}>
      {label}
    </span>
  );
}
