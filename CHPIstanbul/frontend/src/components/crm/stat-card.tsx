import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  accent?: "red" | "navy" | "success" | "warning";
};

const leftBorder = {
  red: "border-l-chp-red",
  navy: "border-l-chp-navy",
  success: "border-l-success",
  warning: "border-l-warning",
};

const iconStyle = {
  red: "bg-chp-red-subtle text-chp-red ring-1 ring-chp-red/15",
  navy: "bg-slate-100 text-chp-navy ring-1 ring-slate-200/80",
  success: "bg-teal-50 text-success ring-1 ring-teal-100",
  warning: "bg-amber-50 text-warning ring-1 ring-amber-100",
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = "navy",
}: StatCardProps) {
  return (
    <div
      className={`rounded-lg border border-border bg-surface shadow-crm-sm ${leftBorder[accent]} border-l-[3px]`}
    >
      <div className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            {label}
          </p>
          <p className="mt-2 tabular-nums text-[28px] font-semibold leading-none tracking-tight text-foreground">
            {value}
          </p>
          {hint ? (
            <p className="mt-2 text-[12px] font-medium text-muted">{hint}</p>
          ) : null}
        </div>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${iconStyle[accent]}`}
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </div>
      </div>
    </div>
  );
}
