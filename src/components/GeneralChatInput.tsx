'use client';

import React, { useState } from 'react';
import { Send, LoaderCircle } from 'lucide-react';
import { useGeneralChatStore } from '@/stores/generalChatStore';
import { v4 as uuidv4 } from 'uuid';

interface GeneralChatInputProps {
  endpoint?: string; // allow override for tests
}

const GeneralChatInput: React.FC<GeneralChatInputProps> = ({ endpoint = '/api/general-chat' }) => {
  const [input, setInput] = useState('');
  const { addMessage, setLoading, setError, isLoading } = useGeneralChatStore();

  const sendMessage = async (content: string) => {
    const userMessage = {
      id: uuidv4(),
      role: 'user' as const,
      content,
      timestamp: new Date(),
    };
    addMessage(userMessage);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: content }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from the assistant.');
      }

      const assistantMessage = await response.json();
      addMessage(assistantMessage);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      setError(errorMessage);
      addMessage({
        id: uuidv4(),
        role: 'assistant',
        content: `Sorry, something went wrong: ${errorMessage}`,
        timestamp: new Date(),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    await sendMessage(input);
    setInput('');
  };

  // Expose sendMessage for PromptStarters via window dispatch—not ideal but simple
  // Alternative: lift state up but for now keep here and provide custom event
  const onPromptClick = (prompt: string) => sendMessage(prompt);

  // Listen for custom event emitted by PromptStarters
  React.useEffect(() => {
    const handler = (e: Event) => {
      const prompt = (e as CustomEvent<string>).detail;
      if (typeof prompt === 'string') {
        onPromptClick(prompt);
      }
    };
    window.addEventListener('general-chat-prompt', handler as EventListener);
    return () => window.removeEventListener('general-chat-prompt', handler as EventListener);
  }, []);

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask me anything..."
        className="flex-1 p-2 rounded-lg bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        rows={1}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e as unknown as React.FormEvent);
          }
        }}
        disabled={isLoading}
      />
      <button
        type="submit"
        className="p-2 rounded-full bg-blue-500 text-white disabled:bg-blue-300 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
        disabled={isLoading || !input.trim()}
      >
        {isLoading ? (
          <LoaderCircle className="w-5 h-5 animate-spin" />
        ) : (
          <Send className="w-5 h-5" />
        )}
      </button>
    </form>
  );
};

export default GeneralChatInput; 