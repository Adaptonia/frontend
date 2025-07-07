'use client'
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export const useRequireAuth = () => {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [isRedirecting, setIsRedirecting] = useState(false);

    useEffect(() => {
        // Only check auth state after loading is complete
        if (!loading) {
            if (!user && !isRedirecting) {
                console.log("useRequireAuth: No authenticated user found, redirecting to login");
                setIsRedirecting(true);
                router.push('/login');
            } else if (user) {
                console.log("useRequireAuth: User authenticated:", user.email);
                setIsRedirecting(false);
            }
        }
    }, [user, loading, router, isRedirecting]);

    return { user, loading, isRedirecting };
};
