import {
  clearAuthSession,
  getStoredToken,
} from "@/src/services/auth/auth.service";
import { getUserProfile } from "@/src/services/user/user.service";
import { normalizeUser } from "@/src/features/user/model/normalize-user";
import type { User } from "@/src/services/user/constant";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type { User } from "@/src/services/user/constant";
interface AuthSessionContextValue {
  user: User | null;
  loading: boolean;
  isAuth: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setIsAuth: React.Dispatch<React.SetStateAction<boolean>>;
  logoutUser: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthSessionContext = createContext<AuthSessionContextValue | undefined>(undefined);

export const AuthSessionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  const getToken = useCallback(async () => {
    return getStoredToken();
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      const { data } = await getUserProfile(token);
      const userData = data.user || data;
      setUser(normalizeUser(userData));
      setIsAuth(true);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  const logoutUser = useCallback(async () => {
    try {
      await clearAuthSession();
    } catch {
      // keep UI consistent even if storage operation fails
    } finally {
      setUser(null);
      setIsAuth(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <AuthSessionContext.Provider
      value={{
        user,
        setUser,
        isAuth,
        setIsAuth,
        loading,
        logoutUser,
        getToken,
      }}
    >
      {children}
    </AuthSessionContext.Provider>
  );
};

export const useAuthSession = (): AuthSessionContextValue => {
  const ctx = useContext(AuthSessionContext);
  if (!ctx) throw new Error("useAuthSession must be used within AuthSessionProvider");
  return ctx;
};
