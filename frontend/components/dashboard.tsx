"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts"
import { MessageSquare, Send, TrendingUp, Percent, Inbox } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { CircularProgressbar, buildStyles } from "react-circular-progressbar"
import "react-circular-progressbar/dist/styles.css"

interface UsageData {
  hour: string
  count: number
}

interface DashboardData {
  usage: UsageData[]
  summary: {
    sent: number
    received: number
    total: number
    percent_sent: number
  }
}

export default function Dashboard() {
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/dashboard/usage", {
          headers: { Authorization: `Bearer ${user?.token}` },
        })
        const data = await res.json()
        setDashboardData(data)
      } catch (err) {
        console.error("Failed to load dashboard data", err)
      } finally {
        setLoading(false)
      }
    }

    if (user?.token) fetchData()
  }, [user?.token])

  if (loading) {
    return (
      <div className="text-center text-sm text-muted-foreground">Loading dashboard...</div>
    )
  }

  const summary = dashboardData?.summary || { sent: 0, received: 0, total: 0, percent_sent: 0 }
  const responseRate = summary.sent > 0 ? ((summary.received / summary.sent) * 100).toFixed(1) : "0"

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex items-center justify-between pb-1">
            <CardTitle className="text-sm font-medium">Sent</CardTitle>
            <Send className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.sent}</div>
            <p className="text-xs text-muted-foreground">Messages sent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between pb-1">
            <CardTitle className="text-sm font-medium">Received</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.received}</div>
            <p className="text-xs text-muted-foreground">Messages received</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between pb-1">
            <CardTitle className="text-sm font-medium">Total Activity</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total}</div>
            <p className="text-xs text-muted-foreground">Combined messages</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between pb-1">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <Percent className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{responseRate}%</div>
            <p className="text-xs text-muted-foreground">Replies per sent</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Charts */}
      <div className="grid gap-6 sm:grid-cols-2">
        <Card className="flex items-center justify-center p-6">
          <div className="w-36">
            <CircularProgressbar
              value={summary.percent_sent}
              text={`${summary.percent_sent}%`}
              styles={buildStyles({
                pathColor: "#22c55e",
                textColor: "#16a34a",
                trailColor: "#e5e7eb",
              })}
            />
          </div>
          <div className="ml-6">
            <h4 className="text-sm font-semibold">Delivery Ratio</h4>
            <p className="text-sm text-muted-foreground">
              % of all messages that were sent
            </p>
          </div>
        </Card>

        <Card className="flex items-center justify-center p-6">
          <div className="w-36">
            <CircularProgressbar
              value={parseFloat(responseRate)}
              text={`${responseRate}%`}
              styles={buildStyles({
                pathColor: "#0ea5e9",
                textColor: "#0284c7",
                trailColor: "#e5e7eb",
              })}
            />
          </div>
          <div className="ml-6">
            <h4 className="text-sm font-semibold">Response Rate</h4>
            <p className="text-sm text-muted-foreground">
              Replies compared to messages sent
            </p>
          </div>
        </Card>
      </div>

      {/* Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>24-Hour Sent Activity</CardTitle>
          <CardDescription>Hourly breakdown of sent messages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardData?.usage || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#16a34a">
                  <LabelList dataKey="count" position="top" fontSize={10} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
