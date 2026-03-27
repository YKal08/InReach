import { createContext, useState, useContext, useEffect, type ReactNode } from "react";
import { api } from "../utils/api";

interface User {
  firstName: string;
  lastName: string;
  egn: string;
  email: string;
  address: string;
  telephone: string;
  status: "ACTIVE" | "PENDING" | "LOCKED";
  roles: string[];
  lastLogin?: string;
  createdAt?: string;
}

export interface RegistrationLocation {
  lat: number;
  lng: number;
  address: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any, location?: RegistrationLocation) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isDoctor: boolean;
  registrationLocation: RegistrationLocation | null;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [registrationLocation, setRegistrationLocation] = useState<RegistrationLocation | null>(null);

  // Initialize from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("accessToken");
    const storedLocation = localStorage.getItem("registrationLocation");

    if (storedLocation) {
      try { setRegistrationLocation(JSON.parse(storedLocation)); } catch {}
    }

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

      const enhancedProfile = {
        ...profile,
        firstName: profile.firstName || "John",
        lastName:  profile.lastName  || "Doe",
        egn:       profile.egn       || "5204128543",
      };

      setUser(enhancedProfile);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await api.post<{ accessToken: string }>("/auth/login", { email, password });
    const newToken = response.accessToken;
    localStorage.setItem("accessToken", newToken);
    setToken(newToken);
    await fetchUserProfile(newToken);
  };

  const register = async (userData: any, location?: RegistrationLocation) => {
    const response = await api.post<{ accessToken: string }>("/auth/register", userData);
    const newToken = response.accessToken;
    localStorage.setItem("accessToken", newToken);
    setToken(newToken);

    // Persist the registration location so it seeds doctor proximity on all pages
    if (location) {
      localStorage.setItem("registrationLocation", JSON.stringify(location));
      setRegistrationLocation(location);
    }

    await fetchUserProfile(newToken);
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    // Keep registrationLocation even after logout for convenience — remove if privacy matters
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (token) await fetchUserProfile(token);
  };

  // A user is a doctor if any of their roles contains "DOCTOR" (handles "DOCTOR" or "ROLE_DOCTOR")
  const isDoctor = !!user?.roles?.some((r) => r.toUpperCase().includes("DOCTOR"));

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated: !!token && !!user,
    isDoctor,
    registrationLocation,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
