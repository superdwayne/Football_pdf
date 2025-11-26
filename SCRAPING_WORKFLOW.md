# Player Data Scraping Workflow

## Overview

This workflow uses **Browser MCP** to scrape comprehensive player data from Transfermarkt and **Airtable MCP** to save/update records in the Football Players table.

## Process Flow

### Step 1: Navigate to Player Page
Use browser MCP to navigate to Transfermarkt player profile:
```
browser_navigate → https://www.transfermarkt.com/[player-name]/profil/spieler/[player-id]
```

### Step 2: Extract Player Data
Use browser MCP evaluate to extract all available data:

**Extracted Fields:**
- Player Name, First Name, Last Name
- Date of Birth, Age
- Height, Weight
- Nationality, Preferred Foot
- Photo URL
- Current Club, Contract Until
- Market Value
- Positions Played
- Statistics (by season/competition)
- Transfers (if available)
- Injuries (if available)

### Step 3: Convert to Airtable Format
Use `convertToAirtableFormat()` function to:
- Calculate totals (games, goals, assists, cards, minutes)
- Format league appearances as JSON
- Calculate valuations for different leagues
- Format positions, injuries, transfers as JSON

### Step 4: Check Existing Record
Use Airtable MCP to search for existing player:
```
mcp_airtable_search_records({
  baseId: "appLkDMJZrxnOCpPF",
  tableId: "tblwfa8UVh8Uoigp5",
  searchTerm: "Player Name"
})
```

### Step 5: Save or Update
- If record exists: Use `update_records` to update
- If new: Use `create_record` to create new record

## Example: Scraping Lamine Yamal

### Current Scraped Data:
```json
{
  "name": "Lamine Yamal",
  "firstName": "Lamine",
  "lastName": "Yamal",
  "photo": "https://img.a.transfermarkt.technology/portrait/header/937958-1746563945.jpg",
  "currentClub": "Barcelona",
  "positions": ["Right Winger", "Left Winger"]
}
```

### Next Steps:
1. Navigate to statistics section to get more data
2. Extract DOB, height, weight from info table
3. Extract market value
4. Extract season-by-season statistics
5. Save to Airtable

## Batch Processing

To scrape multiple players:

1. **List of Players**: Define in `scripts/batch-scrape-players.ts`
2. **For Each Player**:
   - Navigate to player URL
   - Extract data
   - Convert to Airtable format
   - Check if exists in Airtable
   - Create or update record
   - Wait 2-3 seconds between players (rate limiting)

## Data Sources

### Transfermarkt Provides:
- ✅ Player profile (name, DOB, height, weight, nationality)
- ✅ Current club and contract
- ✅ Market value
- ✅ Positions
- ✅ Season-by-season statistics
- ✅ Transfer history
- ✅ Injury records (if available)

### Additional Data to Extract:
- Social media stats (Instagram, Twitter/X followers)
- TFG ratings (if available on page)
- Stylistic comparisons
- Rankings
- Performance metrics (passes, shots, tackles, etc.)

## Airtable Table Structure

**Base ID**: `appLkDMJZrxnOCpPF`  
**Table ID**: `tblwfa8UVh8Uoigp5`  
**Table Name**: "Football Players"

### Key Fields:
- Profile: Player Name, First Name, Last Name, DOB, Age, Height, Weight, Nationality, Preferred Foot
- Club: Current Club, Contract Until
- Ratings: TFG Player Rating, Predicted 2028 Rating
- Statistics: Total Games, Goals, Assists, Cards, Minutes
- Valuations: Transfermarkt, TFG Intrinsic, League-specific values
- JSON Fields: League Appearances, Injury Record, Transfer History, Performance Data, Strengths, Weaknesses

## Usage

### Single Player Scrape:
```typescript
// 1. Navigate
browser_navigate("https://www.transfermarkt.com/lamine-yamal/profil/spieler/937958")

// 2. Extract
const scrapedData = browser_evaluate(extractPlayerDataFromPage)

// 3. Convert
const airtableData = convertToAirtableFormat(scrapedData)

// 4. Save
mcp_airtable_create_record({
  baseId: "appLkDMJZrxnOCpPF",
  tableId: "tblwfa8UVh8Uoigp5",
  fields: airtableData
})
```

### Batch Scrape:
Use the workflow for each player in `PLAYERS_TO_SCRAPE` array.

## Notes

- Transfermarkt may have rate limiting - add delays between requests
- Some data may require clicking through tabs (Statistics, Transfers, Injuries)
- Photo URLs from Transfermarkt may expire - consider downloading and hosting
- Market values are in EUR format - parse correctly for calculations
- Statistics tables may be in different formats - handle multiple selectors

