import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'Admin | Defne Qr',
  description: 'Defne Qr Admin Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className={`${inter.className} text-gray-900 antialiased`}>
        {children}
      </body>
    </html>
  );
}
