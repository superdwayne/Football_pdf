# Airtable as Data Source - MCP Integration

## Overview

This project now supports using Airtable's "Football Players" table as a data source through MCP (Model Context Protocol). This allows you to:

- Search for players stored in Airtable
- Retrieve player details, statistics, and additional data
- Use Airtable as the primary or fallback data source

## Airtable Configuration

- **Base ID**: `appLkDMJZrxnOCpPF`
- **Table Name**: "Football Players"
- **Table ID**: `tblwfa8UVh8Uoigp5`

## Using Airtable as Data Source

### Option 1: Direct MCP Usage

You can use MCP functions directly to access Airtable data:

```typescript
// Search for players
const searchResult = await mcp_airtable_search_records({
  baseId: "appLkDMJZrxnOCpPF",
  tableId: "tblwfa8UVh8Uoigp5",
  searchTerm: "Ronaldo",
  maxRecords: 10,
})

// Get a specific player
const player = await mcp_airtable_get_record({
  baseId: "appLkDMJZrxnOCpPF",
  tableId: "tblwfa8UVh8Uoigp5",
  recordId: "rec1M3Ah2OMWzePKp",
})

// List all players
const players = await mcp_airtable_list_records({
  baseId: "appLkDMJZrxnOCpPF",
  tableId: "tblwfa8UVh8Uoigp5",
  maxRecords: 50,
})
```

### Option 2: Using the Airtable Provider

The `AirtableProvider` class provides a clean interface to access Airtable data:

```typescript
import { AirtableProvider } from "@/lib/airtable-provider"

const provider = new AirtableProvider()

// Search for players
const players = await provider.searchPlayers("Ronaldo", 10)

// Get player by record ID
const player = await provider.getPlayerByRecordId("rec1M3Ah2OMWzePKp")

// Get player statistics
const statistics = await provider.getPlayerStatistics("rec1M3Ah2OMWzePKp")

// Get player transfers
const transfers = await provider.getPlayerTransfers("rec1M3Ah2OMWzePKp")

// Get player injuries
const injuries = await provider.getPlayerInjuries("rec1M3Ah2OMWzePKp")
```

### Option 3: Using API Routes

API routes are available to access Airtable data:

#### Search Players

```typescript
const response = await fetch("/api/player/airtable", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    action: "search",
    name: "Ronaldo",
    limit: 10,
  }),
})

const data = await response.json()
// data.players contains the search results
```

#### Get Player Details

```typescript
const response = await fetch("/api/player/airtable", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    action: "getDetails",
    recordId: "rec1M3Ah2OMWzePKp",
  }),
})

const data = await response.json()
// data.player, data.statistics, data.transfers, data.injuries
```

## Data Structure

The Airtable "Football Players" table contains:

### Profile Information
- Player Name, First Name, Last Name
- Date of Birth, Age
- Height, Weight
- Nationality, Preferred Foot
- Photo URL
- Current Club, Contract Until

### Statistics
- TFG Player Rating
- Predicted 2028 Rating
- Total Games, Goals, Assists
- Total Yellow/Red Cards
- Total Minutes
- Average Rating

### Valuations (EUR)
- Transfermarkt Value
- TFG Intrinsic Value
- League-specific values (Premier League, La Liga, Serie A, Bundesliga, Ligue 1, SPL)

### Additional Data (JSON)
- Positions Played
- League Appearances JSON
- Injury Record JSON
- Transfer History JSON
- Performance Data JSON
- Strengths JSON
- Weaknesses JSON

## Integration with Existing Code

The Airtable provider is compatible with the existing player data structure:

```typescript
import { AirtableProvider } from "@/lib/airtable-provider"
import type { Player, PlayerStatistics } from "@/types/player"

const provider = new AirtableProvider()

// Returns Player type compatible with existing code
const player: Player = await provider.getPlayerByRecordId("rec1M3Ah2OMWzePKp")

// Returns PlayerStatistics[] compatible with existing code
const stats: PlayerStatistics[] = await provider.getPlayerStatistics("rec1M3Ah2OMWzePKp")
```

## Converting Airtable Records

The `airtable-data-source.ts` module provides utilities to convert Airtable records:

```typescript
import {
  convertAirtableRecordToPlayer,
  getPlayerStatisticsFromAirtable,
  getPlayerAdditionalDataFromAirtable,
} from "@/lib/airtable-data-source"

// Convert Airtable record to Player
const player = convertAirtableRecordToPlayer(airtableRecord)

// Get statistics from record
const stats = getPlayerStatisticsFromAirtable(airtableRecord)

// Get additional data (transfers, injuries, etc.)
const additional = getPlayerAdditionalDataFromAirtable(airtableRecord)
```

## MCP Helper

The `MCPAirtableHelper` class provides instructions for MCP calls:

```typescript
import { mcpAirtableHelper } from "@/lib/mcp-airtable-helper"

// Get search instructions
const instructions = mcpAirtableHelper.getSearchInstructions("Ronaldo", 10)
// Use instructions.mcpFunction and instructions.parameters with MCP

// Get record instructions
const recordInstructions = mcpAirtableHelper.getRecordInstructions("rec1M3Ah2OMWzePKp")
```

## Example: Using Airtable in the Application

To use Airtable as the primary data source in your application:

```typescript
// In your component or API route
import { AirtableProvider } from "@/lib/airtable-provider"

export async function searchPlayersFromAirtable(name: string) {
  const provider = new AirtableProvider()
  
  try {
    const players = await provider.searchPlayers(name, 10)
    return players
  } catch (error) {
    console.error("Error searching Airtable:", error)
    // Fallback to external API if needed
    return []
  }
}
```

## Benefits of Using Airtable

1. **No API Rate Limits**: Airtable doesn't have the same rate limits as external APIs
2. **Custom Data**: You control the data structure and can add custom fields
3. **Easy Updates**: Update player data directly in Airtable without code changes
4. **Rich Data**: Store complex JSON data for performance metrics, comparisons, etc.
5. **MCP Integration**: Direct access through MCP for seamless integration

## Notes

- MCP functions are available in the AI assistant context
- API routes provide a bridge between the frontend and MCP
- The Airtable provider handles data conversion automatically
- All data is compatible with existing Player and PlayerStatistics types

