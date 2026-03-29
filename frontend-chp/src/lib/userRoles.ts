import type { CurrentUser } from '@/lib/types';
import type { BranchKind } from '@/lib/types';

function normalizeTr(s: string): string {
  return s.toLocaleLowerCase('tr-TR');
}

const CHAIR_ROLE = 'chair';

export function hasPresidentMembershipRole(
  me: CurrentUser | null | undefined
): boolean {
  if (!me) return false;
  return (me.memberships ?? []).some((m) => {
    if (m.role === CHAIR_ROLE) return true;
    const rl = normalizeTr(m.roleLabel ?? '');
    return rl.includes('başkan');
  });
}

export function getPrimaryBranchKind(me: CurrentUser | null | undefined): BranchKind {
  const primary = (me?.primaryBranch ?? undefined) as BranchKind | undefined | null;
  return primary ?? 'ana_kademe';
}
