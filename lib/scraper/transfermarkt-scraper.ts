// Transfermarkt Scraper - Extracts comprehensive player data
// This module provides functions to scrape player data from Transfermarkt

export interface ScrapedPlayerData {
  name: string
  firstName: string
  lastName: string
  age: number | null
  dob: string
  height: string
  weight: string
  nationality: string
  preferredFoot: string
  photo: string
  currentClub: string
  contractUntil: string
  marketValue: string
  positions: string[]
  statistics: Array<{
    season: string
    competition: string
    games: number
    goals: number
    assists: number
    yellowCards: number
    redCards: number
    minutes: number
  }>
  transfers: Array<{
    date: string
    from: string
    to: string
    fee: string
  }>
  injuries: Array<{
    season: string
    injury: string
    from: string
    until: string
    days: number
    gamesMissed: number
  }>
}

/**
 * Extract player data from Transfermarkt page using browser evaluation
 */
export function extractPlayerDataFromPage(): ScrapedPlayerData {
  const playerData: ScrapedPlayerData = {
    name: '',
    firstName: '',
    lastName: '',
    age: null,
    dob: '',
    height: '',
    weight: '',
    nationality: '',
    preferredFoot: '',
    photo: '',
    currentClub: '',
    contractUntil: '',
    marketValue: '',
    positions: [],
    statistics: [],
    transfers: [],
    injuries: []
  }

  // Get player name
  const nameElement = document.querySelector('h1.data-header__headline-wrapper')
  if (nameElement) {
    playerData.name = nameElement.textContent?.trim() || ''
    const nameParts = playerData.name.split(' ')
    playerData.firstName = nameParts[0] || ''
    playerData.lastName = nameParts.slice(1).join(' ') || ''
  }

  // Get player photo
  const photoElement = document.querySelector('.data-header__profile-image img')
  if (photoElement) {
    playerData.photo = (photoElement as HTMLImageElement).src || 
                      photoElement.getAttribute('data-src') || ''
  }

  // Extract info table data
  const infoTable = document.querySelector('.info-table')
  if (infoTable) {
    const rows = infoTable.querySelectorAll('tr')
    rows.forEach(row => {
      const label = row.querySelector('th')?.textContent?.trim() || ''
      const value = row.querySelector('td')?.textContent?.trim() || ''
      
      if (label.includes('Date of birth') || label.includes('Born')) {
        playerData.dob = value
        // Calculate age
        const dobMatch = value.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/)
        if (dobMatch) {
          const birthDate = new Date(
            parseInt(dobMatch[3]), 
            parseInt(dobMatch[2]) - 1, 
            parseInt(dobMatch[1])
          )
          const today = new Date()
          playerData.age = today.getFullYear() - birthDate.getFullYear()
        }
      } else if (label.includes('Height')) {
        playerData.height = value
      } else if (label.includes('Weight')) {
        playerData.weight = value
      } else if (label.includes('Citizenship') || label.includes('Nationality')) {
        playerData.nationality = value
      } else if (label.includes('Foot') || label.includes('Preferred foot')) {
        playerData.preferredFoot = value
      } else if (label.includes('Contract') || label.includes('Contract expires')) {
        playerData.contractUntil = value
      }
    })
  }

  // Get current club
  const clubElement = document.querySelector('.data-header__club-info a')
  if (clubElement) {
    playerData.currentClub = clubElement.textContent?.trim() || ''
  }

  // Get market value
  const marketValueElement = document.querySelector(
    '.data-header__market-value-wrapper .data-header__market-value'
  )
  if (marketValueElement) {
    playerData.marketValue = marketValueElement.textContent?.trim() || ''
  }

  // Get positions
  const positionElements = document.querySelectorAll('.detail-position__position')
  positionElements.forEach(el => {
    const position = el.textContent?.trim() || ''
    if (position) playerData.positions.push(position)
  })

  // Extract statistics from performance table
  const statsTable = document.querySelector('.items tbody')
  if (statsTable) {
    const rows = statsTable.querySelectorAll('tr')
    rows.forEach(row => {
      const cells = row.querySelectorAll('td')
      if (cells.length >= 8) {
        const season = cells[0]?.textContent?.trim() || ''
        const competition = cells[1]?.textContent?.trim() || ''
        const games = parseInt(cells[2]?.textContent?.trim() || '0', 10)
        const goals = parseInt(cells[3]?.textContent?.trim() || '0', 10)
        const assists = parseInt(cells[4]?.textContent?.trim() || '0', 10)
        const yellowCards = parseInt(cells[5]?.textContent?.trim() || '0', 10)
        const redCards = parseInt(cells[6]?.textContent?.trim() || '0', 10)
        const minutesText = cells[7]?.textContent?.trim() || '0'
        const minutes = parseInt(minutesText.replace(/[^\d]/g, ''), 10)

        if (season && competition) {
          playerData.statistics.push({
            season,
            competition,
            games,
            goals,
            assists,
            yellowCards,
            redCards,
            minutes
          })
        }
      }
    })
  }

  return playerData
}

/**
 * Convert scraped data to Airtable format
 */
