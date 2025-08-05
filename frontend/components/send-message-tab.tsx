"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Users, AlertCircle, Plus, Trash2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import TemplatePreview from "@/components/template-preview"
// import { useToast } from "@/hooks/use-toast"

interface Template {
  id: string
  name: string
  status: string
  category: string
  language: string
  components: any[]
}

interface TierInfo {
  tier: string
  limit: number
}

interface Recipient {
  phone_number: string
  selected: boolean
}

export default function SendMessageTab() {
  const { user } = useAuth()
  // const { toast } = useToast()
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [messageType, setMessageType] = useState<"template" | "text">("template")
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [newRecipient, setNewRecipient] = useState("")
  const [textMessage, setTextMessage] = useState("")
  const [parameters, setParameters] = useState<{ [key: string]: string }>({})
  const [tierInfo, setTierInfo] = useState<TierInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchTemplates()
    fetchRecipients()
    fetchTierInfo()
  }, [user?.token])

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/templates/status", {
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      const data = await response.json()
      const approvedTemplates = (data.templates || []).filter((t: Template) => t.status === "APPROVED")
      setTemplates(approvedTemplates)
    } catch (error) {
      console.error("Failed to fetch templates:", error)
    }
  }

  const fetchRecipients = async () => {
    try {
      const response = await fetch("/messages/recipient_numbers", {
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      const data = await response.json()
      const recipientList = (data.registered_numbers || []).map((phone: string) => ({
        phone_number: phone,
        selected: false,
      }))
      setRecipients(recipientList)
    } catch (error) {
      console.error("Failed to fetch recipients:", error)
    }
  }

  const fetchTierInfo = async () => {
    try {
      const response = await fetch("/messages/whatsapp_tier", {
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      const data = await response.json()
      setTierInfo(data)
    } catch (error) {
      console.error("Failed to fetch tier info:", error)
    }
  }

  const extractParameters = (text: string): string[] => {
    const matches = text.match(/\{\{(\d+)\}\}/g)
    return matches ? matches.map((match) => match.replace(/[{}]/g, "")) : []
  }

  const getAllTemplateParameters = (): string[] => {
    if (!selectedTemplate) return []

    const allParams = new Set<string>()
    selectedTemplate.components.forEach((component) => {
      if (component.text) {
        extractParameters(component.text).forEach((param) => allParams.add(param))
      }
    })

    return Array.from(allParams).sort((a, b) => Number.parseInt(a) - Number.parseInt(b))
  }

  // const addRecipient = () => {
  //   if (!newRecipient.trim()) return

  //   const phone = newRecipient.trim()
  //   if (recipients.some((r) => r.phone_number === phone)) {
  //   window.alert("Recipient already exists")

  //     return
  //   }

  //   setRecipients((prev) => [...prev, { phone_number: phone, selected: true }])
  //   setNewRecipient("")
  // }


  const addRecipient = () => {
  if (!newRecipient.trim()) return

  const rawInput = newRecipient.trim()

  // Split input by commas, spaces, or new lines
  const phoneNumbers = rawInput
    .split(/[\s,]+/)
    .map((phone) => phone.trim())
    .filter((phone) => phone.length > 0)

  const invalidNumbers: string[] = []
  const duplicates: string[] = []
  const validNewRecipients: Recipient[] = []

  phoneNumbers.forEach((phone) => {
    // Check if phone contains only digits and is 10 to 15 digits long
    if (!/^\d{10,15}$/.test(phone)) {
      invalidNumbers.push(phone)
    } else if (recipients.some((r) => r.phone_number === phone)) {
      duplicates.push(phone)
    } else {
      validNewRecipients.push({ phone_number: phone, selected: true })
    }
  })

  // Show alerts for invalid or duplicate numbers
  if (invalidNumbers.length > 0) {
    window.alert(`Invalid phone number(s): ${invalidNumbers.join(", ")}. Phone numbers must be 10-15 digits and contain only numbers.`)
  }

  if (duplicates.length > 0) {
    window.alert(`Duplicate phone number(s): ${duplicates.join(", ")} already exist.`)
  }

  if (validNewRecipients.length > 0) {
    setRecipients((prev) => [...prev, ...validNewRecipients])
    setNewRecipient("")
  }
}

  const toggleRecipient = (phone: string) => {
    setRecipients((prev) => prev.map((r) => (r.phone_number === phone ? { ...r, selected: !r.selected } : r)))
  }

  const removeRecipient = (phone: string) => {
    setRecipients((prev) => prev.filter((r) => r.phone_number !== phone))
  }

  const selectAllRecipients = () => {
    setRecipients((prev) => prev.map((r) => ({ ...r, selected: true })))
  }

  const deselectAllRecipients = () => {
    setRecipients((prev) => prev.map((r) => ({ ...r, selected: false })))
  }

  const getSelectedRecipients = () => {
    return recipients.filter((r) => r.selected)
  }

  // Check if text messages can be sent to selected recipients
  const checkTextMessageCapability = async (phoneNumbers: string[]): Promise<string[]> => {
    const validNumbers: string[] = []

    for (const phone of phoneNumbers) {
      try {
        const response = await fetch(`/messages/log?direction=inbound&recipient=${phone}`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        })
        const data = await response.json()

        if (data.messages && data.messages.length > 0) {
          const lastInbound = new Date(data.messages[0].sent_at)
          const now = new Date()
          const hoursDiff = (now.getTime() - lastInbound.getTime()) / (1000 * 60 * 60)

          if (hoursDiff < 24) {
            validNumbers.push(phone)
          }
        }
      } catch (error) {
        console.error(`Failed to check capability for ${phone}:`, error)
      }
    }

    return validNumbers
  }

const sendMessage = async () => {
  const selectedRecipients = getSelectedRecipients()
  // if (selectedRecipients.length === 0) {
  //   window.alert("Error: Please select at least one recipient.")
  //   return
  // }

  // if (messageType === "template" && !selectedTemplate) {
  //   window.alert("Error: Please select a template.")
  //   return
  // }

  // if (messageType === "text" && !textMessage.trim()) {
  //   window.alert("Error: Please enter a message.")
  //   return
  // }

  if (messageType === "text") {
    const phoneNumbers = selectedRecipients.map((r) => r.phone_number)
    const validNumbers = await checkTextMessageCapability(phoneNumbers)
    if (validNumbers.length === 0) {
      window.alert("Cannot Send Text Message: None of the selected recipients have sent you a message in the last 24 hours. Text messages can only be sent within this window.")
      return
    }
    if (validNumbers.length < phoneNumbers.length) {
      const invalidCount = phoneNumbers.length - validNumbers.length
      window.alert(`Partial Send Available: ${invalidCount} recipient(s) cannot receive text messages. Only ${validNumbers.length} recipient(s) will receive the message.`)
      return
    }
  }

  if (messageType === "template") {
    const requiredParams = getAllTemplateParameters()
    const missingParams = requiredParams.filter((param) => !parameters[param]?.trim())
    if (missingParams.length > 0) {
      window.alert(`Error: Please fill in all parameters: ${missingParams.join(", ")}`)
      return
    }
  }

  setSending(true)
  try {
    const payload: any = {
      to: selectedRecipients.map((r) => r.phone_number),
      type: messageType,
    }

    if (messageType === "template") {
      payload.name = selectedTemplate!.name
      payload.language = selectedTemplate!.language
      const components = []
      const allParams = getAllTemplateParameters()

      const headerComponent = selectedTemplate!.components.find((c) => c.type === "HEADER" && c.text)
      const bodyComponent = selectedTemplate!.components.find((c) => c.type === "BODY" && c.text)

      if (headerComponent) {
        const headerParams = extractParameters(headerComponent.text)
        if (headerParams.length > 0) {
          components.push({
            type: "header",
            parameters: headerParams.map((param) => ({ type: "text", text: parameters[param] })),
          })
        }
      }

      if (bodyComponent) {
        const bodyParams = extractParameters(bodyComponent.text)
        if (bodyParams.length > 0) {
          components.push({
            type: "body",
            parameters: bodyParams.map((param) => ({ type: "text", text: parameters[param] })),
          })
        }
      }

      if (components.length > 0) {
        payload.components = components
      }
    } else {
      payload.text = textMessage
    }

    const response = await fetch("/messages/send_message", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${user?.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()
    if (response.ok || response.status === 207) {
      const successCount = data.results?.length || 0
      const errorCount = data.errors?.length || 0

      if (successCount > 0 && errorCount === 0) {
        window.alert(`Message sent successfully to ${successCount} recipient${successCount !== 1 ? "s" : ""}`)
      } else if (successCount > 0 && errorCount > 0) {
        const errorMessages = data.errors.map((error: any) => `${error.recipient}: ${error.response}`).join("\n")
        window.alert(`Partial Success:\n${successCount} sent, ${errorCount} failed:\n${errorMessages}`)
      } else if (errorCount > 0) {
        const errorMessages = data.errors.map((error: any) => `${error.recipient}: ${error.response}`).join("\n")
        window.alert(`Message Send Failed:\nAll messages failed:\n${errorMessages}`)
      }

      if (successCount > 0) {
        if (messageType === "text") {
          setTextMessage("")
        } else {
          setParameters({})
        }
        deselectAllRecipients()
      }
    } else {
      let errorMessage = "Failed to send message"
      if (data && data.error) {
        if (typeof data.error === "string") {
          errorMessage = data.error
        } else if (typeof data.error === "object" && data.error.message) {
          errorMessage = data.error.message
        }
      }
      window.alert(`Message Send Failed: ${errorMessage}`)
    }
  } catch (error) {
    console.error("Failed to send message:", error)
    window.alert("Network error occurred while sending message")
  } finally {
    setSending(false)
  }
}


  const selectedRecipientsCount = getSelectedRecipients().length
  const templateParams = getAllTemplateParameters()

  return (
    <div className="space-y-6">
    {/* <h1>What is happening</h1> */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Send Messages</h2>
          <p className="text-gray-600">Send WhatsApp messages to your contacts</p>
        </div>
        {tierInfo && (
          <Badge variant="outline" className="text-sm">
            Tier: {tierInfo.tier} • Limit: {tierInfo.limit} unique recipients/24h
          </Badge>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Message Composition */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compose Message</CardTitle>
              <CardDescription>Choose message type and content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={messageType} onValueChange={(value: any) => setMessageType(value)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="template">Template Message</TabsTrigger>
                  <TabsTrigger value="text">Text Message</TabsTrigger>
                </TabsList>

                <TabsContent value="template" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Template</Label>
                    <Select
                      value={selectedTemplate?.name || ""}
                      onValueChange={(value) => {
                        const template = templates.find((t) => t.name === value)
                        setSelectedTemplate(template || null)
                        setParameters({}) // Reset parameters when template changes
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a template..." />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.name}>
                            <div className="flex items-center gap-2">
                              <span>{template.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {template.category}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedTemplate && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{selectedTemplate.category}</Badge>
                        <Badge variant="secondary">{selectedTemplate.language}</Badge>
                      </div>

                      {/* Template Parameters - Only show once */}
                      {templateParams.length > 0 && (
                        <div className="space-y-3">
                          <Label>Template Parameters</Label>
                          <div className="grid gap-3 md:grid-cols-2">
                            {templateParams.map((param) => (
                              <div key={param} className="space-y-1">
                                <Label htmlFor={`param-${param}`} className="text-sm">
                                  Parameter {param}
                                </Label>
                                <Input
                                  id={`param-${param}`}
                                  value={parameters[param] || ""}
                                  onChange={(e) =>
                                    setParameters((prev) => ({
                                      ...prev,
                                      [param]: e.target.value,
                                    }))
                                  }
                                  placeholder={`Value for {{${param}}}`}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Inline Template Preview - Only show parameters in preview, not ask for them again */}
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <h4 className="font-medium mb-3">Template Preview</h4>
                        <TemplatePreview
                          template={{
                            ...selectedTemplate,
                            components: selectedTemplate.components.map((comp) => ({
                              ...comp,
                              text: comp.text
                                ? comp.text.replace(/\{\{(\d+)\}\}/g, (match: string, paramNum: string) => {
                                    return parameters[paramNum] || match
                                  })
                                : comp.text,
                            })),
                          }}
                          hideParameterInputs={true}
                        />
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="text" className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Text messages can only be sent to contacts who have messaged you within the last 24 hours.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label htmlFor="text-message">Message Text</Label>
                    <Textarea
                      id="text-message"
                      value={textMessage}
                      onChange={(e) => setTextMessage(e.target.value)}
                      placeholder="Enter your message..."
                      rows={4}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Send Button */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    Ready to send to {selectedRecipientsCount} recipient{selectedRecipientsCount !== 1 ? "s" : ""}
                  </p>
                  <p className="text-sm text-gray-600">
                    {messageType === "template" ? "Template message" : "Text message"}
                  </p>
                </div>
                <Button
                  onClick={sendMessage}
                  disabled={sending || selectedRecipientsCount === 0}
                  className="flex items-center gap-2"
                >
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Message
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recipients */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Recipients
              </CardTitle>
              <CardDescription>Select contacts to send messages to OR add new recipients</CardDescription>
             
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add New Recipient */}
              <div className="flex gap-2">
                <Input
                  value={newRecipient}
                  onChange={(e) => setNewRecipient(e.target.value)}
                  placeholder="923003000000, 923004000000..."
                  onKeyPress={(e) => e.key === "Enter" && addRecipient()}
                />
                <Button onClick={addRecipient} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Bulk Actions */}
              {recipients.length > 0 && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllRecipients}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={deselectAllRecipients}>
                    Deselect All
                  </Button>
                </div>
              )}

              {/* Recipients List */}
              <ScrollArea className="h-[300px]">
                {recipients.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No recipients yet</p>
                    <p className="text-sm">Add phone numbers to get started</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recipients.map((recipient) => (
                      <div
                        key={recipient.phone_number}
                        className="flex items-center gap-3 p-2 rounded border hover:bg-gray-50"
                      >
                        <Checkbox
                          checked={recipient.selected}
                          onCheckedChange={() => toggleRecipient(recipient.phone_number)}
                        />
                        <span className="flex-1 text-sm font-mono">{recipient.phone_number}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRecipient(recipient.phone_number)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {selectedRecipientsCount > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-gray-600">
                    {selectedRecipientsCount} of {recipients.length} selected
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
