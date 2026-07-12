'use client';

import React from 'react';

/**
 * BrowserGuard - Restrictions Removed
 * This component is now a transparent wrapper allowing all browsers and devices.
 */
export function BrowserGuard({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
