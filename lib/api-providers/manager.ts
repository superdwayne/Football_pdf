import type { FootballApiProvider } from "./base"
import { ApiFootballProvider } from "./api-football"
import { FootballDataOrgProvider } from "./football-data-org"
import { FallbackProvider } from "./fallback"

class ApiProviderManager {
  private providers: FootballApiProvider[] = []
  private currentProviderIndex = 0

  constructor() {
    // Initialize providers in priority order
    // API-Football is primary (best player search)
    this.providers.push(new ApiFootballProvider())
    // Football-Data.org as secondary (better for teams/matches)
    this.providers.push(new FootballDataOrgProvider())
    // Fallback always available
    this.providers.push(new FallbackProvider())
    
    // Set the first available provider as default
    const availableIndex = this.providers.findIndex(p => p.isAvailable())
    this.currentProviderIndex = availableIndex !== -1 ? availableIndex : 0
  }

  getCurrentProvider(): FootballApiProvider {
    return this.providers[this.currentProviderIndex]
  }

  getAllProviders(): FootballApiProvider[] {
    return this.providers.filter(p => p.isAvailable())
  }

  switchProvider(providerName: string): boolean {
    const index = this.providers.findIndex(p => p.name === providerName && p.isAvailable())
    if (index !== -1) {
      this.currentProviderIndex = index
      return true
    }
    return false
  }

  // Try to use a provider, fallback to next if it fails
  async withFallback<T>(
    operation: (provider: FootballApiProvider) => Promise<T>,
    startIndex: number = this.currentProviderIndex
  ): Promise<T> {
    let lastError: Error | null = null
    let lastResult: T | null = null
    
    // Try current provider first
    for (let i = 0; i < this.providers.length; i++) {
      const index = (startIndex + i) % this.providers.length
      const provider = this.providers[index]
      
      if (!provider.isAvailable() && provider.name !== "Fallback") {
        continue
      }

      try {
        const result = await operation(provider)
        lastResult = result
        
        // For search operations, check if we got results
        // If empty results but no error, might want to try next provider
        if (Array.isArray(result) && result.length === 0 && i < this.providers.length - 1) {
          // Don't use fallback for empty results, try next real provider
          if (provider.name !== "Fallback") {
            console.log(`No results from ${provider.name}, trying next provider...`)
            continue
          }
        }
        
        // If successful and we switched providers, update current
        if (index !== this.currentProviderIndex && provider.name !== "Fallback") {
          this.currentProviderIndex = index
          console.log(`Switched to ${provider.name} provider`)
        }
        return result
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        
        // If it's a rate limit error, try next provider
        if (error instanceof Error && 
            (error.message.includes("rate limit") || error.message.includes("rateLimit"))) {
          console.log(`Rate limit on ${provider.name}, trying next provider...`)
          continue
        }
        
        // For other errors, also try next provider (except for fallback)
        if (provider.name !== "Fallback") {
          console.log(`Error with ${provider.name}: ${error instanceof Error ? error.message : String(error)}, trying next provider...`)
          continue
        }
      }
    }

    // If we have a result (even if empty), return it
    if (lastResult !== null) {
      return lastResult
    }

    // If all providers failed, provide a helpful error message
    if (lastError) {
      // If it was a rate limit error, provide specific guidance
      if (lastError.message.includes("rate limit") || lastError.message.includes("rateLimit")) {
        throw new Error(
          "All API providers have hit rate limits. " +
          "API-Football allows 10 requests per minute. " +
          "Please wait 60 seconds and try again, or try searching for a different player."
        )
      }
      throw lastError
    }

    throw new Error("All API providers failed. Please check your API keys and try again.")
  }
}

// Export singleton instance
export const apiProviderManager = new ApiProviderManager()

// Export convenience functions that use the manager
export async function searchPlayers(name: string, limit?: number) {
  return apiProviderManager.withFallback(provider => provider.searchPlayers(name, limit))
}

export async function getPlayerById(playerId: number) {
  return apiProviderManager.withFallback(provider => provider.getPlayerById(playerId))
}

export async function getPlayerStatistics(playerId: number, season?: number) {
  return apiProviderManager.withFallback(provider => provider.getPlayerStatistics(playerId, season))
}

export async function getPlayerTransfers(playerId: number) {
  return apiProviderManager.withFallback(provider => provider.getPlayerTransfers(playerId))
}

export async function getPlayerInjuries(playerId: number) {
  return apiProviderManager.withFallback(provider => provider.getPlayerInjuries(playerId))
}

