'use client';

import React, { useState } from 'react';
import { AlertCircle, Info, Bug } from 'lucide-react';

interface ApiResponse {
  success: boolean;
  message: string;
  managerId?: string;
  employeeId?: string;
  error?: string;
}

/**
 * Demo component showing different ways to handle API errors
 * This demonstrates various approaches to error handling for your registration endpoints
 */
export default function ErrorHandlingDemo() {
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Method 1: Basic error handling with user-friendly display
  const testBasicError = async () => {
    setIsLoading(true);
    setError('');
    setResponse(null);

    try {
      const response = await fetch('/api/auth/register-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'Test',
          lastName: 'User',
          email: 'invalid-email', // This will cause validation error
          company: 'Test Corp',
          role: 'Manager',
          password: '123' // This will cause password strength error
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed');
        console.log('❌ API Error:', data.error);
        return;
      }

      setResponse(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Network error';
      setError(errorMsg);
      console.error('❌ Network Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Method 2: Detailed error logging for debugging
  const testDetailedLogging = async () => {
    setIsLoading(true);
    setError('');
    setResponse(null);

    try {
      const response = await fetch('/api/auth/register-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: '',  // Missing required field
          lastName: 'User',
          email: 'test@existing.com', // Simulate existing email
          company: 'Test Corp',
          role: 'Manager',
          password: 'validpassword123'
        })
      });

      const data = await response.json();

      // Detailed console logging
      console.group('🔍 API Response Analysis');
      console.log('Status Code:', response.status);
      console.log('Status Text:', response.statusText);
      console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
      console.log('Response Data:', data);
      console.log('Success:', response.ok);
      console.log('Timestamp:', new Date().toISOString());
      console.groupEnd();

      if (!response.ok) {
        // Categorize error types
        let errorCategory = 'Unknown Error';
        if (response.status === 400) errorCategory = 'Validation Error';
        else if (response.status === 409) errorCategory = 'Conflict Error';
        else if (response.status === 500) errorCategory = 'Server Error';

        console.warn(`⚠️ ${errorCategory}:`, {
          message: data.error,
          statusCode: response.status,
          category: errorCategory
        });

        setError(`${errorCategory}: ${data.error}`);
        return;
      }

      console.log('✅ Registration successful:', data);
      setResponse(data);

    } catch (err) {
      console.error('🚨 Critical Error:', {
        error: err,
        type: err instanceof Error ? err.constructor.name : typeof err,
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
        timestamp: new Date().toISOString()
      });
      
      setError(`Critical Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Method 3: Error handling with retry logic
  const testWithRetry = async () => {
    setIsLoading(true);
    setError('');
    setResponse(null);

    const maxRetries = 3;
    let attempt = 0;

    const attemptRequest = async (): Promise<void> => {
      attempt++;
      console.log(`🔄 Attempt ${attempt}/${maxRetries}`);

      try {
        const response = await fetch('/api/auth/register-employee', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: 'Test',
            lastName: 'Employee',
            email: 'test@company.com',
            company: 'Test Corp',
            role: 'Employee',
            password: 'validpassword123'
          })
        });

        const data = await response.json();

        if (!response.ok) {
          if (attempt < maxRetries && response.status >= 500) {
            console.warn(`⚠️ Server error (${response.status}), retrying in 1 second...`);
            setTimeout(() => attemptRequest(), 1000);
            return;
          }
          
          throw new Error(data.error || `Request failed with status ${response.status}`);
        }

        console.log(`✅ Success on attempt ${attempt}:`, data);
        setResponse(data);

      } catch (err) {
        if (attempt < maxRetries) {
          console.warn(`⚠️ Error on attempt ${attempt}, retrying...`, err);
          setTimeout(() => attemptRequest(), 1000);
        } else {
          console.error(`❌ Failed after ${maxRetries} attempts:`, err);
          setError(err instanceof Error ? err.message : 'All retry attempts failed');
        }
      }
    };

    try {
      await attemptRequest();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
          <Bug className="mr-2" />
          API Error Handling Demo
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={testBasicError}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Test Basic Error
          </button>
          
          <button
            onClick={testDetailedLogging}
            disabled={isLoading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            Test Detailed Logging
          </button>
          
          <button
            onClick={testWithRetry}
            disabled={isLoading}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
          >
            Test With Retry
          </button>
        </div>

        {isLoading && (
          <div className="flex items-center text-blue-600 mb-4">
            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
            Testing API...
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center text-red-800">
              <AlertCircle className="h-4 w-4 mr-2" />
              <strong>Error:</strong>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        )}

        {response && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center text-green-800 mb-2">
              <Info className="h-4 w-4 mr-2" />
              <strong>Success Response:</strong>
            </div>
            <pre className="text-sm text-green-700 bg-green-100 p-2 rounded overflow-x-auto">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">How to View Errors:</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li><strong>Console Errors:</strong> Open browser DevTools (F12) → Console tab</li>
            <li><strong>Network Tab:</strong> DevTools → Network tab to see raw HTTP responses</li>
            <li><strong>User Display:</strong> Errors appear in red boxes above</li>
            <li><strong>Server Logs:</strong> Check your terminal/server console for backend errors</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 