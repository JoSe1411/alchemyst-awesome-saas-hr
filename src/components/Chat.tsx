'use client';

import React, { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { useChatStore } from '@/stores/chatStore';

const Chat = () => {
  const { messages, isLoading, error, initializeWelcomeMessage } = useChatStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize welcome message on client side only
  useEffect(() => {
    initializeWelcomeMessage();
  }, [initializeWelcomeMessage]);

  useEffect(() => {
    // Scroll to the bottom on new message
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
           <div className="flex items-start gap-3">
             <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
               {/* Bot Icon can be placed here */}
             </div>
             <div className="px-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-700">
                <div className="flex items-center justify-center">
                  <span className="h-2 w-2 bg-blue-500 rounded-full animate-pulse mr-1.5"></span>
                  <span className="h-2 w-2 bg-blue-500 rounded-full animate-pulse mr-1.5 delay-150"></span>
                  <span className="h-2 w-2 bg-blue-500 rounded-full animate-pulse delay-300"></span>
                </div>
             </div>
           </div>
        )}
        {error && (
            <div className="text-red-500 text-sm text-center p-2">{error}</div>
        )}
      </div>
      <div className="p-4 border-t dark:border-gray-700">
        <ChatInput />
      </div>
    </div>
  );
};

export default Chat; 