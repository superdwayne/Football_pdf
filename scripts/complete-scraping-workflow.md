# Complete Player Scraping Workflow

## Overview

This document provides a complete workflow for scraping player data from Transfermarkt using Browser MCP and saving to Airtable using Airtable MCP.

## Workflow Steps

### For Each Player:

1. **Navigate to Player Page**
   ```
   browser_navigate → https://www.transfermarkt.com/[player-name]/profil/spieler/[player-id]
   ```

2. **Wait for Page Load**
   ```
   browser_wait_for → 3 seconds
   ```

3. **Extract Player Data**
   ```
   browser_evaluate → Use extraction function to get:
   - Name, First Name, Last Name
   - Date of Birth, Age
   - Height, Weight
   - Nationality, Preferred Foot
   - Photo URL
   - Current Club, Contract Until
   - Market Value
   - Positions
   - Statistics (by season/competition)
   ```

4. **Convert to Airtable Format**
   - Calculate totals (games, goals, assists, cards, minutes)
   - Format league appearances as JSON
   - Calculate valuations
   - Format positions, injuries, transfers as JSON

5. **Check if Player Exists**
   ```
   mcp_airtable_search_records → Search by "Player Name"
   ```

6. **Save or Update**
   - If exists: `mcp_airtable_update_records`
   - If new: `mcp_airtable_create_record`

## Players Processed

### ✅ Completed:
- Lamine Yamal (recPuMVuRuDtmODiK) - Created
- Kylian Mbappé (recmkg3TdBPXRQx80) - Created
- Erling Haaland (rec4Kz37Ql133U2DH) - Updated

### 🔄 In Progress:
- Jude Bellingham - Extracting data

### ⏳ Pending:
- Vinicius Junior
- Phil Foden
- Bukayo Saka
- Pedri
- Gavi
- Jamal Musiala
- And more...

## Data Extraction Function

The extraction function gets:
- ✅ Player name and photo
- ✅ Market value
- ✅ Positions
- ⚠️ Statistics (may require clicking tabs or scrolling)
- ⚠️ DOB, Height, Weight (from info table - may need better selectors)
- ⚠️ Club name (may need better selector)

## Next Steps

1. Improve selectors for info table data (DOB, height, weight, nationality)
2. Add logic to click "Statistics" tab to get season-by-season data
3. Add logic to extract transfers and injuries
4. Process remaining players in batch
5. Add error handling and retry logic

## Notes

- Transfermarkt pages may have cookie dialogs - handle them
- Some data may be behind tabs (Statistics, Transfers, Injuries)
- Market values are in EUR format
- Statistics tables may vary in structure
- Add delays between requests to avoid rate limiting

