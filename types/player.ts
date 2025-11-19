export interface Player {
  id: number
  name: string
  firstname: string
  lastname: string
  age: number
  birth: {
    date: string
    place: string
    country: string
  }
  nationality: string
  height: string
  weight: string
  injured: boolean
  photo: string
  currentTeam?: {
    name: string
    logo?: string
  }
}

export interface PlayerStatistics {
  team: {
    id: number
    name: string
    logo: string
  }
  league: {
    id: number
    name: string
    country: string
    logo: string
    flag: string
    season: number
  }
  games: {
    appearences: number
    lineups: number
    minutes: number
    number: number | null
    position: string
    rating: string
    captain: boolean
  }
  substitutes: {
    in: number
    out: number
    bench: number
  }
  shots: {
    total: number
    on: number
  }
  goals: {
    total: number
    conceded: number | null
    assists: number
    saves: number | null
  }
  passes: {
    total: number
    key: number
    accuracy: number
  }
  tackles: {
    total: number
    blocks: number
    interceptions: number
  }
  duels: {
    total: number
    won: number
  }
  dribbles: {
    attempts: number
    success: number
  }
  fouls: {
    drawn: number
    committed: number
  }
  cards: {
    yellow: number
    yellowred: number
    red: number
  }
  penalty: {
    won: number | null
    commited: number | null
    scored: number
    missed: number
    saved: number | null
  }
}

export interface PlayerTransfer {
  date: string
  type: string
  teams: {
    in: {
      id: number
      name: string
      logo: string
    }
    out: {
      id: number
      name: string
      logo: string
    }
  }
}

export interface PlayerInjury {
  player: {
    id: number
    name: string
  }
  team: {
    id: number
    name: string
    logo: string
  }
  fixture: {
    id: number
    referee: string
    timezone: string
    date: string
    timestamp: number
    venue: {
      id: number
      name: string
      city: string
    }
    status: {
      long: string
      short: string
      elapsed: number
    }
  }
  league: {
    id: number
    season: number
    name: string
    country: string
    logo: string
    flag: string
    round: string
  }
  players: {
    player: {
      id: number
      name: string
    }
    player_id: number
  }[]
  player_id: number
  player_name: string
  reason: string
  fixture: {
    id: number
    timezone: string
    date: string
    timestamp: number
  }
  coach: {
    id: number
    name: string
    photo: string
  }
}

export interface PlayerSearchResult {
  player: Player
}

export interface ApiFootballResponse<T> {
  get: string
  parameters: Record<string, string | number>
  errors: any[]
  results: number
  paging: {
    current: number
    total: number
  }
  response: T[]
}

