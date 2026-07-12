import type {Metadata, Viewport} from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { GlobalSidebar } from '@/components/GlobalSidebar';

export const metadata: Metadata = {
  title: 'DOCTIVO - Book Appointments',
  description: 'Book Doctor Appointments With Ease',
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
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
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
      <body className="antialiased bg-slate-50 min-h-screen selection:bg-blue-100">
        <GlobalSidebar />
        <main>
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
