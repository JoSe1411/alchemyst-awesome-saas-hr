'use client';

import { useState } from 'react';
import { FileText, ClipboardList, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import PolicyUpload from './PolicyUpload';
import PolicyList from './PolicyList';

// Minimal shape we use in the UI – avoids importing Prisma types in the browser
interface SimpleJD {
  id: string;
  title: string | null;
  createdAt: Date;
}

interface SimpleIK {
  id: string;
  createdAt: Date;
  // context and questions are irrelevant for list view
}

interface ManagerDashboardClientProps {
  jobDescriptions: SimpleJD[];
  interviewKits: SimpleIK[];
  managerId: string;
}

type ActiveTab = 'jd' | 'ik' | 'policies';

// A union type for items to be displayed, distinguishing between models.
type Item = (SimpleJD & { type: 'jd' }) | (SimpleIK & { type: 'ik' });

const ManagerDashboardClient: React.FC<ManagerDashboardClientProps> = ({
  jobDescriptions,
  interviewKits,
  managerId,
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('jd');
  const [refreshPolicies, setRefreshPolicies] = useState(0);

  return (
    <div>
      <div className="sm:hidden">
        <label htmlFor="tabs" className="sr-only">
          Select a tab
        </label>
                  <select
            id="tabs"
            name="tabs"
            className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
            onChange={(e) => setActiveTab(e.target.value as ActiveTab)}
            value={activeTab}
          >
            <option value="jd">Job Descriptions</option>
            <option value="ik">Interview Kits</option>
            <option value="policies">Policy Documents</option>
          </select>
      </div>
      <div className="hidden sm:block">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('jd')}
              className={`${
                activeTab === 'jd'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Job Descriptions ({jobDescriptions.length})
            </button>
            <button
              onClick={() => setActiveTab('ik')}
              className={`${
                activeTab === 'ik'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Interview Kits ({interviewKits.length})
            </button>
            <button
              onClick={() => setActiveTab('policies')}
              className={`${
                activeTab === 'policies'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Policy Documents
            </button>
          </nav>
        </div>
      </div>

      <div className="mt-6">
        {activeTab === 'jd' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Job Descriptions
              </h2>
              <Link
                href={`/dashboard/manager/${managerId}/jd-generator`}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusCircle className="-ml-1 mr-2 h-5 w-5" />
                Create New Job Description
              </Link>
            </div>
            <ItemList
              items={jobDescriptions.map((jd) => ({ ...jd, type: 'jd' }))}
              title="Job Descriptions"
              icon={<FileText className="h-6 w-6 text-gray-400" />}
              managerId={managerId}
            />
          </div>
        )}
        {activeTab === 'ik' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Interview Kits
              </h2>
              <Link
                href={`/dashboard/manager/${managerId}/interview-generator`}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusCircle className="-ml-1 mr-2 h-5 w-5" />
                Create New Interview Kit
              </Link>
            </div>
            <ItemList
              items={interviewKits.map((ik) => ({ ...ik, type: 'ik' }))}
              title="Interview Kits"
              icon={<ClipboardList className="h-6 w-6 text-gray-400" />}
              managerId={managerId}
            />
          </div>
        )}
        {activeTab === 'policies' && (
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PolicyUpload 
                managerId={managerId}
                onUploadSuccess={() => setRefreshPolicies(prev => prev + 1)}
              />
              <PolicyList key={refreshPolicies} managerId={managerId} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface ItemListProps {
  items: Item[];
  title: string;
  icon: React.ReactNode;
  managerId: string;
}

const ItemList: React.FC<ItemListProps> = ({ items, title, icon, managerId }) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        {icon}
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
          No {title.toLowerCase()} yet
        </h3>
        <p className="mt-1 text-sm text-gray-500">Get started by using the create button above.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        // The title for an InterviewKit is not stored in its model, so we provide a default.
        const itemTitle = item.type === 'jd' ? item.title : 'Interview Kit';
        return (
          <div key={item.id} className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 truncate">
                {itemTitle || 'Untitled'}
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Created on {new Date(item.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
              <Link 
                href={item.type === 'jd' 
                  ? `/dashboard/manager/${managerId}/jd/${item.id}`
                  : `/dashboard/manager/${managerId}/interview-kit/${item.id}`
                }
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
              >
                View
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ManagerDashboardClient; 