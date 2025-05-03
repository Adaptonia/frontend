'use client'
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const useRequireAuth = () => {
    const {user, loading} = useAuth();
    const router = useRouter()

    useEffect(() => {
        if(!loading && !user){
            router.push('/login')
        }
    }, [loading, user])

    return {user, loading}
}