
import type {Metadata, Viewport} from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { BrowserGuard } from '@/components/BrowserGuard';

export const metadata: Metadata = {
  title: 'DOCTIVO - Book Appointments',
  description: 'Book Doctor Appointments With Ease',
  manifest: '/manifest.json?v=2',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'DOCTIVO',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="manifest" href="/manifest.json?v=2" />
      </head>
      <body className="font-body antialiased bg-slate-100">
        <BrowserGuard>
          <main className="min-h-screen bg-slate-100">
            {children}
          </main>
        </BrowserGuard>
        <Toaster />
      </body>
    </html>
  );
}
