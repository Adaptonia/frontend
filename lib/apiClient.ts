import axios from 'axios';
import { logoutUser } from './auth';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,  // Ensure cookies are sent with requests
});

api.interceptors.response.use(
  (response) => response,  // Return the response directly if it's successful
  async (error) => {
    const originalRequest = error.config;
    
    // Skip auth handling for certain endpoints to prevent logout loops
    const isChannelJoinEndpoint = (originalRequest.url?.includes('/channels/') && 
                                 originalRequest.url?.includes('/join')) ||
                                 originalRequest.url?.includes('/channels/join/');
    
    // If it's a channel join endpoint, just reject with the error (don't handle auth)
    if (isChannelJoinEndpoint) {
      console.log('Channel join error - bypassing auth handling:', error.message);
      return Promise.reject(error);
    }

    // If the error is a 401 (Unauthorized) or 403 (Forbidden), handle token refresh
    if (error.response?.status === 401 || error.response?.status === 403) {
      try {
        // Attempt to refresh the token using the Next.js API route
        await axios.get("/api/auth/refresh-token", {
          withCredentials: true,  // Send cookies to refresh the token
        });

        // Retry the original request with the new token
        return api(originalRequest);
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        
        // If refreshing the token fails, logout the user
        try {
          await logoutUser();
        } catch (logoutError) {
          console.error("Logout failed after token refresh error:", logoutError);
        }

        // Avoid redirect loop - only redirect if we're not already on the login page
        // if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        //   window.location.href = '/login';
        // }
        return Promise.reject(refreshError);
      }
    }

    // If it's not a 401 or 403 error, reject the promise
    return Promise.reject(error);
  }
);

export default api;
