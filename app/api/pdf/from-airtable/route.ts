import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { processPlayerData } from "@/lib/data-processor"
import { generatePDF } from "@/lib/pdf-generator"
import { extractChartDataFromPerformanceFields } from "@/lib/chart-data-parser"
import { players } from "@/lib/local-players"
import type { Player } from "@/types/player"

export const runtime = "nodejs"

const recordIdSchema = z.object({
  recordId: z.string().min(1, "Record ID is required"),
})

export async function POST(req: NextRequest) {
  try {
    console.log("PDF from Local API: Received request")
    const body = await req.json()
    const { recordId } = recordIdSchema.parse(body)

    console.log("PDF from Local API: Fetching player data for id", recordId)

    const local = players.find((p) => String(p.id) === recordId)

    if (!local) {
      return NextResponse.json(
        { success: false, error: "Player not found in local database" },
        { status: 404 }
      )
    }

    const player: Player = {
      id: local.id,
      name: local.name,
      firstname: local.name.split(" ")[0] || local.name,
      lastname: local.name.split(" ").slice(1).join(" ") || local.name,
      age: local.age,
      birth: {
        date: local.dob || "",
        place: "",
        country: local.nationality,
      },
      nationality: local.nationality,
      height: local.height || "",
      weight: "",
      injured: false,
      photo: local.photoUrl || "",
      currentTeam: local.club ? { name: local.club } : undefined,
    }

    console.log("PDF from Local API: Player found:", player.name)

    // Build a synthetic statistics row from local key metrics so totals/league tables are populated
    const statistics: any[] = [
      {
        team: {
          id: 0,
          name: local.club,
          logo: "",
        },
        league: {
          id: 0,
          name: "Club Season",
          country: local.nationality,
          logo: "",
          flag: "",
          season: 2024,
        },
        games: {
          appearences: local.games ?? 0,
          lineups: local.games ?? 0,
          minutes: local.minutes ?? 0,
          number: null,
          position: local.position,
          rating: local.averageRating ? local.averageRating.toFixed(2) : "0.00",
          captain: false,
        },
        substitutes: {
          in: 0,
          out: 0,
          bench: 0,
        },
        shots: {
          total: undefined,
          on: undefined,
        },
        goals: {
          total: local.goals ?? 0,
          conceded: null,
          assists: local.assists ?? 0,
          saves: null,
        },
        passes: {
          total: undefined,
          key: undefined,
          accuracy: undefined,
        },
        tackles: {
          total: undefined,
          blocks: undefined,
          interceptions: undefined,
        },
        duels: {
          total: undefined,
          won: undefined,
        },
        dribbles: {
          attempts: undefined,
          success: undefined,
        },
        fouls: {
          drawn: undefined,
          committed: undefined,
        },
        cards: {
          yellow: local.yellowCards ?? 0,
          yellowred: 0,
          red: local.redCards ?? 0,
        },
        penalty: {
          won: null,
          commited: null,
          scored: 0,
          missed: 0,
          saved: null,
        },
      },
    ]
    const transfers: any[] = local.transfers || []
    const injuries: any[] = local.injuries || []

    console.log("PDF from Local API: Data retrieved:", {
      statistics: statistics.length,
      transfers: transfers.length,
      injuries: injuries.length,
    })

    // Build fields object compatible with extractChartDataFromPerformanceFields
    const { chartData, performanceData, usedField } =
      extractChartDataFromPerformanceFields({
        "Performance Data JSON": local.performanceDataJson || {},
      })

    if (chartData) {
      console.log("Chart data parsed from", usedField, "->", {
        radarKeys: Object.keys(chartData.radarChartMetrics),
        positionalKeys: Object.keys(chartData.positionalTraits),
        tfgKeys: Object.keys(chartData.tfgRatingTrend),
      })
    } else {
      console.log("Chart data not found in Performance Data JSON, existing data: ", performanceData)
    }

    // Process the data to the format expected by PDF generator
    const processedData = processPlayerData(player, statistics, transfers, injuries, chartData)

    // Update current team from statistics if available
    if (player.currentTeam) {
      processedData.profile.currentTeam = {
        id: 0,
        name: player.currentTeam.name,
        logo: "",
      }
    }

    console.log("PDF from Local API: Processing data complete, generating PDF...")

    // Generate PDF
    const pdfBuffer = await generatePDF(processedData)

    console.log("PDF from Local API: PDF generated successfully, size:", pdfBuffer.length)

    // Get player name for filename
    const playerName = processedData.profile.name || "player"

    // Return PDF as response
    const pdfBytes = new Uint8Array(pdfBuffer)
    return new NextResponse(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="player-report-${playerName.replace(/\s+/g, "-")}.pdf"`,
        "Content-Length": pdfBytes.byteLength.toString(),
      },
    })
  } catch (error) {
    console.error("PDF from Local API: Error occurred")
    console.error("PDF from Local API: Error type:", (error as any)?.constructor?.name)
    console.error("PDF from Local API: Error message:", error instanceof Error ? error.message : String(error))

    if (error instanceof Error) {
      console.error("PDF from Local API: Error stack:", error.stack)
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid request", details: error.issues },
        { status: 400 }
      )
    }

    const errorMessage = error instanceof Error ? error.message : "Failed to generate PDF"
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}

