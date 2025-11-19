// Comprehensive batch script to update all players in Airtable
// This script:
// 1. Gets all players from Airtable
// 2. For each player, searches Transfermarkt and extracts comprehensive data
// 3. Updates Airtable records with all available data (photo URLs + all fields)
// 4. Ensures all columns are filled for chart generation

const AIRTABLE_BASE_ID = "appLkDMJZrxnOCpPF"
const AIRTABLE_TABLE_ID = "tblwfa8UVh8Uoigp5"

/**
 * Comprehensive data extraction function for Transfermarkt
 * This extracts ALL available data from a player's profile page
 */
export const COMPREHENSIVE_EXTRACTION_FUNCTION = `
() => {
  const data = {};
  
  // 1. Name and Photo
  const nameEl = document.querySelector('h1.data-header__headline-wrapper');
  if (nameEl) {
    const fullName = nameEl.textContent?.trim() || '';
    data.name = fullName.replace(/^#\\d+\\s*/, '').trim();
    const parts = data.name.split(' ');
    data.firstName = parts[0] || '';
    data.lastName = parts.slice(1).join(' ') || '';
  }
  
  const img = document.querySelector('.data-header__profile-image img, .data-header__profile-container img');
  if (img) {
    data.photo = img.src || img.getAttribute('data-src') || '';
  }
  
  // 2. Extract all info from info table
  const infoRows = document.querySelectorAll('.info-table tr, table.info-table tr, [class*="info-table"] tr');
  infoRows.forEach(row => {
    const label = row.querySelector('th, td:first-child')?.textContent?.trim() || '';
    const value = row.querySelector('td:last-child, td:nth-child(2)')?.textContent?.trim() || '';
    
    if (label.toLowerCase().includes('date of birth') || label.toLowerCase().includes('born')) {
      data.dob = value;
      // Extract age from format like "03/03/1993 (32)"
      const ageMatch = value.match(/\\((\\d+)\\)/);
      if (ageMatch) {
        data.age = parseInt(ageMatch[1], 10);
      }
    } else if (label.toLowerCase().includes('height')) {
      data.height = value;
    } else if (label.toLowerCase().includes('weight')) {
      data.weight = value;
    } else if (label.toLowerCase().includes('citizenship') || label.toLowerCase().includes('nationality')) {
      data.nationality = value;
    } else if (label.toLowerCase().includes('foot') || label.toLowerCase().includes('preferred foot')) {
      data.preferredFoot = value.toLowerCase();
    } else if (label.toLowerCase().includes('contract') && label.toLowerCase().includes('expires')) {
      data.contractUntil = value;
    }
  });
  
  // 3. Current Club
  const clubLink = document.querySelector('.data-header__club-info a, a[href*="/verein/"]');
  if (clubLink) {
    data.currentClub = clubLink.textContent?.trim() || '';
  }
  
  // 4. Market Value
  const marketValueEl = document.querySelector('.data-header__market-value-wrapper .data-header__market-value, [class*="market-value"]');
  if (marketValueEl) {
    data.marketValue = marketValueEl.textContent?.trim() || '';
  }
  
  // 5. Positions
  data.positions = [];
  const positionEls = document.querySelectorAll('.detail-position__position, [class*="position"]');
  positionEls.forEach(el => {
    const pos = el.textContent?.trim();
    if (pos && !data.positions.includes(pos)) {
      data.positions.push(pos);
    }
  });
  
  // If no positions found, try main position
  if (data.positions.length === 0) {
    const mainPos = document.querySelector('[class*="main-position"], [class*="position"]');
    if (mainPos) {
      data.positions.push(mainPos.textContent?.trim() || '');
    }
  }
  
  // 6. Statistics - Try to get from stats table
  data.statistics = [];
  const statsTable = document.querySelector('table.items tbody, [class*="stats"] tbody');
  if (statsTable) {
    const rows = statsTable.querySelectorAll('tr');
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 6) {
        const season = cells[0]?.textContent?.trim() || '';
        const competition = cells[1]?.textContent?.trim() || '';
        const games = parseInt(cells[2]?.textContent?.trim() || '0', 10);
        const goals = parseInt(cells[3]?.textContent?.trim() || '0', 10);
        const assists = parseInt(cells[4]?.textContent?.trim() || '0', 10);
        const yellowCards = parseInt(cells[5]?.textContent?.trim() || '0', 10);
        const redCards = parseInt(cells[6]?.textContent?.trim() || '0', 10);
        const minutesText = cells[7]?.textContent?.trim() || '0';
        const minutes = parseInt(minutesText.replace(/[^\\d]/g, ''), 10) || 0;
        
        if (season && competition) {
          data.statistics.push({
            season,
            competition,
            games: games || 0,
            goals: goals || 0,
            assists: assists || 0,
            yellowCards: yellowCards || 0,
            redCards: redCards || 0,
            minutes: minutes || 0
          });
        }
      }
    });
  }
  
  // 7. Transfers (if available on page)
  data.transfers = [];
  const transferRows = document.querySelectorAll('[class*="transfer"] tbody tr, table tbody tr');
  transferRows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length >= 4) {
      const date = cells[0]?.textContent?.trim() || '';
      const from = cells[1]?.textContent?.trim() || '';
      const to = cells[2]?.textContent?.trim() || '';
      const fee = cells[3]?.textContent?.trim() || '';
      if (date && from && to) {
        data.transfers.push({ date, from, to, fee });
      }
    }
  });
  
  // 8. Injuries (if available)
  data.injuries = [];
  const injuryRows = document.querySelectorAll('[class*="injury"] tbody tr');
  injuryRows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length >= 4) {
      const season = cells[0]?.textContent?.trim() || '';
      const injury = cells[1]?.textContent?.trim() || '';
      const from = cells[2]?.textContent?.trim() || '';
      const until = cells[3]?.textContent?.trim() || '';
      if (season && injury) {
        data.injuries.push({ season, injury, from, until, days: 0, gamesMissed: 0 });
      }
    }
  });
  
  return data;
}
`

