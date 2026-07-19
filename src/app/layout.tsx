import type { Metadata } from 'next';
import { Geist, Geist_Mono, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: 'WebGIS GeoAI Morowali — Deteksi Perubahan Lahan Tambang',
  description:
    'Dashboard analitik spasial untuk memantau perubahan lahan tambang dan kualitas perairan pesisir akibat ekspansi industri nikel di Kabupaten Morowali, Sulawesi Tengah.',
  keywords: [
    'WebGIS',
    'Morowali',
    'tambang nikel',
    'perubahan lahan',
    'Sentinel-2',
    'machine learning',
    'geospatial',
    'IMIP',
    'Bahodopi',
  ],
  authors: [{ name: 'GeoAI Morowali Research Team' }],
  openGraph: {
    title: 'WebGIS GeoAI Morowali',
    description: 'Analitik spasial perubahan lahan tambang nikel berbasis ML',
    type: 'website',
    locale: 'id_ID',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f172a',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${jetbrainsMono.variable} dark h-full antialiased`}
    >
      <body className="h-full w-full overflow-hidden">
        {children}
      </body>
    </html>
  );
}
