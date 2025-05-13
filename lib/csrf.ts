import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Get a cookie value by name
 */
export const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null; // Not in browser environment
  
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
};

/**
 * Get the current CSRF token, or fetch a new one if none exists
 */
export const getCsrfToken = async (): Promise<string> => {
  // First try to get from cookie
  const token = getCookie('XSRF-TOKEN');
  if (token) return token;
  
  // If no token, fetch a new one
  try {
    const response = await axios.get(`${API_BASE_URL}/auth/csrf-token`, {
      withCredentials: true,
    });
    
    // The token will be set in cookies by the server
    return getCookie('XSRF-TOKEN') || '';
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
    return '';
  }
};

/**
 * Explicitly refresh the CSRF token 
 * (useful after session timeouts or before important operations)
 */
export const refreshCsrfToken = async (): Promise<string> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/auth/csrf-token`, {
      withCredentials: true,
    });
    
    return getCookie('XSRF-TOKEN') || '';
  } catch (error) {
    console.error('Failed to refresh CSRF token:', error);
    return '';
  }
}; 