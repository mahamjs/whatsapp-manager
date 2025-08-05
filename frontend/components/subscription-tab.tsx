"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CreditCard, DollarSign, FileText, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
// import { useToast } from "@/hooks/use-toast"

interface SubscriptionData {
  plan: string
  monthly_cap: number | null
  price_usd: string
  usage_count: number
  remaining: number | string
  plan_expiry: string
}

interface Plan {
  id: number
  name: string
  monthly_cap: number | null
  price_usd: string
  description: string
}

interface BillingRecord {
  period: string
  amount_usd: string
  messages: number
  generated_at: string
}

interface SubscriptionRequest {
  id: number
  type: string
  status: string
  details: string
  created_at: string
  completed_at: string | null
}

export default function SubscriptionTab() {
  const { user } = useAuth()
  // const { toast } = useToast()
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [billingHistory, setBillingHistory] = useState<BillingRecord[]>([])
  const [requests, setRequests] = useState<SubscriptionRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form states
  const [requestType, setRequestType] = useState<string>("")
  const [requestDetails, setRequestDetails] = useState("")
  const [selectedPlan, setSelectedPlan] = useState("")

  const formatDateSafe = (dateString: string) => {
    if (typeof window === "undefined") return "Loading..."
    return new Date(dateString).toLocaleDateString()
  }

  useEffect(() => {
    fetchData()
  }, [user?.token])

  const fetchData = async () => {
    try {
      const [subResponse, plansResponse, billingResponse, requestsResponse] = await Promise.all([
        fetch("/subscription/my_subscription", {
          headers: { Authorization: `Bearer ${user?.token}` },
        }),
        fetch("/subscription/plans"),
        fetch("/subscription/billing_history", {
          headers: { Authorization: `Bearer ${user?.token}` },
        }),
        fetch("/subscription/my_requests", {
          headers: { Authorization: `Bearer ${user?.token}` },
        }),
      ])

      const [subData, plansData, billingData, requestsData] = await Promise.all([
        subResponse.json(),
        plansResponse.json(),
        billingResponse.json(),
        requestsResponse.json(),
      ])

      setSubscription(subData)
      setPlans(plansData.plans || [])
      setBillingHistory(billingData.billing_records || [])
      setRequests(requestsData || [])
    } catch (error) {
      console.error("Failed to fetch subscription data:", error)
      // toast({
      //   title: "Error",
      //   description: "Failed to fetch subscription data",
      //   variant: "destructive",
      // })

      window.alert("Failed to fetch subscription data")
    } finally {
      setLoading(false)
    }
  }

  const submitRequest = async () => {
    if (!requestType) {
      // toast({
      //   title: "Error",
      //   description: "Please select a request type",
      //   variant: "destructive",
      // })
      window.alert("Please select a request type")
      return
    }

    setSubmitting(true)
    try {
      let details = requestDetails
      if (requestType === "change_plan" && selectedPlan) {
        details = `Change to ${selectedPlan}: ${requestDetails}`
      }

      const response = await fetch("/subscription/request", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user?.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: requestType,
          details: details,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // toast({
        //   title: "Success",
        //   description: "Request submitted successfully!",
        // })
        window.alert("Success, request submitted successfully!")
        setRequestType("")
        setRequestDetails("")
        setSelectedPlan("")
        fetchData()
      } 
    } catch (error) {
      window.alert("Failed to submit request")
      // toast({
      //   title: "Error",
      //   description: "Failed to submit request",
      //   variant: "destructive",
      // })
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const isExpiringSoon =
    subscription && new Date(subscription.plan_expiry) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const usagePercentage = subscription?.monthly_cap ? (subscription.usage_count / subscription.monthly_cap) * 100 : 0

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
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
          <h2 className="text-2xl font-bold">Subscription Management</h2>
          <p className="text-gray-600">Manage your plan, billing, and subscription requests</p>
        </div>
        <Button onClick={fetchData} variant="outline" className="flex items-center gap-2 bg-transparent">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Alerts */}
      {isExpiringSoon && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-orange-800">
            <span className="font-medium">Plan Expiring Soon!</span> Your plan expires on{" "}
            {formatDateSafe(subscription!.plan_expiry)}. Submit a renewal request to avoid service interruption.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Current Subscription */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Current Subscription
              </CardTitle>
              <CardDescription>Your active plan details and usage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2">Plan Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Plan:</span>
                      <Badge variant={isExpiringSoon ? "destructive" : "default"}>
                        {subscription?.plan || "No Plan"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Price:</span>
                      <span>{subscription?.price_usd || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monthly Limit:</span>
                      <span>{subscription?.monthly_cap || "Unlimited"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Expires:</span>
                      <span>{subscription?.plan_expiry ? formatDateSafe(subscription.plan_expiry) : "N/A"}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Usage This Month</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Used:</span>
                      <span>{subscription?.usage_count || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Remaining:</span>
                      <span>{subscription?.remaining}</span>
                    </div>
                    {subscription?.monthly_cap && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              usagePercentage > 80
                                ? "bg-red-500"
                                : usagePercentage > 60
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                            }`}
                            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{usagePercentage.toFixed(1)}% used</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Available Plans */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Available Plans
              </CardTitle>
              <CardDescription>Choose from our available subscription plans</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`border rounded-lg p-4 ${
                      subscription?.plan === plan.name ? "border-green-500 bg-green-50" : "border-gray-200"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{plan.name}</h4>
                      {subscription?.plan === plan.name && (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Current
                        </Badge>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-green-600 mb-2">{plan.price_usd}</p>
                    <p className="text-sm text-gray-600 mb-3">
                      {plan.monthly_cap ? `${plan.monthly_cap} messages/month` : "Unlimited messages"}
                    </p>
                    <p className="text-xs text-gray-500">{plan.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Billing History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Billing History
              </CardTitle>
              <CardDescription>Your past billing records and invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {billingHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No billing history yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {billingHistory.map((record, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium">{record.period}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{record.amount_usd}</p>
                          <p className="text-xs text-gray-500">{formatDateSafe(record.generated_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Request Management */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Submit Request</CardTitle>
              <CardDescription>Request changes to your subscription</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Request Type</Label>
                <Select value={requestType} onValueChange={setRequestType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select request type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="renew">Renew Subscription</SelectItem>
                    <SelectItem value="change_plan">Change Plan</SelectItem>
                    <SelectItem value="cancel">Cancel Subscription</SelectItem>
                    <SelectItem value="delete_account">Delete Account</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {requestType === "change_plan" && (
                <div className="space-y-2">
                  <Label>New Plan</Label>
                  <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select new plan..." />
                    </SelectTrigger>
                    <SelectContent>
                      {plans
                        .filter((plan) => plan.name !== subscription?.plan)
                        .map((plan) => (
                          <SelectItem key={plan.id} value={plan.name}>
                            {plan.name} - {plan.price_usd}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Details (Optional)</Label>
                <Textarea
                  value={requestDetails}
                  onChange={(e) => setRequestDetails(e.target.value)}
                  placeholder="Add any additional details or special requests..."
                  rows={3}
                />
              </div>

              <Button onClick={submitRequest} disabled={!requestType || submitting} className="w-full">
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  "Submit Request"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* My Requests */}
          <Card>
            <CardHeader>
              <CardTitle>My Requests</CardTitle>
              <CardDescription>Track your subscription requests</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {requests.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No requests yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {requests.map((request) => (
                      <div key={request.id} className="border rounded-lg p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(request.status)}
                            <span className="font-medium capitalize">{request.type.replace("_", " ")}</span>
                          </div>
                          <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                        </div>
                        {request.details && <p className="text-sm text-gray-600 mb-2">{request.details}</p>}
                        <div className="text-xs text-gray-500">
                          <p>Created: {formatDateSafe(request.created_at)}</p>
                          {request.completed_at && <p>Completed: {formatDateSafe(request.completed_at)}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
