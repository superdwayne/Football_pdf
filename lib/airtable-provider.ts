// Airtable Provider - Uses MCP to provide player data from Airtable
// This provider can be used as an alternative data source to API-Football

import type { Player, PlayerStatistics, PlayerTransfer, PlayerInjury } from "@/types/player"
import {
  convertAirtableRecordToPlayer,
  getPlayerStatisticsFromAirtable,
  getPlayerAdditionalDataFromAirtable,
  type AirtablePlayerRecord,
} from "./airtable-data-source"

const AIRTABLE_BASE_ID = "appLkDMJZrxnOCpPF"
const AIRTABLE_TABLE_ID = "tblwfa8UVh8Uoigp5" // Football Players table

export interface AirtableProviderConfig {
  baseId?: string
  tableId?: string
}

/**
 * Airtable Provider - Fetches player data from Airtable using MCP
 * 
 * Note: This provider requires MCP to be available. In a production environment,
 * you would need to set up MCP server integration or use the Airtable REST API directly.
 */
export class AirtableProvider {
  private baseId: string
  private tableId: string

  constructor(config: AirtableProviderConfig = {}) {
    this.baseId = config.baseId || AIRTABLE_BASE_ID
    this.tableId = config.tableId || AIRTABLE_TABLE_ID
  }

  /**
   * Search for players by name
   * Uses Airtable REST API directly
   */
  async searchPlayers(name: string, limit: number = 10): Promise<Player[]> {
    try {
      const apiKey = process.env.AIRTABLE_API_KEY || process.env.NEXT_PUBLIC_AIRTABLE_API_KEY || ""
      
      console.log("🔑 AirtableProvider.searchPlayers called:", {
        name,
        limit,
        hasApiKey: !!apiKey,
        apiKeyLength: apiKey.length,
        baseId: this.baseId,
        tableId: this.tableId,
      })
      
      if (!apiKey) {
        throw new Error("AIRTABLE_API_KEY is not set. Please add it to your .env.local file.")
      }

      // Use Airtable REST API directly
      // Try multiple search formulas for better matching
      const searchTerm = name.toLowerCase().trim()
      const searchFormula = `OR(
        SEARCH("${searchTerm}", LOWER({Player Name})),
        SEARCH("${searchTerm}", LOWER({First Name})),
        SEARCH("${searchTerm}", LOWER({Last Name}))
      )`
      
      const url = `https://api.airtable.com/v0/${this.baseId}/${this.tableId}?maxRecords=${limit}&filterByFormula=${encodeURIComponent(searchFormula)}`
      
      console.log("🌐 Airtable API Request:", {
        url: url.replace(apiKey, "***"),
        searchFormula,
        searchTerm,
      })
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      })

