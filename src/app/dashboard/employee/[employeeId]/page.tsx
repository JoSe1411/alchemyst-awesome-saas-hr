'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { HRAgent } from '@/lib/agent';
import { UserRole } from '@/types/index';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function EmployeeDashboard() {
  const params = useParams();
  const employeeId = params.employeeId as string;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agent, setAgent] = useState<HRAgent | null>(null);

  useEffect(() => {
    const initializeAgent = async () => {
      const hrAgent = new HRAgent();
      setAgent(hrAgent);
      
      // Load conversation history for this employee
      try {
        const history = await hrAgent.getConversationHistory(employeeId, 10);
        setMessages(history.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp
        })));
      } catch (error) {
        console.error('Failed to load conversation history:', error);
      }
    };

    initializeAgent();
  }, [employeeId]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || !agent || isLoading) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await agent.processQuery(
        inputMessage,
        {
          userId: employeeId,
          role: UserRole.EMPLOYEE,
          department: 'General',
          preferences: {
            communicationStyle: 'casual',
            language: 'en',
            frequentTopics: ['benefits', 'policies', 'vacation']
          },
          sessionHistory: messages
        }
      );

      const assistantMessage: Message = {
        id: response.id,
        role: 'assistant',
        content: response.content,
        timestamp: response.timestamp
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Employee Dashboard</h1>
          <p className="text-gray-600">Employee ID: {employeeId}</p>
          <p className="text-sm text-gray-500">
            Your personal HR assistant with conversation history
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 mb-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-16">
                <p>No conversation history yet.</p>
                <p className="text-sm">Start by asking me about benefits, policies, or general questions!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs md:max-w-md p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-green-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 p-3 rounded-lg">
                  <p className="text-sm">Thinking...</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask me about benefits, policies, vacation time..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>

          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">Employee Features:</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Benefits and compensation information</li>
              <li>• Time off and vacation policies</li>
              <li>• Company policies and procedures</li>
              <li>• Career development resources</li>
              <li>• Personalized conversation history</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 