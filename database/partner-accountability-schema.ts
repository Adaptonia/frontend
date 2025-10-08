// Partner Accountability MVP Database Schema
// This file defines all the new collections and attributes needed for the partner accountability system

export interface PartnershipPreferences {
  id: string;
  userId: string;
  preferredPartnerType: 'p2p' | 'premium_expert' | 'either';
  supportStyle: string[]; // Array of support styles user prefers
  availableCategories: string[]; // Categories user wants accountability for
  goalCategories: string[]; // Specific goal categories (finance, career, fitness, tech, etc.)
  timeCommitment: 'daily' | 'weekly' | 'flexible';
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  isAvailableForMatching: boolean;
  timezone?: string;
  preferredMeetingTimes?: string[]; // Array of time slots
  bio?: string; // Short bio for partner matching
  lastActiveAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpertProfile {
  id: string;
  userId: string;
  isExpert: boolean;
  expertiseAreas: string[]; // finance, career, fitness, tech, etc.
  yearsOfExperience: number;
  certifications: string[];
  specializations: string[]; // More specific areas within expertise
  hourlyRate?: number;
  availability: {
    timeSlots: string[];
    timezone: string;
    maxClients: number;
  };
  bio: string;
  achievements: string[];
  isAvailableForMatching: boolean;
  rating?: number;
  totalClientsHelped: number;
  successStories: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Partnership {
  id: string;
  user1Id: string;
  user2Id: string;
  partnershipType: 'p2p' | 'premium_expert';
  status: 'pending' | 'active' | 'paused' | 'ended';
  matchedAt: string;
  startedAt?: string;
  endedAt?: string;
  matchingPreferences: {
    supportStyle: string;
    category: string;
    timeCommitment: string;
  };
  partnershipRules?: {
    verificationRequired: boolean;
    reminderFrequency: 'daily' | 'weekly' | 'never';
    allowTaskCreation: boolean;
  };
  metrics: {
    totalSharedGoals: number;
    totalTasksVerified: number;
    averageVerificationTime: number;
    lastInteraction: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SharedGoal {
  id: string;
  partnershipId: string;
  ownerId: string; // who created the goal
  partnerId: string; // who can verify tasks
  title: string;
  description?: string;
  category: 'schedule' | 'finance' | 'career' | 'audio_books';
  deadline?: string;
  supportStyle: string;
  accountability: {
    preferredPartnerType: 'p2p' | 'premium_expert';
    verificationRequired: boolean;
    reminderEnabled: boolean;
  };
  progress: {
    totalTasks: number;
    completedTasks: number;
    verifiedTasks: number;
    lastUpdated: string;
  };
  isCompleted: boolean;
  isShared: boolean; // true for shared goals, false for personal
  createdAt: string;
  updatedAt: string;
}

export interface PartnerTask {
  id: string;
  sharedGoalId: string;
  partnershipId: string;
  ownerId: string; // who created/owns the task
  partnerId: string; // who verifies the task
  title: string;
  description?: string;

  // Task status workflow
  status: 'pending' | 'in_progress' | 'marked_done' | 'verified' | 'rejected';

  // Verification workflow
  verificationStatus: 'not_required' | 'pending' | 'approved' | 'rejected' | 'redo_requested';
  verificationRequired: boolean;

  // Important dates
  dueDate?: string;
  markedDoneAt?: string;
  verifiedAt?: string;

  // Verification details
  verificationComment?: string;
  verificationEvidence?: string; // URL to uploaded proof/image
  verificationHistory: {
    action: 'marked_done' | 'verified' | 'rejected' | 'redo_requested';
    by: string; // userId
    at: string; // timestamp
    comment?: string;
  }[];

  // Task metadata
  priority: 'low' | 'medium' | 'high';
  estimatedTime?: string; // e.g., "30 minutes", "2 hours"
  tags?: string[];

  createdAt: string;
  updatedAt: string;
}

export interface VerificationRequest {
  id: string;
  taskId: string;
  partnershipId: string;
  requesterId: string; // who marked the task as done
  verifierId: string; // who needs to verify

  // Request status
  status: 'pending' | 'approved' | 'rejected' | 'redo_requested' | 'expired';

  // Verification details
  evidence?: string; // URL to proof/screenshot
  requesterComment?: string; // comment from person who marked as done
  verifierComment?: string; // comment from verifier

  // Timing
  requestedAt: string;
  verifiedAt?: string;
  expiresAt?: string; // auto-expire after 48 hours

  // Notification tracking
  notificationsSent: {
    initial: boolean;
    reminder24h: boolean;
    reminder1h: boolean;
    expired: boolean;
  };

  // Metadata
  verificationMethod: 'simple_approve' | 'with_comment' | 'request_evidence';
  priority: 'normal' | 'urgent';

  createdAt: string;
  updatedAt: string;
}

export interface PartnerNotification {
  id: string;
  partnershipId: string;
  fromUserId: string;
  toUserId: string;

  // Notification type and content
  type: 'partner_assigned' | 'partnership_request' | 'task_completed' | 'verification_request' |
    'verification_approved' | 'verification_rejected' | 'redo_requested' |
    'goal_shared' | 'partnership_ended' | 'weekly_summary' | 'expert_task_assigned' | 
    'expert_task_reminder' | 'expert_task_feedback';

  title: string;
  message: string;

  // Related entities
  relatedTaskId?: string;
  relatedGoalId?: string;
  relatedVerificationId?: string;

  // Delivery tracking
  emailSent: boolean;
  emailSentAt?: string;
  pushSent: boolean;
  pushSentAt?: string;

  // User interaction
  isRead: boolean;
  readAt?: string;
  actionTaken?: string; // what action user took from notification

  // Metadata
  priority: 'low' | 'normal' | 'high' | 'urgent';
  expiresAt?: string;

  createdAt: string;
  updatedAt: string;
}

export interface PartnershipMetrics {
  id: string;
  partnershipId: string;
  user1Id: string;
  user2Id: string;

  // Activity metrics
  totalSharedGoals: number;
  totalTasksCreated: number;
  totalTasksCompleted: number;
  totalTasksVerified: number;
  totalVerificationRequests: number;

  // Performance metrics
  averageVerificationTime: number; // in hours
  verificationSuccessRate: number; // percentage
  taskCompletionRate: number; // percentage
  goalCompletionRate: number; // percentage

  // Engagement metrics
  lastInteractionAt: string;
  totalInteractions: number;
  averageResponseTime: number; // in hours

  // Weekly/Monthly rollups
  weeklyGoalsCompleted: number;
  weeklyTasksVerified: number;
  monthlyActiveStreaks: number;

  // Calculated scores
  partnershipScore: number; // 0-100 based on mutual success
  reliabilityScore: number; // 0-100 based on timely verifications

  createdAt: string;
  updatedAt: string;
}

export interface ExpertTask {
  id: string;
  expertId: string;
  title: string;
  description: string;
  dueDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskSubmission {
  id: string;
  taskId: string;
  memberId: string;
  submissionText: string;
  submissionLink?: string;
  status: 'pending' | 'approved' | 'rejected' | 'needs_revision';
  expertComment?: string;
  submittedAt: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Collection Configuration for Appwrite
export const APPWRITE_COLLECTIONS = {
  PARTNERSHIP_PREFERENCES: {
    name: 'partnership_preferences',
    attributes: [
      { key: 'userId', type: 'string', required: true },
      { key: 'preferredPartnerType', type: 'string', required: true },
      { key: 'supportStyle', type: 'string', required: false, array: true },
      { key: 'availableCategories', type: 'string', required: false, array: true },
      { key: 'timeCommitment', type: 'string', required: true },
      { key: 'experienceLevel', type: 'string', required: true },
      { key: 'isAvailableForMatching', type: 'boolean', required: true },
      { key: 'timezone', type: 'string', required: false },
      { key: 'preferredMeetingTimes', type: 'string', required: false, array: true },
      { key: 'bio', type: 'string', required: false, size: 500 },
      { key: 'lastActiveAt', type: 'datetime', required: true },
      { key: 'createdAt', type: 'datetime', required: true },
      { key: 'updatedAt', type: 'datetime', required: true }
    ],
    indexes: [
      { key: 'userId', type: 'unique' },
      { key: 'isAvailableForMatching' },
      { key: 'preferredPartnerType' },
      { key: 'timeCommitment' }
    ]
  },

  PARTNERSHIPS: {
    name: 'partnerships',
    attributes: [
      { key: 'user1Id', type: 'string', required: true },
      { key: 'user2Id', type: 'string', required: true },
      { key: 'partnershipType', type: 'string', required: true },
      { key: 'status', type: 'string', required: true },
      { key: 'matchedAt', type: 'datetime', required: true },
      { key: 'startedAt', type: 'datetime', required: false },
      { key: 'endedAt', type: 'datetime', required: false },
      { key: 'matchingPreferences', type: 'string', required: false }, // JSON string
      { key: 'partnershipRules', type: 'string', required: false }, // JSON string
      { key: 'metrics', type: 'string', required: false }, // JSON string
      { key: 'createdAt', type: 'datetime', required: true },
      { key: 'updatedAt', type: 'datetime', required: true }
    ],
    indexes: [
      { key: 'user1Id' },
      { key: 'user2Id' },
      { key: 'status' },
      { key: 'partnershipType' }
    ]
  },

  SHARED_GOALS: {
    name: 'shared_goals',
    attributes: [
      { key: 'partnershipId', type: 'string', required: true },
      { key: 'ownerId', type: 'string', required: true },
      { key: 'partnerId', type: 'string', required: true },
      { key: 'title', type: 'string', required: true, size: 255 },
      { key: 'description', type: 'string', required: false, size: 1000 },
      { key: 'category', type: 'string', required: true },
      { key: 'deadline', type: 'datetime', required: false },
      { key: 'supportStyle', type: 'string', required: true },
      { key: 'accountability', type: 'string', required: false }, // JSON string
      { key: 'progress', type: 'string', required: false }, // JSON string
      { key: 'isCompleted', type: 'boolean', required: true },
      { key: 'isShared', type: 'boolean', required: true },
      { key: 'createdAt', type: 'datetime', required: true },
      { key: 'updatedAt', type: 'datetime', required: true }
    ],
    indexes: [
      { key: 'partnershipId' },
      { key: 'ownerId' },
      { key: 'partnerId' },
      { key: 'category' },
      { key: 'isCompleted' },
      { key: 'isShared' }
    ]
  },

  PARTNER_TASKS: {
    name: 'partner_tasks',
    attributes: [
      { key: 'sharedGoalId', type: 'string', required: true },
      { key: 'partnershipId', type: 'string', required: true },
      { key: 'ownerId', type: 'string', required: true },
      { key: 'partnerId', type: 'string', required: true },
      { key: 'title', type: 'string', required: true, size: 255 },
      { key: 'description', type: 'string', required: false, size: 1000 },
      { key: 'status', type: 'string', required: true },
      { key: 'verificationStatus', type: 'string', required: true },
      { key: 'verificationRequired', type: 'boolean', required: true },
      { key: 'dueDate', type: 'datetime', required: false },
      { key: 'markedDoneAt', type: 'datetime', required: false },
      { key: 'verifiedAt', type: 'datetime', required: false },
      { key: 'verificationComment', type: 'string', required: false, size: 500 },
      { key: 'verificationEvidence', type: 'string', required: false },
      { key: 'verificationHistory', type: 'string', required: false }, // JSON string
      { key: 'priority', type: 'string', required: true },
      { key: 'estimatedTime', type: 'string', required: false },
      { key: 'tags', type: 'string', required: false, array: true },
      { key: 'createdAt', type: 'datetime', required: true },
      { key: 'updatedAt', type: 'datetime', required: true }
    ],
    indexes: [
      { key: 'sharedGoalId' },
      { key: 'partnershipId' },
      { key: 'ownerId' },
      { key: 'partnerId' },
      { key: 'status' },
      { key: 'verificationStatus' },
      { key: 'verificationRequired' }
    ]
  },

  VERIFICATION_REQUESTS: {
    name: 'verification_requests',
    attributes: [
      { key: 'taskId', type: 'string', required: true },
      { key: 'partnershipId', type: 'string', required: true },
      { key: 'requesterId', type: 'string', required: true },
      { key: 'verifierId', type: 'string', required: true },
      { key: 'status', type: 'string', required: true },
      { key: 'evidence', type: 'string', required: false },
      { key: 'requesterComment', type: 'string', required: false, size: 500 },
      { key: 'verifierComment', type: 'string', required: false, size: 500 },
      { key: 'requestedAt', type: 'datetime', required: true },
      { key: 'verifiedAt', type: 'datetime', required: false },
      { key: 'expiresAt', type: 'datetime', required: false },
      { key: 'notificationsSent', type: 'string', required: false }, // JSON string
      { key: 'verificationMethod', type: 'string', required: true },
      { key: 'priority', type: 'string', required: true },
      { key: 'createdAt', type: 'datetime', required: true },
      { key: 'updatedAt', type: 'datetime', required: true }
    ],
    indexes: [
      { key: 'taskId' },
      { key: 'partnershipId' },
      { key: 'requesterId' },
      { key: 'verifierId' },
      { key: 'status' },
      { key: 'expiresAt' }
    ]
  },

  PARTNER_NOTIFICATIONS: {
    name: 'partner_notifications',
    attributes: [
      { key: 'partnershipId', type: 'string', required: true },
      { key: 'fromUserId', type: 'string', required: true },
      { key: 'toUserId', type: 'string', required: true },
      { key: 'type', type: 'string', required: true },
      { key: 'title', type: 'string', required: true, size: 255 },
      { key: 'message', type: 'string', required: true, size: 1000 },
      { key: 'relatedTaskId', type: 'string', required: false },
      { key: 'relatedGoalId', type: 'string', required: false },
      { key: 'relatedVerificationId', type: 'string', required: false },
      { key: 'emailSent', type: 'boolean', required: true },
      { key: 'emailSentAt', type: 'datetime', required: false },
      { key: 'pushSent', type: 'boolean', required: true },
      { key: 'pushSentAt', type: 'datetime', required: false },
      { key: 'isRead', type: 'boolean', required: true },
      { key: 'readAt', type: 'datetime', required: false },
      { key: 'actionTaken', type: 'string', required: false },
      { key: 'priority', type: 'string', required: true },
      { key: 'expiresAt', type: 'datetime', required: false },
      { key: 'createdAt', type: 'datetime', required: true },
      { key: 'updatedAt', type: 'datetime', required: true }
    ],
    indexes: [
      { key: 'partnershipId' },
      { key: 'toUserId' },
      { key: 'type' },
      { key: 'isRead' },
      { key: 'priority' }
    ]
  },

  EXPERT_PROFILES: {
    name: 'expert_profiles',
    attributes: [
      { key: 'userId', type: 'string', required: true },
      { key: 'isExpert', type: 'boolean', required: true },
      { key: 'expertiseAreas', type: 'string', required: false, array: true },
      { key: 'yearsOfExperience', type: 'integer', required: true },
      { key: 'certifications', type: 'string', required: false, array: true },
      { key: 'specializations', type: 'string', required: false, array: true },
      { key: 'hourlyRate', type: 'double', required: false },
      { key: 'availability', type: 'string', required: true, size: 1000 },
      { key: 'bio', type: 'string', required: true, size: 2000 },
      { key: 'achievements', type: 'string', required: false, array: true },
      { key: 'isAvailableForMatching', type: 'boolean', required: true },
      { key: 'rating', type: 'double', required: false },
      { key: 'totalClientsHelped', type: 'integer', required: true },
      { key: 'successStories', type: 'string', required: false, array: true },
      { key: 'createdAt', type: 'datetime', required: true },
      { key: 'updatedAt', type: 'datetime', required: true }
    ],
    indexes: [
      { key: 'userId', type: 'unique' },
      { key: 'isExpert' },
      { key: 'expertiseAreas' },
      { key: 'isAvailableForMatching' },
      { key: 'rating' }
    ]
  },

  PARTNERSHIP_METRICS: {
    name: 'partnership_metrics',
    attributes: [
      { key: 'partnershipId', type: 'string', required: true },
      { key: 'user1Id', type: 'string', required: true },
      { key: 'user2Id', type: 'string', required: true },
      { key: 'totalSharedGoals', type: 'integer', required: true },
      { key: 'totalTasksCreated', type: 'integer', required: true },
      { key: 'totalTasksCompleted', type: 'integer', required: true },
      { key: 'totalTasksVerified', type: 'integer', required: true },
      { key: 'totalVerificationRequests', type: 'integer', required: true },
      { key: 'averageVerificationTime', type: 'double', required: true },
      { key: 'verificationSuccessRate', type: 'double', required: true },
      { key: 'taskCompletionRate', type: 'double', required: true },
      { key: 'goalCompletionRate', type: 'double', required: true },
      { key: 'lastInteractionAt', type: 'datetime', required: true },
      { key: 'totalInteractions', type: 'integer', required: true },
      { key: 'averageResponseTime', type: 'double', required: true },
      { key: 'weeklyGoalsCompleted', type: 'integer', required: true },
      { key: 'weeklyTasksVerified', type: 'integer', required: true },
      { key: 'monthlyActiveStreaks', type: 'integer', required: true },
      { key: 'partnershipScore', type: 'double', required: true },
      { key: 'reliabilityScore', type: 'double', required: true },
      { key: 'createdAt', type: 'datetime', required: true },
      { key: 'updatedAt', type: 'datetime', required: true }
    ],
    indexes: [
      { key: 'partnershipId', type: 'unique' },
      { key: 'user1Id' },
      { key: 'user2Id' },
      { key: 'partnershipScore' },
      { key: 'reliabilityScore' }
    ]
  },

  EXPERT_TASKS: {
    name: 'expert_tasks',
    attributes: [
      { key: 'expertId', type: 'string', required: true },
      { key: 'title', type: 'string', required: true, size: 255 },
      { key: 'description', type: 'string', required: true, size: 2000 },
      { key: 'dueDate', type: 'datetime', required: true },
      { key: 'isActive', type: 'boolean', required: true },
      { key: 'createdAt', type: 'datetime', required: true },
      { key: 'updatedAt', type: 'datetime', required: true }
    ],
    indexes: [
      { key: 'expertId' },
      { key: 'isActive' },
      { key: 'dueDate' }
    ]
  },

  TASK_SUBMISSIONS: {
    name: 'task_submissions',
    attributes: [
      { key: 'taskId', type: 'string', required: true },
      { key: 'memberId', type: 'string', required: true },
      { key: 'submissionText', type: 'string', required: true, size: 2000 },
      { key: 'submissionLink', type: 'string', required: false },
      { key: 'status', type: 'string', required: true },
      { key: 'expertComment', type: 'string', required: false, size: 1000 },
      { key: 'submittedAt', type: 'datetime', required: true },
      { key: 'reviewedAt', type: 'datetime', required: false },
      { key: 'createdAt', type: 'datetime', required: true },
      { key: 'updatedAt', type: 'datetime', required: true }
    ],
    indexes: [
      { key: 'taskId' },
      { key: 'memberId' },
      { key: 'status' },
      { key: 'submittedAt' }
    ]
  }
} as const;

// Environment variables needed
export const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_APPWRITE_PARTNERSHIP_PREFERENCES_COLLECTION_ID',
  'NEXT_PUBLIC_APPWRITE_PARTNERSHIPS_COLLECTION_ID',
  'NEXT_PUBLIC_APPWRITE_SHARED_GOALS_COLLECTION_ID',
  'NEXT_PUBLIC_APPWRITE_PARTNER_TASKS_COLLECTION_ID',
  'NEXT_PUBLIC_APPWRITE_VERIFICATION_REQUESTS_COLLECTION_ID',
  'NEXT_PUBLIC_APPWRITE_PARTNER_NOTIFICATIONS_COLLECTION_ID',
  'NEXT_PUBLIC_APPWRITE_PARTNERSHIP_METRICS_COLLECTION_ID'
] as const;