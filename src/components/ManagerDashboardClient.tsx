'use client';

import { useState } from 'react';
import { FileText, ClipboardList, PlusCircle } from 'lucide-react';
import Link from 'next/link';

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
}

type ActiveTab = 'jd' | 'ik';

// A union type for items to be displayed, distinguishing between models.
type Item = (SimpleJD & { type: 'jd' }) | (SimpleIK & { type: 'ik' });

const ManagerDashboardClient: React.FC<ManagerDashboardClientProps> = ({
  jobDescriptions,
  interviewKits,
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('jd');

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
          </nav>
        </div>
      </div>

      <div className="mt-6">
        {activeTab === 'jd' && (
          <ItemList
            items={jobDescriptions.map((jd) => ({ ...jd, type: 'jd' }))}
            title="Job Descriptions"
            icon={<FileText className="h-6 w-6 text-gray-400" />}
            createLink="/"
            createLabel="Create New Job Description"
          />
        )}
        {activeTab === 'ik' && (
          <ItemList
            items={interviewKits.map((ik) => ({ ...ik, type: 'ik' }))}
            title="Interview Kits"
            icon={<ClipboardList className="h-6 w-6 text-gray-400" />}
            createLink="/"
            createLabel="Create New Interview Kit"
          />
        )}
      </div>
    </div>
  );
};

interface ItemListProps {
  items: Item[];
  title: string;
  icon: React.ReactNode;
  createLink: string;
  createLabel: string;
}

const ItemList: React.FC<ItemListProps> = ({ items, title, icon, createLink, createLabel }) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        {icon}
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
          No {title.toLowerCase()} yet
        </h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating a new one.</p>
        <div className="mt-6">
          <Link
            href={createLink}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusCircle className="-ml-1 mr-2 h-5 w-5" />
            {createLabel}
          </Link>
        </div>
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
              <a href="#" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                View
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ManagerDashboardClient; 