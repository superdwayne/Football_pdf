import type { FootballApiProvider } from "./base"
import type { Player, PlayerStatistics, PlayerTransfer, PlayerInjury } from "@/types/player"

const API_BASE_URL = "https://api.football-data.org/v4"
const API_KEY = process.env.FOOTBALL_DATA_ORG_KEY || ""

// Football-Data.org doesn't require auth for basic access, but has better rate limits with auth
async function fetchApi<T>(endpoint: string): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  }
  
  // Add auth header if API key is provided
  if (API_KEY) {
    headers["X-Auth-Token"] = API_KEY
  }

  const response = await fetch(url, {
    method: "GET",
    headers,
    next: { revalidate: 60 }, // Cache for 60 seconds
  })

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("API rate limit exceeded. Please try again later.")
    }
    if (response.status === 403) {
      throw new Error("Access forbidden. Please check your API key.")
    }
    throw new Error(`API request failed: ${response.statusText}`)
  }

  return response.json()
}

export class FootballDataOrgProvider implements FootballApiProvider {
  name = "Football-Data.org"

  isAvailable(): boolean {
    // Football-Data.org works without API key, but better with one
    return true
  }

  async searchPlayers(name: string, limit: number = 10): Promise<Player[]> {
    try {
      // Football-Data.org doesn't have direct player search
      // We'll search through popular teams' squads
      // Popular team IDs from Football-Data.org:
      // 57 (Arsenal), 61 (Chelsea), 64 (Liverpool), 65 (Man City), 66 (Man United)
      // 81 (Barcelona), 86 (Real Madrid), 98 (AC Milan), 108 (Juventus), 109 (Inter)
      const popularTeamIds = [57, 61, 64, 65, 66, 81, 86, 98, 108, 109]
      const allPlayers: Player[] = []
      const searchLower = name.toLowerCase().trim()
      
      // Search through popular teams (limit to 2-3 to avoid rate limits)
      for (const teamId of popularTeamIds.slice(0, 3)) {
        try {
          const squadData = await fetchApi<any>(`/teams/${teamId}`)
          
          // Get squad from team data
          if (squadData.squad && Array.isArray(squadData.squad)) {
            const matchingPlayers = squadData.squad
              .filter((member: any) => {
                const playerName = (member.name || "").toLowerCase()
                return (
                  playerName.includes(searchLower) ||
                  searchLower.includes(playerName) ||
                  // Also check if search term matches part of the name
                  playerName.split(" ").some((part: string) => part.includes(searchLower)) ||
                  searchLower.split(" ").some((part: string) => playerName.includes(part))
                )
              })
              .map((member: any) => {
                // Parse name into first and last name
                const fullName = member.name || ""
                const nameParts = fullName.split(" ")
                const firstname = nameParts[0] || ""
                const lastname = nameParts.slice(1).join(" ") || ""
                
                // Calculate age from dateOfBirth if available
                let age = 0
                if (member.dateOfBirth) {
                  const birthDate = new Date(member.dateOfBirth)
                  const today = new Date()
                  age = today.getFullYear() - birthDate.getFullYear()
                  const monthDiff = today.getMonth() - birthDate.getMonth()
                  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    age--
                  }
                }
                
                // Convert Football-Data.org format to our Player format
                return {
                  id: member.id || 0,
                  name: fullName,
                  firstname: firstname,
                  lastname: lastname,
                  age: age,
                  birth: {
                    date: member.dateOfBirth || "",
                    place: "",
                    country: member.nationality || "",
                  },
                  nationality: member.nationality || "",
                  height: null,
                  weight: null,
                  injured: false, // Football-Data.org doesn't provide injury status in squad
                  photo: null,
                } as Player
              })
            
            allPlayers.push(...matchingPlayers)
            
            if (allPlayers.length >= limit) {
              break
            }
          }
        } catch (teamError) {
          // If rate limited, throw to allow fallback
          if (teamError instanceof Error && 
              (teamError.message.includes("rate limit") || teamError.message.includes("429"))) {
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
      
      if (uniquePlayers.length > 0) {
        console.log(`Football-Data.org: Found ${uniquePlayers.length} players matching "${name}"`)
      }
      
      return uniquePlayers
    } catch (error) {
      // Re-throw rate limit errors so fallback can catch them
      if (error instanceof Error && 
          (error.message.includes("rate limit") || error.message.includes("429"))) {
        throw error
      }
      console.error("Football-Data.org search error:", error)
      return []
    }
  }

  async getPlayerById(playerId: number): Promise<Player | null> {
    try {
      // Football-Data.org doesn't have direct player endpoints
      // Would need to search through teams/squads
      return null
    } catch (error) {
      console.error("Error fetching player:", error)
      return null
    }
  }

  async getPlayerStatistics(playerId: number, season?: number): Promise<PlayerStatistics[]> {
    // Not available in Football-Data.org free tier
    return []
  }

  async getPlayerTransfers(playerId: number): Promise<PlayerTransfer[]> {
    // Not available in Football-Data.org
    return []
  }

  async getPlayerInjuries(playerId: number): Promise<PlayerInjury[]> {
    // Not available in Football-Data.org
    return []
  }
}

