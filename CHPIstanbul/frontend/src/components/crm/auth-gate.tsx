"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      const next = encodeURIComponent(pathname || "/");
      router.replace(`/giris?next=${next}`);
    }
  }, [loading, user, router, pathname]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-[13px] text-muted">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-chp-navy border-t-transparent" />
        Oturum doğrulanıyor…
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
