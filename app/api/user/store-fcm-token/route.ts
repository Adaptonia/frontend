import { NextRequest, NextResponse } from 'next/server';
import { Client, Account, Databases, ID, Query } from 'appwrite';
import { DATABASE_ID, PUSH_TOKENS_COLLECTION_ID } from '@/src/services/appwrite';

export async function POST(request: NextRequest) {
  try {
    const { token, userId } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'FCM token is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('💾 Storing FCM token for user:', userId);

    // Create server-side Appwrite client for database operations
    // Note: Using the same client config as frontend since we're accepting userId directly
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

    const databases = new Databases(client);

    console.log('✅ Using server-side client for database operations');

    // Check if token already exists for this user
    const existingTokens = await databases.listDocuments(
      DATABASE_ID,
      PUSH_TOKENS_COLLECTION_ID,
      [Query.equal('userId', userId)]
    );

    console.log(`📋 Found ${existingTokens.documents.length} existing tokens for user`);

    if (existingTokens.documents.length > 0) {
      // Update existing token
      const existingToken = existingTokens.documents[0];
      await databases.updateDocument(
        DATABASE_ID,
        PUSH_TOKENS_COLLECTION_ID,
        existingToken.$id,
        {
          token,
          platform: getPlatform(),
          updatedAt: new Date().toISOString()
        }
      );
      console.log('✅ FCM token updated successfully');
    } else {
      // Create new token
      await databases.createDocument(
        DATABASE_ID,
        PUSH_TOKENS_COLLECTION_ID,
        ID.unique(),
        {
          userId: userId,
          token,
          platform: getPlatform(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      );
      console.log('✅ FCM token created successfully');
    }

    return NextResponse.json({
      success: true,
      message: 'FCM token stored successfully',
      userId: userId
    });

  } catch (error: any) {
    console.error('❌ Error storing FCM token:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// Helper function to detect platform
function getPlatform(): string {
  if (typeof window === 'undefined') return 'server';
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  
  if (/android/.test(userAgent)) return 'android';
  if (/iphone|ipad|ipod/.test(userAgent)) return 'ios';
  if (/mac/.test(userAgent)) return 'macos';
  if (/win/.test(userAgent)) return 'windows';
  if (/linux/.test(userAgent)) return 'linux';
  
  return 'web';
} 