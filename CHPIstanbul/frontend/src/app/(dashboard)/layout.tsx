import { DashboardFrame } from "@/components/crm/dashboard-frame";

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardFrame>{children}</DashboardFrame>;
}
