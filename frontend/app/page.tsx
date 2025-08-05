"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { MessageSquare, LogOut, BarChart3, FileText, Send, CreditCard } from "lucide-react"

import LoginForm from "@/components/login-form"
import Dashboard from "@/components/dashboard"
import TemplateManager from "@/components/template-manager"
import ConversationTab from "@/components/conversation-tab"
import SendMessageTab from "@/components/send-message-tab"
import SubscriptionTab from "@/components/subscription-tab"
import { AuthProvider, useAuth } from "@/contexts/auth-context"
// import ChangePasswordTab from "@/components/change-password-tab"


function AppContent() {
  const { user, logoutClient, loading } = useAuth()
  const [activeTab, setActiveTab] = useState("dashboard")

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-green-600" />
            <h1 className="text-xl font-bold text-green-600">WhatsApp Manager</h1>

          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
          Welcome, <span className="font-medium">{user.name}</span> 
            </div>
                        <div className="text-sm text-gray-600">
          Plan: <span className="font-medium">{user.plan}</span> 
            </div>
            <Button variant="outline" onClick={logoutClient} className="flex items-center gap-2 bg-transparent">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="conversations" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Conversations
            </TabsTrigger>
            <TabsTrigger value="send" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Send Messages
            </TabsTrigger>
            <TabsTrigger value="subscription" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Subscription
            </TabsTrigger>
            {/* <TabsTrigger value="password" className="flex items-center gap-2">
               <LogOut className="h-4 w-4" />
               Change Password
            </TabsTrigger> */}
          </TabsList>

          <TabsContent value="dashboard">
            <Dashboard />
          </TabsContent>

          <TabsContent value="templates">
            <TemplateManager />
          </TabsContent>

          <TabsContent value="conversations">
            <ConversationTab />
          </TabsContent>

          <TabsContent value="send">
            <SendMessageTab />
          </TabsContent>

          <TabsContent value="subscription">
            <SubscriptionTab />
          </TabsContent>

          {/* <TabsContent value="password">
  <ChangePasswordTab />
</TabsContent> */}




        </Tabs>
      </main>
    </div>
  )
}

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
