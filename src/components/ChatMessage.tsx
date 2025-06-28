'use client';

import React, { useState, useEffect } from 'react';
import { User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ConversationMessage } from '@/types';

interface ChatMessageProps {
  message: ConversationMessage;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const [timeString, setTimeString] = useState<string>('');

  // Use useEffect to set timestamp only on client-side to prevent hydration mismatch
  useEffect(() => {
    setTimeString(new Date(message.timestamp).toLocaleTimeString());
  }, [message.timestamp]);

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          <Bot className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </div>
      )}
      <div
        className={`px-4 py-3 rounded-2xl max-w-lg lg:max-w-2xl xl:max-w-3xl ${
          isUser
            ? 'bg-blue-500 text-white rounded-br-none'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'
        }`}
      >
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
        {timeString && (
          <div className="text-xs opacity-70 mt-1.5 text-right">
            {timeString}
          </div>
        )}
      </div>
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
          <User className="w-5 h-5 text-blue-600 dark:text-blue-300" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage; 