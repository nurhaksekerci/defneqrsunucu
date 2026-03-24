"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export type SearchableOption = { value: string; label: string };

export type SearchableOptionGroup = {
  label: string;
  options: SearchableOption[];
};

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options?: SearchableOption[];
  /** Kol seçiliyken: İlçe Başkanlıkları / Komisyonlar grupları (boş dizi = tanımsız hat) */
  optionGroups?: SearchableOptionGroup[] | null;
  placeholder?: string;
  emptyLabel?: string;
  disabled?: boolean;
  minWidthClass?: string;
};

export function SearchableSelect({
  id,
  label,
  value,
  onChange,
  options = [],
  optionGroups,
  placeholder = "Ara…",
  emptyLabel = "Tümü",
  disabled,
  minWidthClass = "min-w-[180px]",
}: Props) {
  const grouped = optionGroups != null;

  const flatOptions = useMemo(() => {
    if (grouped) {
      return optionGroups!.flatMap((g) => g.options);
    }
    return options;
  }, [grouped, optionGroups, options]);

  const selected = flatOptions.find((o) => o.value === value);
  const displayLabel = value && selected ? selected.label : emptyLabel;
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  const filteredFlat = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return options;
    return options.filter((o) => o.label.toLowerCase().includes(t));
  }, [options, q]);

  const filteredGroups = useMemo(() => {
    if (!grouped) return null;
    const t = q.trim().toLowerCase();
    return optionGroups!
      .map((g) => ({
        label: g.label,
        options: t
          ? g.options.filter((o) => o.label.toLowerCase().includes(t))
          : g.options,
      }))
      .filter((g) => g.options.length > 0);
  }, [grouped, optionGroups, q]);

  const labelCls =
    "text-[10px] font-semibold uppercase tracking-wider text-muted";
  const triggerCls = `flex h-9 w-full ${minWidthClass} items-center justify-between gap-2 rounded-md border border-border bg-background px-2.5 text-left text-[13px] font-medium outline-none transition-colors hover:bg-slate-50/80 focus:border-border-strong focus:ring-1 focus:ring-chp-navy/12 disabled:cursor-not-allowed disabled:opacity-50`;

  return (
    <div
      ref={rootRef}
      className={`relative flex flex-col gap-0.5 ${minWidthClass}`}
    >
      <label htmlFor={`${id}-trigger`} className={labelCls}>
        {label}
      </label>
      <button
        type="button"
        id={`${id}-trigger`}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={triggerCls}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
      >
        <span className="min-w-0 flex-1 truncate">{displayLabel}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open ? (
        <div
          className="absolute left-0 right-0 top-full z-[100] mt-1 overflow-hidden rounded-md border border-border bg-background shadow-lg ring-1 ring-black/5"
          role="listbox"
        >
          <input
            type="search"
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={placeholder}
            className="w-full border-b border-border bg-background px-2.5 py-2 text-[13px] outline-none focus:bg-slate-50/50"
            onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          />
          <ul className="max-h-52 overflow-y-auto py-1">
            <li role="none">
              <button
                type="button"
                role="option"
                aria-selected={value === ""}
                className="flex w-full px-2.5 py-2 text-left text-[13px] text-foreground hover:bg-slate-50"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
              >
                {emptyLabel}
              </button>
            </li>
            {grouped ? (
              optionGroups!.length === 0 ? (
                <li className="px-2.5 py-3 text-center text-[12px] leading-snug text-muted">
                  Bu kol için İlçe Başkanlığı veya Komisyon olarak işaretli hat
                  yok. Admin panelinden hat kaydını güncelleyin.
                </li>
              ) : filteredGroups!.length === 0 ? (
                <li className="px-2.5 py-3 text-center text-[12px] text-muted">
                  Sonuç yok
                </li>
              ) : (
                filteredGroups!.map((g) => (
                  <li key={g.label} role="none" className="mt-1 first:mt-0">
                    <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-chp-navy/80">
                      {g.label}
                    </p>
                    <ul role="group" aria-label={g.label}>
                      {g.options.map((o) => (
                        <li key={o.value} role="none">
                          <button
                            type="button"
                            role="option"
                            aria-selected={value === o.value}
                            className="flex w-full px-2.5 py-2 pl-4 text-left text-[13px] hover:bg-slate-50"
                            onClick={() => {
                              onChange(o.value);
                              setOpen(false);
                            }}
                          >
                            {o.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))
              )
            ) : filteredFlat.length === 0 ? (
              <li className="px-2.5 py-3 text-center text-[12px] text-muted">
                Sonuç yok
              </li>
            ) : (
              filteredFlat.map((o) => (
                <li key={o.value} role="none">
                  <button
                    type="button"
                    role="option"
                    aria-selected={value === o.value}
                    className="flex w-full px-2.5 py-2 text-left text-[13px] hover:bg-slate-50"
                    onClick={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                  >
                    {o.label}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
