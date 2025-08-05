"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MessageSquare, Send, Clock, CheckCircle, User, Bot } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface Conversation {
  phone_number: string
  last_message: string
  last_message_time: string | null
  can_send_text: boolean
}

interface Message {
  id: number
  text: string
  content: string | null
  timestamp: string
  status: string
  direction: "inbound" | "outbound"
}

export default function ConversationTab() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)

  // Add these helper functions at the top of the component
  const formatTimeSafe = (timestamp: string) => {
    if (typeof window === "undefined") return ""
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDateSafe = (timestamp: string) => {
    if (typeof window === "undefined") return ""
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "Today"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday"
    } else {
      return date.toLocaleDateString()
    }
  }

  useEffect(() => {
    fetchConversations()
  }, [user?.token])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation)
    }
  }, [selectedConversation])

  const checkCanSendText = async (phoneNumber: string): Promise<boolean> => {
    try {
      // Check if there's an inbound message from this number in the last 24 hours
      const response = await fetch(`/messages/log?direction=inbound&recipient=${phoneNumber}`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      const data = await response.json()

      if (data.messages && data.messages.length > 0) {
        const lastInbound = new Date(data.messages[0].sent_at)
        const now = new Date()
        const hoursDiff = (now.getTime() - lastInbound.getTime()) / (1000 * 60 * 60)
        return hoursDiff < 24
      }

      return false
    } catch (error) {
      console.error("Failed to check text capability:", error)
      return false
    }
  }

  const fetchConversations = async () => {
    try {
      const response = await fetch("/conversations", {
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      const phoneNumbers = await response.json()

      // Fetch additional info for each conversation
      const conversationPromises = phoneNumbers.map(async (phone: string) => {
        const canSendText = await checkCanSendText(phone)

        const canSendResponse = await fetch(`/conversation/${phone}/can_send_text`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        })
        const canSendData = await canSendResponse.json()

        return {
          phone_number: phone,
          last_message: canSendData.last_message || "No messages yet",
          last_message_time: canSendData.last_message_time,
          can_send_text: canSendText,
        }
      })

      const conversationsData = await Promise.all(conversationPromises)
      setConversations(conversationsData)
    } catch (error) {
      console.error("Failed to fetch conversations:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (phoneNumber: string) => {
    try {
      const response = await fetch(`/conversation/${phoneNumber}/messages`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      const data = await response.json()
      setMessages(data.messages || [])
    } catch (error) {
      console.error("Failed to fetch messages:", error)
    }
  }

  const sendTextMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sendingMessage) return

    setSendingMessage(true)
    try {
      const response = await fetch("/messages/send_message", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user?.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: [selectedConversation],
          type: "text",
          text: newMessage,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setNewMessage("")
        await fetchMessages(selectedConversation)
        await fetchConversations()
      } else {
        alert(data.error || "Failed to send message")
      }
    } catch (error) {
      console.error("Failed to send message:", error)
      alert("Failed to send message")
    } finally {
      setSendingMessage(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-12 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-3 h-[600px]">
      {/* Conversations List */}
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Conversations
          </CardTitle>
          <CardDescription>
            {conversations.length} active conversation{conversations.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No conversations yet</p>
                <p className="text-sm">Start messaging to see conversations here</p>
              </div>
            ) : (
              <div className="space-y-1">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.phone_number}
                    className={`p-4 cursor-pointer hover:bg-gray-50 border-b transition-colors ${
                      selectedConversation === conversation.phone_number ? "bg-blue-50 border-blue-200" : ""
                    }`}
                    onClick={() => setSelectedConversation(conversation.phone_number)}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{conversation.phone_number.slice(-2)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm truncate">{conversation.phone_number}</p>
                          <div className="flex items-center gap-1">
                            {conversation.can_send_text ? (
                              <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                                Can Reply
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                Template Only
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-1">{conversation.last_message}</p>
                        {conversation.last_message_time && (
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDateSafe(conversation.last_message_time)} at{" "}
                            {formatTimeSafe(conversation.last_message_time)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className="md:col-span-2">
        {selectedConversation ? (
          <>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{selectedConversation.slice(-2)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{selectedConversation}</CardTitle>
                    <CardDescription>
                      {conversations.find((c) => c.phone_number === selectedConversation)?.can_send_text
                        ? "You can send free text messages"
                        : "Template messages only (no recent inbound message)"}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex flex-col h-[450px]">
              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No messages in this conversation</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.direction === "outbound" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            message.direction === "outbound" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {message.direction === "inbound" ? (
                              <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            ) : (
                              <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <p className="text-sm">{message.content || message.text}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs opacity-70">{formatTimeSafe(message.timestamp)}</span>
                                {message.direction === "outbound" && (
                                  <div className="flex items-center gap-1">
                                    {message.status === "sent" && <CheckCircle className="h-3 w-3 opacity-70" />}
                                    <span className="text-xs opacity-70 capitalize">{message.status}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Message Input */}
              <div className="border-t p-4">
                {conversations.find((c) => c.phone_number === selectedConversation)?.can_send_text ? (
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      onKeyPress={(e) => e.key === "Enter" && sendTextMessage()}
                      disabled={sendingMessage}
                    />
                    <Button onClick={sendTextMessage} disabled={!newMessage.trim() || sendingMessage} size="sm">
                      {sendingMessage ? <Clock className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-800">
                        <Clock className="h-4 w-4 inline mr-1" />
                        Free text messaging is only available within 24 hours of receiving a message from this contact.
                      </p>
                      <p className="text-xs text-yellow-700 mt-1">
                        You can still send template messages from the "Send Messages" tab.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </>
        ) : (
          <CardContent className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Select a Conversation</h3>
              <p>Choose a conversation from the left to start chatting</p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
