// Batch script to scrape multiple players from Transfermarkt and save to Airtable
// This script uses browser MCP for scraping and Airtable MCP for saving

const AIRTABLE_BASE_ID = "appLkDMJZrxnOCpPF"
const AIRTABLE_TABLE_ID = "tblwfa8UVh8Uoigp5"

// List of popular players to scrape
const PLAYERS_TO_SCRAPE = [
  { name: "Lamine Yamal", url: "https://www.transfermarkt.com/lamine-yamal/profil/spieler/937958" },
  { name: "Kylian Mbappé", url: "https://www.transfermarkt.com/kylian-mbappe/profil/spieler/342229" },
  { name: "Erling Haaland", url: "https://www.transfermarkt.com/erling-haaland/profil/spieler/418560" },
  { name: "Jude Bellingham", url: "https://www.transfermarkt.com/jude-bellingham/profil/spieler/433177" },
  { name: "Vinicius Junior", url: "https://www.transfermarkt.com/vinicius-junior/profil/spieler/371998" },
  { name: "Phil Foden", url: "https://www.transfermarkt.com/phil-foden/profil/spieler/357662" },
  { name: "Bukayo Saka", url: "https://www.transfermarkt.com/bukayo-saka/profil/spieler/433177" },
  { name: "Pedri", url: "https://www.transfermarkt.com/pedri/profil/spieler/504105" },
  { name: "Gavi", url: "https://www.transfermarkt.com/gavi/profil/spieler/504105" },
  { name: "Jamal Musiala", url: "https://www.transfermarkt.com/jamal-musiala/profil/spieler/504105" },
]

/**
 * Convert scraped data to Airtable format
 */
