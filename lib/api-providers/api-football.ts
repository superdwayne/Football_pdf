import type { FootballApiProvider } from "./base"
import type {
  Player,
  PlayerSearchResult,
  PlayerStatistics,
  PlayerTransfer,
  PlayerInjury,
  ApiFootballResponse,
} from "@/types/player"

const API_BASE_URL = "https://v3.football.api-sports.io"
const API_KEY = process.env.API_FOOTBALL_KEY || ""

async function fetchApi<T>(
  endpoint: string,
  params: Record<string, string | number> = {}
): Promise<ApiFootballResponse<T>> {
  const url = new URL(`${API_BASE_URL}${endpoint}`)
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, String(value))
  })

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "x-rapidapi-key": API_KEY,
      "x-rapidapi-host": "v3.football.api-sports.io",
      "x-apisports-key": API_KEY,
    },
  })

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("API rate limit exceeded. Please try again later.")
    }
    if (response.status === 401) {
      throw new Error("Invalid API key. Please check your API_FOOTBALL_KEY.")
    }
    throw new Error(`API request failed: ${response.statusText}`)
  }

  const data = await response.json()
  
  // Check for rate limiting - throw error so fallback can catch it
  if (data.errors && typeof data.errors === "object") {
    if (data.errors.rateLimit) {
      const rateLimitMsg = typeof data.errors.rateLimit === "string" 
        ? data.errors.rateLimit 
        : "Rate limit exceeded"
      throw new Error(`API rate limit exceeded: ${rateLimitMsg}. Please wait a minute and try again.`)
    }
  }
  
  // Check for other API errors
  if (data.errors && typeof data.errors === "object") {
    // Check for field requirement errors (like team/league required with search)
    if (data.errors.team || data.errors.league) {
      // This is not a fatal error, just means search needs more params
      // Return empty response so fallback can try
      return { ...data, response: [] }
    }
  }
  
  if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
    const errorMessages = data.errors.map((err: any) => 
      typeof err === "string" ? err : JSON.stringify(err)
    ).join(", ")
    throw new Error(`API error: ${errorMessages}`)
  }

  return data
}

export class ApiFootballProvider implements FootballApiProvider {
  name = "API-Football"

  isAvailable(): boolean {
    return !!API_KEY
  }

  async searchPlayers(name: string, limit: number = 10): Promise<Player[]> {
    try {
      if (!API_KEY) {
        throw new Error("API key is not configured.")
      }

      // API-Football requires team or league with search parameter
      // We'll try searching through popular teams/leagues
      // Popular team IDs: 33 (Manchester United), 50 (Manchester City), 49 (Chelsea), 
      // 40 (Liverpool), 42 (Arsenal), 541 (Barcelona), 85 (Paris Saint-Germain)
      const popularTeams = [33, 50, 49, 40, 42, 541, 85, 489, 81, 86] // Add more popular teams
      const allPlayers: Player[] = []
      
      // Try searching in popular teams
      for (const teamId of popularTeams.slice(0, 3)) { // Limit to 3 teams to avoid rate limits
        try {
          const data = await fetchApi<PlayerSearchResult>("/players", {
            search: name,
            team: teamId,
          })
          
          if (data.response && data.response.length > 0) {
            const players = data.response
              .map((result) => result.player)
              .filter((player) => {
                const searchLower = name.toLowerCase().trim()
                const playerNameLower = player.name?.toLowerCase() || ""
                const firstNameLower = player.firstname?.toLowerCase() || ""
                const lastNameLower = player.lastname?.toLowerCase() || ""
                
                return (
                  playerNameLower.includes(searchLower) ||
                  searchLower.includes(playerNameLower) ||
                  firstNameLower.includes(searchLower) ||
                  lastNameLower.includes(searchLower) ||
                  `${firstNameLower} ${lastNameLower}`.includes(searchLower)
                )
              })
            
            allPlayers.push(...players)
            
            // If we found enough players, break
            if (allPlayers.length >= limit) {
              break
            }
          }
        } catch (teamError) {
          // If rate limited, throw to trigger fallback
          if (teamError instanceof Error && 
              (teamError.message.includes("rate limit") || teamError.message.includes("rateLimit"))) {
            throw teamError
          }
          // Continue to next team for other errors
          continue
        }
      }

      // Return unique players (by ID) up to limit
      const uniquePlayers = Array.from(
        new Map(allPlayers.map(p => [p.id, p])).values()
      ).slice(0, limit)

      return uniquePlayers
    } catch (error) {
      // Re-throw rate limit errors so fallback can catch them
      if (error instanceof Error && 
          (error.message.includes("rate limit") || error.message.includes("rateLimit"))) {
        throw error
      }
      // For other errors, return empty array
      console.error("API-Football search error:", error)
      return []
    }
  }

  async getPlayerById(playerId: number): Promise<Player | null> {
    try {
      const data = await fetchApi<PlayerSearchResult>("/players", {
        id: playerId,
      })

      if (data.response.length === 0) {
        return null
      }

      return data.response[0].player
    } catch (error) {
      console.error("Error fetching player:", error)
      throw error
    }
  }

  async getPlayerStatistics(playerId: number, season?: number): Promise<PlayerStatistics[]> {
    try {
      const params: Record<string, string | number> = {
        id: playerId,
      }

      if (season) {
        params.season = season
      }

      const data = await fetchApi<{ player: Player; statistics: PlayerStatistics[] }>(
        "/players",
        params
      )

      const allStats: PlayerStatistics[] = []
      data.response.forEach((item: any) => {
        if (item.statistics && Array.isArray(item.statistics)) {
          allStats.push(...item.statistics)
        }
      })

      return allStats
    } catch (error) {
      console.error("Error fetching player statistics:", error)
      throw error
    }
  }

  async getPlayerTransfers(playerId: number): Promise<PlayerTransfer[]> {
    try {
      const data = await fetchApi<{ player: Player; transfers: PlayerTransfer[] }>(
        "/transfers",
        {
          player: playerId,
        }
      )

      if (data.response.length === 0) {
        return []
      }

      return data.response[0].transfers || []
    } catch (error) {
      console.error("Error fetching player transfers:", error)
      throw error
    }
  }

  async getPlayerInjuries(playerId: number): Promise<PlayerInjury[]> {
    try {
      const data = await fetchApi<PlayerInjury>("/injuries", {
        player: playerId,
      })

      return data.response
    } catch (error) {
      console.error("Error fetching player injuries:", error)
      return []
    }
  }
}

