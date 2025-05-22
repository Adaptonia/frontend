// import api from "./apiClient";

// export async function getCurrentUser() {
//     try{
//         // Use the Next.js API route which will handle the communication with the backend
//         const res = await api.get('/auth/me', {withCredentials: true})
//         return res.data // make sure it Returns
//     } catch(error: unknown){
//         const errorMessage =
//           error instanceof Error ? error.message : "Default error message";
//         console.error("Failed to get current user:", errorMessage);
//         return null // always return something
//     }
// }

// export async function logoutUser() {
//     try {
//         // Use fetch to avoid interceptors that might cause loops
//         const res = await fetch('/api/auth/logout', {
//             method: 'POST',
//             credentials: 'include'
//         });
        
//         if (!res.ok) {
//             throw new Error('Logout failed');
//         }
        
//         // Don't automatically redirect, let the calling component handle navigation
//         return true;
//     } catch (error) {
//         console.error('Logout error:', error);
//         throw error; // Propagate the error to the caller
//     }
// }