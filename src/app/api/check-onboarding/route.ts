import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { userNeedsOnboarding } from "@/lib/userUtils";

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ needsOnboarding: false }, { status: 401 });
    }
    
    const needsOnboarding = await userNeedsOnboarding(userId);
    
    return NextResponse.json({ needsOnboarding });
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return NextResponse.json({ needsOnboarding: false }, { status: 500 });
  }
} 