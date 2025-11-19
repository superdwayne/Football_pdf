import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { generatePDF } from "@/lib/pdf-generator"
import type { ProcessedPlayerData } from "@/lib/data-processor"

const pdfRequestSchema = z.object({
  data: z.object({
    profile: z.object({
      name: z.string(),
      firstName: z.string(),
      lastName: z.string(),
      age: z.number(),
      dob: z.string(),
      height: z.string(),
      weight: z.string(),
      nationality: z.string(),
      preferredFoot: z.string().nullable(),
      photo: z.string(),
      currentTeam: z
        .object({
          id: z.number(),
          name: z.string(),
          logo: z.string(),
        })
        .nullable(),
    }),
    positions: z.array(
      z.object({
        position: z.string(),
        appearances: z.number(),
        goals: z.number(),
        assists: z.number(),
      })
    ),
    leagueAppearances: z.array(
      z.object({
        season: z.string(),
        competition: z.string(),
        games: z.number(),
        assists: z.number(),
        yellowCards: z.number(),
        secondYellow: z.number(),
        redCards: z.number(),
        ownGoals: z.number(),
        minutes: z.number(),
      })
    ),
    statistics: z.object({
      totalGames: z.number(),
      totalGoals: z.number(),
      totalAssists: z.number(),
      totalYellowCards: z.number(),
      totalRedCards: z.number(),
      totalMinutes: z.number(),
      averageRating: z.number(),
    }),
    transfers: z.array(
      z.object({
        date: z.string(),
        type: z.string(),
        from: z.string(),
        to: z.string(),
      })
    ),
    injuries: z.array(
      z.object({
        season: z.string(),
        injury: z.string(),
        from: z.string(),
        until: z.string(),
        days: z.number(),
        gamesMissed: z.number(),
      })
    ),
    strengths: z.array(
      z.object({
        category: z.string(),
        percentile: z.number(),
      })
    ),
    weaknesses: z.array(
      z.object({
        category: z.string(),
        percentile: z.number(),
      })
    ),
  }),
})

export async function POST(req: NextRequest) {
  try {
    console.log("PDF API: Received request")
    const body = await req.json()
    console.log("PDF API: Request body parsed, validating schema...")
    
    const { data } = pdfRequestSchema.parse(body)
    console.log("PDF API: Schema validation passed, player:", data.profile.name)

    // Generate PDF
    console.log("PDF API: Calling generatePDF...")
    const pdfBuffer = await generatePDF(data as ProcessedPlayerData)
    console.log("PDF API: PDF generated successfully, buffer size:", pdfBuffer.length)

    // Return PDF as response
    return new NextResponse(pdfBuffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="player-report-${data.profile.name.replace(/\s+/g, "-")}.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error("PDF API: Error occurred")
    console.error("PDF API: Error type:", error?.constructor?.name)
    console.error("PDF API: Error message:", error instanceof Error ? error.message : String(error))
    
    if (error instanceof Error) {
      console.error("PDF API: Error stack:", error.stack)
    }

    if (error instanceof z.ZodError) {
      console.error("PDF API: Validation errors:", JSON.stringify(error.issues, null, 2))
      return NextResponse.json(
        { success: false, error: "Invalid request data", details: error.issues },
        { status: 400 }
      )
    }

    const errorMessage = error instanceof Error ? error.message : "Failed to generate PDF"
    console.error("PDF API: Returning error response:", errorMessage)
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}

