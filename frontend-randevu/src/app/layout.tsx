import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DefneRandevu — Randevu Yönetim Sistemi',
  description: 'Kuaför, berber, klinik ve daha fazlası için randevu yönetimi',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
