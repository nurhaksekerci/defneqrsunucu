import { Suspense } from "react";
import { AramaResults } from "./arama-results";

function AramaFallback() {
  return (
    <div className="mx-auto max-w-[720px] rounded-lg border border-border bg-surface px-5 py-12 text-center text-[13px] text-muted">
      Yükleniyor…
    </div>
  );
}

export default function AramaPage() {
  return (
    <Suspense fallback={<AramaFallback />}>
      <AramaResults />
    </Suspense>
  );
}
