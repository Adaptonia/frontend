export type AuthContextType = {
  user: any | null;
  loading: boolean;
  setUser: React.Dispatch<React.SetStateAction<any | null>>;
  logout: () => Promise<void>;
  updateUser: any | null
};