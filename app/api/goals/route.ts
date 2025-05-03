import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { API_ROUTES } from '@/lib/api';

// Get all goals
export async function GET(request: NextRequest) {
  try {
    // Forward the cookies for authentication
    const response = await axios.get(API_ROUTES.goals, {
      headers: {
        Cookie: request.headers.get('cookie') || '',
      },
      withCredentials: true,
    });
    
    return NextResponse.json(response.data);
  } catch (error: unknown) {
    console.error('Error fetching goals:', error);
    
    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json(
        { message: error.response.data.message || 'Failed to fetch goals' },
        { status: error.response.status }
      );
    }
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create a new goal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Forward the cookies for authentication
    const response = await axios.post(API_ROUTES.goals, body, {
      headers: {
        Cookie: request.headers.get('cookie') || '',
      },
      withCredentials: true,
    });
    
    // Forward any cookies set by the backend
    const cookies = response.headers["set-cookie"];
    const res = NextResponse.json(response.data);
    
    if (cookies) {
      res.headers.set("Set-Cookie", cookies.join(","));
    }
    
    return res;
  } catch (error: unknown) {
    console.error('Error creating goal:', error);
    
    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json(
        { message: error.response.data.message || 'Failed to create goal' },
        { status: error.response.status }
      );
    }
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 