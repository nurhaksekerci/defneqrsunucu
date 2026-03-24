import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  accent?: "red" | "navy" | "success" | "warning";
  className?: string;
  onClick?: () => void;
  selected?: boolean;
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
  className = "",
  onClick,
  selected = false,
}: StatCardProps) {
  const inner = (
    <div className="flex items-start justify-between gap-4 p-5 sm:p-6">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          {label}
        </p>
        <p className="mt-2.5 tabular-nums text-[30px] font-semibold leading-none tracking-tight text-foreground">
          {value}
        </p>
        {hint ? (
          <p className="mt-2.5 text-[12px] leading-snug text-muted">{hint}</p>
        ) : null}
      </div>
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconStyle[accent]}`}
      >
        <Icon className="h-[19px] w-[19px]" strokeWidth={1.75} />
      </div>
    </div>
  );

  const shell = `rounded-2xl border border-border/80 bg-surface shadow-sm ring-1 ring-black/[0.03] ${
    onClick
      ? "cursor-pointer text-left transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chp-navy/25"
      : "transition-shadow hover:shadow-md"
  } ${selected ? "ring-2 ring-chp-navy/30" : ""} ${leftBorder[accent]} border-l-[3px] ${className}`;

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`w-full ${shell}`}>
        {inner}
      </button>
    );
  }

  return <div className={shell}>{inner}</div>;
}
