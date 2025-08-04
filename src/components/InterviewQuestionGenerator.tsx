'use client';

import React, { useState } from 'react';
import { useRightPanelStore } from '@/stores/rightPanelStore';
import { useGeneralChatStore } from '@/stores/generalChatStore';
import { useDemoUsageStore } from '@/stores/demoUsageStore';
import { useAuth } from '@clerk/nextjs';

const InterviewQuestionGenerator: React.FC = () => {
  const { setMode } = useRightPanelStore();
  const { addMessage } = useGeneralChatStore();

  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const remainingDemo = useDemoUsageStore((s) => s.remaining);
  const decrementDemo = useDemoUsageStore((s) => s.decrement);

  const { isSignedIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!isSignedIn && remainingDemo <= 0) {
      setError('Demo limit reached. Sign up for unlimited questions.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const resp = await fetch('/api/interview-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context }),
      });
      if (!resp.ok) {
        if (resp.status === 401) {
          throw new Error('Free quota exceeded. Please sign in to continue.');
        }
        if (resp.status === 429) {
          throw new Error('Rate limit exceeded. Please wait and try again.');
        }
        throw new Error('Failed to generate questions');
      }
      const data = await resp.json();
      setResult(data.content as string);
      if (!isSignedIn) decrementDemo();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSendToChat = () => {
    if (!result) return;
    addMessage({
      id: Date.now().toString(),
      role: 'assistant',
      content: result,
      timestamp: new Date(),
    });
    setMode('chat');
  };

  if (result) {
    return (
      <div className="flex flex-col h-full overflow-y-auto p-6 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900">
        <h3 className="text-xl font-bold mb-4">Generated Interview Questions</h3>
        <div
          className="flex-1 overflow-y-auto prose dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: result.replace(/\n/g, '<br/>') }}
        />
        <div className="mt-6 flex gap-3 flex-wrap">
          <button
            className="bg-green-600 text-white px-4 py-2 rounded"
            onClick={() => {
              if (!result) return;
              const blob = new Blob([result], { type: 'text/markdown;charset=utf-8' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = 'interview-questions.md';
              document.body.appendChild(link);
              link.click();
              link.remove();
              URL.revokeObjectURL(url);
            }}
          >
            Download (.md)
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleSendToChat}>
            Send to Chat
          </button>
          <button className="bg-gray-500 text-white px-4 py-2 rounded" onClick={() => setMode('chat')}>
            Back to Chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 p-6 overflow-y-auto h-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
    >
      <h3 className="text-xl font-bold">Interview Question Generator</h3>
      <div>
        <label className="block text-sm font-medium mb-1">Role / Context </label>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          className="w-full p-2 rounded border"
          rows={3}
          placeholder="e.g. Senior Frontend Engineer working in an agile team"
        />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {!isSignedIn && (
        <p className="text-sm text-gray-600 dark:text-gray-400">Demo uses remaining: {remainingDemo}</p>
      )}
      <div className="flex gap-3 mt-2">
        <button
          type="submit"
          disabled={loading || (!isSignedIn && remainingDemo <= 0)}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Generating…' : 'Generate Questions'}
        </button>
        <button type="button" onClick={() => setMode('chat')} className="bg-gray-500 text-white px-4 py-2 rounded">
          Cancel
        </button>
      </div>
    </form>
  );
};

export default InterviewQuestionGenerator; 