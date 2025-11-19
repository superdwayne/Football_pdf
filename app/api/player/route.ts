import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { players } from "@/lib/local-players"

const searchSchema = z.object({
  name: z.string().min(1, "Player name is required"),
})

const recordIdSchema = z.object({
  recordId: z.string().min(1, "Record ID is required"),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, ...params } = body

    if (action === "search") {
      const { name } = searchSchema.parse(params)
      
      console.log("🔍 Searching local players:", name)

      const lower = name.toLowerCase()
      const matched = players.filter((p) => p.name.toLowerCase().includes(lower))

      console.log("📊 Local search results:", {
        searchTerm: name,
        found: matched.length,
        players: matched.map((p) => ({ id: p.id, name: p.name })),
      })

      return NextResponse.json({
        success: true,
        players: matched.map((p) => ({
          id: String(p.id),
          name: p.name,
          age: p.age,
          nationality: p.nationality,
          photo: p.photoUrl ?? "",
          team: p.club,
        })),
        source: "local",
      })
    }

    if (action === "getDetails") {
      const { recordId } = recordIdSchema.parse(params)

      console.log("🔍 Getting local player details for id:", recordId)

      const local = players.find((p) => String(p.id) === recordId)

      if (!local) {
        console.log("❌ Local player not found:", recordId)
        return NextResponse.json(
          { success: false, error: "Player not found in local database" },
          { status: 404 }
        )
      }

      console.log("✅ Found local player:", local.name)

      // For now, statistics/transfers/injuries are empty; we can extend later
      const statistics: any[] = []
      const transfers: any[] = []
      const injuries: any[] = []

      const currentTeam = local.club
        ? {
            id: 0,
            name: local.club,
            logo: "",
          }
        : null

      const player = {
        id: local.id,
        name: local.name,
        age: local.age,
        nationality: local.nationality,
        currentTeam,
      }

      return NextResponse.json({
        success: true,
        player,
        statistics,
        transfers,
        injuries,
        source: "local",
      })
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    )
  } catch (error) {
    console.error("❌ Player API error:", error)

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

