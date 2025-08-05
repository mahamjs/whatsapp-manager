"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Globe, Phone } from "lucide-react"

interface Template {
  name: string
  category: string
  language: string
  components: any[]
}

interface TemplatePreviewProps {
  template: Template
  onClose?: () => void
  hideParameterInputs?: boolean
}

export default function TemplatePreview({ template, onClose, hideParameterInputs = false }: TemplatePreviewProps) {
  const [parameters, setParameters] = useState<{ [key: string]: string }>({})

  const extractParameters = (text: string): string[] => {
    const matches = text.match(/\{\{(\d+)\}\}/g)
    return matches ? matches.map((match) => match.replace(/[{}]/g, "")) : []
  }

  const replaceParameters = (text: string): string => {
    return text.replace(/\{\{(\d+)\}\}/g, (match, paramNum) => {
      return parameters[paramNum] || `{{${paramNum}}}`
    })
  }

  const getAllParameters = (): string[] => {
    const allParams = new Set<string>()

    template.components.forEach((component) => {
      if (component.text) {
        extractParameters(component.text).forEach((param) => allParams.add(param))
      }
    })

    return Array.from(allParams).sort((a, b) => Number.parseInt(a) - Number.parseInt(b))
  }

  const allParams = getAllParameters()

  const renderButton = (button: any, index: number) => {
    const getButtonIcon = () => {
      switch (button.type) {
        case "URL":
          return <Globe className="h-3 w-3" />
        case "PHONE_NUMBER":
          return <Phone className="h-3 w-3" />
        default:
          return null
      }
    }

    const getButtonStyle = () => {
      switch (button.type) {
        case "URL":
          return "bg-blue-500 hover:bg-blue-600 text-white"
        case "PHONE_NUMBER":
          return "bg-green-500 hover:bg-green-600 text-white"
        default:
          return "bg-gray-100 hover:bg-gray-200 text-gray-800 border"
      }
    }

    return (
      <Button
        key={index}
        variant="outline"
        size="sm"
        className={`flex items-center gap-2 ${getButtonStyle()}`}
        disabled
      >
        {getButtonIcon()}
        {button.text}
      </Button>
    )
  }

  return (
    <div className="space-y-6">
      {/* Parameter Inputs - Only show if not hidden and there are parameters */}
      {!hideParameterInputs && allParams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Template Parameters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {allParams.map((param) => (
                <div key={param} className="space-y-2">
                  <Label htmlFor={`param-${param}`}>Parameter {param}</Label>
                  <Input
                    id={`param-${param}`}
                    value={parameters[param] || ""}
                    onChange={(e) => setParameters((prev) => ({ ...prev, [param]: e.target.value }))}
                    placeholder={`Enter value for {{${param}}}`}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Template Preview - Simplified Card Layout */}
      <Card className="max-w-md mx-auto">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline" className="text-xs">
              {template.category}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              WhatsApp Template
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Template Components */}
          {template.components.map((component, index) => {
            if (component.type === "HEADER") {
              if (component.format === "TEXT" && component.text) {
                return (
                  <div key={index} className="font-bold text-gray-900 text-lg">
                    {replaceParameters(component.text)}
                  </div>
                )
              } else if (component.format === "IMAGE") {
                return (
                  <div key={index} className="w-full h-32 bg-gray-200 rounded flex items-center justify-center">
                    <span className="text-gray-500 text-sm">Image Header</span>
                  </div>
                )
              } else if (component.format === "VIDEO") {
                return (
                  <div key={index} className="w-full h-32 bg-gray-200 rounded flex items-center justify-center">
                    <span className="text-gray-500 text-sm">Video Header</span>
                  </div>
                )
              }
            }

            if (component.type === "BODY" && component.text) {
              return (
                <div key={index} className="text-gray-800 text-sm leading-relaxed">
                  {replaceParameters(component.text)}
                </div>
              )
            }

            if (component.type === "FOOTER" && component.text) {
              return (
                <div key={index} className="text-gray-500 text-xs mt-2">
                  {component.text}
                </div>
              )
            }

            if (component.type === "BUTTONS" && component.buttons) {
              return (
                <div key={index} className="space-y-2 mt-3 pt-3 border-t">
                  {component.buttons.map((button: any, buttonIndex: number) => renderButton(button, buttonIndex))}
                </div>
              )
            }

            return null
          })}

          {/* Template Info */}
          <div className="mt-3 pt-2 border-t border-gray-100">
            <div className="text-xs text-gray-400">Template: {template.name}</div>
          </div>
        </CardContent>
      </Card>

      {onClose && (
        <div className="flex justify-end">
          <Button onClick={onClose}>Close Preview</Button>
        </div>
      )}
    </div>
  )
}
