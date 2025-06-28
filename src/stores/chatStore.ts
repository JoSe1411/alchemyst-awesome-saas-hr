import { create } from 'zustand';
import { ConversationMessage } from '@/types';

interface ChatState {
  messages: ConversationMessage[];
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  addMessage: (message: ConversationMessage) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  initializeWelcomeMessage: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  isInitialized: false,
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
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
            content: 'Hello! I am your HR AI Assistant. How can I help you today?',
            timestamp: new Date(),
          },
        ],
        isInitialized: true,
      });
    }
  },
})); 