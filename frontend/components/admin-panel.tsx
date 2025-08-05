"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Users, Plus, Settings, BarChart3, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
// import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation" // ✅ Import



interface Client {
  id: number
  username: string
  plan: string | null
  auto_renew: boolean
  is_active: boolean
  created_at: string
  expiry: string | null
}

interface Plan {
  id: number
  name: string
  monthly_cap: number | null
  price_usd: string
  description: string
}

interface Analytics {
  total_clients: number
  active_clients: number
  expired_clients: number
}

interface SubscriptionRequest {
  id: number
  client_id: number
  client_username: string
  type: string
  status: string
  details: string
  created_at: string
  completed_at: string | null
}

export default function AdminPanel() {
  const [clients, setClients] = useState<Client[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [requests, setRequests] = useState<SubscriptionRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showOnboardDialog, setShowOnboardDialog] = useState(false)
  const [showPlanDialog, setShowPlanDialog] = useState(false)
  // const { logoutAdmin } = useAuth()
  const router = useRouter() // ✅ Get router
  // const [templateToDelete, setTemplateToDelete] = useState("");
  const [templates, setTemplates] = useState<{ name: string; status: string }[]>([]); // Add state for templates
  const [deletingTemplate, setDeletingTemplate] = useState<string | null>(null);

  // Form states
  const [onboardForm, setOnboardForm] = useState({
    name: "",
    username: "",
    password: "",
    plan: "Starter",
    valid_days: "30",
  })

  const [planForm, setPlanForm] = useState({
    name: "",
    monthly_cap: "",
    price_cents: "",
    description: "",
  })

  const fetchTemplates = async () => {
  const adminToken = localStorage.getItem("admin_token");
  if (!adminToken) return;

  try {
    const response = await fetch("/templates/status", {
      headers: {
        "X-Admin-Token": adminToken,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      setTemplates(data.templates || []);
    } else {
      console.error("Failed to fetch templates");
    }
  } catch (error) {
    console.error("Error fetching templates:", error);
  }
};

  useEffect(() => {
    fetchData()
    fetchTemplates(); // Add this

  }, [])

  const fetchData = async () => {
    const adminToken = localStorage.getItem("admin_token")
    if (!adminToken) return

    try {
      const [clientsRes, plansRes, analyticsRes, requestsRes] = await Promise.all([
        fetch("/admin/clients", {
          headers: { "X-Admin-Token": adminToken },
        }),
        fetch("/subscription/plans"),
        fetch("/admin/analytics", {
          headers: { "X-Admin-Token": adminToken },
        }),
        fetch("/admin/subscription_requests", {
          headers: { "X-Admin-Token": adminToken },
        }),
      ])

      const [clientsData, plansData, analyticsData, requestsData] = await Promise.all([
        clientsRes.json(),
        plansRes.json(),
        analyticsRes.json(),
        requestsRes.json(),
      ])

      setClients(clientsData)
      setPlans(plansData.plans || [])
      setAnalytics(analyticsData)
      setRequests(requestsData)
    } catch (error) {
      console.error("Failed to fetch admin data:", error)
    } finally {
      setLoading(false)
    }
  }
  // const handleLogout = () => {
  //   logout()
  //   router.push("/") // ✅ Redirect to client login
  // }

  const handleOnboardClient = async () => {
    const adminToken = localStorage.getItem("admin_token")
    if (!adminToken) return

    try {
      const response = await fetch("/admin/onboard", {
        method: "POST",
        headers: {
          "X-Admin-Token": adminToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(onboardForm),
      })

      if (response.ok) {
        alert("Client onboarded successfully!")
        setShowOnboardDialog(false)
        setOnboardForm({ name: "", username: "", password: "", plan: "Starter", valid_days: "30" })
        fetchData()
      } else {
        const error = await response.json()
        alert(`Failed to onboard client: ${error.error}`)
      }
    } catch (error) {
      console.error("Failed to onboard client:", error)
      alert("Failed to onboard client")
    }
  }

  const handleCreatePlan = async () => {
    const adminToken = localStorage.getItem("admin_token")
    if (!adminToken) return

    try {
      const response = await fetch("/admin/plans", {
        method: "POST",
        headers: {
          "X-Admin-Token": adminToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...planForm,
          monthly_cap: planForm.monthly_cap ? Number.parseInt(planForm.monthly_cap) : null,
          price_cents: Number.parseInt(planForm.price_cents),
        }),
      })

      if (response.ok) {
        alert("Plan created successfully!")
        setShowPlanDialog(false)
        setPlanForm({ name: "", monthly_cap: "", price_cents: "", description: "" })
        fetchData()
      } else {
        const error = await response.json()
        alert(`Failed to create plan: ${error.error}`)
      }
    } catch (error) {
      console.error("Failed to create plan:", error)
      alert("Failed to create plan")
    }
  }

  const handleProcessRequest = async (requestId: number) => {
    const adminToken = localStorage.getItem("admin_token")
    if (!adminToken) return

    try {
      const response = await fetch(`/admin/process_request/${requestId}`, {
        method: "POST",
        headers: {
          "X-Admin-Token": adminToken,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        alert("Request processed successfully!")
        fetchData()
      } else {
        const error = await response.json()
        alert(`Failed to process request: ${error.error}`)
      }
    } catch (error) {
      console.error("Failed to process request:", error)
      alert("Failed to process request")
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      default:
        return <XCircle className="h-4 w-4 text-red-600" />
    }
  }

  const formatDateSafe = (dateString: string) => {
    if (typeof window === "undefined") return "Loading..."
    return new Date(dateString).toLocaleDateString()
  }



const handleDeleteTemplate = async (templateName: string) => {
  if (!templateName) {
    alert("Please enter a template name.");
    return;
  }

  const adminToken = localStorage.getItem("admin_token");
  if (!adminToken) {
    alert("Admin token not found.");
    return;
  }

  const confirmDelete = confirm(`Are you sure you want to delete template "${templateName}"?`);
  if (!confirmDelete) return;

  setDeletingTemplate(templateName); // Start loading state

  try {
    const response = await fetch(`/templates?name=${encodeURIComponent(templateName)}`, {
      method: "DELETE",
      headers: {
        "X-Admin-Token": adminToken,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      alert(`Template "${templateName}" deleted successfully!`);

      // Option 1: Optimistic UI update
      setTemplates((prev) => prev.filter((tpl) => tpl.name !== templateName));

      // Option 2: Re-fetch from server
      // await fetchTemplates();
    } else {
      const error = await response.json();
      alert(`Failed to delete template: ${error.error || JSON.stringify(error)}`);
    }
  } catch (error) {
    console.error("Error deleting template:", error);
    alert("Error occurred while deleting template.");
  } finally {
    setDeletingTemplate(null); // End loading state
  }
};



  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          {/* <h2 className="text-2xl font-bold text-red-600">Admin Panel</h2> */}
          <p className="text-gray-600">Manage clients, plans, and system settings</p>
        </div>
        <div className="flex gap-2">

            {/* <Button
    variant="outline"
    onClick={logoutAdmin}
    className="bg-transparent border-red-600 text-red-600 hover:bg-red-50 flex items-center gap-2"
  >
    <LogOut className="h-4 w-4" />
    Return to Client Login
  </Button> */}

          <Dialog open={showOnboardDialog} onOpenChange={setShowOnboardDialog}>
            <DialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700">
                <Plus className="h-4 w-4 mr-2" />
                Onboard Client
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Onboard New Client</DialogTitle>
                <DialogDescription>Create a new client account with plan assignment</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={onboardForm.name}
                      onChange={(e) => setOnboardForm({ ...onboardForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={onboardForm.username}
                      onChange={(e) => setOnboardForm({ ...onboardForm, username: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={onboardForm.password}
                    onChange={(e) => setOnboardForm({ ...onboardForm, password: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="plan">Plan</Label>
                    <Select
                      value={onboardForm.plan}
                      onValueChange={(value) => setOnboardForm({ ...onboardForm, plan: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {plans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.name}>
                            {plan.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="valid_days">Valid Days</Label>
                    <Input
                      id="valid_days"
                      type="number"
                      value={onboardForm.valid_days}
                      onChange={(e) => setOnboardForm({ ...onboardForm, valid_days: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={handleOnboardClient} className="w-full bg-red-600 hover:bg-red-700">
                  Create Client
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-red-600 text-red-600 hover:bg-red-50 bg-transparent">
                <Settings className="h-4 w-4 mr-2" />
                Create Plan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Plan</DialogTitle>
                <DialogDescription>Add a new subscription plan</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="plan-name">Plan Name</Label>
                  <Input
                    id="plan-name"
                    value={planForm.name}
                    onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="monthly-cap">Monthly Cap</Label>
                    <Input
                      id="monthly-cap"
                      type="number"
                      placeholder="Leave empty for unlimited"
                      value={planForm.monthly_cap}
                      onChange={(e) => setPlanForm({ ...planForm, monthly_cap: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="price-cents">Price (dollars)</Label>
                    <Input
                      id="price-cents"
                      type="number"
                      value={planForm.price_cents}
                      onChange={(e) => setPlanForm({ ...planForm, price_cents: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={planForm.description}
                    onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  />
                </div>
                <Button onClick={handleCreatePlan} className="w-full bg-red-600 hover:bg-red-700">
                  Create Plan
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.total_clients || 0}</div>
            <p className="text-xs text-muted-foreground">All registered clients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{analytics?.active_clients || 0}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>


        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired Clients</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{analytics?.expired_clients || 0}</div>
            <p className="text-xs text-muted-foreground">Plans expired</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Plans</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plans.length}</div>
            <p className="text-xs text-muted-foreground">Subscription plans</p>
          </CardContent>
        </Card>
      </div>
      
      <div>

        <Card>
  <CardHeader>
    <CardTitle>WhatsApp Templates</CardTitle>
    <CardDescription>Manage WhatsApp message templates</CardDescription>
  </CardHeader>
  <CardContent>
    <ScrollArea className="h-[300px] space-y-2">
      {templates.map((tpl) => (
        <div
          key={tpl.name}
          className="flex items-center justify-between p-4 border rounded-lg"
        >
          <div>
            <p className="font-medium">{tpl.name}</p>
            <p className="text-sm text-gray-600">Status: {tpl.status}</p>
          </div>
<Button
  onClick={() => handleDeleteTemplate(tpl.name)}
  className="bg-red-600 hover:bg-red-700"
  disabled={deletingTemplate === tpl.name}
>
  {deletingTemplate === tpl.name ? "Deleting..." : "Delete"}
</Button>

        </div>
      ))}
    </ScrollArea>
  </CardContent>
</Card>

      </div>
      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Client Management</CardTitle>
          <CardDescription>View and manage all clients</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {clients.map((client) => (
                <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium">{client.username}</p>
                      <p className="text-sm text-gray-600">ID: {client.id}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={client.is_active ? "default" : "secondary"}>
                        {client.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline">{client.plan || "No Plan"}</Badge>
                      {client.auto_renew && <Badge variant="outline">Auto-Renew</Badge>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">Created: {formatDateSafe(client.created_at)}</p>
                    {client.expiry && <p className="text-sm">Expires: {formatDateSafe(client.expiry)}</p>}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Subscription Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Requests</CardTitle>
          <CardDescription>Process client subscription requests</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {requests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(request.status)}
                    <div>
                      <p className="font-medium">{request.client_username}</p>
                      <p className="text-sm text-gray-600">
                        {request.type} - {request.details}
                      </p>
                      <p className="text-xs text-gray-500">{formatDateSafe(request.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={request.status === "pending" ? "default" : "secondary"}>{request.status}</Badge>
                    {request.status === "pending" && (
                      <Button
                        size="sm"
                        onClick={() => handleProcessRequest(request.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Process
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
