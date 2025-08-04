'use client';

import React, { useState } from 'react';
import { Send, LoaderCircle } from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { useRateLimitStore } from '@/stores/rateLimitStore';
import { v4 as uuidv4 } from 'uuid';

const ChatInput: React.FC = () => {
  const [input, setInput] = useState('');
  const { addMessage, setLoading, setError, isLoading } = useChatStore();
  const resetAt = useRateLimitStore((s) => s.resetAt);
  const isRateLimited = !!resetAt && Date.now() < resetAt;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (isRateLimited) {
      setError('You are sending requests too quickly. Please wait a moment.');
      return;
    }

    const userMessage = {
      id: uuidv4(),
      role: 'user' as const,
      content: input,
      timestamp: new Date(),
    };
    addMessage(userMessage);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from the assistant.');
      }

      const assistantMessage = await response.json();
      addMessage(assistantMessage);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      setError(errorMessage);
      // Optionally add a system message to the chat
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

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your message..."
        className="flex-1 p-2 rounded-lg bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        rows={1}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e as unknown as React.FormEvent);
          }
        }}
        disabled={isLoading || isRateLimited}
      />
      <button
        type="submit"
        className="p-2 rounded-full bg-blue-500 text-white disabled:bg-blue-300 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
        disabled={isLoading || !input.trim() || isRateLimited}
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

export default ChatInput; 