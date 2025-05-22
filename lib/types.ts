export type UserRole = 'user' | 'admin';

export type User = {
  id?: string;
  name?: string;
  email?: string;
  profilePicture? : string;
  role?: UserRole;
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
  category: 'SCHEDULE' | 'FINANCE' | 'CAREER' | 'AUDIO_BOOKS';
  deadline?: string;
  location?: string;
  tags?: string;
  reminderDate?: string;
  isCompleted: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalRequest {
  title: string;
  description?: string;
  category: 'SCHEDULE' | 'FINANCE' | 'CAREER' | 'AUDIO_BOOKS';
  deadline?: string;
  location?: string;
  tags?: string;
  reminderDate?: string;
  isCompleted?: boolean;
}

export interface UpdateGoalRequest {
  title?: string;
  description?: string;
  category?: 'SCHEDULE' | 'FINANCE' | 'CAREER' | 'AUDIO_BOOKS';
  deadline?: string;
  location?: string;
  tags?: string;
  reminderDate?: string;
  isCompleted?: boolean;
}
