"use client"

import * as React from "react"
import { Input } from "./input"
import { Button } from "./button"
import { Send, Loader2, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatInputProps {
  onSend: (message: string) => void
  onSuggestPlayer?: () => void
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({
  onSend,
  onSuggestPlayer,
  disabled = false,
  placeholder = "Enter a player's name...",
}: ChatInputProps) {
  const [input, setInput] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !disabled) {
      onSend(input.trim())
      setInput("")
    }
  }

  React.useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <div className="border-t bg-white">
      <form onSubmit={handleSubmit} className="flex gap-2 p-4">
        {onSuggestPlayer && (
          <Button
            type="button"
            onClick={onSuggestPlayer}
            disabled={disabled}
            variant="outline"
            size="icon"
            title="Suggest a random player"
          >
            <Sparkles className="w-4 h-4" />
          </Button>
        )}
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSubmit(e)
            }
          }}
        />
        <Button
          type="submit"
          disabled={disabled || !input.trim()}
          size="icon"
        >
          {disabled ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </form>
    </div>
  )
}

