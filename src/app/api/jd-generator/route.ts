import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { NextRequest, NextResponse } from 'next/server';

const llm = new ChatGoogleGenerativeAI({
  model: process.env.GEMINI_MODEL_NAME ?? 'gemini-1.5-flash',
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0.6,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const prompt = `You are Aura, an AI recruiter assistant. Draft a clear, inclusive job description in markdown using the details provided below. Use headings where appropriate. Omit sections that have no content.\n\nJob Details (JSON):\n${JSON.stringify(body, null, 2)}`;

    const response = await llm.invoke(prompt);

    return NextResponse.json({ content: response.content });
  } catch (error) {
    console.error('JD generator error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
} 