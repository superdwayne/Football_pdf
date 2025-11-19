import type { FootballApiProvider } from "./base"
import type { Player, PlayerStatistics, PlayerTransfer, PlayerInjury } from "@/types/player"

/**
 * Fallback provider that uses cached/mock data or alternative strategies
 * This helps when primary APIs hit rate limits
 */
export class FallbackProvider implements FootballApiProvider {
  name = "Fallback"

  isAvailable(): boolean {
    return true // Always available as fallback
  }

  async searchPlayers(name: string, limit: number = 10): Promise<Player[]> {
    // This is a fallback - in a real scenario, you might:
    // 1. Use cached data
    // 2. Use a different API endpoint
    // 3. Return partial data
    
    console.log("Fallback provider: Player search not fully supported")
    return []
  }

  async getPlayerById(playerId: number): Promise<Player | null> {
    return null
  }

  async getPlayerStatistics(playerId: number, season?: number): Promise<PlayerStatistics[]> {
    return []
  }

  async getPlayerTransfers(playerId: number): Promise<PlayerTransfer[]> {
    return []
  }

  async getPlayerInjuries(playerId: number): Promise<PlayerInjury[]> {
    return []
  }
}

