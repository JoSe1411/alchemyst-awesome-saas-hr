import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import ManagerJDGenerator from '@/components/ManagerJDGenerator';

interface ManagerJDGeneratorPageProps {
  params: {
    managerId: string;
  };
}

const ManagerJDGeneratorPage: React.FC<ManagerJDGeneratorPageProps> = async ({ params }) => {
  // Waiting for authentication
  const { userId } = await auth();

  // Protect the route: ensure user is logged in
  if (!userId) {
    redirect('/auth/sign-in');
  }

  // Security check: ensure the logged-in user is viewing their own dashboard
  const { managerId } = await params;
  if (userId !== managerId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-red-500">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p>You are not authorized to view this page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Create Job Description
          </h1>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>
      <main>
        <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <ManagerJDGenerator managerId={managerId} />
        </div>
      </main>
    </div>
  );
};

export default ManagerJDGeneratorPage;