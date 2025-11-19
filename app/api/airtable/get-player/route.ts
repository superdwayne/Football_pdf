import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const getPlayerSchema = z.object({
  recordId: z.string().min(1, "Record ID is required"),
})

const AIRTABLE_BASE_ID = "appLkDMJZrxnOCpPF"
const AIRTABLE_TABLE_ID = "tblwfa8UVh8Uoigp5" // Football Players table
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || process.env.NEXT_PUBLIC_AIRTABLE_API_KEY || ""
const AIRTABLE_API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`

/**
 * Get a specific player from Airtable using REST API
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { recordId } = getPlayerSchema.parse(body)

    if (!AIRTABLE_API_KEY) {
      // If no API key, try using MCP via the AI assistant
      return NextResponse.json({
        success: true,
        record: null,
        instructions: {
          mcpFunction: "mcp_airtable_get_record",
          parameters: {
            baseId: AIRTABLE_BASE_ID,
            tableId: AIRTABLE_TABLE_ID,
            recordId,
          },
        },
        note: "AIRTABLE_API_KEY not set. Using MCP instructions. Set AIRTABLE_API_KEY in .env.local to use REST API.",
      })
    }

    // Use Airtable REST API to get record
    const url = `${AIRTABLE_API_URL}/${recordId}`
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { success: false, error: "Player not found", record: null },
          { status: 404 }
        )
      }
      throw new Error(`Airtable API error: ${response.statusText}`)
    }

    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      record: data,
    })
  } catch (error) {
    console.error("Airtable get player error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid request", details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to get player from Airtable",
      },
      { status: 500 }
    )
  }
}

