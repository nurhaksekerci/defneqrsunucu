"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { SectionCard } from "@/components/crm/section-card";
import {
  HEADER_SEARCH_INDEX,
  filterSearchIndex,
} from "@/lib/search-index";
import { ArrowRight, Search } from "lucide-react";

export function AramaResults() {
  const params = useSearchParams();
  const q = params.get("q")?.trim() ?? "";

  const hits = useMemo(
    () => filterSearchIndex(q, HEADER_SEARCH_INDEX),
    [q],
  );

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-6">
      <SectionCard
        title="Arama"
        action={
          q ? (
            <span className="text-[11px] font-medium text-muted">
              “{q}” · {hits.length} sonuç
            </span>
          ) : null
        }
      >
        {!q ? (
          <div className="px-5 py-10 text-center">
            <Search
              className="mx-auto h-10 w-10 text-muted opacity-40"
              strokeWidth={1.25}
              aria-hidden
            />
            <p className="mt-3 text-[14px] font-medium text-foreground">
              Üst çubuktaki arama kutusuna yazıp Enter&apos;a basın
            </p>
            <p className="mt-1 text-[13px] text-muted">
              Sayfa, menü ve anahtar kelimelerde aranır (API sonrası genişletilecek).
            </p>
            <ul className="mx-auto mt-6 flex max-w-sm flex-col gap-2 text-left text-[13px]">
              {HEADER_SEARCH_INDEX.map((item) => (
                <li key={item.href + item.label}>
                  <Link
                    href={item.href}
                    className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 font-medium text-foreground transition-colors hover:border-chp-navy/25 hover:bg-slate-50"
                  >
                    {item.label}
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : hits.length === 0 ? (
          <p className="px-5 py-10 text-center text-[13px] text-muted">
            “{q}” için eşleşme yok. Farklı bir kelime deneyin veya{" "}
            <Link
              href="/etkinlikler"
              className="font-medium text-chp-navy underline-offset-2 hover:underline"
            >
              Etkinlikler
            </Link>{" "}
            sayfasına gidin.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {hits.map((item) => (
              <li key={item.href + item.label}>
                <Link
                  href={item.href}
                  className="flex items-start justify-between gap-4 px-5 py-4 transition-colors hover:bg-slate-50/80"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{item.label}</p>
                    <p className="mt-0.5 text-[13px] text-muted">
                      {item.description}
                    </p>
                  </div>
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
