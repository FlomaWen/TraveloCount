'use client';

import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';
import { ServiceWorkerRegister } from '@/components/sw-register';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ServiceWorkerRegister />
      {children}
    </SessionProvider>
  );
}
