"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface User {
  client_id: number;
  plan: string;
  plan_expiry: string;
  token: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  admin: boolean;
  login: (username: string, password: string, remember: boolean) => Promise<void>;
  loginAsAdmin: (token: string) => Promise<void>;  // RENAMED HERE
  logoutClient: () => void;
  logoutAdmin: () => void;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const getStoredToken = (key: string) => {
    return localStorage.getItem(key) || sessionStorage.getItem(key);
  };

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const adminToken = localStorage.getItem("admin_token");
        if (adminToken) {
          const res = await fetch("/admin/analytics", {
            headers: {
              "X-Admin-Token": adminToken,
              "Content-Type": "application/json",
            },
          });

          if (res.ok && isMounted) {
            setAdmin(true);
            return; // Admin validated, skip client validation
          } else {
            localStorage.removeItem("admin_token");
          }
        }

        // Validate client only if admin not logged in
        const clientToken = getStoredToken("whatsapp_token");
        if (clientToken) {
          const res = await fetch("/subscription/my_subscription", {
            headers: {
              Authorization: `Bearer ${clientToken}`,
              "Content-Type": "application/json",
            },
          });

          if (res.ok && isMounted) {
            const userData = JSON.parse(getStoredToken("whatsapp_user") || "{}");
            setUser({ ...userData, token: clientToken });
          } else {
            localStorage.removeItem("whatsapp_token");
            localStorage.removeItem("whatsapp_user");
            sessionStorage.removeItem("whatsapp_token");
            sessionStorage.removeItem("whatsapp_user");
          }
        }
      } catch (err) {
        console.error("Auth validation failed", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (username: string, password: string, remember: boolean) => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      const userData: User = {
        client_id: data.client_id,
        plan: data.plan,
        plan_expiry: data.plan_expiry,
        token: data.token,
        name: data.name,
      };

      const storage = remember ? localStorage : sessionStorage;
      storage.setItem("whatsapp_token", data.token);
      storage.setItem("whatsapp_user", JSON.stringify(userData));
      setUser(userData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // RENAMED AND CLEANED
  const loginAsAdmin = async (token: string) => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/admin/analytics", {
        headers: {
          "X-Admin-Token": token,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Invalid admin token");

      localStorage.setItem("admin_token", token);
      setAdmin(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Admin login failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logoutClient = () => {
    localStorage.removeItem("whatsapp_token");
    localStorage.removeItem("whatsapp_user");
    sessionStorage.removeItem("whatsapp_token");
    sessionStorage.removeItem("whatsapp_user");
    setUser(null);
    router.push("/");
  };

  const logoutAdmin = () => {
    localStorage.removeItem("admin_token");
    setAdmin(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        admin,
        login,
        loginAsAdmin, // EXPORTED HERE
        logoutClient,
        logoutAdmin,
        loading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
