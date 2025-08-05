"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface TemplateComponent {
  type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS"
  format?: "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT"
  text?: string
}

interface Template {
  name: string
  category: string
  language: string
  components: TemplateComponent[]
}

export interface GeneralTemplateFormProps {
  initialTemplate?: Template | null
  onSubmit: (template: Template) => void
  onCancel: () => void
}

export default function GeneralTemplateForm({ initialTemplate, onSubmit, onCancel }: GeneralTemplateFormProps) {
  const [formData, setFormData] = useState<Template>({
    name: "",
    category: "MARKETING",
    language: "en_US",
    components: [],
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initialTemplate) {
      setFormData(initialTemplate)
    }
  }, [initialTemplate])

  const handleChange = (field: keyof Template, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const validate = (): string | null => {
    if (!formData.name.trim()) return "Template name is required"
    if (formData.name.length > 512) return "Template name must be 512 characters or less"
    return null
  }

  const handleSubmit = () => {
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    onSubmit(formData)
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>Basic Information</CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Template Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="e.g., order_confirmation"
            />
            <p className="text-xs text-gray-500">
              Use lowercase letters, numbers, and underscores only. Max 512 characters.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MARKETING">Marketing</SelectItem>
                <SelectItem value="UTILITY">Utility</SelectItem>
                <SelectItem value="AUTHENTICATION">Authentication</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Language *</Label>
            <Select value={formData.language} onValueChange={(value) => handleChange("language", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en_US">English (US)</SelectItem>
                <SelectItem value="es_ES">Spanish (Spain)</SelectItem>
                <SelectItem value="fr_FR">French (France)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit}>Submit</Button>
      </div>
    </div>
  )
}