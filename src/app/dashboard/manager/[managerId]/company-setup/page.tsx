import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import { UserButton } from '@clerk/nextjs';
import CompanyProfileSetup from '@/components/CompanyProfileSetup';

interface CompanySetupPageProps {
  params: {
    managerId: string;
  };
}

const prisma = new PrismaClient();

async function getCompanyProfile(managerId: string) {
  try {
    // Check if companyProfile model exists (after migration)
    if (!prisma.companyProfile) {
      console.log('CompanyProfile model not found - database migration needed');
      return null;
    }
    
    const profile = await prisma.companyProfile.findUnique({
      where: { managerId }
    });
    return profile;
  } catch (error) {
    console.error('Failed to fetch company profile:', error);
    return null;
  }
}

const CompanySetupPage: React.FC<CompanySetupPageProps> = async ({ params }) => {
  const { userId } = await auth();

  if (!userId) {
    redirect('/auth/sign-in');
  }

  const { managerId } = await params;
  
  if (userId !== managerId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-red-500">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p>You are not authorized to view this page.</p>
      </div>
    );
  }

  const companyProfile = await getCompanyProfile(managerId);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Company Profile Setup
          </h1>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <main>
        <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg mb-6 p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                🚀 Supercharge Your Job Descriptions
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Set up your company profile once to automatically include your brand voice, 
                benefits, culture, and career paths in every job description. This makes your 
                JDs consistent, comprehensive, and way better than generic ChatGPT output.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">Brand Consistency</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">Every JD matches your company voice</p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h3 className="font-semibold text-green-900 dark:text-green-100">Never Miss Benefits</h3>
                <p className="text-sm text-green-700 dark:text-green-300">Auto-include all your perks & benefits</p>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <h3 className="font-semibold text-purple-900 dark:text-purple-100">Career Growth</h3>
                <p className="text-sm text-purple-700 dark:text-purple-300">Show clear advancement paths</p>
              </div>
            </div>
          </div>
          
          <CompanyProfileSetup 
            managerId={managerId} 
            existingProfile={companyProfile} 
          />
        </div>
      </main>
    </div>
  );
};

export default CompanySetupPage;