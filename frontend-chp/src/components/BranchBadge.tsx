import type { BranchKind } from '@/lib/types';
import clsx from 'clsx';

const styles: Record<BranchKind, string> = {
  ana_kademe: 'bg-red-700 text-white',
  genclik: 'bg-sky-700 text-white',
  kadin: 'bg-fuchsia-800 text-white',
  komisyon: 'bg-amber-700 text-white',
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
        'inline-block rounded-full px-2.5 py-0.5 text-xs font-bold',
        styles[kind]
      )}>
      {label}
    </span>
  );
}
