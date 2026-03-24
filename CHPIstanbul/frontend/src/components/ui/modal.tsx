"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  /** Boş bırakılırsa üst başlık çubuğu sadece kapatma için sıkıştırılır */
  title?: string;
  description?: string;
  /** title yokken erişilebilir isim */
  ariaLabel?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** default: dar form; lg: form+harita; xl: rapor galerisi */
  size?: "default" | "lg" | "xl";
};

export function Modal({
  open,
  onClose,
  title,
  description,
  ariaLabel = "Pencere",
  children,
  footer,
  size = "default",
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
      aria-label={title ? undefined : ariaLabel}
    >
      <button
        type="button"
        className="absolute inset-0 bg-chp-navy/40 backdrop-blur-[2px]"
        aria-label="Kapat"
        onClick={onClose}
      />
      <div
        className={`relative z-10 flex max-h-[min(90vh,800px)] w-full flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-crm sm:max-h-[90vh] ${
          size === "xl"
            ? "max-w-3xl"
            : size === "lg"
              ? "max-w-2xl"
              : "max-w-lg"
        }`}
      >
        <div
          className={`flex items-start gap-3 border-b border-border px-5 py-4 ${
            title || description ? "justify-between" : "justify-end"
          }`}
        >
          {title || description ? (
            <div className="min-w-0">
              {title ? (
                <h2
                  id="modal-title"
                  className="text-base font-semibold tracking-tight text-foreground"
                >
                  {title}
                </h2>
              ) : null}
              {description ? (
                <p
                  className={`text-[13px] text-muted ${title ? "mt-1" : ""}`}
                >
                  {description}
                </p>
              ) : null}
            </div>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted transition-colors hover:bg-slate-100 hover:text-foreground"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <div className="border-t border-border bg-slate-50/50 px-5 py-3">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
