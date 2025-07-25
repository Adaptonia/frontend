import { NextRequest, NextResponse } from 'next/server';
import { Client, Account } from 'node-appwrite';

export async function POST(request: NextRequest) {
  try {
    const { userId, secret, password } = await request.json();

    if (!userId || !secret || !password) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, secret, password' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
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

    // Reset password using Appwrite
    await account.updateRecovery(
      userId,
      secret,
      password
    );

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error: unknown) {
    console.error('Reset password error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to reset password';
    
    // Handle specific Appwrite errors
    if (errorMessage.includes('Invalid secret')) {
      return NextResponse.json(
        { error: 'Invalid or expired reset link. Please request a new one.' },
        { status: 400 }
      );
    }
    
    if (errorMessage.includes('User not found')) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to reset password. Please try again.' },
      { status: 500 }
    );
  }
} 