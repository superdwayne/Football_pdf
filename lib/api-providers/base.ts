import type { Player, PlayerStatistics, PlayerTransfer, PlayerInjury } from "@/types/player"

export interface FootballApiProvider {
  name: string
  searchPlayers(name: string, limit?: number): Promise<Player[]>
  getPlayerById(playerId: number): Promise<Player | null>
  getPlayerStatistics(playerId: number, season?: number): Promise<PlayerStatistics[]>
  getPlayerTransfers(playerId: number): Promise<PlayerTransfer[]>
  getPlayerInjuries(playerId: number): Promise<PlayerInjury[]>
  isAvailable(): boolean
}

