'use client'
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentUser } from "@/services/appwrite/auth";

export const useRequireAuth = () => {
    const { user, loading, setUser } = useAuth();
    const router = useRouter();
    const [isRedirecting, setIsRedirecting] = useState(false);

    useEffect(() => {
        const checkAuthState = async () => {
            try {
                console.log("useRequireAuth: Checking auth state...");
                // Don't check if already redirecting
                if (isRedirecting) {
                    console.log("useRequireAuth: Already redirecting, skipping check");
                    return;
                }
                
                // If we don't have a user but might have a session, check Appwrite
                if (!user && !loading) {
                    console.log("useRequireAuth: No user in context, checking Appwrite session");
                    const currentUser = await getCurrentUser();
                    if (currentUser) {
                        console.log("useRequireAuth: Found Appwrite session for:", currentUser.email);
                        setUser(currentUser);
                        return; // User is authenticated, no need to redirect
                    } else {
                        // No session found, redirect to login
                        console.log("useRequireAuth: No session found, redirecting to login");
                        setIsRedirecting(true);
                        window.location.href = '/login';
                    }
                } else if (!loading && !user) {
                    // No user and not loading, redirect to login
                    console.log("useRequireAuth: No user and not loading, redirecting to login");
                    setIsRedirecting(true);
                    window.location.href = '/login';
                } else if (user) {
                    console.log("useRequireAuth: User authenticated:", user.email);
                }
            } catch (error) {
                console.error('Error checking auth state:', error);
                setIsRedirecting(true);
                window.location.href = '/login';
            }
        };
        
        checkAuthState();
    }, [user, loading, isRedirecting]);

    return { user, loading, isRedirecting };
}
