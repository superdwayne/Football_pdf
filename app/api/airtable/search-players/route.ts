import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const searchSchema = z.object({
  searchTerm: z.string().min(1, "Search term is required"),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

const AIRTABLE_BASE_ID = "appLkDMJZrxnOCpPF"
const AIRTABLE_TABLE_ID = "tblwfa8UVh8Uoigp5" // Football Players table
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || process.env.NEXT_PUBLIC_AIRTABLE_API_KEY || ""
const AIRTABLE_API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`

/**
 * Search for players in Airtable using REST API
 * This endpoint searches the Football Players table
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { searchTerm, limit } = searchSchema.parse(body)

    if (!AIRTABLE_API_KEY) {
      // If no API key, try using MCP via the AI assistant
      return NextResponse.json({
        success: true,
        records: [],
        instructions: {
          mcpFunction: "mcp_airtable_search_records",
          parameters: {
            baseId: AIRTABLE_BASE_ID,
            tableId: AIRTABLE_TABLE_ID,
            searchTerm,
            maxRecords: limit,
          },
        },
        note: "AIRTABLE_API_KEY not set. Using MCP instructions. Set AIRTABLE_API_KEY in .env.local to use REST API.",
      })
    }

    // Use Airtable REST API to search
    // Search is case-insensitive and looks in Player Name field
    const searchFormula = `SEARCH(LOWER("${searchTerm.toLowerCase()}"), LOWER({Player Name}))`
    const url = `${AIRTABLE_API_URL}?maxRecords=${limit}&filterByFormula=${encodeURIComponent(searchFormula)}`
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.statusText}`)
    }

    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      records: data.records || [],
    })
  } catch (error) {
    console.error("Airtable search error:", error)

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
          error instanceof Error ? error.message : "Failed to search Airtable",
      },
      { status: 500 }
    )
  }
}

