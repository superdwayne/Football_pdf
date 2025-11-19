import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "./card"
import { Button } from "./button"
import { Download } from "lucide-react"

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  playerData?: any
  pdfUrl?: string
}

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user"

  return (
    <div
      className={cn(
        "flex w-full mb-4",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-2 shadow-sm",
          isUser
            ? "bg-green-600 text-white"
            : "bg-amber-50 text-gray-900 border border-amber-200"
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        
        {message.playerData && message.playerData.name && (
          <div className="mt-2 pt-2 border-t border-border/50">
            <div className="text-xs opacity-80">
              <p className="font-semibold">{message.playerData.name}</p>
              {message.playerData.team && (
                <p>{message.playerData.team}</p>
              )}
            </div>
          </div>
        )}

        {message.pdfUrl && (
          <div className="mt-2 pt-2 border-t border-border/50">
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => {
                window.open(message.pdfUrl, "_blank")
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

