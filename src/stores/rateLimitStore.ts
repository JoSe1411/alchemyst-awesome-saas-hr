'use client';

import { create } from 'zustand';

interface RateLimitState {
  /**
   * Timestamp (ms) when the user can send the next request. If null → not rate-limited.
   */
  resetAt: number | null;
  /** Mark the user as rate-limited for `retryAfter` seconds. */
  setRateLimit: (retryAfterSeconds: number) => void;
  /** Clears the rate-limited state immediately (used when timer expires). */
  clearRateLimit: () => void;
}

export const useRateLimitStore = create<RateLimitState>((set) => ({
  resetAt: null,
  setRateLimit: (retryAfterSeconds) =>
    set({ resetAt: Date.now() + retryAfterSeconds * 1000 }),
  clearRateLimit: () => set({ resetAt: null }),
})); 