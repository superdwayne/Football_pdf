// Airtable Data Source - Uses MCP to read from Football Players table
// This service provides methods to search and retrieve players from Airtable

const AIRTABLE_BASE_ID = "appLkDMJZrxnOCpPF"
const AIRTABLE_TABLE_ID = "tblwfa8UVh8Uoigp5" // Football Players table

export interface AirtablePlayerRecord {
  id: string
  fields: {
    "Player Name": string
    "First Name": string
    "Last Name": string
    "Date of Birth": string
    "Age": string
    "Height": string
    "Weight": string
    "Nationality": string
    "Preferred Foot": string
    "Photo URL": string
    "Current Club": string
    "Contract Until": string
    "TFG Player Rating": string
    "Predicted 2028 Rating": string
    "Total Games": string
    "Total Goals": string
    "Total Assists": string
    "Total Yellow Cards": string
    "Total Red Cards": string
    "Total Minutes": string
    "Average Rating": string
    "Transfermarkt Value EUR": string
    "TFG Intrinsic Value EUR": string
    "Premier League Value EUR": string
    "La Liga Value EUR": string
    "Serie A Value EUR": string
    "Bundesliga Value EUR": string
    "Ligue 1 Value EUR": string
    "SPL Value EUR": string
    "Positions Played": string
    "League Appearances JSON": string
    "Injury Record JSON": string
    "Transfer History JSON": string
    "Performance Data JSON": string
    "Strengths JSON": string
    "Weaknesses JSON": string
    "Last Updated": string
    [key: string]: any
  }
}

export interface AirtableSearchOptions {
  query?: string
  maxRecords?: number
  filterByFormula?: string
  sort?: Array<{ field: string; direction: "asc" | "desc" }>
}

/**
 * Search for players in Airtable by name
 * Uses MCP to search the Football Players table
 */
export async function searchPlayersInAirtable(
  searchTerm: string,
  limit: number = 20
): Promise<AirtablePlayerRecord[]> {
  try {
    // Use MCP to search records
    // Note: This function should be called from an API route that has access to MCP
    const response = await fetch("/api/airtable/search-players", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        searchTerm,
        limit,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to search Airtable: ${response.statusText}`)
    }

    const data = await response.json()
    return data.records || []
  } catch (error) {
    console.error("Error searching players in Airtable:", error)
    throw error
  }
}

/**
 * Get a player by ID from Airtable
 */
export async function getPlayerFromAirtable(
  recordId: string
): Promise<AirtablePlayerRecord | null> {
  try {
    const response = await fetch("/api/airtable/get-player", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recordId,
      }),
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`Failed to get player from Airtable: ${response.statusText}`)
    }

    const data = await response.json()
    return data.record || null
  } catch (error) {
    console.error("Error getting player from Airtable:", error)
    throw error
  }
}

/**
 * List all players from Airtable with optional filtering
 */
export async function listPlayersFromAirtable(
  options: AirtableSearchOptions = {}
): Promise<AirtablePlayerRecord[]> {
  try {
    const response = await fetch("/api/airtable/list-players", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(options),
    })

    if (!response.ok) {
      throw new Error(`Failed to list players from Airtable: ${response.statusText}`)
    }

    const data = await response.json()
    return data.records || []
  } catch (error) {
    console.error("Error listing players from Airtable:", error)
    throw error
  }
}

/**
 * Convert Airtable record to Player type (for compatibility with existing code)
 */
export function convertAirtableRecordToPlayer(
  record: AirtablePlayerRecord
): {
  id: string
  name: string
  firstName: string
  lastName: string
  age: number
  nationality: string
  photo: string
  currentTeam: {
    name: string
  } | null
  airtableRecord: AirtablePlayerRecord
} {
  const fields = record.fields

  return {
    id: record.id,
    name: fields["Player Name"] || "",
    firstName: fields["First Name"] || "",
    lastName: fields["Last Name"] || "",
    age: parseInt(fields["Age"] || "0", 10),
    nationality: fields["Nationality"] || "",
    photo: fields["Photo URL"] || "",
    currentTeam: fields["Current Club"]
      ? { name: fields["Current Club"] }
      : null,
    airtableRecord: record,
  }
}

/**
 * Get player statistics from Airtable record
 */
export function getPlayerStatisticsFromAirtable(
  record: AirtablePlayerRecord
) {
  const fields = record.fields

  try {
    const performanceData = JSON.parse(fields["Performance Data JSON"] || "{}")

    return {
      totalGames: parseInt(fields["Total Games"] || "0", 10),
      totalGoals: parseInt(fields["Total Goals"] || "0", 10),
      totalAssists: parseInt(fields["Total Assists"] || "0", 10),
      totalYellowCards: parseInt(fields["Total Yellow Cards"] || "0", 10),
      totalRedCards: parseInt(fields["Total Red Cards"] || "0", 10),
      totalMinutes: parseInt(fields["Total Minutes"] || "0", 10),
      averageRating: parseFloat(fields["Average Rating"] || "0"),
      tfgRating: parseInt(fields["TFG Player Rating"] || "0", 10),
      predictedRating: parseInt(fields["Predicted 2028 Rating"] || "0", 10),
      performanceData,
    }
  } catch (error) {
    console.error("Error parsing performance data:", error)
    return {
      totalGames: 0,
      totalGoals: 0,
      totalAssists: 0,
      totalYellowCards: 0,
      totalRedCards: 0,
      totalMinutes: 0,
      averageRating: 0,
      tfgRating: 0,
      predictedRating: 0,
      performanceData: {},
    }
  }
}

/**
 * Get additional data from Airtable record (transfers, injuries, etc.)
 */
export function getPlayerAdditionalDataFromAirtable(record: AirtablePlayerRecord) {
  const fields = record.fields

  try {
    return {
      transfers: JSON.parse(fields["Transfer History JSON"] || "[]"),
      injuries: JSON.parse(fields["Injury Record JSON"] || "[]"),
      leagueAppearances: JSON.parse(fields["League Appearances JSON"] || "[]"),
      strengths: JSON.parse(fields["Strengths JSON"] || "[]"),
      weaknesses: JSON.parse(fields["Weaknesses JSON"] || "[]"),
      positions: fields["Positions Played"] || "",
      valuations: {
        transfermarkt: fields["Transfermarkt Value EUR"] || "0M",
        tfgIntrinsic: fields["TFG Intrinsic Value EUR"] || "0M",
        premierLeague: fields["Premier League Value EUR"] || "0M",
        laLiga: fields["La Liga Value EUR"] || "0M",
        serieA: fields["Serie A Value EUR"] || "0M",
        bundesliga: fields["Bundesliga Value EUR"] || "0M",
        ligue1: fields["Ligue 1 Value EUR"] || "0M",
        spl: fields["SPL Value EUR"] || "0M",
      },
    }
  } catch (error) {
    console.error("Error parsing additional data:", error)
    return {
      transfers: [],
      injuries: [],
      leagueAppearances: [],
      strengths: [],
      weaknesses: [],
      positions: "",
      valuations: {},
    }
  }
}

