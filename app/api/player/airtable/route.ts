import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { AirtableProvider } from "@/lib/airtable-provider"

const searchSchema = z.object({
  name: z.string().min(1, "Player name is required"),
  limit: z.coerce.number().int().positive().max(20).default(10),
})

const recordIdSchema = z.object({
  recordId: z.string().min(1, "Record ID is required"),
})

/**
 * Player API using Airtable as data source
 * This endpoint uses MCP to fetch player data from the Football Players table
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, ...params } = body

    const provider = new AirtableProvider()

    if (action === "search") {
      const { name, limit } = searchSchema.parse(params)
      
      // Use MCP to search Airtable
      // Note: In production, you would call MCP directly here
      // For now, we'll use the provider which will handle the MCP calls
      const players = await provider.searchPlayers(name, limit)

      return NextResponse.json({
        success: true,
        players: players.map((player) => ({
          id: player.id,
          name: player.name,
          age: player.age,
          nationality: player.nationality,
          photo: player.photo,
          team: null, // Will be populated from Airtable data if available
        })),
        source: "airtable",
      })
    }

    if (action === "getDetails") {
      const { recordId } = recordIdSchema.parse(params)

      // Get player from Airtable
      const player = await provider.getPlayerByRecordId(recordId)

      if (!player) {
        return NextResponse.json(
          { success: false, error: "Player not found in Airtable" },
          { status: 404 }
        )
      }

      // Get additional data including enhanced information
      const [statistics, transfers, injuries, enhancedInfo] = await Promise.all([
        provider.getPlayerStatistics(recordId).catch(() => []),
        provider.getPlayerTransfers(recordId).catch(() => []),
        provider.getPlayerInjuries(recordId).catch(() => []),
        provider.getPlayerEnhancedInfo(recordId).catch(() => null),
      ])

      // Get current team from Airtable record
      let currentTeam = null
      if (statistics.length > 0) {
        const latestStats = statistics[0]
        currentTeam = {
          id: latestStats.team.id,
          name: latestStats.team.name,
          logo: latestStats.team.logo,
        }
      }

      return NextResponse.json({
        success: true,
        player: {
          ...player,
          currentTeam,
        },
        statistics,
        transfers,
        injuries,
        enhancedInfo, // Includes valuations, strengths, weaknesses, positions breakdown
        source: "airtable",
      })
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Airtable Player API error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid request", details: error.issues },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

