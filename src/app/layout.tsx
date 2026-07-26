import type {Metadata, Viewport} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { GlobalSidebar } from '@/components/GlobalSidebar';
import { ThemeProvider } from '@/components/theme-provider';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'Doctivo | Book Best Doctors & Clinic Appointments Online',
  description: 'Book Doctor Appointments With Ease in Gorakhpur and Deoria. Doctivo is your trusted healthcare platform to find and book appointments with the best doctors, physicians, and specialists near you.',
  keywords: [
    "doctivo", "appointment booking", "appointment booking in gorakhpur", "appointment booking in deoria", 
    "appointment booking for gprakhpur", "appointment booking for gkp", "appointment booking in gkp",
    "best doctor in gorakhpur", "online doctor consultation gorakhpur", "book clinic appointment gkp",
    "healthcare platform deoria", "doctor appointment app up", "find physician gorakhpur",
    "medical booking gkp", "top doctors in gorakhpur", "hospital appointment booking gorakhpur"
  ].join(', '),
  authors: [{ name: 'Gaurav Singh Shrinet' }, { name: 'Doctivo' }],
  creator: 'Doctivo',
  publisher: 'Doctivo',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'Doctivo | Book Best Doctors & Clinic Appointments Online',
    description: 'Book Doctor Appointments With Ease in Gorakhpur and Deoria.',
    url: 'https://doctivo.in',
    siteName: 'Doctivo',
    locale: 'en_IN',
    type: 'website',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'DOCTIVO',
  },
  icons: {
    icon: '/562c71b5-1be4-415a-94dc-002e1889eb7c-8.jpg',
    apple: '/562c71b5-1be4-415a-94dc-002e1889eb7c-8.jpg',
  },
};

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MedicalOrganization',
    name: 'Doctivo',
    alternateName: 'Doctivo Healthcare',
    url: 'https://doctivo.in',
    logo: 'https://doctivo.in/562c71b5-1be4-415a-94dc-002e1889eb7c-8.jpg',
    founder: {
      '@type': 'Person',
      name: 'Gaurav Singh Shrinet'
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      areaServed: ['Gorakhpur', 'Deoria', 'Uttar Pradesh'],
      availableLanguage: ['English', 'Hindi']
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Gorakhpur',
      addressRegion: 'UP',
      addressCountry: 'IN'
    }
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Anti-ChunkLoadError & Recovery Script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // 1. Recovery Logic: Force refresh to clear stale caches
                function handleRecovery(reason) {
                  console.warn('ChunkLoadError detected: ' + reason + '. Initiating recovery...');
                  
                  // Prevent infinite reload loops
                  const lastReload = sessionStorage.getItem('doctivo_recovery_timestamp');
                  const now = Date.now();
                  if (lastReload && (now - parseInt(lastReload)) < 10000) {
                    console.error('Recovery failed: Multiple errors in short duration. Manual intervention required.');
                    return;
                  }
                  sessionStorage.setItem('doctivo_recovery_timestamp', now.toString());

                  // Force unregister all service workers which are often the cause of stale assets
                  if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistrations().then(function(registrations) {
                      for(let registration of registrations) {
                        registration.unregister();
                      }
                    });
                  }

                  // Perform a hard reload from server
                  window.location.reload();
                }

                // 2. Global Error Listeners
                window.addEventListener('error', function(e) {
                  const errorMsg = (e.message || '').toLowerCase();
                  if (
                    errorMsg.indexOf('chunkloaderror') > -1 || 
                    errorMsg.indexOf('loading chunk') > -1 || 
                    errorMsg.indexOf('load chunk') > -1 ||
                    errorMsg.indexOf('failed to fetch') > -1
                  ) {
                    handleRecovery('Static Asset 404');
                  }
                }, true);
                
                window.addEventListener('unhandledrejection', function(e) {
                  const reason = e.reason || {};
                  const msg = (reason.message || reason.name || '').toLowerCase();
                  if (
                    msg.indexOf('chunkloaderror') > -1 || 
                    msg.indexOf('loading chunk') > -1 || 
                    msg.indexOf('load chunk') > -1
                  ) {
                    handleRecovery('Async Chunk Rejection');
                  }
                });

                // 3. Periodic Service Worker cleanup check
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    if (registrations.length > 5) { // Cleanup if too many stale workers
                      for(let registration of registrations) registration.unregister();
                    }
                  });
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`antialiased bg-slate-50 min-h-screen selection:bg-blue-100 ${inter.className}`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <div className="main-wrapper w-full min-h-screen flex flex-col">
            <GlobalSidebar />
            <div className="flex-1">
              {children}
            </div>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
