/**
 * Utility functions for consistent error handling across the application
 */

export interface ErrorDetails {
  message: string;
  status?: number;
  code?: string;
  timestamp: string;
  url?: string;
}

export interface ApiErrorResponse {
  error: string;
  status?: number;
}

/**
 * Enhanced error logging with categorization
 */
export function logError(error: unknown, context: string, additionalData?: Record<string, unknown>): void {
  const timestamp = new Date().toISOString();
  
  console.group(`🚨 Error in ${context}`);
  console.log('Timestamp:', timestamp);
  console.log('Context:', context);
  
  if (error instanceof Error) {
    console.log('Type:', error.constructor.name);
    console.log('Message:', error.message);
    console.log('Stack:', error.stack);
  } else {
    console.log('Error:', error);
  }
  
  if (additionalData) {
    console.log('Additional Data:', additionalData);
  }
  
  console.groupEnd();
}

/**
 * Extract error message from API response
 */
export async function extractApiError(response: Response): Promise<string> {
  try {
    const data: ApiErrorResponse = await response.json();
    return data.error || `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}: ${response.statusText}`;
  }
}

/**
 * Log detailed API response information
 */
export async function logApiResponse(response: Response, requestData?: unknown): Promise<void> {
  const responseData = await response.clone().json().catch(() => null);
  
  console.group('🔍 API Response Details');
  console.log('URL:', response.url);
  console.log('Status:', response.status, response.statusText);
  console.log('Headers:', Object.fromEntries(response.headers.entries()));
  console.log('Success:', response.ok);
  
  if (requestData) {
    console.log('Request Data:', requestData);
  }
  
  if (responseData) {
    console.log('Response Data:', responseData);
  }
  
  console.log('Timestamp:', new Date().toISOString());
  console.groupEnd();
}

/**
 * Create user-friendly error messages
 */
export function getUserFriendlyError(error: unknown): string {
  if (error instanceof Error) {
    // Network/Connection errors
    if (error.message.includes('fetch')) {
      return 'Connection error. Please check your internet connection and try again.';
    }
    
    // Timeout errors
    if (error.message.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }
    
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Enhanced fetch wrapper with automatic error handling
 */
export async function fetchWithErrorHandling(
  url: string,
  options: RequestInit = {},
  context: string = 'API Request'
): Promise<Response> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Log response details
    await logApiResponse(response, options.body ? JSON.parse(options.body as string) : null);

    return response;
  } catch (error) {
    logError(error, context, { url, options });
    throw error;
  }
}

/**
 * Parse and handle API errors consistently
 */
export async function handleApiError(response: Response): Promise<never> {
  const errorMessage = await extractApiError(response);
  
  // Categorize errors
  const errorCategory = categorizeHttpError(response.status);
  
  console.warn(`⚠️ ${errorCategory}:`, {
    message: errorMessage,
    status: response.status,
    url: response.url,
    timestamp: new Date().toISOString(),
  });
  
  throw new Error(errorMessage);
}

/**
 * Categorize HTTP error status codes
 */
export function categorizeHttpError(status: number): string {
  if (status >= 400 && status < 500) {
    switch (status) {
      case 400: return 'Validation Error';
      case 401: return 'Authentication Error';
      case 403: return 'Permission Error';
      case 404: return 'Not Found Error';
      case 409: return 'Conflict Error';
      case 422: return 'Validation Error';
      default: return 'Client Error';
    }
  } else if (status >= 500) {
    return 'Server Error';
  }
  
  return 'Unknown Error';
}

/**
 * Example usage for registration endpoints
 */
export async function registerUser(
  endpoint: string,
  userData: Record<string, unknown>
): Promise<ApiResponse> {
  try {
    const response = await fetchWithErrorHandling(
      endpoint,
      {
        method: 'POST',
        body: JSON.stringify(userData),
      },
      'User Registration'
    );

    if (!response.ok) {
      await handleApiError(response);
    }

    const data = await response.json();
    console.log('✅ Registration successful:', data);
    return data;

  } catch (error) {
    const friendlyMessage = getUserFriendlyError(error);
    logError(error, 'User Registration', { userData, endpoint });
    throw new Error(friendlyMessage);
  }
}

interface ApiResponse {
  success: boolean;
  message: string;
  managerId?: string;
  employeeId?: string;
} 