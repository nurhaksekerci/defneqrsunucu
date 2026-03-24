"use client";

import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/auth-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster
        position="bottom-right"
        duration={3000}
        richColors
        closeButton
        toastOptions={{
          classNames: {
            toast:
              "rounded-lg border border-border bg-surface text-foreground shadow-crm text-[13px]",
            title: "font-semibold",
            description: "text-muted",
          },
        }}
      />
    </AuthProvider>
  );
}
