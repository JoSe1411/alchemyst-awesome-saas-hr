import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { localChat } from '@/lib/localModel';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const llm = new ChatGoogleGenerativeAI({
  model: process.env.GEMINI_MODEL_NAME ?? 'gemini-1.5-flash',
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0.6,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = await auth();

    let companyContext = '';
    
    // Fetch company profile for enhanced context
    if (userId) {
      try {
        const prisma = new PrismaClient();
        // Check if companyProfile model exists (after migration)
        if (!prisma.companyProfile) {
          console.log('CompanyProfile model not found - skipping company context');
        } else {

        const companyProfile = await prisma.companyProfile.findUnique({
          where: { managerId: userId }
        });

        if (companyProfile) {
          companyContext = `
COMPANY CONTEXT (Use this to enhance the job description):
Company Name: ${companyProfile.companyName}
Industry: ${companyProfile.industry}
Company Size: ${companyProfile.companySize}
Location: ${companyProfile.location}
${companyProfile.website ? `Website: ${companyProfile.website}` : ''}

BRAND VOICE & STYLE:
- Tone: ${companyProfile.toneStyle}
- Writing Style: ${companyProfile.writingStyle}
${companyProfile.companyVoice ? `- Voice Guidelines: ${companyProfile.companyVoice}` : ''}

COMPANY CULTURE:
${companyProfile.coreValues.length > 0 ? `- Core Values: ${companyProfile.coreValues.join(', ')}` : ''}
${companyProfile.companyMission ? `- Mission: ${companyProfile.companyMission}` : ''}
${companyProfile.workCulture ? `- Work Culture: ${companyProfile.workCulture}` : ''}

BENEFITS & PERKS:
${companyProfile.standardBenefits.length > 0 ? `- Standard Benefits: ${companyProfile.standardBenefits.join(', ')}` : ''}
${companyProfile.uniquePerks.length > 0 ? `- Unique Perks: ${companyProfile.uniquePerks.join(', ')}` : ''}
${companyProfile.workingHours ? `- Working Hours: ${companyProfile.workingHours}` : ''}

CAREER DEVELOPMENT:
${companyProfile.learningBudget ? `- Learning Budget: ${companyProfile.learningBudget}` : ''}
${companyProfile.mentorshipProgram ? '- Mentorship Program Available' : ''}

INSTRUCTIONS:
1. Write in ${companyProfile.toneStyle} tone with ${companyProfile.writingStyle} style
2. Naturally incorporate company values and culture
3. ${companyProfile.autoIncludeBenefits ? 'Include ALL benefits and perks in a comprehensive benefits section' : 'Include key benefits as appropriate'}
4. Use the company name naturally throughout
5. Reflect the company's industry and size in expectations
6. Make it sound authentic to this specific company, not generic

`;
          }
        }
      } catch (err) {
        console.warn('Failed to fetch company profile:', err);
      }
    }

    const prompt = `You are Aura, an AI recruiter assistant. Draft a clear, inclusive job description in markdown using the details provided below. Use headings where appropriate. Omit sections that have no content.

${companyContext}

Job Details (JSON):
${JSON.stringify(body, null, 2)}

Create a job description that feels authentic to this specific company and industry, not a generic template. Make it compelling and comprehensive.`;

    let reply: string;
    try {
      const completion = await llm.invoke(prompt);
      reply = completion.content as string;
    } catch (err) {
      console.warn('Gemini failed, falling back to local model:', err);
      reply = await localChat(prompt);
    }

    // Persist only for authenticated users
    if (userId) {
      try {
        const prisma = new PrismaClient();
        
        // For now, save with the Clerk userId directly since we're using Clerk for auth
        // The managerId can be nullable and we'll store the Clerk userId
        await prisma.jobDescription.create({
          data: {
            managerId: userId,
            title: body.roleTitle ?? 'Job Description',
            markdown: reply,
            metadata: body,
          },
        });
        
        console.log(`✅ JD saved successfully for user: ${userId}`);
      } catch (err) {
        console.error('Failed to persist JD:', err);
        console.error('Error details:', err);
      }
    } else {
      console.log('❌ No authenticated user found, JD not saved');
    }

    return NextResponse.json({ content: reply });
  } catch (error) {
    console.error('JD generator error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
} 