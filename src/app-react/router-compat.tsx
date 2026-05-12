'use client';

import React from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export function useNavigate() {
  const router = useRouter();
  return (to: string | number, options?: { replace?: boolean }) => {
    if (typeof to === 'number') {
      if (to === -1) router.back();
      else if (to === 1) router.forward();
      return;
    }
    if (options?.replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  };
}

export function useLocation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return {
    pathname,
    search: searchParams.toString(),
    hash: '',
    state: null,
    key: 'default',
  };
}

export function Link({ to, children, ...props }: any) {
  const nextLink = require('next/link').default;
  return React.createElement(nextLink, { href: to, ...props }, children);
}

export function Outlet() {
  return null; // Next.js uses {children} in layouts
}
