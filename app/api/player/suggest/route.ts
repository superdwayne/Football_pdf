import { NextRequest, NextResponse } from "next/server"
import { AirtableProvider } from "@/lib/airtable-provider"
import { POPULAR_PLAYERS } from "@/lib/player-suggestions"

export async function GET(req: NextRequest) {
  try {
    const provider = new AirtableProvider()
    const foundPlayers: string[] = []
    const maxAttempts = 5 // Limit searches
    
    // Shuffle popular players for variety
    const shuffled = [...POPULAR_PLAYERS].sort(() => 0.5 - Math.random())
    
    // Try to find players from popular list that exist in Airtable
    for (const playerName of shuffled.slice(0, maxAttempts)) {
      try {
        const players = await provider.searchPlayers(playerName, 1)
        if (players.length > 0) {
          // Use the actual name from Airtable (might be slightly different)
          foundPlayers.push(players[0].name)
          if (foundPlayers.length >= 3) break // Get 3 valid players
        }
      } catch (error) {
        // Skip if this player search fails
        console.log(`Player "${playerName}" not found in Airtable`)
        continue
      }
    }
    
    if (foundPlayers.length === 0) {
      // Fallback: return popular names anyway (user can try)
      return NextResponse.json({
        success: true,
        players: POPULAR_PLAYERS.slice(0, 5),
        note: "These are popular player names. Check if they exist in Airtable.",
      })
    }
    
    return NextResponse.json({
      success: true,
      players: foundPlayers,
      source: "airtable",
    })
  } catch (error) {
    console.error("Error suggesting players from Airtable:", error)
    
    // Fallback to static list if Airtable search fails
    return NextResponse.json({
      success: true,
      players: POPULAR_PLAYERS.slice(0, 5),
      note: "Using popular player names. Check if they exist in Airtable.",
    })
  }
}

