import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

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
    <html lang="tr" style={{ colorScheme: 'light' }}>
      <body className={`${inter.className} text-gray-900`}>{children}</body>
    </html>
  );
}
