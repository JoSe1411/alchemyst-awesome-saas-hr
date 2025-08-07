import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
const prisma = new PrismaClient;
import { auth, currentUser } from "@clerk/nextjs/server"

export async function POST(req: NextRequest) {
    try {
      const { userId } = await auth();
      
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      const { userType, company, role, department } = await req.json();
      
      // Get user data from Clerk
      const user = await currentUser();
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      // Create user based on userType with all the collected information
      if (userType === 'manager') {
        await prisma.manager.create({
          data: { 
            id: userId,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.emailAddresses[0]?.emailAddress || '',
            company,
            role,
            department,
            password: '' // Password is managed by Clerk
          }
        });
      } else {
        await prisma.employee.create({
          data: { 
            id: userId,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.emailAddresses[0]?.emailAddress || '',
            company,
            role,
            department,
            password: '' // Password is managed by Clerk
          }
        });
      }
      
      return NextResponse.json({ success: true });
      
    } catch (error) {
      console.error('Error:', error);
      return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
    } finally {
      await prisma.$disconnect();
    }
  }