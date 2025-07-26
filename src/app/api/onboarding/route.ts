import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
const prisma = new PrismaClient;
import {auth} from "@clerk/nextjs/server"

export async function POST(req: NextRequest) {
    try {
      const { userId } = await auth();
      
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      const { userType, department } = await req.json();
      
      // Simple update based on userType
      if (userType === 'manager') {
        await prisma.manager.update({
          where: { id: userId },
          data: { department }
        });
      } else {
        await prisma.employee.update({
          where: { id: userId },
          data: { department }
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