export type User = {
  id?: string;
  name?: string;
  email?: string;
  profilePicture? : string;
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
