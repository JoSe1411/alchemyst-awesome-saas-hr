'use client';

import React from 'react';
import { useRightPanelStore } from '@/stores/rightPanelStore';

// Hiring-focused starter prompts that showcase Aura's ability to simplify recruitment
const STARTERS = [
  'Draft a concise job description for a frontend engineer.',
  'Give me 3 effective behavioral interview questions.',
  'Outline a simple 4-step hiring workflow for a small startup.',
  'What metrics should we track to measure hiring success?',
  'How can we streamline candidate resume screening?',
];

const PromptStarters: React.FC = () => {
  const { setMode } = useRightPanelStore();

  const handleClick = (prompt: string, index: number) => {
    if (index === 0) {
      setMode('jd');
      return;
    }

    if (index === 1) {
      setMode('interview');
      return;
    }

    // Otherwise treat as normal chat prompt
    const event = new CustomEvent<string>('general-chat-prompt', { detail: prompt });
    window.dispatchEvent(event);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {STARTERS.map((starter, idx) => (
        <button
          key={starter}
          onClick={() => handleClick(starter, idx)}
          className="text-sm px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-white transition-colors"
        >
          {starter}
        </button>
      ))}
    </div>
  );
};

export default PromptStarters; 