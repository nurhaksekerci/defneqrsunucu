'use client';

import { AuthGate } from '@/components/AuthGate';
import { DashboardShell } from '@/components/DashboardShell';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <DashboardShell>{children}</DashboardShell>
    </AuthGate>
  );
}
