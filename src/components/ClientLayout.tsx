'use client';

import { useEffect } from 'react';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Remove the cz-shortcut-listen attribute after hydration
    const body = document.querySelector('body');
    if (body) {
      body.removeAttribute('cz-shortcut-listen');
    }
  }, []);

  return <>{children}</>;
} 