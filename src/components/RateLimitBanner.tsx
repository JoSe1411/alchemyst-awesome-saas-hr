'use client';

import React, { useEffect, useState } from 'react';
import { useRateLimitStore } from '@/stores/rateLimitStore';

/**
 * Displays a floating banner whenever the user is temporarily rate-limited by the
 * backend (HTTP 429). It also monkey-patches `window.fetch` so that every
 * request automatically detects 429 responses and updates the global
 * `RateLimitStore` with the server-provided `reset` value (in seconds).
 */
const RateLimitBanner: React.FC = () => {
  const resetAt = useRateLimitStore((s) => s.resetAt);
  const setRateLimit = useRateLimitStore((s) => s.setRateLimit);
  const clearRateLimit = useRateLimitStore((s) => s.clearRateLimit);

  // Patch global fetch once on mount.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const res = await originalFetch(...args);

      if (res.status === 429) {
        try {
          // Clone so we don't consume body for the caller.
          const clone = res.clone();
          const data = await clone.json().catch(() => null);
          const retryAfterHeader = res.headers.get('Retry-After');

          // Prefer server-provided `reset` field, then Retry-After header, else default 60 s.
          const retryAfterSeconds =
            (data && typeof data.reset === 'number' && data.reset) ||
            (retryAfterHeader ? parseInt(retryAfterHeader, 10) : 60);

          if (!Number.isNaN(retryAfterSeconds)) {
            setRateLimit(retryAfterSeconds);
          }
        } catch {
          // ignore JSON / parsing errors
        }
      }

      return res;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [setRateLimit]);

  // Remaining seconds countdown logic.
  const [remaining, setRemaining] = useState<number>(0);
  useEffect(() => {
    if (!resetAt) return;

    const update = () => {
      const diff = Math.max(0, Math.ceil((resetAt - Date.now()) / 1000));
      setRemaining(diff);
      if (diff <= 0) {
        clearRateLimit();
      }
    };

    update(); // initial
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [resetAt, clearRateLimit]);

  if (!resetAt) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded shadow-lg z-50">
      You have reached the request limit. Please wait {remaining}s.
    </div>
  );
};

export default RateLimitBanner; 