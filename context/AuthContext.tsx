'use client'
import { getCurrentUser, logoutUser } from "@/lib/auth";
import { AuthContextType, User } from "@/lib/types";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useState, createContext, useEffect, useContext } from "react";



const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children} : {children: React.ReactNode}) => {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true);
    const router = useRouter()

    const fetchUser = async () => {
        try {
          const data = await getCurrentUser();
          setUser(data);
        } catch {
          setUser(null);
        }  finally {
            setLoading(false)
        }
    }

    const logout = async () => {
      try {
        await logoutUser(); // Backend logout (e.g., remove cookie/token)
        setUser(null); // Clear local user state
        router.push("/home"); // Redirect to homepage
      } catch (error) {
        console.error("Logout failed:", error);
        // Optionally show a toast or error feedback
      }
    };

    const refreshAccessToken = async () => {
        try{
            const response = await axios.get('api/refresh-token', {
                withCredentials: true
            })
            if(response.status !== 200){
                throw new Error('Refresh failed')
            }

            // Fetch user again after refreshing token
            await fetchUser()
        } catch( err){
            console.error('could not refresh token:', err)
            setUser(null)
            // router.push('/login')
        }
    }

    const updateUser = (updated: Partial<User>) => {
      setUser((prev) => {
        if (!prev) return prev;
        return { ...prev, ...updated };
      });
    };


   useEffect(() => {
     const init = async () => {
       try {
         await refreshAccessToken(); // Try refreshing token first
       } catch (err) {
         console.error("Initial refresh failed");
       } finally {
         await fetchUser(); // Then load user (or set to null if not authenticated)
       }
     };

     init();
   }, []);


    return (
        <AuthContext.Provider value={{user, loading, setUser, logout, updateUser}}>
        {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () =>  {
    const context = useContext(AuthContext)
    if(!context) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context;
}