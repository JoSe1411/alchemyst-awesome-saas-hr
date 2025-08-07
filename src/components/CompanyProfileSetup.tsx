'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Building2, Palette, Heart, Gift, TrendingUp, Settings, Save, Plus, X } from 'lucide-react';

interface CompanyProfile {
  companyName: string;
  industry: string;
  companySize: string;
  website: string;
  location: string;
  toneStyle: string;
  writingStyle: string;
  companyVoice: string;
  coreValues: string[];
  companyMission: string;
  workCulture: string;
  standardBenefits: string[];
  uniquePerks: string[];
  workingHours: string;
  careerProgression: Record<string, any>;
  learningBudget: string;
  mentorshipProgram: boolean;
  preferredTemplate: string;
  requireApproval: boolean;
  autoIncludeBenefits: boolean;
}

interface CompanyProfileSetupProps {
  managerId: string;
  existingProfile: any;
}

const CompanyProfileSetup: React.FC<CompanyProfileSetupProps> = ({ managerId, existingProfile }) => {
  const router = useRouter();
  const [profile, setProfile] = useState<CompanyProfile>({
    companyName: existingProfile?.companyName || '',
    industry: existingProfile?.industry || '',
    companySize: existingProfile?.companySize || '',
    website: existingProfile?.website || '',
    location: existingProfile?.location || '',
    toneStyle: existingProfile?.toneStyle || 'professional',
    writingStyle: existingProfile?.writingStyle || 'formal',
    companyVoice: existingProfile?.companyVoice || '',
    coreValues: existingProfile?.coreValues || [],
    companyMission: existingProfile?.companyMission || '',
    workCulture: existingProfile?.workCulture || '',
    standardBenefits: existingProfile?.standardBenefits || [],
    uniquePerks: existingProfile?.uniquePerks || [],
    workingHours: existingProfile?.workingHours || '',
    careerProgression: existingProfile?.careerProgression || {},
    learningBudget: existingProfile?.learningBudget || '',
    mentorshipProgram: existingProfile?.mentorshipProgram || false,
    preferredTemplate: existingProfile?.preferredTemplate || 'standard',
    requireApproval: existingProfile?.requireApproval || false,
    autoIncludeBenefits: existingProfile?.autoIncludeBenefits !== false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [newValue, setNewValue] = useState('');
  const [newBenefit, setNewBenefit] = useState('');
  const [newPerk, setNewPerk] = useState('');

  const handleChange = (field: keyof CompanyProfile) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const addToArray = (field: 'coreValues' | 'standardBenefits' | 'uniquePerks', value: string) => {
    if (value.trim()) {
      setProfile(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }));
      if (field === 'coreValues') setNewValue('');
      if (field === 'standardBenefits') setNewBenefit('');
      if (field === 'uniquePerks') setNewPerk('');
    }
  };

  const removeFromArray = (field: 'coreValues' | 'standardBenefits' | 'uniquePerks', index: number) => {
    setProfile(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/company-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ managerId, ...profile }),
      });

      if (!response.ok) throw new Error('Failed to save company profile');
      
      setSuccess(true);
      // Redirect to dashboard after successful save
      setTimeout(() => {
        router.push(`/dashboard/manager/${managerId}`);
      }, 1500); // Show success message briefly before redirecting
    } catch (err) {
      console.error('Company profile save error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing',
    'Retail', 'Marketing', 'Consulting', 'Real Estate', 'Media',
    'Non-profit', 'Government', 'Automotive', 'Energy', 'Other'
  ];

  const companySizes = [
    '1-10 employees', '11-50 employees', '51-200 employees', 
    '201-500 employees', '501-1000 employees', '1000+ employees'
  ];

  const commonBenefits = [
    'Health Insurance', 'Dental Insurance', 'Vision Insurance', '401(k) Matching',
    'Paid Time Off', 'Sick Leave', 'Life Insurance', 'Disability Insurance'
  ];

  const commonPerks = [
    'Remote Work', 'Flexible Hours', 'Unlimited PTO', 'Learning Stipend',
    'Home Office Stipend', 'Gym Membership', 'Catered Meals', 'Team Outings',
    'Conference Budget', 'Stock Options', 'Parental Leave', 'Mental Health Support'
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/manager/${managerId}`}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Company Profile Setup
          </h1>
        </div>
        {success && (
          <div className="text-green-600 font-medium">✅ Profile saved successfully! Redirecting to dashboard...</div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-8">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Basic Company Info */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Basic Company Information</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                value={profile.companyName}
                onChange={handleChange('companyName')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Industry *
              </label>
              <select
                value={profile.industry}
                onChange={handleChange('industry')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                required
              >
                <option value="">Select Industry</option>
                {industries.map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Company Size *
              </label>
              <select
                value={profile.companySize}
                onChange={handleChange('companySize')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                required
              >
                <option value="">Select Size</option>
                {companySizes.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Website
              </label>
              <input
                type="url"
                value={profile.website}
                onChange={handleChange('website')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                placeholder="https://yourcompany.com"
              />
            </div>
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Primary Location *
              </label>
              <input
                type="text"
                value={profile.location}
                onChange={handleChange('location')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                placeholder="San Francisco, CA or Remote"
                required
              />
            </div>
          </div>
        </div>

        {/* Brand Voice & Style */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Palette className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Brand Voice & Style</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tone Style
              </label>
              <select
                value={profile.toneStyle}
                onChange={handleChange('toneStyle')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              >
                <option value="professional">Professional</option>
                <option value="casual">Casual & Friendly</option>
                <option value="technical">Technical & Precise</option>
                <option value="creative">Creative & Innovative</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Writing Style
              </label>
              <select
                value={profile.writingStyle}
                onChange={handleChange('writingStyle')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              >
                <option value="formal">Formal</option>
                <option value="conversational">Conversational</option>
                <option value="concise">Concise & Direct</option>
                <option value="detailed">Detailed & Comprehensive</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Custom Voice Guidelines (Optional)
            </label>
            <textarea
              value={profile.companyVoice}
              onChange={handleChange('companyVoice')}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              rows={3}
              placeholder="e.g., Use inclusive language, avoid jargon, emphasize growth opportunities..."
            />
          </div>
        </div>

        {/* Company Culture & Values */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Heart className="h-5 w-5 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Company Culture & Values</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Core Values
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  placeholder="Add a core value"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('coreValues', newValue))}
                />
                <button
                  type="button"
                  onClick={() => addToArray('coreValues', newValue)}
                  className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.coreValues.map((value, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {value}
                    <button
                      type="button"
                      onClick={() => removeFromArray('coreValues', index)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Company Mission
              </label>
              <textarea
                value={profile.companyMission}
                onChange={handleChange('companyMission')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                rows={3}
                placeholder="What is your company's mission and purpose?"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Work Culture
              </label>
              <input
                type="text"
                value={profile.workCulture}
                onChange={handleChange('workCulture')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                placeholder="e.g., Remote-first, Collaborative, Fast-paced, Work-life balance"
              />
            </div>
          </div>
        </div>

        {/* Benefits & Perks */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Gift className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Benefits & Perks</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Standard Benefits
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newBenefit}
                  onChange={(e) => setNewBenefit(e.target.value)}
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  placeholder="Add a benefit"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('standardBenefits', newBenefit))}
                />
                <button
                  type="button"
                  onClick={() => addToArray('standardBenefits', newBenefit)}
                  className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="text-xs text-gray-500 mb-2">Common: {commonBenefits.join(', ')}</div>
              <div className="flex flex-wrap gap-2">
                {profile.standardBenefits.map((benefit, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                  >
                    {benefit}
                    <button
                      type="button"
                      onClick={() => removeFromArray('standardBenefits', index)}
                      className="text-green-600 hover:text-green-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Unique Perks
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newPerk}
                  onChange={(e) => setNewPerk(e.target.value)}
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  placeholder="Add a unique perk"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('uniquePerks', newPerk))}
                />
                <button
                  type="button"
                  onClick={() => addToArray('uniquePerks', newPerk)}
                  className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="text-xs text-gray-500 mb-2">Ideas: {commonPerks.slice(0, 6).join(', ')}</div>
              <div className="flex flex-wrap gap-2">
                {profile.uniquePerks.map((perk, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                  >
                    {perk}
                    <button
                      type="button"
                      onClick={() => removeFromArray('uniquePerks', index)}
                      className="text-purple-600 hover:text-purple-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Working Hours
            </label>
            <input
              type="text"
              value={profile.workingHours}
              onChange={handleChange('workingHours')}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              placeholder="e.g., Flexible hours, 9-5 EST, Asynchronous work"
            />
          </div>
        </div>

        {/* Career Development */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Career Development</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Learning Budget
              </label>
              <input
                type="text"
                value={profile.learningBudget}
                onChange={handleChange('learningBudget')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                placeholder="e.g., $1,500 annual learning budget"
              />
            </div>
            <div className="flex items-center">
              <input
                id="mentorshipProgram"
                type="checkbox"
                checked={profile.mentorshipProgram}
                onChange={handleChange('mentorshipProgram')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="mentorshipProgram" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Mentorship Program Available
              </label>
            </div>
          </div>
        </div>

        {/* JD Preferences */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Settings className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">JD Generation Preferences</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Preferred Template
              </label>
              <select
                value={profile.preferredTemplate}
                onChange={handleChange('preferredTemplate')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              >
                <option value="standard">Standard Format</option>
                <option value="detailed">Detailed & Comprehensive</option>
                <option value="concise">Concise & Direct</option>
                <option value="creative">Creative & Engaging</option>
              </select>
            </div>
            <div className="flex items-center">
              <input
                id="requireApproval"
                type="checkbox"
                checked={profile.requireApproval}
                onChange={handleChange('requireApproval')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="requireApproval" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Require approval before posting
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="autoIncludeBenefits"
                type="checkbox"
                checked={profile.autoIncludeBenefits}
                onChange={handleChange('autoIncludeBenefits')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="autoIncludeBenefits" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Auto-include benefits in JDs
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
              <Save className="h-4 w-4" />
            )}
            {loading ? 'Saving...' : (existingProfile ? 'Update Profile' : 'Save Profile')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompanyProfileSetup;