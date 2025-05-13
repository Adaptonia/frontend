import { API_ROUTES } from "@/lib/api";
import axios from "axios";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Call backend logout endpoint
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
      withCredentials: true
    });

    // Create response that clears cookies
    const response = NextResponse.json(
      { success: true, message: "Logged out successfully" },
      { status: 200 }
    );

    // Clear all auth cookies
    response.cookies.delete("auth-token");
    response.cookies.delete("refresh-token");
    
    console.log("✅ Logout successful");
    return response;
  } catch (error) {
    console.error("❌ Logout error:", error);
    
    // Even if backend call fails, still clear cookies on frontend
    const response = NextResponse.json(
      { success: true, message: "Logged out from client" },
      { status: 200 }
    );
    
    response.cookies.delete("auth-token");
    response.cookies.delete("refresh-token");
    
    return response;
  }
}
