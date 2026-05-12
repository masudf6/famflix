import { createContext, useEffect, useMemo, useState, ReactNode } from "react";
import { authApi, AuthUser, userApi } from "@/services/api";

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  updateProfile: (payload: { display_name?: string | null }) => Promise<AuthUser>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("auth_token")
  );
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem("auth_user");
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  });
  const [loading, setLoading] = useState<boolean>(!!token && !user);

  const setAndStoreUser = (nextUser: AuthUser | null) => {
    setUser(nextUser);
    if (nextUser) localStorage.setItem("auth_user", JSON.stringify(nextUser));
    else localStorage.removeItem("auth_user");
  };

  useEffect(() => {
    if (token) {
      authApi
        .me()
        .then((res) => setAndStoreUser(res.data.user))
        .catch(() => {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("auth_user");
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    const newToken = res.data.access_token;
    localStorage.setItem("auth_token", newToken);
    setToken(newToken);
    const meRes = await authApi.me();
    setAndStoreUser(meRes.data.user);
  };

  const register = async (fullName: string, email: string, password: string) => {
    await authApi.register(fullName, email, password);
  };

  const updateProfile = async (payload: { display_name?: string | null }) => {
    const res = await userApi.updateMe(payload);
    setAndStoreUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: !!token,
      loading,
      login,
      register,
      updateProfile,
      logout,
    }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
