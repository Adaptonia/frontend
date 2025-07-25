import { NextRequest, NextResponse } from 'next/server';
import { Client, Account } from 'node-appwrite';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check required environment variables
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    
    if (!endpoint || !projectId) {
      console.error('Missing Appwrite environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Initialize Appwrite client for server-side
    const client = new Client()
      .setEndpoint(endpoint)
      .setProject(projectId);

    const account = new Account(client);

    // Get the recovery URL from environment variable or fallback to request origin
    const recoveryUrl = process.env.NEXT_PUBLIC_APP_URL || 
      `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('host')}`;

    // Request password reset using Appwrite
    await account.createRecovery(
      email,
      `${recoveryUrl}/reset-password`
    );

    return NextResponse.json({
      success: true,
      message: 'Password reset email sent successfully'
    });

  } catch (error: unknown) {
    console.error('Forgot password error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to send reset email';
    
    // Handle specific Appwrite errors
    if (errorMessage.includes('User not found')) {
      return NextResponse.json(
        { error: 'No account found with this email address' },
        { status: 404 }
      );
    }
    
    if (errorMessage.includes('rate limit')) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to send reset email. Please try again.' },
      { status: 500 }
    );
  }
} 