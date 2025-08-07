import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function userNeedsOnboarding(userId: string): Promise<boolean> {
  try {
    // Check if user exists as manager
    const manager = await prisma.manager.findUnique({
      where: { id: userId },
      select: { id: true }
    });

    if (manager) {
      return false; // User exists as manager, no onboarding needed
    }

    // Check if user exists as employee
    const employee = await prisma.employee.findUnique({
      where: { id: userId },
      select: { id: true }
    });

    if (employee) {
      return false; // User exists as employee, no onboarding needed
    }

    // If user doesn't exist in either table, they need onboarding
    return true;
  } catch (error) {
    console.error('Error checking if user needs onboarding:', error);
    return true; // Default to requiring onboarding if there's an error
  }
}

export async function getUserType(userId: string): Promise<'manager' | 'employee' | null> {
  try {
    const manager = await prisma.manager.findUnique({
      where: { id: userId },
      select: { id: true }
    });

    if (manager) {
      return 'manager';
    }

    const employee = await prisma.employee.findUnique({
      where: { id: userId },
      select: { id: true }
    });

    if (employee) {
      return 'employee';
    }

    return null;
  } catch (error) {
    console.error('Error getting user type:', error);
    return null;
  }
} 