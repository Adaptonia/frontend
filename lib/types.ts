export type UserRole = 'user' | 'admin';

// New user types for student classification
export type UserType = 'student' | 'non-student' | null;

export type User = {
  id?: string;
  name?: string;
  email?: string;
  profilePicture? : string;
  role?: UserRole;
  // New fields for student classification
  userType?: UserType;
  schoolName?: string;
  hasCompletedUserTypeSelection?: boolean;
};

export type AuthContextType = {
  user: User | null;
  loading: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  logout: () => Promise<void>;
  updateUser: (updated: Partial<User>) => void;
};

export type EditProfileType = {
  isOpen: boolean;
  onClose: () => void;
};

// New types for the user type selection modal
export interface UserTypeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (userType: UserType, schoolName?: string) => void;
}

export interface SchoolSelectionData {
  name: string;
  location: string;
  type: 'university' | 'polytechnic' | 'college';
}

// Milestone types
export interface Milestone {
  id: string;
  title: string;
  description?: string;
  date: string;
  isCompleted?: boolean;
}

export interface MilestoneComponentProps {
  milestones: Milestone[];
  onMilestonesChange: (milestones: Milestone[]) => void;
}

// Define types
export type ModalTab = 'main' | 'tag' | 'date' | 'reminder' | 'more' | 'location' | 'target';

export interface GoalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (savedGoal: Goal) => void;
  initialData?: Goal | null;
  category?: string;
  mode?: 'create' | 'edit';
}

export interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  selected?: boolean;
}

// Premium feature modal component
export interface PremiumFeatureModalProps {
  title: string;
  description: string;
  icon: React.ReactNode | string;
  onClose: () => void;
}

// Option item component for the "More options" screen
export interface OptionItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  hasToggle?: boolean;
  isActive?: boolean;
  isPro?: boolean;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  category: 'finance' | 'schedule' | 'career' | 'audio_books';
  deadline?: string;
  tags?: string;
  reminderDate?: string;
  location?: string;
  isCompleted?: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
  reminderSettings?: string; // JSON stringified reminder settings
  milestones?: string; // JSON stringified milestones array
}

export interface CreateGoalRequest {
  title: string;
  description?: string;
  category: 'finance' | 'schedule' | 'career' | 'audio_books';
  deadline?: string;
  tags?: string;
  reminderDate?: string; // Keep optional for backward compatibility
  location?: string;
  reminderSettings?: string; // JSON stringified reminder settings
  isCompleted?: boolean;
  milestones?: string; // JSON stringified milestones array
}

export interface UpdateGoalRequest {
  title?: string;
  description?: string;
  category?: 'schedule' | 'finance' | 'career' | 'audio_books';
  deadline?: string;
  location?: string;
  tags?: string;
  reminderDate?: string;
  isCompleted?: boolean;
  reminderSettings?: string;
  milestones?: string;
}

// Goal Pack types
export interface GoalPack {
  id: string;
  title: string;
  description?: string;
  category: 'finance' | 'schedule' | 'career' | 'audio_books';
  targetUserType: 'student' | 'non-student' | 'all';
  milestones?: string; // JSON stringified milestones array
  tags?: string;
  link?: string;
  isActive: boolean;
  createdBy: string; // Admin user ID
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalPackRequest {
  title: string;
  description?: string;
  category: 'finance' | 'schedule' | 'career' | 'audio_books';
  targetUserType: 'student' | 'non-student' | 'all';
  milestones?: string;
  tags?: string;
  link?: string;
  isActive?: boolean;
}

export interface UpdateGoalPackRequest {
  title?: string;
  description?: string;
  category?: 'finance' | 'schedule' | 'career' | 'audio_books';
  targetUserType?: 'student' | 'non-student' | 'all';
  milestones?: string;
  tags?: string;
  link?: string;
  isActive?: boolean;
}

export interface GoalPackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (savedGoalPack: GoalPack) => void;
  initialData?: GoalPack | null;
  mode?: 'create' | 'edit';
}

// Library types
export type LibraryItemType = 'book' | 'article' | 'video' | 'podcast' | 'course' | 'document' | 'other';

export interface LibraryItem {
  id: string;
  title: string;
  description?: string;
  type: LibraryItemType;
  author?: string;
  url?: string;
  tags?: string;
  category: 'finance' | 'schedule' | 'career' | 'audio_books' | 'general';
  isFavorite?: boolean;
  isCompleted?: boolean;
  rating?: number; // 1-5 stars
  notes?: string;
  dateAdded: string;
  dateCompleted?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLibraryItemRequest {
  title: string;
  description?: string;
  type: LibraryItemType;
  author?: string;
  url?: string;
  tags?: string;
  category: 'finance' | 'schedule' | 'career' | 'audio_books' | 'general';
  isFavorite?: boolean;
  isCompleted?: boolean;
  rating?: number;
  notes?: string;
  dateAdded?: string;
  dateCompleted?: string;
}

export interface UpdateLibraryItemRequest {
  title?: string;
  description?: string;
  type?: LibraryItemType;
  author?: string;
  url?: string;
  tags?: string;
  category?: 'finance' | 'schedule' | 'career' | 'audio_books' | 'general';
  isFavorite?: boolean;
  isCompleted?: boolean;
  rating?: number;
  notes?: string;
  dateAdded?: string;
  dateCompleted?: string;
}

export interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (savedItem: LibraryItem) => void;
  initialData?: LibraryItem | null;
  mode?: 'create' | 'edit';
}

// Goal Pack Review types
export interface GoalPackReview {
  id: string;
  goalPackId: string;
  userId: string;
  userName: string;
  userProfilePicture?: string;
  rating: number; // 1-5 stars
  reviewText?: string;
  isHelpful?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalPackReviewRequest {
  goalPackId: string;
  rating: number;
  reviewText?: string;
}

export interface UpdateGoalPackReviewRequest {
  rating?: number;
  reviewText?: string;
}

// Enhanced Goal Pack with review stats
export interface GoalPackWithStats extends GoalPack {
  averageRating: number;
  totalReviews: number;
  totalPurchases: number;
  isPurchased?: boolean;
  userReview?: GoalPackReview;
}

// Goal Pack Purchase types
export interface GoalPackPurchase {
  id: string;
  goalPackId: string;
  userId: string;
  purchasePrice: number;
  purchaseDate: string;
  createdAt: string;
}

export interface CreateGoalPackPurchaseRequest {
  goalPackId: string;
  purchasePrice: number;
}
