'use client';

import { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface PolicyUploadProps {
  managerId: string;
  onUploadSuccess?: () => void;
}

interface UploadState {
  isUploading: boolean;
  error: string | null;
  success: string | null;
}

const PolicyUpload: React.FC<PolicyUploadProps> = ({ onUploadSuccess }) => {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    error: null,
    success: null,
  });
  const [formData, setFormData] = useState({
    title: '',
    category: 'General Policies',
    file: null as File | null,
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, file }));
      setUploadState(prev => ({ ...prev, error: null, success: null }));
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setUploadState(prev => ({ ...prev, error: null, success: null }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!formData.file || !formData.title.trim()) {
      setUploadState(prev => ({ 
        ...prev, 
        error: 'Please select a file and enter a policy title' 
      }));
      return;
    }

    setUploadState(prev => ({ ...prev, isUploading: true, error: null, success: null }));

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', formData.file);
      uploadFormData.append('title', formData.title.trim());
      uploadFormData.append('category', formData.category);

      const response = await fetch('/api/policy-upload', {
        method: 'POST',
        body: uploadFormData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload policy');
      }

      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        success: `Policy "${result.policy.title}" uploaded successfully! Created ${result.policy.chunks} chunks.`,
      }));

      // Reset form
      setFormData({
        title: '',
        category: 'General Policies',
        file: null,
      });

      // Call success callback
      if (onUploadSuccess) {
        onUploadSuccess();
      }

    } catch (error) {
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }));
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <div className="flex items-center mb-6">
        <FileText className="h-6 w-6 text-indigo-600 mr-3" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Upload Policy Document
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Policy Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Policy Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
            placeholder="Enter policy title"
            required
          />
        </div>

        {/* Policy Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Policy Category
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="General Policies">General Policies</option>
            <option value="Benefits">Benefits</option>
            <option value="Compliance">Compliance</option>
            <option value="Training">Training</option>
            <option value="Onboarding">Onboarding</option>
            <option value="Workplace Policies">Workplace Policies</option>
          </select>
        </div>

        {/* File Upload */}
        <div>
          <label htmlFor="file" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Policy Document *
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors">
            <div className="space-y-1 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600 dark:text-gray-400">
                <label
                  htmlFor="file"
                  className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                >
                  <span>Upload a file</span>
                  <input
                    id="file"
                    name="file"
                    type="file"
                    className="sr-only"
                    accept=".txt,.pdf,.doc,.docx"
                    onChange={handleFileChange}
                    required
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                TXT, PDF, DOC, DOCX up to 10MB
              </p>
            </div>
          </div>
          {formData.file && (
            <div className="mt-2 flex items-center text-sm text-gray-600 dark:text-gray-400">
              <FileText className="h-4 w-4 mr-2" />
              {formData.file.name} ({(formData.file.size / 1024 / 1024).toFixed(2)} MB)
            </div>
          )}
        </div>

        {/* Error/Success Messages */}
        {uploadState.error && (
          <div className="flex items-center p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <span className="text-sm text-red-700 dark:text-red-400">{uploadState.error}</span>
          </div>
        )}

        {uploadState.success && (
          <div className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
            <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
            <span className="text-sm text-green-700 dark:text-green-400">{uploadState.success}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={uploadState.isUploading}
          className="w-full flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploadState.isUploading ? (
            <>
              <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="-ml-1 mr-2 h-4 w-4" />
              Upload Policy
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default PolicyUpload; 