import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../components/AuthContext";

type AllowedRole = "PATIENT" | "DOCTOR" | "unauthenticated" | "any";

/**
 * useRoleGuard — redirects the user if they don't belong on this page.
 *
 * "PATIENT"         → must be authenticated + NOT a doctor. Redirects:
 *                     - unauthenticated → /login
 *                     - doctors → /doctor-home
 *
 * "DOCTOR"          → must be authenticated + IS a doctor. Redirects:
 *                     - unauthenticated → /login
 *                     - patients → /home
 *
 * "unauthenticated" → must NOT be authenticated. Redirects:
 *                     - patients → /home
 *                     - doctors  → /doctor-home
 *
 * "any"             → must be authenticated (any role). Redirects:
 *                     - unauthenticated → /login
 */
export function useRoleGuard(allowedRole: AllowedRole) {
  const { isAuthenticated, isLoading, isDoctor } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return; // Wait until auth state is resolved

    switch (allowedRole) {
      case "PATIENT":
        if (!isAuthenticated) { navigate("/login", { replace: true }); return; }
        if (isDoctor)          { navigate("/doctor-home", { replace: true }); return; }
        break;

      case "DOCTOR":
        if (!isAuthenticated) { navigate("/login",  { replace: true }); return; }
        if (!isDoctor)         { navigate("/home",   { replace: true }); return; }
        break;

      case "unauthenticated":
        if (isAuthenticated) {
          navigate(isDoctor ? "/doctor-home" : "/home", { replace: true });
        }
        break;

      case "any":
        if (!isAuthenticated) { navigate("/login", { replace: true }); }
        break;
    }
  }, [isAuthenticated, isLoading, isDoctor, allowedRole, navigate]);

  return { isLoading, isAuthenticated, isDoctor };
}
