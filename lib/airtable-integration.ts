import { processPlayerData } from "./data-processor"
import type { ProcessedPlayerData } from "./data-processor"
import type { Player, PlayerStatistics } from "@/types/player"

const AIRTABLE_BASE_ID = "appLkDMJZrxnOCpPF"
const AIRTABLE_TABLE_ID = "tblwfa8UVh8Uoigp5" // Football Players table

interface AirtableAttachment {
  url: string
  filename?: string
  type?: string
}

interface AirtablePlayerRecord {
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
  "Player Photo"?: AirtableAttachment[]
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
}

export function formatPlayerDataForAirtable(
  processedData: ProcessedPlayerData,
  player: Player,
  statistics: PlayerStatistics[]
): AirtablePlayerRecord {
  // Calculate predicted rating (simple projection based on current rating)
  const predictedRating = Math.round(
    processedData.statistics.averageRating * 10 + 50
  )

  // Format positions
  const positionsStr = processedData.positions
    .map((p) => `${p.position} (${p.appearances} apps, ${p.goals}G, ${p.assists}A)`)
    .join("\n")

  // Format league appearances
  const leagueAppearancesStr = JSON.stringify(
    processedData.leagueAppearances,
    null,
    2
  )

  // Format injury record
  const injuryRecordStr = JSON.stringify(processedData.injuries, null, 2)

  // Format transfer history
  const transferHistoryStr = JSON.stringify(processedData.transfers, null, 2)

  // Format performance data
  const performanceDataStr = JSON.stringify(
    {
      totalGames: processedData.statistics.totalGames,
      totalGoals: processedData.statistics.totalGoals,
      totalAssists: processedData.statistics.totalAssists,
      totalYellowCards: processedData.statistics.totalYellowCards,
      totalRedCards: processedData.statistics.totalRedCards,
      totalMinutes: processedData.statistics.totalMinutes,
      averageRating: processedData.statistics.averageRating,
    },
    null,
    2
  )

  // Format strengths
  const strengthsStr = JSON.stringify(processedData.strengths, null, 2)

  // Format weaknesses
  const weaknessesStr = JSON.stringify(processedData.weaknesses, null, 2)

  // Get contract info from statistics or transfers
  const currentTeam = processedData.profile.currentTeam
  const contractUntil = "N/A" // API doesn't provide this directly

  // Calculate valuations (mock/estimated based on statistics)
  const baseValue = processedData.statistics.averageRating * 200000 // Simple calculation
  const transfermarktValue = baseValue * 0.5
  const tfgIntrinsicValue = baseValue * 1.2
  const premierLeagueValue = baseValue * 1.1
  const laLigaValue = baseValue * 0.6
  const serieAValue = baseValue * 0.8
  const bundesligaValue = baseValue * 0.7
  const ligue1Value = baseValue * 0.7
  const splValue = baseValue * 1.5 // Higher for SPL

  const photoUrl = processedData.profile.photo || player.photo || ""

  const attachment: AirtableAttachment[] | undefined = photoUrl
    ? [
        {
          url: photoUrl,
          filename: `${processedData.profile.name.replace(/\s+/g, "_")}_photo.jpg`,
        },
      ]
    : undefined

  return {
    "Player Name": processedData.profile.name,
    "First Name": processedData.profile.firstName,
    "Last Name": processedData.profile.lastName,
    "Date of Birth": processedData.profile.dob,
    "Age": String(processedData.profile.age),
    "Height": processedData.profile.height,
    "Weight": processedData.profile.weight,
    "Nationality": processedData.profile.nationality,
    "Preferred Foot": processedData.profile.preferredFoot || "N/A",
    "Photo URL": photoUrl,
    "Player Photo": attachment,
    "Current Club": currentTeam?.name || "N/A",
    "Contract Until": contractUntil,
    "TFG Player Rating": String(Math.round(processedData.statistics.averageRating * 10)),
    "Predicted 2028 Rating": String(predictedRating),
    "Total Games": String(processedData.statistics.totalGames),
    "Total Goals": String(processedData.statistics.totalGoals),
    "Total Assists": String(processedData.statistics.totalAssists),
    "Total Yellow Cards": String(processedData.statistics.totalYellowCards),
    "Total Red Cards": String(processedData.statistics.totalRedCards),
    "Total Minutes": String(processedData.statistics.totalMinutes),
    "Average Rating": String(processedData.statistics.averageRating),
    "Transfermarkt Value EUR": String(Math.round(transfermarktValue / 1000000 * 10) / 10) + "M",
    "TFG Intrinsic Value EUR": String(Math.round(tfgIntrinsicValue / 1000000 * 10) / 10) + "M",
    "Premier League Value EUR": String(Math.round(premierLeagueValue / 1000000 * 10) / 10) + "M",
    "La Liga Value EUR": String(Math.round(laLigaValue / 1000000 * 10) / 10) + "M",
    "Serie A Value EUR": String(Math.round(serieAValue / 1000000 * 10) / 10) + "M",
    "Bundesliga Value EUR": String(Math.round(bundesligaValue / 1000000 * 10) / 10) + "M",
    "Ligue 1 Value EUR": String(Math.round(ligue1Value / 1000000 * 10) / 10) + "M",
    "SPL Value EUR": String(Math.round(splValue / 1000000 * 10) / 10) + "M",
    "Positions Played": positionsStr,
    "League Appearances JSON": leagueAppearancesStr,
    "Injury Record JSON": injuryRecordStr,
    "Transfer History JSON": transferHistoryStr,
    "Performance Data JSON": performanceDataStr,
    "Strengths JSON": strengthsStr,
    "Weaknesses JSON": weaknessesStr,
    "Last Updated": new Date().toISOString(),
  }
}

export async function savePlayerToAirtable(
  processedData: ProcessedPlayerData,
  player: Player,
  statistics: PlayerStatistics[]
): Promise<string | null> {
  try {
    const recordData = formatPlayerDataForAirtable(
      processedData,
      player,
      statistics
    )

    // Use the Airtable MCP to create the record
    // Note: We'll need to create an API route that uses the MCP
    const response = await fetch("/api/airtable/save-player", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        baseId: AIRTABLE_BASE_ID,
        tableId: AIRTABLE_TABLE_ID,
        fields: recordData,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to save to Airtable: ${response.statusText}`)
    }

    const data = await response.json()
    return data.recordId || null
  } catch (error) {
    console.error("Error saving player to Airtable:", error)
    return null
  }
}




