import { authService } from "@/services/auth";
import { userService } from "@/services/user";
import { normalizeUser } from "@/src/core/user/normalize-user";
import type { User } from "@/types/api";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type { User } from "@/types/api";
interface AppContextType {
  user: User | null;
  loading: boolean;
  isAuth: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setIsAuth: React.Dispatch<React.SetStateAction<boolean>>;
  logoutUser: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  const getToken = useCallback(async () => {
    return authService.getToken();
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      const { data } = await userService.getMe();
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
      await authService.clearSession();
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
    <AppContext.Provider
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
    </AppContext.Provider>
  );
};

export const useAppData = (): AppContextType => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppData must be used within AppProvider");
  return ctx;
};
