import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Source_Serif_4 } from 'next/font/google';

import { AuthProvider } from '@/components/AuthProvider';

import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
});

const sourceSerif = Source_Serif_4({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-display',
  weight: ['600', '700'],
});

export const metadata: Metadata = {
  title: 'CHP İstanbul · Web',
  description: 'Cumhuriyet Halk Partisi İstanbul İl Başkanlığı',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${plusJakarta.variable} ${sourceSerif.variable}`}>
      <body className="font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
