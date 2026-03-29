import type { Metadata } from 'next';
import { Manrope, Newsreader } from 'next/font/google';

import { AuthProvider } from '@/components/AuthProvider';

import './globals.css';

const manrope = Manrope({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-manrope',
});

const newsreader = Newsreader({
  subsets: ['latin', 'latin-ext'],
  weight: ['700'],
  variable: '--font-newsreader',
});

export const metadata: Metadata = {
  title: 'CHP İstanbul · Web',
  description: 'Cumhuriyet Halk Partisi İstanbul İl Başkanlığı',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${manrope.variable} ${newsreader.variable}`}>
      <body className="font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
