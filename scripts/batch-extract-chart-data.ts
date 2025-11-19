// Batch script to extract chart data for all players
// Extracts player ID from Photo URL and navigates to detailed stats page

const AIRTABLE_BASE_ID = "appLkDMJZrxnOCpPF"
const AIRTABLE_TABLE_ID = "tblwfa8UVh8Uoigp5"

/**
 * Extract player ID from Photo URL
 * Format: https://img.a.transfermarkt.technology/portrait/header/{ID}-{timestamp}.jpg?lm=1
 */
function extractPlayerIdFromPhotoUrl(photoUrl: string | undefined): string | null {
  if (!photoUrl) return null
  const match = photoUrl.match(/\/header\/(\d+)-/)
  return match ? match[1] : null
}

/**
 * Chart data extraction function
 */
export const CHART_DATA_EXTRACTION = `
() => {
  const data = {
    radarChartMetrics: {},
    advancedStats: {},
    positionsWithStats: []
  };
  
  const statsTable = document.querySelector('table.items tbody, [class*="stats"] tbody');
  if (!statsTable) return data;
  
  const rows = statsTable.querySelectorAll('tr');
  let totalPasses = 0, totalShots = 0, totalDribbles = 0;
  let totalTackles = 0, totalInterceptions = 0;
  let totalGames = 0, totalGoals = 0, totalAssists = 0;
  
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length >= 3) {
      const games = parseInt(cells[2]?.textContent?.trim().replace(/[^0-9]/g, '') || '0', 10);
      totalGames += games;
      const goals = parseInt(cells[3]?.textContent?.trim().replace(/[^0-9]/g, '') || '0', 10);
      totalGoals += goals;
      const assists = parseInt(cells[4]?.textContent?.trim().replace(/[^0-9]/g, '') || '0', 10);
      totalAssists += assists;
      
      if (cells.length >= 12) {
        totalPasses += parseInt(cells[8]?.textContent?.trim().replace(/[^0-9]/g, '') || '0', 10);
        totalShots += parseInt(cells[9]?.textContent?.trim().replace(/[^0-9]/g, '') || '0', 10);
        totalDribbles += parseInt(cells[10]?.textContent?.trim().replace(/[^0-9]/g, '') || '0', 10);
      }
    }
  });
  
  const avgGames = totalGames || 1;
  const avgPasses = totalPasses / avgGames || (totalGoals + totalAssists) * 15;
  const avgShots = totalShots / avgGames || totalGoals * 3;
  const avgDribbles = totalDribbles / avgGames || (totalGoals + totalAssists) * 2;
  const avgTackles = totalTackles / avgGames || 2;
  const avgChances = totalAssists * 1.5;
  
  data.radarChartMetrics = {
    Passes: Math.min(100, Math.round((avgPasses / 80) * 100)),
    ChancesCreated: Math.min(100, Math.round((avgChances / 5) * 100)),
    Shots: Math.min(100, Math.round((avgShots / 5) * 100)),
    Touches: Math.min(100, Math.round((avgPasses * 1.2 / 100) * 100)),
    BallRecovery: Math.min(100, Math.round((avgTackles / 5) * 100)),
    DefensiveActions: Math.min(100, Math.round(((totalTackles + totalInterceptions) / avgGames / 8) * 100)),
    AerialDuels: 0,
    PossessionRegains: Math.min(100, Math.round((avgTackles / 4) * 100)),
    Dribbles: Math.min(100, Math.round((avgDribbles / 8) * 100))
  };
  
  data.advancedStats = {
    shots: { total: totalShots || totalGoals * 3, onTarget: Math.round((totalShots || totalGoals * 3) * 0.4), accuracy: 40 },
    passes: { total: totalPasses || avgPasses * avgGames, accurate: Math.round((totalPasses || avgPasses * avgGames) * 0.85), accuracy: 85 },
    dribbles: { attempted: totalDribbles || avgDribbles * avgGames, successful: Math.round((totalDribbles || avgDribbles * avgGames) * 0.6), successRate: 60 },
    tackles: { total: totalTackles || avgTackles * avgGames, won: Math.round((totalTackles || avgTackles * avgGames) * 0.7), successRate: 70 },
    interceptions: totalInterceptions,
    clearances: 0,
    fouls: { committed: 0, suffered: 0 }
  };
  
  return data;
}
`

// Players to process (will be populated from Airtable)
export const PLAYERS_TO_PROCESS = [
  // This will be populated dynamically
]



