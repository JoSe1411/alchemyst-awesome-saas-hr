'use client';

import React from 'react';
import Link from 'next/link';
import { SignedOut } from '@clerk/nextjs';
import { useDemoUsageStore } from '@/stores/demoUsageStore';

/**
 * Renders a persistent call-to-action banner for visitors who have not signed in.
 * It encourages them to create an account to unlock unlimited usage and data
 * persistence.  The banner is lightweight and appears on every page via
 * insertion in the RootLayout.
 */
const AuthBanner: React.FC = () => {
  const remaining = useDemoUsageStore((s) => s.remaining);

  // Only show banner for guests *after* they have used all demo credits
  if (remaining > 0) return null;

  return (
    <SignedOut>
      <div className="w-full bg-blue-600 text-white text-sm md:text-base px-4 py-2 flex flex-col md:flex-row gap-2 md:gap-4 items-center justify-center">
        <span>
          You&rsquo;ve reached the demo limit. Create a free account to unlock unlimited usage and save your work.
        </span>
        <div className="flex gap-2 whitespace-nowrap">
          <Link
            href="/auth/sign-up"
            className="bg-white text-blue-600 px-3 py-1 rounded font-semibold hover:bg-blue-100 transition-colors"
          >
            Sign&nbsp;up
          </Link>
          <Link
            href="/auth/sign-in"
            className="border border-white px-3 py-1 rounded font-semibold hover:bg-white hover:text-blue-600 transition-colors"
          >
            Sign&nbsp;in
          </Link>
        </div>
      </div>
    </SignedOut>
  );
};

export default AuthBanner; 