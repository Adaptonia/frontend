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
}
