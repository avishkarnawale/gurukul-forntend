import { useEffect, useState } from "react";
import { getRole, getToken, getUser, type AppRole } from "@/lib/api";

export type { AppRole };

export interface AuthState {
  token: string | null;
  user: { id: string; email?: string } | null;
  role: AppRole | null;
  loading: boolean;
  roles: AppRole[];
  session: { access_token: string } | null;
}

function readAuthFromStorage() {
  if (typeof window === "undefined") {
    return { token: null as string | null, role: null as AppRole | null, user: null };
  }
  return { token: getToken(), role: getRole(), user: getUser() };
}

export function useAuth(): AuthState {
  const [auth, setAuth] = useState(readAuthFromStorage);
  const [loading, setLoading] = useState(() => typeof window === "undefined");

  useEffect(() => {
    setLoading(false);
    const read = () => setAuth(readAuthFromStorage());
    window.addEventListener("gk-auth-change", read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener("gk-auth-change", read);
      window.removeEventListener("storage", read);
    };
  }, []);

  const { token, role, user } = auth;

  return {
    token,
    user,
    role,
    loading,
    roles: role ? [role] : [],
    session: token ? { access_token: token } : null,
  };
}

export function primaryRole(roles: AppRole[]): AppRole | null {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("staff")) return "staff";
  if (roles.includes("student")) return "student";
  return null;
}
