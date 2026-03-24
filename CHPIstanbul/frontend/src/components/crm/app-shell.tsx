import { Suspense } from "react";
import { Sidebar } from "./sidebar";
import { CrmHeader } from "./header";

function HeaderFallback() {
  return (
    <header className="sticky top-0 z-10 shrink-0 border-b border-border bg-surface/95 backdrop-blur-md">
      <div className="h-0.5 w-full bg-chp-red" aria-hidden />
      <div className="min-h-[56px] px-4 py-3 sm:px-6" />
    </header>
  );
}

type AppShellProps = {
  children: React.ReactNode;
  title: string;
  description?: string;
};

export function AppShell({ children, title, description }: AppShellProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Suspense fallback={<HeaderFallback />}>
          <CrmHeader title={title} description={description} />
        </Suspense>
        <main className="flex-1 overflow-auto px-6 py-7 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
