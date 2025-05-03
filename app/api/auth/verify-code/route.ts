import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Call the backend API
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/verify-code`,
      body
    );
    
    return NextResponse.json(response.data);
  } catch (error: unknown) {
    console.error('Error in verify-code API route:', error);
    
    // Forward the backend error message if available
    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json(
        { message: error.response.data.message || 'Invalid or expired verification code' },
        { status: error.response.status }
      );
    }
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 