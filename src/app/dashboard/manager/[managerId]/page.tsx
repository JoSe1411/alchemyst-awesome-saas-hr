import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import ManagerDashboardClient from '@/components/ManagerDashboardClient';
import Link from 'next/link';
import { Building2 } from 'lucide-react';
import CompanyContextIndicator from '@/components/CompanyContextIndicator';
import AccountSwitcher from '@/components/AccountSwitcher';
import { userNeedsOnboarding } from '@/lib/userUtils';

interface ManagerDashboardProps {
  params: {
    managerId: string;
  };
}

const prisma = new PrismaClient();

async function getManagerData(managerId: string) {
  try {
    const jobDescriptions = await prisma.jobDescription.findMany({
      where: { managerId },
      orderBy: { createdAt: 'desc' },
    });

    const interviewKits = await prisma.interviewKit.findMany({
      where: { managerId },
      orderBy: { createdAt: 'desc' },
    });

    return { jobDescriptions, interviewKits };
      } catch (error) {
    console.error('Failed to fetch manager data:', error);
    // Return empty arrays on error to prevent crashing the page
    return { jobDescriptions: [], interviewKits: [] };
  }
}

const ManagerDashboardPage: React.FC<ManagerDashboardProps> = async ({ params }) => {
  // Waiting for authentication
  const { userId } = await auth();

  // Protect the route: ensure user is logged in
  if (!userId) {
    redirect('/auth/sign-in');
  }

  // Security check: ensure the logged-in user is viewing their own dashboard
  const { managerId } = await params; // Dynamic route params
  if (userId !== managerId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-red-500">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p>You are not authorized to view this page.</p>
      </div>
    );
  }

  // Check if user needs onboarding
  const needsOnboarding = await userNeedsOnboarding(userId);
  if (needsOnboarding) {
    redirect('/onboarding');
  }

  const { jobDescriptions, interviewKits } = await getManagerData(userId);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Manager Dashboard
              </h1>
              <CompanyContextIndicator />
            </div>
            <div className="flex items-center space-x-4">
              <AccountSwitcher />
              <Link
                href={`/dashboard/manager/${managerId}/company-setup`}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
              >
                <Building2 className="h-4 w-4 mr-2" />
                Company Setup
              </Link>
            </div>
          </div>

          <ManagerDashboardClient
            jobDescriptions={jobDescriptions}
            interviewKits={interviewKits}
            managerId={managerId}
          />
        </div>
      </main>
    </div>
  );
};

export default ManagerDashboardPage; 