export function convertToAirtableFormat(
  scrapedData: ScrapedPlayerData
): Record<string, any> {
  // Calculate totals
  const totalGames = scrapedData.statistics.reduce((sum, stat) => sum + stat.games, 0)
  const totalGoals = scrapedData.statistics.reduce((sum, stat) => sum + stat.goals, 0)
  const totalAssists = scrapedData.statistics.reduce((sum, stat) => sum + stat.assists, 0)
  const totalYellowCards = scrapedData.statistics.reduce((sum, stat) => sum + stat.yellowCards, 0)
  const totalRedCards = scrapedData.statistics.reduce((sum, stat) => sum + stat.redCards, 0)
  const totalMinutes = scrapedData.statistics.reduce((sum, stat) => sum + stat.minutes, 0)

  // Format positions
  const positionsStr = scrapedData.positions.join(', ')

  // Format league appearances JSON
  const leagueAppearances = scrapedData.statistics.map(stat => ({
    season: stat.season,
    competition: stat.competition,
    games: stat.games,
    assists: stat.assists,
    yellowCards: stat.yellowCards,
    secondYellow: 0,
    redCards: stat.redCards,
    ownGoals: 0,
    minutes: stat.minutes
  }))

  // Format transfer history JSON
  const transferHistory = scrapedData.transfers.map(transfer => ({
    date: transfer.date,
    type: 'Transfer',
    from: transfer.from,
    to: transfer.to,
    fee: transfer.fee
  }))

  // Format injury record JSON
  const injuryRecord = scrapedData.injuries.map(injury => ({
    season: injury.season,
    injury: injury.injury,
    from: injury.from,
    until: injury.until,
    days: injury.days,
    gamesMissed: injury.gamesMissed
  }))

  // Format performance data JSON
  const performanceData = {
    totalGames,
    totalGoals,
    totalAssists,
    totalYellowCards,
    totalRedCards,
    totalMinutes,
    averageRating: totalGames > 0 ? (totalGoals + totalAssists) / totalGames * 10 : 0
  }

  // Parse market value
  const marketValueMatch = scrapedData.marketValue.match(/€\s*([\d.]+)\s*([km])?/i)
  let marketValueNum = 0
  if (marketValueMatch) {
    marketValueNum = parseFloat(marketValueMatch[1])
    if (marketValueMatch[2]?.toLowerCase() === 'm') {
      marketValueNum *= 1000000
    } else if (marketValueMatch[2]?.toLowerCase() === 'k') {
      marketValueNum *= 1000
    }
  }

  // Calculate valuations (using market value as base)
  const baseValue = marketValueNum || (totalGoals + totalAssists) * 200000
  const tfgIntrinsicValue = baseValue * 1.2
  const premierLeagueValue = baseValue * 1.1
  const laLigaValue = baseValue * 0.6
  const serieAValue = baseValue * 0.8
  const bundesligaValue = baseValue * 0.7
  const ligue1Value = baseValue * 0.7
  const splValue = baseValue * 1.5

  return {
    "Player Name": scrapedData.name,
    "First Name": scrapedData.firstName,
    "Last Name": scrapedData.lastName,
    "Date of Birth": scrapedData.dob,
    "Age": scrapedData.age?.toString() || "",
    "Height": scrapedData.height,
    "Weight": scrapedData.weight,
    "Nationality": scrapedData.nationality,
    "Preferred Foot": scrapedData.preferredFoot,
    "Photo URL": scrapedData.photo,
    "Current Club": scrapedData.currentClub,
    "Contract Until": scrapedData.contractUntil,
    "TFG Player Rating": String(Math.round(performanceData.averageRating)),
    "Predicted 2028 Rating": String(Math.round(performanceData.averageRating * 1.15)),
    "Total Games": String(totalGames),
    "Total Goals": String(totalGoals),
    "Total Assists": String(totalAssists),
    "Total Yellow Cards": String(totalYellowCards),
    "Total Red Cards": String(totalRedCards),
    "Total Minutes": String(totalMinutes),
    "Average Rating": String(performanceData.averageRating.toFixed(1)),
    "Transfermarkt Value EUR": scrapedData.marketValue,
    "TFG Intrinsic Value EUR": String(Math.round(tfgIntrinsicValue / 1000000 * 10) / 10) + "M",
    "Premier League Value EUR": String(Math.round(premierLeagueValue / 1000000 * 10) / 10) + "M",
    "La Liga Value EUR": String(Math.round(laLigaValue / 1000000 * 10) / 10) + "M",
    "Serie A Value EUR": String(Math.round(serieAValue / 1000000 * 10) / 10) + "M",
    "Bundesliga Value EUR": String(Math.round(bundesligaValue / 1000000 * 10) / 10) + "M",
    "Ligue 1 Value EUR": String(Math.round(ligue1Value / 1000000 * 10) / 10) + "M",
    "SPL Value EUR": String(Math.round(splValue / 1000000 * 10) / 10) + "M",
    "Positions Played": positionsStr,
    "League Appearances JSON": JSON.stringify(leagueAppearances, null, 2),
    "Injury Record JSON": JSON.stringify(injuryRecord, null, 2),
    "Transfer History JSON": JSON.stringify(transferHistory, null, 2),
    "Performance Data JSON": JSON.stringify(performanceData, null, 2),
    "Strengths JSON": JSON.stringify([], null, 2),
    "Weaknesses JSON": JSON.stringify([], null, 2),
    "Last Updated": new Date().toISOString()
  }
}




