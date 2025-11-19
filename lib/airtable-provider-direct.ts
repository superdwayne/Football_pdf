// Direct Airtable Provider - Uses MCP functions directly
// This version is designed to work when MCP is available in the context

import type { Player, PlayerStatistics, PlayerTransfer, PlayerInjury } from "@/types/player"
import {
  convertAirtableRecordToPlayer,
  getPlayerStatisticsFromAirtable,
  getPlayerAdditionalDataFromAirtable,
  type AirtablePlayerRecord,
} from "./airtable-data-source"

const AIRTABLE_BASE_ID = "appLkDMJZrxnOCpPF"
const AIRTABLE_TABLE_ID = "tblwfa8UVh8Uoigp5" // Football Players table

/**
 * Direct Airtable Provider - Uses MCP functions directly
 * 
 * This provider is designed to work when MCP functions are available.
 * It converts Airtable records to the Player type format.
 */
export class AirtableProviderDirect {
  private baseId: string
  private tableId: string

  constructor(baseId: string = AIRTABLE_BASE_ID, tableId: string = AIRTABLE_TABLE_ID) {
    this.baseId = baseId
    this.tableId = tableId
  }

  /**
   * Convert Airtable search results to Player array
   */
  convertSearchResults(records: AirtablePlayerRecord[]): Player[] {
    return records.map((record) => this.convertToPlayer(record))
  }

  /**
   * Convert Airtable record to Player type
   */
  convertToPlayer(record: AirtablePlayerRecord): Player {
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
      id: parseInt(record.id.replace("rec", ""), 36) || 0,
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
      injured: false,
      photo: converted.photo,
    }
  }

  /**
   * Get player statistics from Airtable record
   */
  getStatistics(record: AirtablePlayerRecord): PlayerStatistics[] {
    const stats = getPlayerStatisticsFromAirtable(record)
    const additionalData = getPlayerAdditionalDataFromAirtable(record)

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
          season: 0,
        },
        games: {
          appearences: stats.totalGames,
          lineups: stats.totalGames,
          minutes: stats.totalMinutes,
          number: null,
          position: "Unknown",
          rating: stats.averageRating.toString(),
          captain: false,
        },
        substitutes: {
          in: 0,
          out: 0,
          bench: 0,
        },
        shots: {
          total: 0,
          on: 0,
        },
        goals: {
          total: stats.totalGoals,
          conceded: 0,
          assists: stats.totalAssists,
          saves: 0,
        },
        passes: {
          total: 0,
          key: 0,
          accuracy: 0,
        },
        tackles: {
          total: 0,
          blocks: 0,
          interceptions: 0,
        },
        duels: {
          total: 0,
          won: 0,
        },
        dribbles: {
          attempts: 0,
          success: 0,
        },
        fouls: {
          drawn: 0,
          committed: 0,
        },
        cards: {
          yellow: stats.totalYellowCards,
          yellowred: 0,
          red: stats.totalRedCards,
        },
        penalty: {
          won: 0,
          commited: 0,
          scored: 0,
          missed: 0,
          saved: 0,
        },
      },
    ]
  }

  /**
   * Get transfers from Airtable record
   */
  getTransfers(record: AirtablePlayerRecord): PlayerTransfer[] {
    const additionalData = getPlayerAdditionalDataFromAirtable(record)
    return additionalData.transfers || []
  }

  /**
   * Get injuries from Airtable record
   */
  getInjuries(record: AirtablePlayerRecord): PlayerInjury[] {
    const additionalData = getPlayerAdditionalDataFromAirtable(record)
    return additionalData.injuries || []
  }
}

