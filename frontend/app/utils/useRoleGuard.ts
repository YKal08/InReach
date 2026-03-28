import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../components/AuthContext";
import { hasRole } from "./roles";

type AllowedRole = "PATIENT" | "DOCTOR" | "ADMIN" | "unauthenticated" | "any";

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
 * "ADMIN"           → must be authenticated + has ADMIN role. Redirects:
 *                     - unauthenticated → /login
 *                     - non-admin doctors → /doctor-home
 *                     - non-admin patients → /home
 *
 * "unauthenticated" → must NOT be authenticated. Redirects:
 *                     - patients → /home
 *                     - doctors  → /doctor-home
 *
 * "any"             → must be authenticated (any role). Redirects:
 *                     - unauthenticated → /login
 */
export function useRoleGuard(allowedRole: AllowedRole) {
  const { isAuthenticated, isLoading, isDoctor, user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = hasRole(user?.roles, "ADMIN");

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

      case "ADMIN":
        if (!isAuthenticated) { navigate("/login", { replace: true }); return; }
        if (!isAdmin) {
          navigate(isDoctor ? "/doctor-home" : "/home", { replace: true });
          return;
        }
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
  }, [isAuthenticated, isLoading, isDoctor, isAdmin, allowedRole, navigate]);

  return { isLoading, isAuthenticated, isDoctor, isAdmin };
}
