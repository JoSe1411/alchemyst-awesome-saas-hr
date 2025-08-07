'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Building2, DollarSign, Users, FileText, Sparkles, CheckCircle } from 'lucide-react';

interface ManagerJDForm {
  // Basic Info
  roleTitle: string;
  department: string;
  reportingTo: string;
  teamSize: string;
  
  // Role Details
  seniority: string;
  responsibilities: string;
  mustHave: string;
  niceHave: string;
  
  // Company Context
  location: string;
  employmentType: string;
  salaryRange: string;
  benefits: string;
  companyTemplate: string;
  
  // Manager Specific
  approvalRequired: boolean;
  useTemplate: string;
}

interface ManagerJDGeneratorProps {
  managerId: string;
}

const ManagerJDGenerator: React.FC<ManagerJDGeneratorProps> = ({ managerId }) => {
  const [hasCompanyProfile, setHasCompanyProfile] = useState<boolean | null>(null);
  const [companyName, setCompanyName] = useState<string>('');
  
  const [form, setForm] = useState<ManagerJDForm>({
    roleTitle: '',
    department: '',
    reportingTo: '',
    teamSize: '',
    seniority: 'Mid',
    responsibilities: '',
    mustHave: '',
    niceHave: '',
    location: 'Remote',
    employmentType: 'Full-time',
    salaryRange: '',
    benefits: '',
    companyTemplate: 'standard',
    approvalRequired: false,
    useTemplate: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  // Check for company profile on component mount
  useEffect(() => {
    const checkCompanyProfile = async () => {
      try {
        const response = await fetch('/api/company-profile');
        if (response.ok) {
          const data = await response.json();
          setHasCompanyProfile(!!data.profile);
          if (data.profile?.companyName) {
            setCompanyName(data.profile.companyName);
          }
        } else {
          setHasCompanyProfile(false);
        }
      } catch (err) {
        setHasCompanyProfile(false);
      }
    };
    
    checkCompanyProfile();
  }, []);

  const handleChange = (field: keyof ManagerJDForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setForm({ ...form, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const resp = await fetch('/api/jd-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          isManagerGenerated: true,
          managerId: managerId,
        }),
      });
      
      if (!resp.ok) throw new Error('Failed to generate JD');
      const data = await resp.json();
      setResult(data.content);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Generated Job Description
          </h2>
          <div className="flex gap-3">
            <button
              onClick={() => setResult(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => {
                setResult(null);
                setForm({
                  roleTitle: '',
                  department: '',
                  reportingTo: '',
                  teamSize: '',
                  seniority: 'Mid',
                  responsibilities: '',
                  mustHave: '',
                  niceHave: '',
                  location: 'Remote',
                  employmentType: 'Full-time',
                  salaryRange: '',
                  benefits: '',
                  companyTemplate: 'standard',
                  approvalRequired: false,
                  useTemplate: '',
                });
                setError('');
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              Create Another JD
            </button>
            <Link
              href={`/dashboard/manager/${managerId}`}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
            >
              Save & Return to Dashboard
            </Link>
          </div>
        </div>
        
        <div className="prose prose-lg max-w-none dark:prose-invert">
          <div 
            className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg border"
            dangerouslySetInnerHTML={{ 
              __html: result.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
            }} 
          />
        </div>
      </div>
    );
  }

  const roleTemplates = [
    { value: '', label: 'Start from scratch' },
    { value: 'software-engineer', label: 'Software Engineer' },
    { value: 'product-manager', label: 'Product Manager' },
    { value: 'data-analyst', label: 'Data Analyst' },
    { value: 'marketing-specialist', label: 'Marketing Specialist' },
    { value: 'sales-representative', label: 'Sales Representative' },
  ];

  const departments = [
    'Engineering', 'Product', 'Marketing', 'Sales', 'Design', 
    'Data Science', 'Operations', 'HR', 'Finance', 'Customer Success'
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/manager/${managerId}`}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Create Job Description
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Enhanced with manager tools and company context
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {hasCompanyProfile && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-medium">Company Context Active</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-blue-600">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-medium">AI-Powered</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-8">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Company Context Banner */}
        {hasCompanyProfile === true ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h4 className="font-semibold text-green-800">Company Context Enabled</h4>
            </div>
            <p className="text-sm text-green-700">
              Your job description will automatically include {companyName}'s brand voice, 
              company culture, benefits, and career development opportunities. This makes 
              your JD far more compelling than generic ChatGPT output.
            </p>
          </div>
        ) : hasCompanyProfile === false ? (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-yellow-800 mb-1">Enhance Your JDs with Company Context</h4>
                <p className="text-sm text-yellow-700">
                  Set up your company profile to automatically include your brand voice, benefits, 
                  and culture in every job description.
                </p>
              </div>
              <Link
                href={`/dashboard/manager/${managerId}/company-setup`}
                className="px-3 py-2 bg-yellow-600 text-white text-sm font-medium rounded-md hover:bg-yellow-700 transition-colors whitespace-nowrap"
              >
                Setup Now
              </Link>
            </div>
          </div>
        ) : null}

        {/* Template Selection */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Start with Template</h3>
          </div>
          <select 
            value={form.useTemplate} 
            onChange={handleChange('useTemplate')}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          >
            {roleTemplates.map((template) => (
              <option key={template.value} value={template.value}>
                {template.label}
              </option>
            ))}
          </select>
        </div>

        {/* Basic Role Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Role Information
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Role Title *
                  </label>
                  <input 
                    value={form.roleTitle} 
                    onChange={handleChange('roleTitle')}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                    placeholder="e.g., Senior Frontend Developer"
                    required 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Department *
                  </label>
                  <select 
                    value={form.department} 
                    onChange={handleChange('department')}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Seniority Level
                  </label>
                  <select 
                    value={form.seniority} 
                    onChange={handleChange('seniority')}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  >
                    {['Intern', 'Junior', 'Mid', 'Senior', 'Lead', 'Principal', 'Director'].map((level) => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Context
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reports To
                  </label>
                  <input 
                    value={form.reportingTo} 
                    onChange={handleChange('reportingTo')}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                    placeholder="e.g., Engineering Manager"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Team Size (if managing)
                  </label>
                  <input 
                    value={form.teamSize} 
                    onChange={handleChange('teamSize')}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                    placeholder="e.g., 3-5 engineers"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Location & Work Style
                  </label>
                  <select 
                    value={form.location} 
                    onChange={handleChange('location')}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  >
                    {['Remote', 'Hybrid', 'On-site', 'Remote (US only)', 'Remote (Global)'].map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Role Details */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Role Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Key Responsibilities *
              </label>
              <textarea 
                value={form.responsibilities} 
                onChange={handleChange('responsibilities')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                rows={4}
                placeholder="List the main responsibilities and duties..."
                required
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Must-Have Skills *
                </label>
                <textarea 
                  value={form.mustHave} 
                  onChange={handleChange('mustHave')}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  rows={3}
                  placeholder="Required skills, experience, certifications..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nice-to-Have Skills
                </label>
                <textarea 
                  value={form.niceHave} 
                  onChange={handleChange('niceHave')}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  rows={3}
                  placeholder="Preferred but not required skills..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Compensation & Benefits */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Compensation & Benefits
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Salary Range
              </label>
              <input 
                value={form.salaryRange} 
                onChange={handleChange('salaryRange')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                placeholder="e.g., $80,000 - $120,000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Employment Type
              </label>
              <select 
                value={form.employmentType} 
                onChange={handleChange('employmentType')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              >
                {['Full-time', 'Part-time', 'Contract', 'Contract-to-hire', 'Internship'].map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Benefits & Perks
            </label>
            <textarea 
              value={form.benefits} 
              onChange={handleChange('benefits')}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              rows={3}
              placeholder="Health insurance, 401k, flexible PTO, remote work stipend..."
            />
          </div>
        </div>

        {/* Manager Settings */}
        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Manager Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Company Template
              </label>
              <select 
                value={form.companyTemplate} 
                onChange={handleChange('companyTemplate')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              >
                <option value="standard">Standard Template</option>
                <option value="tech-startup">Tech Startup Style</option>
                <option value="enterprise">Enterprise Format</option>
                <option value="creative">Creative Industry</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                id="approvalRequired"
                type="checkbox"
                checked={form.approvalRequired}
                onChange={handleChange('approvalRequired')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="approvalRequired" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Require approval before posting
              </label>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Link
            href={`/dashboard/manager/${managerId}`}
            className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {loading ? 'Generating...' : 'Generate Job Description'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ManagerJDGenerator;