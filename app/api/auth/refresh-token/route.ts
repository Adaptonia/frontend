import { API_ROUTES } from "@/lib/api";
import axios from "axios";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        // Use API_BASE_URL directly to construct the URL
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const response = await axios.get(`${API_BASE_URL}/auth/refresh-token`, {
            withCredentials: true
        });
        
        const nextRes = NextResponse.json(response.data, {status: 200});

        // Forward cookies from backend to frontend
        const cookies = response.headers['set-cookie'];
        if (cookies) {
            cookies.forEach(cookie => {
                nextRes.headers.append('Set-Cookie', cookie);
            });
        }

        return nextRes;
    } catch (err) {
        console.error('Could not refresh token:', err);
        
        // Return 401 to trigger proper logout in the interceptor
        return NextResponse.json(
            { message: 'Refresh token failed' }, 
            { status: 401 }
        );
    }
}