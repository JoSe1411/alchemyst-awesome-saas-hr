'use client';

import React, { useState, useEffect } from 'react';
import { useUser, useAuth, SignOutButton } from '@clerk/nextjs';
import { ChevronDown, User, Building2, LogOut, Settings, Loader2 } from 'lucide-react';
import { useSessionStore } from '@/stores/sessionStore';

const AccountSwitcher: React.FC = () => {
  const { user, isLoaded } = useUser();
  const { isSignedIn } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  
  const { 
    currentAccount, 
    setCurrentAccount, 
    isLoading,
    setLoading, 
    setError 
  } = useSessionStore();

  // Fetch account context from database
  useEffect(() => {
    const fetchAccountContext = async () => {
      if (!isSignedIn || !user) {
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Try to fetch manager data first
        const managerResponse = await fetch(`/api/account-context?userId=${user.id}&type=manager`);
        
        if (managerResponse.ok) {
          const managerData = await managerResponse.json();
          setCurrentAccount({
            id: managerData.id,
            email: managerData.email,
            firstName: managerData.firstName,
            lastName: managerData.lastName,
            company: managerData.company,
            role: managerData.role,
            userType: 'manager'
          });
        } else {
          // Try to fetch employee data
          const employeeResponse = await fetch(`/api/account-context?userId=${user.id}&type=employee`);
          
          if (employeeResponse.ok) {
            const employeeData = await employeeResponse.json();
            setCurrentAccount({
              id: employeeData.id,
              email: employeeData.email,
              firstName: employeeData.firstName,
              lastName: employeeData.lastName,
              company: employeeData.company,
              role: employeeData.role,
              userType: 'employee'
            });
          } else {
            // Try without specifying type
            const genericResponse = await fetch(`/api/account-context?userId=${user.id}`);
            
            if (genericResponse.ok) {
              const genericData = await genericResponse.json();
              // Determine user type based on the data or default to employee
              setCurrentAccount({
                id: genericData.id,
                email: genericData.email,
                firstName: genericData.firstName,
                lastName: genericData.lastName,
                company: genericData.company,
                role: genericData.role,
                userType: 'employee' // Default to employee if we can't determine
              });
            } else {
              setError('No account data found');
            }
          }
        }
      } catch (error) {
        console.error('Error fetching account context:', error);
        setError('Failed to load account information');
      } finally {
        setLoading(false);
      }
    };

    fetchAccountContext();
  }, [isSignedIn, user, setCurrentAccount, setLoading, setError]);

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  const toggleDropdown = () => setIsOpen(!isOpen);

  const getRoleIcon = (userType: string) => {
    return userType === 'manager' ? <Building2 className="h-4 w-4" /> : <User className="h-4 w-4" />;
  };

  const getRoleColor = (userType: string) => {
    return userType === 'manager' 
      ? 'bg-blue-100 text-blue-800 border-blue-200' 
      : 'bg-green-100 text-green-800 border-green-200';
  };

  const getDisplayName = () => {
    if (currentAccount?.firstName && currentAccount?.lastName) {
      return `${currentAccount.firstName} ${currentAccount.lastName}`;
    }
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return 'Loading...';
  };

  const getInitials = () => {
    if (currentAccount?.firstName) {
      return currentAccount.firstName.charAt(0);
    }
    if (user?.firstName) {
      return user.firstName.charAt(0);
    }
    return 'U';
  };

  return (
    <div className="relative">
      {/* Simplified Account Switcher Button */}
      <button
        onClick={toggleDropdown}
        disabled={isLoading}
        className="flex items-center space-x-3 bg-white border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
            {isLoading ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              <span className="text-white text-sm font-medium">
                {getInitials()}
              </span>
            )}
          </div>
          <div className="text-left">
            <div className="text-sm font-medium text-gray-900">
              {getDisplayName()}
            </div>
            <div className="text-xs text-gray-500">
              {currentAccount?.company || (isLoading ? 'Loading...' : 'No company')}
            </div>
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4">
            {/* Current Account Header */}
            <div className="border-b border-gray-200 pb-3 mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <span className="text-white font-medium">
                      {getInitials()}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {getDisplayName()}
                  </div>
                  <div className="text-sm text-gray-500">
                    {currentAccount?.email || user?.emailAddresses[0]?.emailAddress}
                  </div>
                  {currentAccount && (
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(currentAccount.userType)}`}>
                        {getRoleIcon(currentAccount.userType)}
                        <span className="ml-1 capitalize">{currentAccount.userType}</span>
                      </span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">{currentAccount.company}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Account Actions */}
            <div className="space-y-1">
              <button
                onClick={() => {
                  // Navigate to user profile/settings
                  window.location.href = `/dashboard/${currentAccount?.userType || 'employee'}/${currentAccount?.id || user?.id}`;
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span>Account Settings</span>
              </button>

              <button
                onClick={() => {
                  // Navigate to company setup for managers
                  if (currentAccount?.userType === 'manager') {
                    window.location.href = `/dashboard/manager/${currentAccount.id}/company-setup`;
                  }
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                <Building2 className="h-4 w-4" />
                <span>Company Profile</span>
              </button>

              <div className="border-t border-gray-200 pt-2 mt-2">
                <SignOutButton>
                  <button className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors">
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </SignOutButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default AccountSwitcher; 