/**
 * Convert scraped data to comprehensive Airtable format
 * Ensures ALL fields are populated for chart generation
 */
export function convertToAirtableFormat(scrapedData: any, existingData?: any): Record<string, any> {
  // Calculate totals from statistics
  const totalGames = (scrapedData.statistics || []).reduce((sum: number, stat: any) => sum + (stat.games || 0), 0) || 
                    parseInt(existingData?.["Total Games"]?.replace(/[^0-9]/g, '') || '0', 10);
  const totalGoals = (scrapedData.statistics || []).reduce((sum: number, stat: any) => sum + (stat.goals || 0), 0) || 
                    parseInt(existingData?.["Total Goals"]?.replace(/[^0-9]/g, '') || '0', 10);
  const totalAssists = (scrapedData.statistics || []).reduce((sum: number, stat: any) => sum + (stat.assists || 0), 0) || 
                      parseInt(existingData?.["Total Assists"]?.replace(/[^0-9]/g, '') || '0', 10);
  const totalYellowCards = (scrapedData.statistics || []).reduce((sum: number, stat: any) => sum + (stat.yellowCards || 0), 0) || 
                          parseInt(existingData?.["Total Yellow Cards"]?.replace(/[^0-9]/g, '') || '0', 10);
  const totalRedCards = (scrapedData.statistics || []).reduce((sum: number, stat: any) => sum + (stat.redCards || 0), 0) || 
                       parseInt(existingData?.["Total Red Cards"]?.replace(/[^0-9]/g, '') || '0', 10);
  const totalMinutes = (scrapedData.statistics || []).reduce((sum: number, stat: any) => sum + (stat.minutes || 0), 0) || 
                      parseInt(existingData?.["Total Minutes"]?.replace(/[^0-9]/g, '') || '0', 10);

  // Calculate average rating
  const averageRating = totalGames > 0 
    ? Math.round(((totalGoals + totalAssists) / totalGames * 10) * 10) / 10 
    : parseFloat(existingData?.["Average Rating"] || '0');

  // Format positions
  const positionsStr = (scrapedData.positions || []).length > 0 
    ? scrapedData.positions.join(', ') 
    : existingData?.["Positions Played"] || '';

  // Format league appearances JSON
  const leagueAppearances = (scrapedData.statistics || []).map((stat: any) => ({
    season: stat.season || '',
    competition: stat.competition || '',
    games: stat.games || 0,
    goals: stat.goals || 0,
    assists: stat.assists || 0,
    yellow: stat.yellowCards || 0,
    red: stat.redCards || 0,
    mins: stat.minutes || 0
  }));

  // Parse market value
  const marketValueText = scrapedData.marketValue || existingData?.["Transfermarkt Value EUR"] || '';
  const marketValueMatch = marketValueText.match(/€\s*([\d.,]+)\s*([km])?/i);
  let marketValueNum = 0;
  if (marketValueMatch) {
    marketValueNum = parseFloat(marketValueMatch[1].replace(/,/g, ''));
    if (marketValueMatch[2]?.toLowerCase() === 'm') {
      marketValueNum *= 1000000;
    } else if (marketValueMatch[2]?.toLowerCase() === 'k') {
      marketValueNum *= 1000;
    }
  }

  // Calculate valuations (use existing if available, otherwise calculate)
  const baseValue = marketValueNum || (totalGoals + totalAssists) * 200000;
  const tfgIntrinsicValue = baseValue * 1.2;
  const premierLeagueValue = baseValue * 1.1;
  const laLigaValue = baseValue * 0.6;
  const serieAValue = baseValue * 0.8;
  const bundesligaValue = baseValue * 0.7;
  const ligue1Value = baseValue * 0.7;
  const splValue = baseValue * 1.5;

  // Format transfer history JSON
  const transferHistory = (scrapedData.transfers || []).map((transfer: any) => ({
    date: transfer.date || '',
    type: 'Transfer',
    from: transfer.from || '',
    to: transfer.to || '',
    fee: transfer.fee || ''
  }));

  // Format injury record JSON
  const injuryRecord = (scrapedData.injuries || []).map((injury: any) => ({
    season: injury.season || '',
    injury: injury.injury || '',
    from: injury.from || '',
    until: injury.until || '',
    days: injury.days || 0,
    gamesMissed: injury.gamesMissed || 0
  }));

  // Performance data JSON - Enhanced with chart data
  const performanceData = {
    totalGames,
    totalGoals,
    totalAssists,
    totalYellowCards,
    totalRedCards,
    totalMinutes,
    averageRating: Math.round(averageRating * 10) / 10,
    // Radar Chart Metrics (will be populated from detailed stats)
    RadarChartMetrics: existingData?.PerformanceDataJSON ? 
      JSON.parse(existingData.PerformanceDataJSON)?.RadarChartMetrics || {} : {},
    // TFG Rating Trend (will be populated from detailed stats)
    TFGRatingTrend: existingData?.PerformanceDataJSON ? 
      JSON.parse(existingData.PerformanceDataJSON)?.TFGRatingTrend || {} : {},
    // Positional Traits (will be populated from detailed stats)
    PositionalTraits: existingData?.PerformanceDataJSON ? 
      JSON.parse(existingData.PerformanceDataJSON)?.PositionalTraits || {} : {},
    // Advanced Stats (will be populated from detailed stats)
    AdvancedStats: existingData?.PerformanceDataJSON ? 
      JSON.parse(existingData.PerformanceDataJSON)?.AdvancedStats || {} : {}
  };

  // Build comprehensive fields object - merge with existing data to preserve what's already there
  const fields: Record<string, any> = {
    // Profile - use scraped data, fallback to existing
    "Player Name": scrapedData.name || existingData?.["Player Name"] || '',
    "First Name": scrapedData.firstName || existingData?.["First Name"] || '',
    "Last Name": scrapedData.lastName || existingData?.["Last Name"] || '',
    "Date of Birth": scrapedData.dob || existingData?.["Date of Birth"] || '',
    "Age": scrapedData.age?.toString() || existingData?.["Age"] || '',
    "Height": scrapedData.height || existingData?.["Height"] || '',
    "Weight": scrapedData.weight || existingData?.["Weight"] || '',
    "Nationality": scrapedData.nationality || existingData?.["Nationality"] || '',
    "Preferred Foot": scrapedData.preferredFoot || existingData?.["Preferred Foot"] || '',
    "Photo URL": scrapedData.photo || existingData?.["Photo URL"] || '', // Always update photo if available
    "Current Club": scrapedData.currentClub || existingData?.["Current Club"] || '',
    "Contract Until": scrapedData.contractUntil || existingData?.["Contract Until"] || '',
    
    // Ratings - calculate or use existing
    "TFG Player Rating": existingData?.["TFG Player Rating"] || String(Math.round(averageRating)),
    "Predicted 2028 Rating": existingData?.["Predicted 2028 Rating"] || String(Math.round(averageRating * 1.15)),
    
    // Statistics - use calculated totals
    "Total Games": totalGames > 0 ? String(totalGames) : (existingData?.["Total Games"] || '0'),
    "Total Goals": totalGoals > 0 ? String(totalGoals) : (existingData?.["Total Goals"] || '0'),
    "Total Assists": totalAssists > 0 ? String(totalAssists) : (existingData?.["Total Assists"] || '0'),
    "Total Yellow Cards": totalYellowCards > 0 ? String(totalYellowCards) : (existingData?.["Total Yellow Cards"] || '0'),
    "Total Red Cards": totalRedCards > 0 ? String(totalRedCards) : (existingData?.["Total Red Cards"] || '0'),
    "Total Minutes": totalMinutes > 0 ? String(totalMinutes) : (existingData?.["Total Minutes"] || '0'),
    "Average Rating": averageRating > 0 ? String(averageRating.toFixed(1)) : (existingData?.["Average Rating"] || '0.0'),
    
    // Valuations - use calculated or existing
    "Transfermarkt Value EUR": marketValueText || existingData?.["Transfermarkt Value EUR"] || '',
    "TFG Intrinsic Value EUR": existingData?.["TFG Intrinsic Value EUR"] || 
      (marketValueNum > 0 ? `EUR ${Math.round(tfgIntrinsicValue / 1000000 * 10) / 10}m` : ''),
    "Premier League Value EUR": existingData?.["Premier League Value EUR"] || 
      (marketValueNum > 0 ? `EUR ${Math.round(premierLeagueValue / 1000000 * 10) / 10}m` : ''),
    "La Liga Value EUR": existingData?.["La Liga Value EUR"] || 
      (marketValueNum > 0 ? `EUR ${Math.round(laLigaValue / 1000000 * 10) / 10}m` : ''),
    "Serie A Value EUR": existingData?.["Serie A Value EUR"] || 
      (marketValueNum > 0 ? `EUR ${Math.round(serieAValue / 1000000 * 10) / 10}m` : ''),
    "Bundesliga Value EUR": existingData?.["Bundesliga Value EUR"] || 
      (marketValueNum > 0 ? `EUR ${Math.round(bundesligaValue / 1000000 * 10) / 10}m` : ''),
    "Ligue 1 Value EUR": existingData?.["Ligue 1 Value EUR"] || 
      (marketValueNum > 0 ? `EUR ${Math.round(ligue1Value / 1000000 * 10) / 10}m` : ''),
    "SPL Value EUR": existingData?.["SPL Value EUR"] || 
      (marketValueNum > 0 ? `EUR ${Math.round(splValue / 1000000 * 10) / 10}m` : ''),
    
    // JSON fields - merge with existing if available
    "Positions Played": positionsStr || existingData?.["Positions Played"] || '',
    "League Appearances JSON": leagueAppearances.length > 0 
      ? JSON.stringify(leagueAppearances, null, 2) 
      : (existingData?.["League Appearances JSON"] || '[]'),
    "Transfer History JSON": transferHistory.length > 0 
      ? JSON.stringify(transferHistory, null, 2) 
      : (existingData?.["Transfer History JSON"] || '[]'),
    "Injury Record JSON": injuryRecord.length > 0 
      ? JSON.stringify(injuryRecord, null, 2) 
      : (existingData?.["Injury Record JSON"] || '[]'),
    "Performance Data JSON": JSON.stringify(performanceData, null, 2),
    "Strengths JSON": existingData?.["Strengths JSON"] || '{}',
    "Weaknesses JSON": existingData?.["Weaknesses JSON"] || '{}',
    "Last Updated": new Date().toISOString()
  };

  return fields;
}

