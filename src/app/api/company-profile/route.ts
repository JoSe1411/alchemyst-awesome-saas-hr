import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { managerId, ...profileData } = body;

    // Security check: ensure user is updating their own profile
    if (userId !== managerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if companyProfile model exists (after migration)
    if (!prisma.companyProfile) {
      return NextResponse.json({ error: 'Company profiles not available' }, { status: 503 });
    }

    // Use upsert to either create or update the profile
    const companyProfile = await prisma.companyProfile.upsert({
      where: { managerId },
      update: {
        companyName: profileData.companyName,
        industry: profileData.industry,
        companySize: profileData.companySize,
        website: profileData.website || null,
        location: profileData.location,
        toneStyle: profileData.toneStyle,
        writingStyle: profileData.writingStyle,
        companyVoice: profileData.companyVoice || null,
        coreValues: profileData.coreValues,
        companyMission: profileData.companyMission || null,
        workCulture: profileData.workCulture || null,
        standardBenefits: profileData.standardBenefits,
        uniquePerks: profileData.uniquePerks,
        workingHours: profileData.workingHours || null,
        careerProgression: profileData.careerProgression,
        learningBudget: profileData.learningBudget || null,
        mentorshipProgram: profileData.mentorshipProgram,
        preferredTemplate: profileData.preferredTemplate,
        requireApproval: profileData.requireApproval,
        autoIncludeBenefits: profileData.autoIncludeBenefits,
      },
      create: {
        managerId,
        companyName: profileData.companyName,
        industry: profileData.industry,
        companySize: profileData.companySize,
        website: profileData.website || null,
        location: profileData.location,
        toneStyle: profileData.toneStyle,
        writingStyle: profileData.writingStyle,
        companyVoice: profileData.companyVoice || null,
        coreValues: profileData.coreValues,
        companyMission: profileData.companyMission || null,
        workCulture: profileData.workCulture || null,
        standardBenefits: profileData.standardBenefits,
        uniquePerks: profileData.uniquePerks,
        workingHours: profileData.workingHours || null,
        careerProgression: profileData.careerProgression,
        learningBudget: profileData.learningBudget || null,
        mentorshipProgram: profileData.mentorshipProgram,
        preferredTemplate: profileData.preferredTemplate,
        requireApproval: profileData.requireApproval,
        autoIncludeBenefits: profileData.autoIncludeBenefits,
      },
    });

    console.log(`✅ Company profile saved for manager: ${managerId}`);
    
    return NextResponse.json({ 
      success: true, 
      profile: companyProfile 
    });
    
  } catch (error) {
    console.error('Company profile save error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if companyProfile model exists (after migration)
    if (!prisma.companyProfile) {
      return NextResponse.json({ profile: null });
    }

    const companyProfile = await prisma.companyProfile.findUnique({
      where: { managerId: userId }
    });

    return NextResponse.json({ profile: companyProfile });
    
  } catch (error) {
    console.error('Company profile fetch error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}