import { createContext, useState, useContext, useEffect, type ReactNode } from "react";

interface EasyModeContextType {
  isEasyMode: boolean;
  toggleEasyMode: () => void;
}

export const EasyModeContext = createContext<EasyModeContextType | undefined>(undefined);

export function EasyModeProvider({ children }: { children: ReactNode }) {
  const [isEasyMode, setIsEasyMode] = useState(() => {
    try {
      return localStorage.getItem("easyMode") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("easyMode", String(isEasyMode));
    } catch {
      // localStorage unavailable (SSR etc.)
    }
  }, [isEasyMode]);

  const toggleEasyMode = () => {
    setIsEasyMode((prev) => !prev);
  };

  return (
    <EasyModeContext.Provider value={{ isEasyMode, toggleEasyMode }}>
      {children}
    </EasyModeContext.Provider>
  );
}

export function useEasyMode() {
  const context = useContext(EasyModeContext);
  if (!context) {
    throw new Error("useEasyMode must be used within EasyModeProvider");
  }
  return context;
}
