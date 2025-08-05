"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MessageSquare, User, Shield, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"



export default function LoginForm() {
  const { login, loading, error } = useAuth()
  const [userForm, setUserForm] = useState({ username: "", password: "" })
  const [adminToken, setAdminToken] = useState("")
  const [activeTab, setActiveTab] = useState("user")
  const [rememberMe, setRememberMe] = useState(false)
  const router = useRouter()


  const handleUserLogin = async (e: React.FormEvent) => {
  e.preventDefault()
  try {
    await login(userForm.username, userForm.password, rememberMe)
  } catch (err) {
    // handled
  }
}

// const handleAdminLogin = async (e: React.FormEvent) => {
//   e.preventDefault()
//   try {
//     await adminLogin(adminToken)
//     router.push("/admin") // Redirect to admin page
//   } catch (err) {
//     // Error handled by auth context
//   }
// }


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-green-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">WhatsApp Manager</h2>
          <p className="mt-2 text-sm text-gray-600">Sign in to manage your WhatsApp templates and messages</p>
        </div>

        <Card className="mt-8">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Sign In</CardTitle>
            {/* <CardDescription className="text-center">Choose your login method</CardDescription> */}
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-1">
                <TabsTrigger value="user" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  User Login
                </TabsTrigger>
                {/* <TabsTrigger value="admin" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Admin Login
                </TabsTrigger> */}
              </TabsList>

              {error && (
                <Alert className="mt-4 border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              <TabsContent value="user" className="space-y-4 mt-4">
                <form onSubmit={handleUserLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      value={userForm.username}
                      onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                      required
                      className="w-full"
                      placeholder="Enter your username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      required
                      className="w-full"
                      placeholder="Enter your password"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="remember-me"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="remember-me" className="text-sm text-gray-600">Remember Me</Label>
                </div>
                  <Button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={loading || !userForm.username || !userForm.password}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Signing in...
                      </div>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* <TabsContent value="admin" className="space-y-4 mt-4">
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-token">Admin Token</Label>
                    <Input
                      id="admin-token"
                      type="password"
                      value={adminToken}
                      onChange={(e) => setAdminToken(e.target.value)}
                      required
                      className="w-full"
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
              </TabsContent> */}
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Secure WhatsApp template and message management system
            <br />
            Contact your administrator for access credentials
          </p>
        </div>
      </div>
    </div>
  )
}