function convertToAirtableFormat(scrapedData: any): Record<string, any> {
  // Calculate totals
  const totalGames = (scrapedData.statistics || []).reduce((sum: number, stat: any) => sum + (stat.games || 0), 0)
  const totalGoals = (scrapedData.statistics || []).reduce((sum: number, stat: any) => sum + (stat.goals || 0), 0)
  const totalAssists = (scrapedData.statistics || []).reduce((sum: number, stat: any) => sum + (stat.assists || 0), 0)
  const totalYellowCards = (scrapedData.statistics || []).reduce((sum: number, stat: any) => sum + (stat.yellowCards || 0), 0)
  const totalRedCards = (scrapedData.statistics || []).reduce((sum: number, stat: any) => sum + (stat.redCards || 0), 0)
  const totalMinutes = (scrapedData.statistics || []).reduce((sum: number, stat: any) => sum + (stat.minutes || 0), 0)

  // Format positions
  const positionsStr = (scrapedData.positions || []).join(', ')

  // Format league appearances JSON
  const leagueAppearances = (scrapedData.statistics || []).map((stat: any) => ({
    season: stat.season,
    competition: stat.competition,
    games: stat.games || 0,
    assists: stat.assists || 0,
    yellowCards: stat.yellowCards || 0,
    secondYellow: 0,
    redCards: stat.redCards || 0,
    ownGoals: 0,
    minutes: stat.minutes || 0
  }))

  // Format performance data JSON
  const averageRating = totalGames > 0 ? ((totalGoals + totalAssists) / totalGames * 10) : 0
  const performanceData = {
    totalGames,
    totalGoals,
    totalAssists,
    totalYellowCards,
    totalRedCards,
    totalMinutes,
    averageRating: Math.round(averageRating * 10) / 10
  }

  // Parse market value
  const marketValueMatch = (scrapedData.marketValue || '').match(/€\s*([\d.]+)\s*([km])?/i)
  let marketValueNum = 0
  if (marketValueMatch) {
    marketValueNum = parseFloat(marketValueMatch[1])
    if (marketValueMatch[2]?.toLowerCase() === 'm') {
      marketValueNum *= 1000000
    } else if (marketValueMatch[2]?.toLowerCase() === 'k') {
      marketValueNum *= 1000
    }
  }

  // Calculate valuations
  const baseValue = marketValueNum || (totalGoals + totalAssists) * 200000
  const tfgIntrinsicValue = baseValue * 1.2
  const premierLeagueValue = baseValue * 1.1
  const laLigaValue = baseValue * 0.6
  const serieAValue = baseValue * 0.8
  const bundesligaValue = baseValue * 0.7
  const ligue1Value = baseValue * 0.7
  const splValue = baseValue * 1.5

  return {
    "Player Name": scrapedData.name || '',
    "First Name": scrapedData.firstName || '',
    "Last Name": scrapedData.lastName || '',
    "Date of Birth": scrapedData.dob || '',
    "Age": scrapedData.age?.toString() || '',
    "Height": scrapedData.height || '',
    "Weight": scrapedData.weight || '',
    "Nationality": scrapedData.nationality || '',
    "Preferred Foot": scrapedData.preferredFoot || '',
    "Photo URL": scrapedData.photo || '',
    "Current Club": scrapedData.currentClub || '',
    "Contract Until": scrapedData.contractUntil || '',
    "TFG Player Rating": String(Math.round(averageRating)),
    "Predicted 2028 Rating": String(Math.round(averageRating * 1.15)),
    "Total Games": String(totalGames),
    "Total Goals": String(totalGoals),
    "Total Assists": String(totalAssists),
    "Total Yellow Cards": String(totalYellowCards),
    "Total Red Cards": String(totalRedCards),
    "Total Minutes": String(totalMinutes),
    "Average Rating": String(averageRating.toFixed(1)),
    "Transfermarkt Value EUR": scrapedData.marketValue || '',
    "TFG Intrinsic Value EUR": String(Math.round(tfgIntrinsicValue / 1000000 * 10) / 10) + "M",
    "Premier League Value EUR": String(Math.round(premierLeagueValue / 1000000 * 10) / 10) + "M",
    "La Liga Value EUR": String(Math.round(laLigaValue / 1000000 * 10) / 10) + "M",
    "Serie A Value EUR": String(Math.round(serieAValue / 1000000 * 10) / 10) + "M",
    "Bundesliga Value EUR": String(Math.round(bundesligaValue / 1000000 * 10) / 10) + "M",
    "Ligue 1 Value EUR": String(Math.round(ligue1Value / 1000000 * 10) / 10) + "M",
    "SPL Value EUR": String(Math.round(splValue / 1000000 * 10) / 10) + "M",
    "Positions Played": positionsStr,
    "League Appearances JSON": JSON.stringify(leagueAppearances, null, 2),
    "Injury Record JSON": JSON.stringify([], null, 2),
    "Transfer History JSON": JSON.stringify([], null, 2),
    "Performance Data JSON": JSON.stringify(performanceData, null, 2),
    "Strengths JSON": JSON.stringify([], null, 2),
    "Weaknesses JSON": JSON.stringify([], null, 2),
    "Last Updated": new Date().toISOString()
  }
}

/**
 * Instructions for scraping and saving players
 * This function provides step-by-step instructions for using browser MCP and Airtable MCP
 */
export function getScrapingInstructions() {
  return {
    steps: [
      {
        step: 1,
        action: "For each player in PLAYERS_TO_SCRAPE",
        details: "Navigate to player URL using browser MCP navigate"
      },
      {
        step: 2,
        action: "Extract player data",
        details: "Use browser MCP evaluate with the extraction function to get all player data"
      },
      {
        step: 3,
        action: "Convert to Airtable format",
        details: "Use convertToAirtableFormat function to format the scraped data"
      },
      {
        step: 4,
        action: "Save to Airtable",
        details: "Use Airtable MCP create_record to save the formatted data"
      },
      {
        step: 5,
        action: "Check for existing record",
        details: "Use Airtable MCP search_records to check if player exists, then update if needed"
      }
    ],
    players: PLAYERS_TO_SCRAPE
  }
}




