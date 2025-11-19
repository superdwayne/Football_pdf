import { NextRequest, NextResponse } from "next/server"
import { players } from "@/lib/local-players"

export async function GET(req: NextRequest) {
  try {
    // Return player names from local database
    const playerNames = players.map((p) => p.name)
    
    // Shuffle for variety
    const shuffled = [...playerNames].sort(() => 0.5 - Math.random())
    
    return NextResponse.json({
      success: true,
      players: shuffled.slice(0, 5),
      source: "local",
    })
  } catch (error) {
    console.error("Error suggesting players:", error)
    
    return NextResponse.json({
      success: true,
      players: [],
      error: "Failed to fetch player suggestions",
    })
  }
}

