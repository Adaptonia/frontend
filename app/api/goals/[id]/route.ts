import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { API_ROUTES } from '@/lib/api';

// Get a goal by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const response = await axios.get(API_ROUTES.goalById(id), {
      headers: {
        Cookie: request.headers.get('cookie') || '',
      },
      withCredentials: true,
    });
    
    return NextResponse.json(response.data);
  } catch (error: unknown) {
    console.error(`Error fetching goal ${params.id}:`, error);
    
    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json(
        { message: error.response.data.message || 'Failed to fetch goal' },
        { status: error.response.status }
      );
    }
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update a goal
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    const response = await axios.patch(API_ROUTES.goalById(id), body, {
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
    console.error(`Error updating goal ${params.id}:`, error);
    
    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json(
        { message: error.response.data.message || 'Failed to update goal' },
        { status: error.response.status }
      );
    }
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete a goal
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const response = await axios.delete(API_ROUTES.goalById(id), {
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
    console.error(`Error deleting goal ${params.id}:`, error);
    
    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json(
        { message: error.response.data.message || 'Failed to delete goal' },
        { status: error.response.status }
      );
    }
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 