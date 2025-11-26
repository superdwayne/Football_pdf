# Airtable Integration for Football Player Data

## Overview

This project now includes integration with Airtable to save comprehensive football player data matching the design structure shown in the reference image.

## Airtable Setup

### Base and Table
- **Base ID**: `appLkDMJZrxnOCpPF`
- **Table Name**: "Football Players"
- **Table ID**: `tblwfa8UVh8Uoigp5`

### Table Structure

The "Football Players" table includes the following fields:

#### Profile Information
- Player Name
- First Name
- Last Name
- Date of Birth
- Age
- Height
- Weight
- Nationality
- Preferred Foot
- Photo URL
- Current Club
- Contract Until

#### Ratings & Statistics
- TFG Player Rating
- Predicted 2028 Rating
- Total Games
- Total Goals
- Total Assists
- Total Yellow Cards
- Total Red Cards
- Total Minutes
- Average Rating

#### Valuations (EUR)
- Transfermarkt Value EUR
- TFG Intrinsic Value EUR
- Premier League Value EUR
- La Liga Value EUR
- Serie A Value EUR
- Bundesliga Value EUR
- Ligue 1 Value EUR
- SPL Value EUR

#### Additional Data (JSON format)
- Positions Played
- League Appearances JSON
- Injury Record JSON
- Transfer History JSON
- Performance Data JSON
- Strengths JSON
- Weaknesses JSON
- Last Updated

## Integration Points

### 1. Automatic Save on PDF Generation

When a player PDF is generated, the data is automatically saved to Airtable. The save happens in the `fetchPlayerDetailsAndGeneratePDF` function in `app/page.tsx`.

### 2. API Route

**Endpoint**: `/api/airtable/save-player`

**Method**: POST

**Request Body**:
```json
{
  "baseId": "appLkDMJZrxnOCpPF",
  "tableId": "tblwfa8UVh8Uoigp5",
  "fields": {
    "Player Name": "Cristiano Ronaldo",
    "First Name": "Cristiano",
    "Last Name": "Ronaldo",
    // ... other fields
  }
}
```

**Response**:
```json
{
  "success": true,
  "recordId": "rec...",
  "message": "Player data saved to Airtable successfully"
}
```

### 3. Data Processing

The `formatPlayerDataForAirtable` function in `lib/airtable-integration.ts` processes player data from the API and formats it for Airtable:

- Extracts player profile information
- Calculates statistics and totals
- Formats positions and league appearances
- Processes injury records and transfer history
- Calculates estimated valuations based on performance metrics
- Generates strengths and weaknesses analysis

## Usage

### Manual Save

You can manually save a player to Airtable by calling the API:

```typescript
const response = await fetch("/api/airtable/save-player", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    baseId: "appLkDMJZrxnOCpPF",
    tableId: "tblwfa8UVh8Uoigp5",
    fields: formattedPlayerData,
  }),
})
```

### Using MCP Directly

You can also use the Airtable MCP tool directly:

```typescript
import { mcp_airtable_create_record } from "@/lib/mcp-airtable-wrapper"

const result = await mcp_airtable_create_record({
  baseId: "appLkDMJZrxnOCpPF",
  tableId: "tblwfa8UVh8Uoigp5",
  fields: formattedPlayerData,
})
```

## Data Sources

The player data is fetched from:
- **API-Football** (primary)
- **Football-Data.org** (fallback)

Data includes:
- Player profile and basic information
- Statistics across multiple seasons
- Transfer history
- Injury records
- League appearances

## Valuation Calculations

Valuations are estimated based on:
- Average rating
- Total games played
- Goals and assists
- League performance

The base value calculation:
```typescript
const baseValue = averageRating * 200000
```

Different leagues have multipliers:
- Premier League: 1.1x
- La Liga: 0.6x
- Serie A: 0.8x
- Bundesliga: 0.7x
- Ligue 1: 0.7x
- SPL: 1.5x

## Testing

To test the integration:

1. Search for a player in the application
2. Generate a PDF report
3. Check the Airtable base for the new record
4. Verify all fields are populated correctly

## Notes

- The integration automatically saves player data when a PDF is generated
- If Airtable save fails, it doesn't prevent PDF generation
- All data is formatted to match the design structure shown in the reference image
- JSON fields store complex data structures for positions, injuries, transfers, etc.

