import { create } from 'zustand';
import { ConversationMessage } from '@/types';

interface GeneralChatState {
  messages: ConversationMessage[];
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  addMessage: (message: ConversationMessage) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  initializeWelcomeMessage: () => void;
}

export const useGeneralChatStore = create<GeneralChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  isInitialized: false,
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  initializeWelcomeMessage: () => {
    const state = get();
    if (!state.isInitialized) {
      set({
        messages: [
          {
            id: 'init',
            role: 'assistant',
            content: 'Hello! I\'m Aura—your AI hiring assistant. Feel free to ask me anything from drafting job descriptions to optimizing your recruitment process.',
            timestamp: new Date(),
          },
        ],
        isInitialized: true,
      });
    }
  },
})); 