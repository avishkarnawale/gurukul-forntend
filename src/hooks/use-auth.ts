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

export function useAuth(): AuthState {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const read = () => {
      setToken(getToken());
      setRole(getRole());
      setUser(getUser());
      setLoading(false);
    };
    read();
    window.addEventListener("gk-auth-change", read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener("gk-auth-change", read);
      window.removeEventListener("storage", read);
    };
  }, []);

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
