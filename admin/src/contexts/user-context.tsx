import type { User } from '@/types';
import { createContext, useContext } from 'react';

interface UserContext {
  user: User | null;
  loading: boolean;
  fetchUser: () => void;
}

export const UserContext = createContext<UserContext | null>(null);

export const useUser = () => useContext(UserContext);
