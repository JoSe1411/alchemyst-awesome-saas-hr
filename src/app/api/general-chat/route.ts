import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { localChat } from '@/lib/localModel';
import { NextRequest, NextResponse } from 'next/server';
import { enforceRateLimit } from '@/lib/rateLimit';

// Singleton LLM instance for Gemini
const llm = new ChatGoogleGenerativeAI({
  model: process.env.GEMINI_MODEL_NAME ?? 'gemini-1.5-flash',
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0.8,
  maxRetries: 0
});

export async function POST(req: NextRequest) {
  try {
    const rate = await enforceRateLimit(req);
    if (!rate.allowed) return rate.response!;

    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
   
    let reply: string;
    try {
      if (globalThis.geminiQuotaExceeded) {
        throw new Error('gemini_quota');   // jump straight to fallback
      }  
      const completion = await llm.invoke(message);
      reply = completion.content as string;
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes('Too Many Requests') || err.message === 'gemini_quota') {
          globalThis.geminiQuotaExceeded = true; // remember for the rest of the day
        }
      }
      console.warn('Gemini failed, using local model:', err);
      reply = await localChat(message);
    }

    return NextResponse.json({
      id: Date.now().toString(),
      role: 'assistant',
      content: reply,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error in general chat API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to process message', details: errorMessage }, { status: 500 });
  }
} 