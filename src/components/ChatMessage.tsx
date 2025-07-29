'use client';

import React from 'react';
import { User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ConversationMessage } from '@/types';

interface ChatMessageProps {
  message: ConversationMessage;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600/10 flex items-center justify-center">
          <Bot className="w-5 h-5 text-blue-600" />
        </div>
      )}
      <div
        className={`px-4 py-3 rounded-lg shadow-sm max-w-lg lg:max-w-2xl xl:max-w-3xl ${
          isUser
            ? 'bg-blue-100 text-blue-900'
            : 'bg-white border border-gray-200 text-gray-900'
        }`}
      >
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>

      </div>
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600/10 flex items-center justify-center">
          <User className="w-5 h-5 text-blue-600" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage; 