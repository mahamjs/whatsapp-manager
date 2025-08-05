// components/AdminLoginForm.tsx
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";

export default function AdminLoginForm() {
  const [adminToken, setAdminToken] = useState("");
  const [loading, setLoading] = useState(false);
  const { loginAsAdmin } = useAuth();  // <-- You need this function in your auth context

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginAsAdmin(adminToken);  // Custom login function
    } catch (error) {
      console.error("Login failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleAdminLogin} className="max-w-md mx-auto mt-10 space-y-4 p-4 border rounded shadow">
      <div className="space-y-2">
        <Label htmlFor="admin-token">Admin Token</Label>
        <Input
          id="admin-token"
          type="password"
          value={adminToken}
          onChange={(e) => setAdminToken(e.target.value)}
          required
          placeholder="Enter admin token"
        />
        <p className="text-xs text-gray-500">Enter the admin token to access the admin panel</p>
      </div>
      <Button
        type="submit"
        className="w-full bg-red-600 hover:bg-red-700"
        disabled={loading || !adminToken}
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Signing in...
          </div>
        ) : (
          "Admin Sign In"
        )}
      </Button>
    </form>
  );
}
