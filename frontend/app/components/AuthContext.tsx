import { createContext, useState, useContext, useEffect, type ReactNode } from "react";
import { api } from "../utils/api";

interface User {
  firstName?: string;
  lastName?: string;
  egn?: string;
  email: string;
  status: "ACTIVE" | "PENDING" | "LOCKED";
  roles: string[];
  lastLogin?: string;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("accessToken");
    if (storedToken) {
      setToken(storedToken);
      fetchUserProfile(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUserProfile = async (authToken: string) => {
    try {
      setIsLoading(true);
      const profile = await api.get<User>("/users/me", {
        Authorization: `Bearer ${authToken}`,
      });
      
      // Mock full name and EGN if not present (for dashboard demo)
      const enhancedProfile = {
        ...profile,
        firstName: profile.firstName || "John",
        lastName: profile.lastName || "Doe",
        egn: profile.egn || "5204128543"
      };
      
      setUser(enhancedProfile);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      // If token is invalid, logout
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post<{ accessToken: string }>("/auth/login", {
        email,
        password,
      });

      const newToken = response.accessToken;
      localStorage.setItem("accessToken", newToken);
      setToken(newToken);
      await fetchUserProfile(newToken);
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData: any) => {
    try {
      // Backend registration endpoint
      const response = await api.post<{ accessToken: string }>("/auth/register", userData);

      // Store token but user remains PENDING
      const newToken = response.accessToken;
      localStorage.setItem("accessToken", newToken);
      setToken(newToken);
      // We don't fetch profile here necessarily, or if we do, it should show PENDING status
      await fetchUserProfile(newToken);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (token) {
      await fetchUserProfile(token);
    }
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated: !!token && !!user,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
