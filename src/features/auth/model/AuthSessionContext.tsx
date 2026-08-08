import {
  clearAuthSession,
  getStoredToken,
} from "@/src/services/auth/auth.service";
import axios from "@/src/utils/axios";
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
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 401 || status === 403 || status === 404) {
        await clearAuthSession();
      }
      setUser(null);
      setIsAuth(false);
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

  useEffect(() => {
    const interceptorId = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error?.response?.status === 401) {
          await logoutUser();
        }
        return Promise.reject(error);
      },
    );
    return () => axios.interceptors.response.eject(interceptorId);
  }, [logoutUser]);

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
