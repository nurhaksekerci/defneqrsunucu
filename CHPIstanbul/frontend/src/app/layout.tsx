import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "İstanbul — Eylem ve Etkinlik",
  description: "CHP İstanbul il örgütü etkinlik ve rapor yönetimi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${ibmPlexSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-background font-sans text-[15px] leading-normal text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
