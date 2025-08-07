import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get('userId');
    const userType = searchParams.get('type');

    // Security check: users can only fetch their own context
    if (requestedUserId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let userData = null;

    if (userType === 'manager') {
      userData = await prisma.manager.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          company: true,
          role: true,
          department: true
        }
      });
    } else if (userType === 'employee') {
      userData = await prisma.employee.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          company: true,
          role: true,
          department: true
        }
      });
    } else {
      // If no specific type requested, try both
      userData = await prisma.manager.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          company: true,
          role: true,
          department: true
        }
      });

      if (!userData) {
        userData = await prisma.employee.findUnique({
          where: { id: userId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            company: true,
            role: true,
            department: true
          }
        });
      }
    }

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(userData);
    
  } catch (error) {
    console.error('Account context fetch error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 