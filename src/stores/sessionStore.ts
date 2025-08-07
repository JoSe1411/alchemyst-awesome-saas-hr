import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AccountContext {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  role: string;
  userType: 'manager' | 'employee';
}

interface SessionState {
  currentAccount: AccountContext | null;
  availableAccounts: AccountContext[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setCurrentAccount: (account: AccountContext) => void;
  addAccount: (account: AccountContext) => void;
  removeAccount: (accountId: string) => void;
  switchAccount: (accountId: string) => void;
  clearSession: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      currentAccount: null,
      availableAccounts: [],
      isLoading: false,
      error: null,

      setCurrentAccount: (account) => {
        set({ currentAccount: account });
        
        // Add to available accounts if not already present
        const { availableAccounts } = get();
        const exists = availableAccounts.find(acc => acc.id === account.id);
        if (!exists) {
          set({ availableAccounts: [...availableAccounts, account] });
        }
      },

      addAccount: (account) => {
        const { availableAccounts } = get();
        const exists = availableAccounts.find(acc => acc.id === account.id);
        if (!exists) {
          set({ availableAccounts: [...availableAccounts, account] });
        }
      },

      removeAccount: (accountId) => {
        const { availableAccounts, currentAccount } = get();
        const filtered = availableAccounts.filter(acc => acc.id !== accountId);
        set({ availableAccounts: filtered });
        
        // If removing current account, clear it
        if (currentAccount?.id === accountId) {
          set({ currentAccount: null });
        }
      },

      switchAccount: (accountId) => {
        const { availableAccounts } = get();
        const account = availableAccounts.find(acc => acc.id === accountId);
        if (account) {
          set({ currentAccount: account });
        }
      },

      clearSession: () => {
        set({
          currentAccount: null,
          availableAccounts: [],
          error: null
        });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      setError: (error) => {
        set({ error });
      },
    }),
    {
      name: 'session-storage',
      partialize: (state) => ({
        currentAccount: state.currentAccount,
        availableAccounts: state.availableAccounts,
      }),
    }
  )
); 