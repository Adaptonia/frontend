// import { apiClient } from './api-client';
// import { User } from '@/lib/types';

// interface PromoteAdminResponse {
//   message: string;
//   user: User;
// }

// export const userApi = {
//   // Get user by ID
//   getUserById: async (userId: string): Promise<User> => {
//     const response = await apiClient.get(`/users/${userId}`);
//     return response.data;
//   },

//   // Promote user to admin (admin only)
//   promoteToAdmin: async (email: string): Promise<PromoteAdminResponse> => {
//     try {
//       const response = await apiClient.post('/users/promote-admin', { email });
//       return response.data;
//     } catch (error: any) {
//       if (error.response?.status === 403) {
//         throw new Error('You do not have permission to promote users to admin');
//       } else if (error.response?.status === 404) {
//         throw new Error(`No user found with email: ${email}`);
//       }
//       throw error;
//     }
//   }
// }; 