'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { User, Building2, Users, ArrowRight } from 'lucide-react';
import { ThreeBackground } from '@/components/ThreeBackground';

// This form is to collect the missing information caused by Clerk Sign up using google.
interface missinginformation {
  userType: "manager" | "employee",
  company: string,
  role: string,
  department: string,
}

export default function OnboardingPage() {
  // useRouter() is used to redirect.
  const router = useRouter();
  const { user } = useUser();
  
  const [formData, setFormData] = useState<missinginformation>({
    userType: "employee", // default
    company: "",
    role: "",
    department: "",
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Submit to your API endpoint
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
          userType: formData.userType,
          company: formData.company,
          role: formData.role,
          department: formData.department
        }),
      });

      if (response.ok) {
        // Redirect based on user type with proper user ID
        if (formData.userType === 'manager') {
          router.push(`/dashboard/manager/${user?.id}`);
        } else {
          router.push(`/dashboard/employee/${user?.id}`);
        }
      } else {
        const data = await response.json();
        setError((data && data.error) ? data.error : 'Something went wrong');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex md:flex-row flex-col">
      {/* Left Visual Section */}
      <div className="relative md:w-1/2 w-full order-2 md:order-1 hidden md:block">
        <ThreeBackground />
        {/* dark tint overlay for better text contrast */}
        <div className="absolute inset-0 bg-indigo-900/20 pointer-events-none" />
        <div className="absolute inset-0 flex items-center justify-center">
          <h2 className="text-5xl font-bold text-black drop-shadow-lg">Aceternity</h2>
        </div>
      </div>

      {/* Right Form Section */}
      <div className="w-full max-w-md mx-auto order-1 md:order-2 bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-4 shadow-lg">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
            <p className="text-gray-600">Just a few details to get you started</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Role Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  What is your role?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${
                    formData.userType === 'employee' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="userType"
                      value="employee"
                      checked={formData.userType === 'employee'}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className="text-center">
                      <User className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                      <div className="font-medium text-gray-900">Employee</div>
                    </div>
                  </label>
                  
                  <label className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${
                    formData.userType === 'manager' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="userType"
                      value="manager"
                      checked={formData.userType === 'manager'}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className="text-center">
                      <Users className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                      <div className="font-medium text-gray-900">Manager</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Company Field */}
              <div className="space-y-2">
                <label htmlFor="company" className="text-sm font-medium text-gray-700">
                  Company Name
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  required
                  value={formData.company}
                  onChange={handleInputChange}
                  placeholder="Enter your company name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-gray-900"
                />
              </div>

              {/* Role Field */}
              <div className="space-y-2">
                <label htmlFor="role" className="text-sm font-medium text-gray-700">
                  Job Title
                </label>
                <input
                  type="text"
                  id="role"
                  name="role"
                  required
                  value={formData.role}
                  onChange={handleInputChange}
                  placeholder="Enter your job title"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-gray-900"
                />
              </div>

              {/* Department Field */}
              <div className="space-y-2">
                <label htmlFor="department" className="text-sm font-medium text-gray-700">
                  Department (Optional)
                </label>
                <select
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-gray-900"
                >
                  <option value="">Select your department (optional)</option>
                  <option value="Engineering">Engineering</option>
                  <option value="HR">Human Resources</option>
                  <option value="Sales">Sales</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Finance">Finance</option>
                  <option value="Operations">Operations</option>
                  <option value="Legal">Legal</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !formData.company || !formData.role}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-lg h-12 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Setting up...
                  </>
                ) : (
                  <>
                    Complete Setup
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

