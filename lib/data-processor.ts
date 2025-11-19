import type {
  Player,
  PlayerStatistics,
  PlayerTransfer,
  PlayerInjury,
} from "@/types/player"

const toNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  return 0
}

const toStringSafe = (value: unknown, fallback = ""): string => {
  if (typeof value === "string") {
    return value
  }
  if (value == null) {
    return fallback
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value)
  }
  return fallback
}

const parseDate = (value: unknown): Date | null => {
  if (!value) {
    return null
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }
  if (typeof value === "number") {
    const fromTimestamp = new Date(value)
    return Number.isNaN(fromTimestamp.getTime()) ? null : fromTimestamp
  }
  if (typeof value === "string") {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }
  return null
}

export interface ProcessedPlayerData {
  profile: {
    name: string
    firstName: string
    lastName: string
    age: number
    dob: string
    height: string
    weight: string
    nationality: string
    preferredFoot: string | null
    photo: string
    currentTeam: {
      id: number
      name: string
      logo: string
    } | null
  }
  positions: {
    position: string
    appearances: number
    goals: number
    assists: number
  }[]
  leagueAppearances: {
    season: string
    competition: string
    games: number
    assists: number
    yellowCards: number
    secondYellow: number
    redCards: number
    ownGoals: number
    minutes: number
  }[]
  statistics: {
    totalGames: number
    totalGoals: number
    totalAssists: number
    totalYellowCards: number
    totalRedCards: number
    totalMinutes: number
    averageRating: number
  }
  transfers: {
    date: string
    type: string
    from: string
    to: string
  }[]
  injuries: {
    season: string
    injury: string
    from: string
    until: string
    days: number
    gamesMissed: number
  }[]
  strengths: {
    category: string
    percentile: number
  }[]
  weaknesses: {
    category: string
    percentile: number
  }[]
  chartData?: {
    radarChartMetrics?: {
      Passes?: number
      ChancesCreated?: number
      Shots?: number
      Touches?: number
      BallRecovery?: number
      DefensiveActions?: number
      AerialDuels?: number
      PossessionRegains?: number
      Dribbles?: number
    }
    positionalTraits?: {
      Category?: string
      Overall?: number
      DefensiveWorkRate?: number
      PassingDribbling?: number
      SpeedRunsInBehind?: number
    }
    tfgRatingTrend?: {
      [key: string]: number // e.g., "Sep 2024": 850, "Mar 2026": 920, "Predicted 2028": 950
    }
    advancedStats?: {
      shots?: { total: number; onTarget: number; accuracy: number }
      passes?: { total: number; accurate: number; accuracy: number }
      dribbles?: { attempted: number; successful: number; successRate: number }
      tackles?: { total: number; won: number; successRate: number }
      interceptions?: number
      clearances?: number
      fouls?: { committed: number; suffered: number }
    }
  }
}