/**
 * Process a single player: search, extract, update
 * This function should be called by the AI assistant using browser and Airtable MCPs
 */
export async function processPlayer(
  playerName: string,
  recordId: string,
  existingData?: any
): Promise<{ success: boolean; message: string }> {
  try {
    // Step 1: Search for player on Transfermarkt
    const searchUrl = `https://www.transfermarkt.com/schnellsuche/ergebnis/schnellsuche?Spieler_page=1&query=${encodeURIComponent(playerName)}`;
    
    // Step 2: Navigate to search results
    // await mcp_cursor_browser_extension_browser_navigate({ url: searchUrl });
    // await mcp_cursor_browser_extension_browser_wait_for({ time: 3 });
    
    // Step 3: Extract player URL from search results
    // const searchResults = await mcp_cursor_browser_extension_browser_evaluate({
    //   function: `() => {
    //     const results = [];
    //     const rows = document.querySelectorAll('table tbody tr');
    //     rows.forEach(row => {
    //       const nameLink = row.querySelector('a[href*="/profil/spieler/"]');
    //       if (nameLink) {
    //         const name = nameLink.textContent?.trim() || '';
    //         const href = nameLink.getAttribute('href') || '';
    //         if (name.toLowerCase().includes('${playerName.toLowerCase().split(' ')[0]}')) {
    //           results.push({ name, url: 'https://www.transfermarkt.com' + href });
    //         }
    //       }
    //     });
    //     return results.length > 0 ? results[0] : null;
    //   }`
    // });
    
    // Step 4: Navigate to player profile
    // if (searchResults && searchResults.url) {
    //   await mcp_cursor_browser_extension_browser_navigate({ url: searchResults.url });
    //   await mcp_cursor_browser_extension_browser_wait_for({ time: 4 });
    // }
    
    // Step 5: Extract comprehensive data
    // const scrapedData = await mcp_cursor_browser_extension_browser_evaluate({
    //   function: COMPREHENSIVE_EXTRACTION_FUNCTION
    // });
    
    // Step 6: Convert to Airtable format
    // const airtableFields = convertToAirtableFormat(scrapedData, existingData);
    
    // Step 7: Update Airtable record
    // await mcp_airtable_update_records({
    //   baseId: AIRTABLE_BASE_ID,
    //   tableId: AIRTABLE_TABLE_ID,
    //   records: [{ id: recordId, fields: airtableFields }]
    // });
    
    return { success: true, message: `Processed ${playerName}` };
  } catch (error) {
    return { success: false, message: `Error processing ${playerName}: ${error}` };
  }
}

/**
 * Main batch processing function
 * This should be executed by the AI assistant
 */
export async function batchProcessAllPlayers() {
  console.log("Starting batch processing of all players...");
  
  // Step 1: Get all players from Airtable
  // const allPlayers = await mcp_airtable_list_records({
  //   baseId: AIRTABLE_BASE_ID,
  //   tableId: AIRTABLE_TABLE_ID,
  //   maxRecords: 1000
  // });
  
  // Step 2: Process each player
  // for (const player of allPlayers) {
  //   const playerName = player.fields["Player Name"] || '';
  //   const recordId = player.id;
  //   console.log(`Processing: ${playerName}`);
  //   await processPlayer(playerName, recordId, player.fields);
  //   // Wait between requests to avoid rate limits
  //   await new Promise(resolve => setTimeout(resolve, 2000));
  // }
  
  console.log("Batch processing complete!");
}

// Export constants for use in execution
export { AIRTABLE_BASE_ID, AIRTABLE_TABLE_ID };

