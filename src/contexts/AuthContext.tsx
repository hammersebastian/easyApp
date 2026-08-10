import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { UserProfile } from '../domain/types';
import { learningRepository } from '../repositories';
import type { SignUpInput } from '../repositories/LearningRepository';

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  signIn(email: string, password: string): Promise<void>;
  signUp(input: SignUpInput): Promise<{ needsVerification: boolean }>;
  requestReset(email: string): Promise<void>;
  updatePassword(password: string): Promise<void>;
  signOut(): Promise<void>;
  updateDisplayName(name: string): Promise<void>;
  deleteAccount(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    void learningRepository
      .getCurrentUser()
      .then((profile) => mounted && setUser(profile))
      .finally(() => mounted && setLoading(false));
    const unsubscribe = learningRepository.onAuthChange(setUser);
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setUser(await learningRepository.signIn(email, password));
  }, []);
  const signUp = useCallback(async (input: SignUpInput) => learningRepository.signUp(input), []);
  const requestReset = useCallback(async (email: string) => learningRepository.requestPasswordReset(email), []);
  const updatePassword = useCallback(async (password: string) => learningRepository.updatePassword(password), []);
  const signOut = useCallback(async () => {
    await learningRepository.signOut();
    setUser(null);
  }, []);
  const updateDisplayName = useCallback(async (name: string) => {
    setUser(await learningRepository.updateDisplayName(name));
  }, []);
  const deleteAccount = useCallback(async () => {
    await learningRepository.deleteAccount();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, signIn, signUp, requestReset, updatePassword, signOut, updateDisplayName, deleteAccount }),
    [user, loading, signIn, signUp, requestReset, updatePassword, signOut, updateDisplayName, deleteAccount],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth muss innerhalb des AuthProviders verwendet werden.');
  return value;
};
