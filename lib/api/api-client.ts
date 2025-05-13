import axios from 'axios';
import { logoutUser } from '../auth';

// Get the base URL from environment variable or use a default
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Function to get a cookie value by name
const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null; // Not in browser environment
  
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // This is important for cookie-based authentication
});

// Request interceptor for adding the CSRF token to headers
apiClient.interceptors.request.use(
  (config) => {
    // Only add CSRF token for state-changing methods
    if (['post', 'put', 'delete', 'patch'].includes(config.method || '')) {
      const csrfToken = getCookie('XSRF-TOKEN');
      if (csrfToken) {
        config.headers['X-XSRF-TOKEN'] = csrfToken;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling auth errors
apiClient.interceptors.response.use(
  (response) => response,  // Return the response directly if it's successful
  async (error) => {
    const originalRequest = error.config;

    // If the error is a 401 (Unauthorized) or 403 (Forbidden), handle token refresh
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      try {
        // Attempt to refresh the token
        await axios.get(`${API_BASE_URL}/auth/refresh-token`, {
          withCredentials: true,  // Send cookies to refresh the token
        });

        // Retry the original request with the new token
        return apiClient(originalRequest);
      } catch (refreshError) {
        // If refreshing the token fails, logout the user
        await logoutUser();

        // Redirect the user to the login page
        // if (typeof window !== 'undefined') {
        //   window.location.href = '/login';
        // }
      }
    }

    // If it's not a 401 or 403 error, reject the promise
    return Promise.reject(error);
  }
);

export default apiClient;