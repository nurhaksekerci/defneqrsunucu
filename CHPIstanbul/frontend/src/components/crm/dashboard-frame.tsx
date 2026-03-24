"use client";

import { usePathname } from "next/navigation";
import { AuthGate } from "./auth-gate";
import { AppShell } from "./app-shell";

function metaForPath(pathname: string): { title: string; description?: string } {
  if (pathname.startsWith("/ayarlar")) {
    return {
      title: "Ayarlar",
      description: "Hesap ve örgüt kapsamı.",
    };
  }
  if (pathname.startsWith("/raporlar")) {
    return {
      title: "Raporlar",
      description: "Etkinlik sonrası raporlar.",
    };
  }
  if (pathname.startsWith("/etkinlikler")) {
    return {
      title: "Etkinlikler",
      description: "Planlanan ve tamamlanan eylem/etkinlik kayıtları.",
    };
  }
  if (pathname.startsWith("/arama")) {
    return {
      title: "Arama",
      description: "Menü ve sayfa kısayollarında arama.",
    };
  }
  return {
    title: "Pano",
    description: "Özet metrikler ve son hareketler.",
  };
}

export function DashboardFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { title, description } = metaForPath(pathname);

  return (
    <AuthGate>
      <AppShell title={title} description={description}>
        {children}
      </AppShell>
    </AuthGate>
  );
}
