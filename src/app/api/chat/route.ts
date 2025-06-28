import { HRAgent } from '@/lib/agent';
import { NextRequest, NextResponse } from 'next/server';
import { UserContext, UserRole } from '@/types';

// Instantiate a singleton instance of our HRAgent.
const agent = new HRAgent();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, userContext } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // A default user context can be used if not provided
    const context: UserContext = userContext || {
      userId: 'anonymous',
      role: UserRole.EMPLOYEE,
      department: 'General',
      preferences: {
        language: 'en-US',
        communicationStyle: 'neutral',
      },
    };

    const response = await agent.processQuery(message, context);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in chat API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to process chat message', details: errorMessage }, { status: 500 });
  }
} 