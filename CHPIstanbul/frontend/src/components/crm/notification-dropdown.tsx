"use client";

import { Bell } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-muted transition-colors hover:border-border-strong hover:text-foreground"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Bildirimler"
      >
        <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-lg border border-border bg-surface shadow-crm">
          <div className="border-b border-border px-3 py-2.5">
            <span className="text-[12px] font-semibold text-foreground">
              Bildirimler
            </span>
          </div>
          <div className="px-3 py-8 text-center text-[13px] text-muted">
            Henüz bildirim yok. (API ile bağlanacak.)
          </div>
        </div>
      ) : null}
    </div>
  );
}
