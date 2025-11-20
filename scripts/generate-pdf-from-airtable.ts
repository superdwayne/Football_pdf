import "server-only"
import { generatePDF } from "@/lib/pdf-generator"
import type { ProcessedPlayerData } from "@/lib/data-processor"

/**
 * Convert Airtable player record to ProcessedPlayerData format
 */
function convertAirtableToProcessedData(record: any): ProcessedPlayerData {
  const fields = record.fields

  // Parse JSON fields
  const leagueAppearancesJson = JSON.parse(fields["League Appearances JSON"] || "{}")
  const injuriesJson = JSON.parse(fields["Injury Record JSON"] || "{}")
  const strengthsJson = JSON.parse(fields["Strengths JSON"] || "{}")
  const weaknessesJson = JSON.parse(fields["Weaknesses JSON"] || "{}")
  const positionsPlayed = fields["Positions Played"] || ""

  // Parse positions
  const positions: { position: string; appearances: number; goals: number; assists: number }[] = []
  if (positionsPlayed) {
    const positionMatch = positionsPlayed.match(/^([^:]+):\s*(\d+)\+?\s*Apps,\s*(\d+)\+?\s*Goals,\s*(\d+)\+?\s*Assists/)
    if (positionMatch) {
      positions.push({
        position: positionMatch[1].trim(),
        appearances: parseInt(positionMatch[2] || "0", 10),
        goals: parseInt(positionMatch[3] || "0", 10),
        assists: parseInt(positionMatch[4] || "0", 10),
      })
    }
  }

  // Convert league appearances
  const leagueAppearances = Object.entries(leagueAppearancesJson).map(([season, data]: [string, any]) => ({
    season,
    competition: data.Competition || "Unknown",
    games: data.Games || 0,
    assists: data.Assists || 0,
    yellowCards: data.Yellow || 0,
    secondYellow: 0, // Not in Airtable data
    redCards: data.Red || 0,
    ownGoals: 0, // Not in Airtable data
    minutes: data.Mins || 0,
  }))

  // Convert injuries
  const injuries = Object.entries(injuriesJson).flatMap(([season, injuryList]: [string, any]) => {
    if (!Array.isArray(injuryList)) return []
    return injuryList.map((injury: any) => ({
      season,
      injury: injury.Injury || "Unknown",
      from: injury.From || "",
      until: injury.Until || "",
      days: injury.Days || 0,
      gamesMissed: injury["Games Missed"] || 0,
    }))
  })

  // Convert strengths
  const strengths = Object.entries(strengthsJson).map(([category, percentileStr]: [string, any]) => {
    const percentileMatch = String(percentileStr).match(/(\d+)th percentile/)
    return {
      category,
      percentile: percentileMatch ? parseInt(percentileMatch[1], 10) : 0,
    }
  })

  // Convert weaknesses
  const weaknesses = Object.entries(weaknessesJson).map(([category, percentileStr]: [string, any]) => {
    const percentileMatch = String(percentileStr).match(/(\d+)th percentile/)
    return {
      category,
      percentile: percentileMatch ? parseInt(percentileMatch[1], 10) : 0,
    }
  })

  // Calculate totals from league appearances
  const totalGames = leagueAppearances.reduce((sum, app) => sum + app.games, 0)
  const totalAssists = leagueAppearances.reduce((sum, app) => sum + app.assists, 0)
  const totalYellowCards = leagueAppearances.reduce((sum, app) => sum + app.yellowCards, 0)
  const totalRedCards = leagueAppearances.reduce((sum, app) => sum + app.redCards, 0)
  const totalMinutes = leagueAppearances.reduce((sum, app) => sum + app.minutes, 0)

  // Extract goals from positions or use default
  const totalGoals = positions.reduce((sum, pos) => sum + pos.goals, 0)

  // Parse date of birth
  const dob = fields["Date of Birth"] || ""
  const dobFormatted = dob ? dob : "N/A"

  // Get photo URL (use a placeholder if not available)
  const photo = fields["Photo URL"] || "https://via.placeholder.com/150"

  return {
    profile: {
      name: fields["Player Name"] || "",
      firstName: fields["First Name"] || "",
      lastName: fields["Last Name"] || "",
      age: parseInt(fields["Age"] || "0", 10),
      dob: dobFormatted,
      height: fields["Height"] || "N/A",
      weight: fields["Weight"] || "N/A",
      nationality: fields["Nationality"] || "",
      preferredFoot: fields["Preferred Foot"] || null,
      photo,
      currentTeam: fields["Current Club"]
        ? {
            id: 0, // Not in Airtable
            name: fields["Current Club"],
            logo: "", // Not in Airtable
          }
        : null,
    },
    positions,
    leagueAppearances,
    statistics: {
      totalGames,
      totalGoals,
      totalAssists,
      totalYellowCards,
      totalRedCards,
      totalMinutes,
      averageRating: parseFloat(fields["Average Rating"] || "0"),
    },
    transfers: [], // Not in Airtable data structure
    injuries,
    strengths,
    weaknesses,
  }
}

/**
 * Generate PDF for a player from Airtable record
 */
export async function generatePDFFromAirtableRecord(record: any): Promise<Buffer> {
  console.log("Converting Airtable data to processed format...")
  const processedData = convertAirtableToProcessedData(record)
  
  console.log("Generating PDF for:", processedData.profile.name)
  const pdfBuffer = await generatePDF(processedData)
  
  return pdfBuffer
}




