import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { API_ROUTES } from '@/lib/api';

// Toggle goal completion
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const response = await axios.patch(API_ROUTES.toggleGoal(id), {}, {
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
    console.error(`Error toggling goal ${params.id}:`, error);
    
    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json(
        { message: error.response.data.message || 'Failed to toggle goal completion' },
        { status: error.response.status }
      );
    }
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 