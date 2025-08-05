"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Edit, Eye, CheckCircle, XCircle, Clock, AlertCircle, Filter, Search } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import TemplateCreator from "@/components/template-creator"
import TemplatePreview from "@/components/template-preview"

interface Template {
  id: string
  name: string
  status: "APPROVED" | "PENDING" | "REJECTED" | "PAUSED"
  category: "AUTHENTICATION" | "MARKETING" | "UTILITY"
  language: string
  components: any[]
}

export default function TemplateManager() {
  const { user } = useAuth()
  const [templates, setTemplates] = useState<Template[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [showCreator, setShowCreator] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchTemplates()

    // Set up periodic status updates every 30 seconds
    const interval = setInterval(() => {
      fetchTemplates()
    }, 30000)

    return () => clearInterval(interval)
  }, [user?.token])

  useEffect(() => {
    // Apply filters whenever templates or filter criteria change
    let filtered = templates

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((template) => template.status === statusFilter)
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((template) => template.category === categoryFilter)
    }

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter((template) => template.name.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    setFilteredTemplates(filtered)
  }, [templates, statusFilter, categoryFilter, searchQuery])

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/templates/status", {
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      const data = await response.json()
      setTemplates(data.templates || [])
    } catch (error) {
      console.error("Failed to fetch templates:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "REJECTED":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "PENDING":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "PAUSED":
        return <AlertCircle className="h-4 w-4 text-gray-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800"
      case "REJECTED":
        return "bg-red-100 text-red-800"
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "PAUSED":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "MARKETING":
        return "bg-blue-100 text-blue-800"
      case "UTILITY":
        return "bg-purple-100 text-purple-800"
      case "AUTHENTICATION":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const clearFilters = () => {
    setStatusFilter("all")
    setCategoryFilter("all")
    setSearchQuery("")
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Template Management</h2>
            <p className="text-gray-600">Create and manage your WhatsApp message templates</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-full"></div>
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
          <h2 className="text-2xl font-bold">Template Management</h2>
          <p className="text-gray-600">Create and manage your WhatsApp message templates</p>
        </div>
        <Button onClick={() => setShowCreator(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Template
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="PAUSED">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="MARKETING">Marketing</SelectItem>
                  <SelectItem value="UTILITY">Utility</SelectItem>
                  <SelectItem value="AUTHENTICATION">Authentication</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters} className="w-full bg-transparent">
                Clear Filters
              </Button>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
            <span>
              Showing {filteredTemplates.length} of {templates.length} templates
            </span>
            {(statusFilter !== "all" || categoryFilter !== "all" || searchQuery.trim()) && (
              <Badge variant="secondary">Filtered</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Plus className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              {templates.length === 0 ? "No templates yet" : "No templates match your filters"}
            </h3>
            <p className="text-gray-600 mb-4">
              {templates.length === 0
                ? "Create your first WhatsApp message template to get started"
                : "Try adjusting your filters or create a new template"}
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => setShowCreator(true)}>
                {templates.length === 0 ? "Create Your First Template" : "Create New Template"}
              </Button>
              {templates.length > 0 && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getStatusColor(template.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(template.status)}
                          {template.status}
                        </div>
                      </Badge>
                      <Badge variant="outline" className={getCategoryColor(template.category)}>
                        {template.category}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Language: {template.language}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedTemplate(template)
                        setShowPreview(true)
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {(template.status === "APPROVED" ||
                      template.status === "REJECTED" ||
                      template.status === "PAUSED") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedTemplate(template)
                          setShowCreator(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Template Creator Dialog */}
      <Dialog open={showCreator} onOpenChange={setShowCreator}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTemplate ? "Edit Template" : "Create New Template"}</DialogTitle>
            <DialogDescription>
              {selectedTemplate
                ? "Modify your existing WhatsApp message template"
                : "Create a new WhatsApp message template for your business"}
            </DialogDescription>
          </DialogHeader>
          <TemplateCreator
            template={selectedTemplate}
            onSuccess={() => {
              setShowCreator(false)
              setSelectedTemplate(null)
              fetchTemplates()
            }}
            onCancel={() => {
              setShowCreator(false)
              setSelectedTemplate(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Template Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>Preview how your template will appear to recipients</DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <TemplatePreview
              template={selectedTemplate}
              onClose={() => {
                setShowPreview(false)
                setSelectedTemplate(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
