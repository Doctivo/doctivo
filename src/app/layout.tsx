import type {Metadata, Viewport} from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { BrowserGuard } from '@/components/BrowserGuard';

export const metadata: Metadata = {
  title: 'DOCTIVO - Book Appointments',
  description: 'Book Doctor Appointments With Ease',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'DOCTIVO',
  },
  icons: {
    icon: '/562ca6c0e52711681283626.png',
    apple: '/562ca6c0e52e41681283626.png',
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
        <link rel="apple-touch-icon" href="/562ca6c0e52e41681283626.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(reg) {
                    console.log('PWA ServiceWorker Registered');
                  }).catch(function(err) {
                    console.log('PWA ServiceWorker Registration Failed', err);
                  });
                });
              }
            `,
          }}
        />
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