      console.log("📡 Airtable API Response:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ Airtable API Error Response:", errorText)
        throw new Error(`Airtable API error: ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      
      console.log("📦 Airtable API Data:", {
        recordCount: data.records?.length || 0,
        records: data.records?.map((r: any) => ({
          id: r.id,
          playerName: r.fields?.["Player Name"],
          firstName: r.fields?.["First Name"],
          lastName: r.fields?.["Last Name"],
        })) || [],
      })
      
      if (data.records && Array.isArray(data.records)) {
        const players = data.records.map((record: AirtablePlayerRecord) => {
          const player = this.convertToPlayer(record)
          // Store the original Airtable record ID for later use
          ;(player as any).recordId = record.id
          return player
        })
        console.log("✅ Converted players:", players.map((p: Player & { recordId?: string }) => ({ 
          id: p.id, 
          name: p.name,
          recordId: (p as any).recordId 
        })))
        return players
      }

      console.log("⚠️ No records found in Airtable response")
      return []
    } catch (error) {
      console.error("❌ Error searching players in Airtable:", error)
      if (error instanceof Error) {
        console.error("Error details:", {
          message: error.message,
          stack: error.stack,
        })
      }
      throw error
    }
  }

  /**
   * Get player by Airtable record ID
   */
  async getPlayerByRecordId(recordId: string): Promise<Player | null> {
    try {
      const apiKey = process.env.AIRTABLE_API_KEY || process.env.NEXT_PUBLIC_AIRTABLE_API_KEY || ""
      
      if (!apiKey) {
        throw new Error("AIRTABLE_API_KEY is not set. Please add it to your .env.local file.")
      }

      // Use Airtable REST API directly
      const url = `https://api.airtable.com/v0/${this.baseId}/${this.tableId}/${recordId}`
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error(`Airtable API error: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data) {
        return this.convertToPlayer(data)
      }

      return null
    } catch (error) {
      console.error("Error getting player from Airtable:", error)
      throw error
    }
  }

  /**
   * Get player statistics from Airtable record
   * Now extracts detailed statistics from League Appearances JSON and Performance Data JSON
   */
  async getPlayerStatistics(recordId: string): Promise<PlayerStatistics[]> {
    try {
      const record = await this.getAirtableRecord(recordId)
      if (!record) {
        return []
      }

      const stats = getPlayerStatisticsFromAirtable(record)
      const additionalData = getPlayerAdditionalDataFromAirtable(record)
      const performanceData = stats.performanceData || {}
      const leagueAppearances = additionalData.leagueAppearances || []

      // If we have league-specific data, create one record per league/season
      if (Array.isArray(leagueAppearances) && leagueAppearances.length > 0) {
        return leagueAppearances.map((appearance: any, index: number) => {
          const season = appearance.season || `${2024 + index}/${2025 + index}`
          const competition = appearance.competition || "Unknown"
          
          // Extract detailed stats from performance data if available
          const seasonStats = performanceData[season] || performanceData[competition] || {}
          
          return {
            team: {
              id: 0,
              name: record.fields["Current Club"] || "Unknown",
              logo: "",
            },
            league: {
              id: 0,
              name: competition,
              country: this.extractCountryFromCompetition(competition),
              logo: "",
              flag: "",
              season: this.extractSeasonYear(season),
            },
            games: {
              appearences: appearance.games || 0,
              lineups: appearance.games || 0,
              minutes: appearance.minutes || 0,
              number: null,
              position: this.extractPositionFromPositions(record.fields["Positions Played"]),
              rating: seasonStats.averageRating || stats.averageRating.toString(),
              captain: false,
            },
            substitutes: {
              in: seasonStats.substitutesIn || 0,
              out: seasonStats.substitutesOut || 0,
              bench: seasonStats.bench || 0,
            },
            shots: {
              total: seasonStats.shotsTotal || performanceData.shots?.total || 0,
              on: seasonStats.shotsOn || performanceData.shots?.on || 0,
            },
            goals: {
              total: appearance.goals || seasonStats.goals || 0,
              conceded: seasonStats.goalsConceded || 0,
              assists: appearance.assists || 0,
              saves: seasonStats.saves || 0,
            },
            passes: {
              total: seasonStats.passesTotal || performanceData.passes?.total || 0,
              key: seasonStats.keyPasses || performanceData.passes?.key || 0,
              accuracy: seasonStats.passAccuracy || performanceData.passes?.accuracy || 0,
            },
            tackles: {
              total: seasonStats.tacklesTotal || performanceData.tackles?.total || 0,
              blocks: seasonStats.blocks || performanceData.tackles?.blocks || 0,
              interceptions: seasonStats.interceptions || performanceData.tackles?.interceptions || 0,
            },
            duels: {
              total: seasonStats.duelsTotal || performanceData.duels?.total || 0,
              won: seasonStats.duelsWon || performanceData.duels?.won || 0,
            },
            dribbles: {
              attempts: seasonStats.dribblesAttempts || performanceData.dribbles?.attempts || 0,
              success: seasonStats.dribblesSuccess || performanceData.dribbles?.success || 0,
              past: seasonStats.dribblesPast || performanceData.dribbles?.past || 0,
            },
            fouls: {
              drawn: seasonStats.foulsDrawn || performanceData.fouls?.drawn || 0,
              committed: seasonStats.foulsCommitted || performanceData.fouls?.committed || 0,
            },
            cards: {
              yellow: appearance.yellowCards || 0,
              yellowred: appearance.secondYellow || 0,
              red: appearance.redCards || 0,
            },
            penalty: {
              won: seasonStats.penaltyWon || performanceData.penalty?.won || 0,
              commited: seasonStats.penaltyCommitted || performanceData.penalty?.commited || 0,
              scored: seasonStats.penaltyScored || performanceData.penalty?.scored || 0,
              missed: seasonStats.penaltyMissed || performanceData.penalty?.missed || 0,
              saved: seasonStats.penaltySaved || performanceData.penalty?.saved || 0,
            },
          }
        })
      }

      // Fallback: Create aggregated statistics record with enhanced data from Performance Data JSON
      return [
        {
          team: {
            id: 0,
            name: record.fields["Current Club"] || "Unknown",
            logo: "",
          },
          league: {
            id: 0,
            name: "Various",
            country: "",
            logo: "",
            flag: "",
          },
          games: {
            appearences: stats.totalGames,
            lineups: stats.totalGames,
            minutes: stats.totalMinutes,
            number: null,
            position: this.extractPositionFromPositions(record.fields["Positions Played"]),
            rating: stats.averageRating.toString(),
            captain: false,
          },
          substitutes: {
            in: performanceData.substitutesIn || performanceData.substitutes?.in || 0,
            out: performanceData.substitutesOut || performanceData.substitutes?.out || 0,
            bench: performanceData.bench || performanceData.substitutes?.bench || 0,
          },
          shots: {
            total: performanceData.shotsTotal || performanceData.shots?.total || 0,
            on: performanceData.shotsOn || performanceData.shots?.on || 0,
          },
          goals: {
            total: stats.totalGoals,
            conceded: performanceData.goalsConceded || 0,
            assists: stats.totalAssists,
            saves: performanceData.saves || 0,
          },
          passes: {
            total: performanceData.passesTotal || performanceData.passes?.total || 0,
            key: performanceData.keyPasses || performanceData.passes?.key || 0,
            accuracy: performanceData.passAccuracy || performanceData.passes?.accuracy || 0,
          },
          tackles: {
            total: performanceData.tacklesTotal || performanceData.tackles?.total || 0,
            blocks: performanceData.blocks || performanceData.tackles?.blocks || 0,
            interceptions: performanceData.interceptions || performanceData.tackles?.interceptions || 0,
          },
          duels: {
            total: performanceData.duelsTotal || performanceData.duels?.total || 0,
            won: performanceData.duelsWon || performanceData.duels?.won || 0,
          },
          dribbles: {
            attempts: performanceData.dribblesAttempts || performanceData.dribbles?.attempts || 0,
            success: performanceData.dribblesSuccess || performanceData.dribbles?.success || 0,
            past: performanceData.dribblesPast || performanceData.dribbles?.past || 0,
          },
          fouls: {
            drawn: performanceData.foulsDrawn || performanceData.fouls?.drawn || 0,
            committed: performanceData.foulsCommitted || performanceData.fouls?.committed || 0,
          },
          cards: {
            yellow: stats.totalYellowCards,
            yellowred: 0,
            red: stats.totalRedCards,
          },
          penalty: {
            won: performanceData.penaltyWon || performanceData.penalty?.won || 0,
            commited: performanceData.penaltyCommitted || performanceData.penalty?.commited || 0,
            scored: performanceData.penaltyScored || performanceData.penalty?.scored || 0,
            missed: performanceData.penaltyMissed || performanceData.penalty?.missed || 0,
            saved: performanceData.penaltySaved || performanceData.penalty?.saved || 0,
          },
        },
      ]
    } catch (error) {
      console.error("Error getting player statistics:", error)
      return []
    }
  }

  /**
   * Extract position from Positions Played field
   */
  private extractPositionFromPositions(positionsStr: string): string {
    if (!positionsStr) return "Unknown"
    
    // Try to extract the most common position
    const positionMatch = positionsStr.match(/(RW|LW|LB|RB|CM|DM|AM|CF|ST|SS|GK|CB)/i)
    if (positionMatch) {
      return positionMatch[1].toUpperCase()
    }
    
    // Try to extract from format like "RW (51 apps, 15G, 5A)"
    const formatMatch = positionsStr.match(/^([A-Z]+)\s*\(/)
    if (formatMatch) {
      return formatMatch[1]
    }
    
    return "Unknown"
  }

  /**
   * Extract country from competition name
   */
  private extractCountryFromCompetition(competition: string): string {
    const countryMap: Record<string, string> = {
      "Premier League": "England",
      "La Liga": "Spain",
      "Serie A": "Italy",
      "Bundesliga": "Germany",
      "Ligue 1": "France",
      "Champions League": "Europe",
      "Europa League": "Europe",
      "SPL": "Saudi Arabia",
    }
    
    for (const [key, country] of Object.entries(countryMap)) {
      if (competition.includes(key)) {
        return country
      }
    }
    
    return ""
  }

  /**
   * Extract season year from season string (e.g., "2024/25" -> 2024)
   */
  private extractSeasonYear(season: string): number {
    const match = season.match(/^(\d{4})/)
    if (match) {
      return parseInt(match[1], 10)
    }
    return new Date().getFullYear()
  }

  /**
   * Get player transfers from Airtable record
   */
  async getPlayerTransfers(recordId: string): Promise<PlayerTransfer[]> {
    try {
      const record = await this.getAirtableRecord(recordId)
      if (!record) {
        return []
      }

      const additionalData = getPlayerAdditionalDataFromAirtable(record)
      return additionalData.transfers || []
    } catch (error) {
      console.error("Error getting player transfers:", error)
      return []
    }
  }

  /**
   * Get player injuries from Airtable record
   */
  async getPlayerInjuries(recordId: string): Promise<PlayerInjury[]> {
    try {
      const record = await this.getAirtableRecord(recordId)
      if (!record) {
        return []
      }

      const additionalData = getPlayerAdditionalDataFromAirtable(record)
      let injuries = additionalData.injuries || []
      
      console.log("🏥 Raw injuries data from Airtable:", JSON.stringify(injuries, null, 2))
      console.log("🏥 Injuries type:", typeof injuries, Array.isArray(injuries))
      
      // Convert object format to array format if needed
      // Airtable stores injuries as {season: [injuries]} but we need a flat array
      if (injuries && typeof injuries === 'object' && !Array.isArray(injuries)) {
        console.log("🔄 Converting injuries object to array")
        const injuriesArray: PlayerInjury[] = []
        for (const [season, seasonInjuries] of Object.entries(injuries)) {
          if (Array.isArray(seasonInjuries)) {
            // Convert Airtable format to PlayerInjury format
            const convertedInjuries = (seasonInjuries as any[]).map((injury: any) => {
              // Parse the "From" date to create fixture.date
              const fromDate = injury.From || injury.from || new Date().toISOString()
              
              return {
                player: {
                  id: 0,
                  name: record.fields["Player Name"] || "",
                },
                team: {
                  id: 0,
                  name: record.fields["Current Club"] || "",
                  logo: "",
                },
                fixture: {
                  id: 0,
                  referee: "",
                  timezone: "UTC",
                  date: fromDate,
                  timestamp: new Date(fromDate).getTime() / 1000,
                  venue: {
                    id: 0,
                    name: "",
                    city: "",
                  },
                  status: {
                    long: "Not Started",
                    short: "NS",
                    elapsed: 0,
                  },
                },
                league: {
                  id: 0,
                  season: parseInt(season.split("/")[0]) || 2024,
                  name: "",
                  country: "",
                  logo: "",
                  flag: "",
                  round: "",
                },
                players: [],
                player_id: 0,
                player_name: record.fields["Player Name"] || "",
                reason: injury.Injury || injury.injury || "Unknown",
                coach: {
                  id: 0,
                  name: "",
                  photo: "",
                },
              } as PlayerInjury
            })
            injuriesArray.push(...convertedInjuries)
          }
        }
        console.log("✅ Converted injuries array:", injuriesArray.length, "injuries")
        return injuriesArray
      }
      
      // If it's already an array, return it
      if (Array.isArray(injuries)) {
        return injuries
      }
      
      console.log("⚠️ Injuries is not an array or object, returning empty array")
      return []
    } catch (error) {
      console.error("❌ Error getting player injuries:", error)
      return []
    }
  }

  /**
   * Convert Airtable record to Player type
   */
  private convertToPlayer(record: AirtablePlayerRecord): Player {
    const converted = convertAirtableRecordToPlayer(record)
    const fields = record.fields

    // Parse date of birth
    let dob = ""
    if (fields["Date of Birth"]) {
      const dobParts = fields["Date of Birth"].split("/")
      if (dobParts.length === 3) {
        // Convert DD/MM/YYYY to YYYY-MM-DD
        dob = `${dobParts[2]}-${dobParts[1]}-${dobParts[0]}`
      } else {
        dob = fields["Date of Birth"]
      }
    }

    return {
      id: parseInt(record.id.replace("rec", ""), 36) || 0, // Convert record ID to number
      name: converted.name,
      firstname: converted.firstName,
      lastname: converted.lastName,
      age: converted.age,
      birth: {
        date: dob,
        place: "",
        country: fields["Nationality"] || "",
      },
      nationality: converted.nationality,
      height: fields["Height"] || "",
      weight: fields["Weight"] || "",
      photo: converted.photo,
    }
  }

  /**
   * Get raw Airtable record
   */
  async getAirtableRecord(recordId: string): Promise<AirtablePlayerRecord | null> {
    try {
      const apiKey = process.env.AIRTABLE_API_KEY || process.env.NEXT_PUBLIC_AIRTABLE_API_KEY || ""
      
      if (!apiKey) {
        throw new Error("AIRTABLE_API_KEY is not set. Please add it to your .env.local file.")
      }

      // Use Airtable REST API directly
      const url = `https://api.airtable.com/v0/${this.baseId}/${this.tableId}/${recordId}`
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error(`Airtable API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data || null
    } catch (error) {
      console.error("Error getting Airtable record:", error)
      return null
    }
  }

  /**
   * Get enhanced player information including valuations, strengths, weaknesses
   */
  async getPlayerEnhancedInfo(recordId: string) {
    try {
      const record = await this.getAirtableRecord(recordId)
      if (!record) {
        return null
      }

      const additionalData = getPlayerAdditionalDataFromAirtable(record)
      const stats = getPlayerStatisticsFromAirtable(record)

      return {
        valuations: additionalData.valuations,
        strengths: additionalData.strengths || [],
        weaknesses: additionalData.weaknesses || [],
        positions: this.parsePositions(record.fields["Positions Played"]),
        tfgRating: stats.tfgRating,
        predictedRating: stats.predictedRating,
        contractUntil: record.fields["Contract Until"],
        preferredFoot: record.fields["Preferred Foot"],
      }
    } catch (error) {
      console.error("Error getting enhanced player info:", error)
      return null
    }
  }

  /**
   * Parse positions from Positions Played field
   */
  private parsePositions(positionsStr: string): Array<{
    position: string
    appearances: number
    goals: number
    assists: number
  }> {
    if (!positionsStr) return []

    const positions: Array<{
      position: string
      appearances: number
      goals: number
      assists: number
    }> = []

    // Parse format like "RW (51 apps, 15G, 5A)" or "RW: 51 Apps, 15 Go, 5 As"
    const lines = positionsStr.split("\n").filter(line => line.trim())
    
    for (const line of lines) {
      // Try multiple formats
      const format1 = line.match(/([A-Z]+)\s*\((\d+)\s*apps?[,\s]+(\d+)G[,\s]+(\d+)A\)/i)
      const format2 = line.match(/([A-Z]+):\s*(\d+)\s*Apps?[,\s]+(\d+)\s*Go[,\s]+(\d+)\s*As/i)
      const format3 = line.match(/([A-Z]+)\s+(\d+)\s+(\d+)\s+(\d+)/)

      let match = format1 || format2 || format3
      if (match) {
        positions.push({
          position: match[1],
          appearances: parseInt(match[2] || "0", 10),
          goals: parseInt(match[3] || "0", 10),
          assists: parseInt(match[4] || "0", 10),
        })
      }
    }

    return positions
  }
}

