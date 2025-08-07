import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { localChat } from '@/lib/localModel';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const llm = new ChatGoogleGenerativeAI({
  model: process.env.GEMINI_MODEL_NAME ?? 'gemini-1.5-flash',
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0.8,
});

export async function POST(req: NextRequest) {
  try {
    const { context } = await req.json();

    const prompt = `You are Aura, an AI recruiter assistant. Generate exactly three behavioural interview questions. Respond ONLY with a numbered markdown list of the questions and nothing else.${
      context ? `\n\nRole / Context: ${context}` : ''
    }`;

    let reply: string;
    try {
      const completion = await llm.invoke(prompt);
      reply = completion.content as string;
    } catch (err) {
      console.warn('Gemini failed, falling back to local model:', err);
      reply = await localChat(prompt);
    }

    // Persist for authenticated users
    const { userId } = await auth();
    if (userId) {
      try {
        const prisma = new PrismaClient();
        await prisma.interviewKit.create({
          data: {
            managerId: userId,
            context: context ?? null,
            questions: reply,
          },
        });
      } catch (err) {
        console.error('Failed to persist interview kit:', err);
      }
    }

    return NextResponse.json({ content: reply });
  } catch (error) {
    console.error('Interview question generator error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
} 