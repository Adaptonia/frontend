import { NextRequest, NextResponse } from 'next/server';
import { databases } from '@/lib/appwrite/config';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const goalPackId = params.id;
    
    if (!goalPackId) {
      return NextResponse.json(
        { error: 'Goal pack ID is required' },
        { status: 400 }
      );
    }

    const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'main';
    const GOAL_PACKS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_GOAL_PACKS_COLLECTION_ID || 'goal-packs';

    // Get the goal pack document
    const goalPack = await databases.getDocument(
      DATABASE_ID,
      GOAL_PACKS_COLLECTION_ID,
      goalPackId
    );

    // Transform the document to match our GoalPack interface
    const transformedGoalPack = {
      id: goalPack.$id,
      title: goalPack.title,
      description: goalPack.description,
      category: goalPack.category,
      targetUserType: goalPack.targetUserType,
      milestones: goalPack.milestones,
      tags: goalPack.tags,
      link: goalPack.link,
      isActive: goalPack.isActive,
      createdBy: goalPack.createdBy,
      createdAt: goalPack.$createdAt,
      updatedAt: goalPack.$updatedAt,
    };

    return NextResponse.json(transformedGoalPack);
  } catch (error: any) {
    console.error('Error fetching goal pack:', error);
    
    if (error.code === 404) {
      return NextResponse.json(
        { error: 'Goal pack not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch goal pack' },
      { status: 500 }
    );
  }
} 