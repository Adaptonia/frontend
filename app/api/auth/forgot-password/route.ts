import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Call the backend API
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/forgot-password`,
      body
    );
    
    return NextResponse.json(response.data);
  } catch (error: unknown) {
    console.error('Error in forgot-password API route:', error);
    
    // Forward the backend error message if available
    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json(
        { message: error.response.data.message || 'Failed to send reset code' },
        { status: error.response.status }
      );
    }
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 