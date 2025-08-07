'use client';

import React from 'react';
import { useSessionStore } from '@/stores/sessionStore';
import { Building2, User, ChevronRight } from 'lucide-react';

const CompanyContextIndicator: React.FC = () => {
  const { currentAccount } = useSessionStore();

  if (!currentAccount) {
    return null;
  }

  const getRoleIcon = (userType: string) => {
    return userType === 'manager' ? <Building2 className="h-4 w-4" /> : <User className="h-4 w-4" />;
  };

  const getRoleColor = (userType: string) => {
    return userType === 'manager' 
      ? 'bg-blue-50 text-blue-700 border-blue-200' 
      : 'bg-green-50 text-green-700 border-green-200';
  };

  return (
    <div className="flex items-center space-x-3 bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm">
      <div className="flex items-center space-x-2">
        <div className={`p-2 rounded-lg ${getRoleColor(currentAccount.userType)}`}>
          {getRoleIcon(currentAccount.userType)}
        </div>
        <div className="text-sm">
          <div className="font-medium text-gray-900">
            {currentAccount.company}
          </div>
          <div className="text-xs text-gray-500 flex items-center space-x-1">
            <span className="capitalize">{currentAccount.userType}</span>
            <ChevronRight className="h-3 w-3" />
            <span>{currentAccount.role}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyContextIndicator; 