import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
const prisma = new PrismaClient;
import {auth} from "@clerk/nextjs/server"

export async function POST(req: NextRequest) {
    try {
      // Get the authenticated user's information
      const { userId } = await auth();
      
      // Check if user is authenticated
      if (!userId) {
        return NextResponse.json(
          { error: 'Unauthorized' }, 
          { status: 401 }
        );
      }
      
      // Parse request body
      const { userType, department } = await req.json();
      
      // Validate required fields
      if (!userType || !department) {
        return NextResponse.json(
          { error: 'Missing required fields: userType and department are required' }, 
          { status: 400 }
        );
      }
      
      // Validate userType
      if (userType !== 'manager' && userType !== 'employee') {
        return NextResponse.json(
          { error: 'Invalid userType. Must be either "manager" or "employee"' }, 
          { status: 400 }
        );
      }
      
      // Check if user exists in either table
      const existingManager = await prisma.manager.findUnique({ where: { id: userId } });
      const existingEmployee = await prisma.employee.findUnique({ where: { id: userId } });
      
      // Update based on userType
      if (userType === 'manager') {
        if (existingManager) {
          await prisma.manager.update({
            where: { id: userId },
            data: { department }
          });
        } else if (existingEmployee) {
          // User exists as employee but wants to be manager
          await prisma.employee.update({
            where: { id: userId },
            data: { department }
          });
          return NextResponse.json({ 
            success: true, 
            message: 'Profile updated. Role change request noted.' 
          });
        } else {
          return NextResponse.json(
            { error: 'User not found in database' }, 
            { status: 404 }
          );
        }
      } else if (userType === 'employee') {
        if (existingEmployee) {
          await prisma.employee.update({
            where: { id: userId },
            data: { department }
          });
        } else if (existingManager) {
          // User exists as manager but wants to be employee
          await prisma.manager.update({
            where: { id: userId },
            data: { department }
          });
          return NextResponse.json({ 
            success: true, 
            message: 'Profile updated. Role change request noted.' 
          });
        } else {
          return NextResponse.json(
            { error: 'User not found in database' }, 
            { status: 404 }
          );
        }
      }
      
      console.log(`✅ Onboarding completed for ${userType}:`, userId);
      return NextResponse.json({ 
        success: true, 
        message: 'Profile completed successfully!' 
      });
      
    } catch (error) {
      console.error('❌ Onboarding API error:', error);
      return NextResponse.json(
        { error: 'Failed to update profile. Please try again.' }, 
        { status: 500 }
      );
    } finally {
      await prisma.$disconnect();
    }
  }