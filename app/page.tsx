"use client"

import { useState } from "react"
import { ChatContainer } from "@/components/ui/chat-container"
import type { Message } from "@/components/ui/chat-message"
import { Button } from "@/components/ui/button"
import { getRandomPlayer } from "@/lib/player-suggestions"

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null)

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      // Search for players
      console.log("🔍 Frontend: Searching for player:", content)
      
      const searchResponse = await fetch("/api/player", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "search",
          name: content,
        }),
      })

      const searchData = await searchResponse.json()
      
      console.log("📦 Frontend: Raw search response from API:", searchData)
      console.log("📊 Frontend: Players found:", searchData.players)
      console.log("📊 Frontend: Number of players:", searchData.players?.length || 0)

      if (!searchData.success) {
        console.error("❌ Frontend: Search failed:", searchData.error)
        throw new Error(searchData.error || "Failed to search players")
      }

      if (searchData.players.length === 0) {
        const errorContent = searchData.error
          ? `Error searching Airtable: ${searchData.error}`
          : `No players found in Airtable with the name "${content}". Please try a different name.`

        const noResultsMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: errorContent,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, noResultsMessage])
        setIsLoading(false)
        return
      }

      // If multiple players found, show selection
      if (searchData.players.length > 1) {
        const selectionMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Found ${searchData.players.length} players. Please select one:`,
          timestamp: new Date(),
          playerData: {
            players: searchData.players,
          },
        }
        setMessages((prev) => [...prev, selectionMessage])
        setIsLoading(false)
        return
      }

      // Single player found, proceed with details
      const player = searchData.players[0]
      // player.id is now a string (Airtable record ID)
      await fetchPlayerDetailsAndGeneratePDF(player.id)
    } catch (error) {
      console.error("Error searching players:", error)
      let errorText = "Failed to search players. Please try again."
      
      if (error instanceof Error) {
        errorText = `Error searching Airtable: ${error.message}`
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: errorText,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
      setIsLoading(false)
    }
  }

  const handlePlayerSelection = async (playerId: string | number) => {
    setIsLoading(true)
    // Convert to string if it's a number (for backward compatibility)
    const recordId = typeof playerId === "number" ? String(playerId) : playerId
    await fetchPlayerDetailsAndGeneratePDF(recordId)
  }

  const handleSuggestPlayer = async () => {
    setIsLoading(true)
    
    try {
      // Fetch players that actually exist in the API
      const response = await fetch("/api/player/suggest")
      const data = await response.json()
      
      if (!data.success || !data.players || data.players.length === 0) {
        throw new Error("Could not fetch available players")
      }
      
      // Get a random player from the validated list
      const randomIndex = Math.floor(Math.random() * data.players.length)
      const suggestedPlayer = data.players[randomIndex]
      
      // Add a message showing the suggestion
      const suggestionMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `🎲 Suggested player: **${suggestedPlayer}**\n\nSearching for this player...`,
        timestamp: new Date(),
        playerData: {
          suggestedName: suggestedPlayer,
        },
      }
      
      setMessages((prev) => [...prev, suggestionMessage])
      
      // Automatically search for the suggested player after a short delay
      setTimeout(() => {
        handleSendMessage(suggestedPlayer)
      }, 800)
    } catch (error) {
      console.error("Error suggesting player:", error)
      
      // Fallback to static list
      const suggestedPlayer = getRandomPlayer()
      
      const suggestionMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `🎲 Suggested player: **${suggestedPlayer}**\n\nSearching for this player...`,
        timestamp: new Date(),
        playerData: {
          suggestedName: suggestedPlayer,
        },
      }
      
      setMessages((prev) => [...prev, suggestionMessage])
      
      setTimeout(() => {
        handleSendMessage(suggestedPlayer)
      }, 800)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPlayerDetailsAndGeneratePDF = async (recordId: string | number) => {
    try {
      // Convert to string if needed (Airtable uses string record IDs)
      const recordIdString = typeof recordId === "number" ? String(recordId) : recordId
      
      // Fetch player details from Airtable
      const detailsResponse = await fetch("/api/player", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "getDetails",
          recordId: recordIdString,
        }),
      })

      const detailsData = await detailsResponse.json()
      
      console.log("📦 Frontend: Raw player details response:", detailsData)
      console.log("📊 Frontend: Player data:", detailsData.player)
      console.log("📊 Frontend: Statistics:", detailsData.statistics)
      console.log("📊 Frontend: Transfers:", detailsData.transfers)
      console.log("📊 Frontend: Injuries:", detailsData.injuries)

      if (!detailsData.success) {
        console.error("❌ Frontend: Failed to get player details:", detailsData.error)
        throw new Error(detailsData.error || "Failed to fetch player details")
      }

      // Generate PDF directly from Airtable via dedicated route
      const pdfResponse = await fetch("/api/pdf/from-airtable", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recordId: recordIdString,
        }),
      })

      if (!pdfResponse.ok) {
        let errorMessage = `Failed to generate PDF (status ${pdfResponse.status})`

        try {
          const errorBody = await pdfResponse.json()
          console.error("❌ PDF generation failed:", errorBody)

          if (errorBody?.error) {
            errorMessage = `Failed to generate PDF: ${errorBody.error}`
          }

          if (errorBody?.details) {
            console.error("📄 PDF validation details:", errorBody.details)
          }
        } catch (parseError) {
          console.error("⚠️ Could not parse PDF error response:", parseError)
        }

        throw new Error(errorMessage)
      }

      // Create blob and download link
      const pdfBlob = await pdfResponse.blob()
      const pdfUrl = URL.createObjectURL(pdfBlob)
      // Add success message with download link
      const successMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `PDF report generated successfully for ${detailsData.player.name}!`,
        timestamp: new Date(),
        playerData: {
          name: detailsData.player.name,
          team: detailsData.player.currentTeam?.name || "Unknown",
        },
        pdfUrl,
      }

      setMessages((prev) => [...prev, successMessage])
      setSelectedPlayer(null)
    } catch (error) {
      console.error("Error generating PDF:", error)
      let errorText = "Failed to generate PDF. Please try again."
      
      if (error instanceof Error) {
        if (error.message.includes("not found")) {
          errorText = "Player data not found in Airtable. Please try a different player."
        } else if (error.message.includes("PDF")) {
          errorText = `PDF generation failed: ${error.message}`
        } else {
          errorText = `Error generating Airtable PDF: ${error.message}`
        }
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: errorText,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // Check if last message has player selection options
  const lastMessage = messages[messages.length - 1]
  const showPlayerSelection =
    lastMessage?.role === "assistant" && lastMessage?.playerData?.players

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-amber-50 to-green-100 p-4">
      <ChatContainer
        messages={messages}
        onSendMessage={handleSendMessage}
        onSuggestPlayer={handleSuggestPlayer}
        isLoading={isLoading}
      />

      {/* Player Selection UI */}
      {showPlayerSelection && (
        <div className="max-w-4xl mx-auto mt-4">
          <div className="bg-white rounded-lg shadow-lg p-4">
            <h3 className="font-semibold mb-3">Select a player:</h3>
            <div className="space-y-2">
              {lastMessage.playerData.players.map((player: any) => (
                <Button
                  key={player.id}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handlePlayerSelection(player.id)}
                  disabled={isLoading}
                >
                  <div className="flex items-center gap-3">
                    {player.photo && (
                      <img
                        src={player.photo}
                        alt={player.name}
                        className="w-10 h-10 rounded"
                      />
                    )}
                    <div className="text-left">
                      <div className="font-semibold">{player.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {player.nationality} • Age: {player.age}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