export function processPlayerData(
  player: Player,
  statistics: PlayerStatistics[],
  transfers: PlayerTransfer[],
  injuries: PlayerInjury[],
  chartData?: any
): ProcessedPlayerData {
  // Process positions
  const positionMap = new Map<
    string,
    { appearances: number; goals: number; assists: number }
  >()

  statistics.forEach((stat) => {
    const position = stat.games?.position || (stat.games as any)?.Position || "Unknown"
    const existing = positionMap.get(position) || {
      appearances: 0,
      goals: 0,
      assists: 0,
    }

    const appearancesValue =
      stat.games?.appearences ?? (stat.games as any)?.appearances ?? 0

    positionMap.set(position, {
      appearances: existing.appearances + toNumber(appearancesValue),
      goals: existing.goals + toNumber(stat.goals?.total),
      assists: existing.assists + toNumber(stat.goals?.assists),
    })
  })

  const positions = Array.from(positionMap.entries()).map(([position, data]) => ({
    position,
    appearances: data.appearances,
    goals: data.goals,
    assists: data.assists,
  }))

  // Process league appearances
  const leagueAppearances = statistics.map((stat) => {
    const rawSeason =
      stat.league?.season ?? (stat.league as any)?.Season ?? (stat.league as any)?.season
    const season = toNumber(rawSeason)
    const seasonStr = season > 0
      ? `${season}/${String(season + 1).slice(-2)}`
      : toStringSafe((stat.league as any)?.seasonLabel, "Unknown")

    return {
      season: seasonStr,
      competition: `${stat.league?.name || ""} - ${stat.league?.country || ""}`,
      games: toNumber(stat.games?.appearences ?? (stat.games as any)?.appearances),
      assists: toNumber(stat.goals?.assists),
      yellowCards: toNumber(stat.cards?.yellow),
      secondYellow: toNumber(stat.cards?.yellowred),
      redCards: toNumber(stat.cards?.red),
      ownGoals: 0, // API doesn't provide this
      minutes: toNumber(stat.games?.minutes),
    }
  })

  // Calculate totals
  const totalGames = statistics.reduce(
    (sum, stat) =>
      sum +
      toNumber(stat.games?.appearences ?? (stat.games as any)?.appearances),
    0
  )
  const totalGoals = statistics.reduce(
    (sum, stat) => sum + toNumber(stat.goals?.total),
    0
  )
  const totalAssists = statistics.reduce(
    (sum, stat) => sum + toNumber(stat.goals?.assists),
    0
  )
  const totalYellowCards = statistics.reduce(
    (sum, stat) => sum + toNumber(stat.cards?.yellow),
    0
  )
  const totalRedCards = statistics.reduce(
    (sum, stat) => sum + toNumber(stat.cards?.red),
    0
  )
  const totalMinutes = statistics.reduce(
    (sum, stat) => sum + toNumber(stat.games?.minutes),
    0
  )
  
  const ratings = statistics
    .map((stat) => {
      const rating = stat.games?.rating || "0"
      return typeof rating === "number" ? rating : parseFloat(rating)
    })
    .filter((r) => r > 0)
  const averageRating = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
    : 0

  // Process transfers
  const processedTransfers = transfers.map((transfer) => {
    const raw = transfer as unknown as Record<string, any>
    const dateStr = toStringSafe(raw?.date ?? raw?.Date, "")
    const typeStr = toStringSafe(raw?.type ?? raw?.Type, "Transfer")
    const fromTeam =
      toStringSafe(raw?.teams?.out?.name, "") ||
      toStringSafe(raw?.from ?? raw?.From, "Unknown")
    const toTeam =
      toStringSafe(raw?.teams?.in?.name, "") ||
      toStringSafe(raw?.to ?? raw?.To, "Unknown")

    return {
      date: dateStr || "Unknown",
      type: typeStr || "Transfer",
      from: fromTeam || "Unknown",
      to: toTeam || "Unknown",
    }
  })

  // Process injuries
  const processedInjuries = injuries.map((injury) => {
    const raw = injury as unknown as Record<string, any>

    const rawFrom = raw?.fixture?.date ?? raw?.from ?? raw?.From ?? raw?.startDate
    const rawUntil = raw?.until ?? raw?.Until ?? raw?.endDate

    const fromDate = parseDate(rawFrom) || new Date()
    const untilDate = parseDate(rawUntil) || new Date(fromDate.getTime())
    if (!rawUntil) {
      untilDate.setDate(untilDate.getDate() + 7)
    }

    const diffMs = Math.max(untilDate.getTime() - fromDate.getTime(), 0)
    const days = toNumber(raw?.days ?? raw?.Days) || Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    const gamesMissed =
      toNumber(raw?.gamesMissed ?? raw?.GamesMissed ?? raw?.["Games Missed"]) ||
      Math.ceil(days / 7)

    const seasonLabel =
      raw?.season ||
      raw?.Season ||
      `${fromDate.getFullYear()}/${String(fromDate.getFullYear() + 1).slice(-2)}`

    return {
      season: toStringSafe(seasonLabel, "Unknown"),
      injury:
        toStringSafe(raw?.reason, "") ||
        toStringSafe(raw?.injury, "") ||
        toStringSafe(raw?.Injury, "Unknown"),
      from: fromDate.toLocaleDateString("en-GB"),
      until: untilDate.toLocaleDateString("en-GB"),
      days,
      gamesMissed,
    }
  })

  // Calculate strengths and weaknesses (mock data based on statistics)
  const strengths: { category: string; percentile: number }[] = []
  const weaknesses: { category: string; percentile: number }[] = []

  // Dribbling strength (based on dribbles success rate)
  const dribbleSuccessRate = statistics.reduce((sum, stat) => {
    const attempts = toNumber(stat.dribbles?.attempts)
    if (attempts > 0) {
      return sum + toNumber(stat.dribbles?.success) / attempts
    }
    return sum
  }, 0) / Math.max(statistics.length, 1)

  if (dribbleSuccessRate > 0.5) {
    strengths.push({
      category: "Dribbling",
      percentile: Math.min(95, Math.round(dribbleSuccessRate * 100)),
    })
  } else {
    weaknesses.push({
      category: "Dribbling",
      percentile: Math.max(5, Math.round(dribbleSuccessRate * 100)),
    })
  }

  // Creativity (based on key passes)
  const avgKeyPasses =
    statistics.reduce((sum, stat) => sum + toNumber(stat.passes?.key), 0) /
    Math.max(totalGames, 1)
  if (avgKeyPasses > 1.5) {
    strengths.push({
      category: "Creativity",
      percentile: Math.min(95, Math.round((avgKeyPasses / 3) * 100)),
    })
  }

  // Defensive contribution (based on tackles and interceptions)
  const avgDefensiveActions =
    statistics.reduce((sum, stat) => {
      const tackles = toNumber(stat.tackles?.total)
      const interceptions = toNumber(stat.tackles?.interceptions)
      return sum + tackles + interceptions
    }, 0) / Math.max(totalGames, 1)
  
  if (avgDefensiveActions < 2) {
    weaknesses.push({
      category: "Defensive Contribution",
      percentile: Math.max(5, Math.round((avgDefensiveActions / 2) * 100)),
    })
  }

  // Passing volume
  const avgPasses =
    statistics.reduce((sum, stat) => sum + toNumber(stat.passes?.total), 0) /
    Math.max(totalGames, 1)
  if (avgPasses < 30) {
    weaknesses.push({
      category: "Passing Volume",
      percentile: Math.max(5, Math.round((avgPasses / 30) * 100)),
    })
  }

  // Process chart data if provided
  const processedChartData = chartData ? {
    radarChartMetrics: chartData.radarChartMetrics || {},
    positionalTraits: chartData.positionalTraits || {},
    tfgRatingTrend: chartData.tfgRatingTrend || {},
    advancedStats: chartData.advancedStats || {},
  } : undefined

  return {
    profile: {
      name: player.name,
      firstName: player.firstname,
      lastName: player.lastname,
      age: player.age,
      dob: player.birth?.date || "N/A",
      height: player.height || "N/A",
      weight: player.weight || "N/A",
      nationality: player.nationality,
      preferredFoot: null, // API doesn't provide this
      photo: player.photo,
      currentTeam: null, // Will be set from statistics
    },
    positions,
    leagueAppearances,
    statistics: {
      totalGames,
      totalGoals,
      totalAssists,
      totalYellowCards,
      totalRedCards,
      totalMinutes,
      averageRating: Math.round(averageRating * 10) / 10,
    },
    transfers: processedTransfers,
    injuries: processedInjuries,
    strengths,
    weaknesses,
    chartData: processedChartData,
  }
}

