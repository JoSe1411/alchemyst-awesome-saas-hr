import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { ArrowLeft, Edit, Download, Share2 } from 'lucide-react';

interface JDViewPageProps {
  params: {
    managerId: string;
    jdId: string;
  };
}

const prisma = new PrismaClient();

async function getJobDescription(jdId: string, managerId: string) {
  try {
    const jd = await prisma.jobDescription.findUnique({
      where: { 
        id: jdId,
        managerId: managerId // Ensure user can only view their own JDs
      }
    });
    return jd;
  } catch (error) {
    console.error('Failed to fetch job description:', error);
    return null;
  }
}

const JDViewPage: React.FC<JDViewPageProps> = async ({ params }) => {
  const { userId } = await auth();

  if (!userId) {
    redirect('/auth/sign-in');
  }

  const { managerId, jdId } = await params;
  
  // Security check
  if (userId !== managerId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-red-500">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p>You are not authorized to view this page.</p>
      </div>
    );
  }

  const jobDescription = await getJobDescription(jdId, managerId);

  if (!jobDescription) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-gray-500">
        <h1 className="text-2xl font-bold">Job Description Not Found</h1>
        <p>The job description you're looking for doesn't exist or has been deleted.</p>
        <Link
          href={`/dashboard/manager/${managerId}`}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/manager/${managerId}`}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {jobDescription.title}
            </h1>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <main>
        <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Actions Bar */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Created on {new Date(jobDescription.createdAt).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-3">
                  <button className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </button>
                  <button className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </button>
                  <Link
                    href={`/dashboard/manager/${managerId}/jd/${jdId}/edit`}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Job Description Content */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="px-6 py-8">
              <div 
                className="prose prose-lg max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ 
                  __html: jobDescription.markdown
                    .replace(/\n/g, '<br>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
                }} 
              />
            </div>
          </div>

          {/* Metadata */}
          {jobDescription.metadata && Object.keys(jobDescription.metadata as object).length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg mt-6 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Form Data Used
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {Object.entries(jobDescription.metadata as Record<string, any>).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="font-medium text-gray-600 dark:text-gray-400 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                    </span>
                    <span className="text-gray-900 dark:text-gray-100">
                      {typeof value === 'string' ? value : JSON.stringify(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default JDViewPage;