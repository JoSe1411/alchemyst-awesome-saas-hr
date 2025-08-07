'use client';

import { create } from 'zustand';

interface DemoUsageState {
  remaining: number;
  decrement: () => void;
  reset: (value?: number) => void;
}

// Default to 3 demo uses per browser session (not persisted across reloads) – we store in sessionStorage so refresh resets to default.
const DEFAULT_REMAINING = 3;

export const useDemoUsageStore = create<DemoUsageState>((set, get) => {
  // Load initial value from sessionStorage if available
  const stored = typeof window !== 'undefined' ? sessionStorage.getItem('demoRemaining') : null;
  const initial = stored ? parseInt(stored, 10) : DEFAULT_REMAINING;

  // Helper to persist
  const save = (value: number) => {
    if (typeof window !== 'undefined') sessionStorage.setItem('demoRemaining', value.toString());
  };

  return {
    remaining: initial,
    decrement: () => {
      const newVal = Math.max(0, get().remaining - 1);
      save(newVal);
      set({ remaining: newVal });
    },
    reset: (value = DEFAULT_REMAINING) => {
      save(value);
      set({ remaining: value });
    },
  };
}); 