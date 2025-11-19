"use client"

import * as React from "react"
import { ScrollArea } from "./scroll-area"
import { ChatMessage, type Message } from "./chat-message"
import { ChatInput } from "./chat-input"
import { Card } from "./card"
import { Loader2 } from "lucide-react"

interface ChatContainerProps {
  messages: Message[]
  onSendMessage: (message: string) => void
  onSuggestPlayer?: () => void
  isLoading?: boolean
}

export function ChatContainer({
  messages,
  onSendMessage,
  onSuggestPlayer,
  isLoading = false,
}: ChatContainerProps) {
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <Card className="flex flex-col h-[calc(100vh-2rem)] max-w-4xl mx-auto">
      <div className="p-4 border-b bg-gradient-to-r from-green-600 to-green-700 text-white">
        <h1 className="text-2xl font-bold mb-1">Football Player PDF Generator</h1>
        <p className="text-sm text-green-100">
          Enter a player's name to generate a comprehensive PDF report
        </p>
      </div>

      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-center text-muted-foreground">
            <div>
              <p className="text-lg mb-2">Welcome!</p>
              <p className="mb-4">Start by entering a football player's name above.</p>
              {onSuggestPlayer && (
                <button
                  onClick={onSuggestPlayer}
                  disabled={isLoading}
                  className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  🎲 Suggest a Player
                </button>
              )}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}

        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-muted rounded-lg px-4 py-2 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm text-muted-foreground">
                Searching for player...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </ScrollArea>

      <ChatInput 
        onSend={onSendMessage} 
        onSuggestPlayer={onSuggestPlayer}
        disabled={isLoading} 
      />
    </Card>
  )
}

