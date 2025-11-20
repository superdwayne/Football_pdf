export interface LocalPlayer {
  id: number
  name: string
  position: string
  age: number
  nationality: string
  club: string
  marketValue: string
  // Optional richer data for the report
  dob?: string
  height?: string
  weight?: string
  preferredFoot?: string | null
  photoUrl?: string
  performanceDataJson?: any
  // Key performance metrics
  games?: number
  minutes?: number
  goals?: number
  nonPenaltyGoals?: number
  assists?: number
  xg?: number
  xa?: number
  yellowCards?: number
  redCards?: number
  averageRating?: number
  transfers?: {
    date: string
    type: string
    from: string
    to: string
  }[]
  injuries?: {
    season: string
    injury: string
    from: string
    until: string
    days: number
    gamesMissed: number
  }[]
}

// Base player list (you can keep adding fields per player over time)
export const players: LocalPlayer[] = [
  {
    id: 1,
    name: "Lionel Messi",
    position: "Forward",
    age: 36,
    nationality: "Argentina",
    club: "Inter Miami",
    marketValue: "€50M",
    dob: "1987-06-24",
    height: "1.70 m",
    preferredFoot: "Left",
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/c/c1/Lionel_Messi_20180626.jpg?20180627015805",
    performanceDataJson: {
      "TFG Rating Trend": {
        "Sep 2024": 920,
        "Mar 2026": 915,
        "Predicted 2028": 900
      },
      "Radar Chart Metrics": {
        Passes: 95,
        "Chances Created": 98,
        Shots: 85,
        Touches: 99,
        "Ball Recovery": 70,
        "Defensive Actions": 60,
        "Aerial Duels": 40,
        "Possession Regains": 75,
        Dribbles: 94
      },
      "Positional Traits": {
        Category: "Creative playmaker",
        Overall: 92,
        "Defensive work rate": 55,
        "Passing + Dribbling": 98,
        "Speed and runs in behind": 80
      }
    },
    games: 30,
    minutes: 2600,
    goals: 22,
    nonPenaltyGoals: 19,
    assists: 18,
    xg: 20.5,
    xa: 21.3,
    yellowCards: 3,
    redCards: 0,
    averageRating: 8.4,
    transfers: [
      {
        date: "2023-07-15",
        type: "Free transfer",
        from: "Paris Saint-Germain",
        to: "Inter Miami"
      }
    ],
    injuries: [
      {
        season: "2022/23",
        injury: "Hamstring strain",
        from: "2023-02-10",
        until: "2023-02-24",
        days: 14,
        gamesMissed: 3
      }
    ]
  },

  {
    id: 2,
    name: "Cristiano Ronaldo",
    position: "Forward",
    age: 38,
    nationality: "Portugal",
    club: "Al Nassr",
    marketValue: "€25M",
    dob: "1985-02-05",
    height: "1.87 m",
    preferredFoot: "Right",
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Cristiano_Ronaldo.jpg/1599px-Cristiano_Ronaldo.jpg?20070420131537",
    performanceDataJson: {
      "TFG Rating Trend": {
        "Sep 2024": 880,
        "Mar 2026": 870,
        "Predicted 2028": 850
      },
      "Radar Chart Metrics": {
        Passes: 78,
        "Chances Created": 82,
        Shots: 95,
        Touches: 75,
        "Ball Recovery": 60,
        "Defensive Actions": 50,
        "Aerial Duels": 92,
        "Possession Regains": 68,
        Dribbles: 80
      },
      "Positional Traits": {
        Category: "Goal scorer",
        Overall: 90,
        "Defensive work rate": 60,
        "Passing + Dribbling": 82,
        "Speed and runs in behind": 88
      }
    },
    games: 32,
    minutes: 2800,
    goals: 28,
    nonPenaltyGoals: 25,
    assists: 6,
    xg: 27.1,
    xa: 5.2,
    yellowCards: 5,
    redCards: 0,
    averageRating: 7.9,
    transfers: [
      {
        date: "2023-01-01",
        type: "Free transfer",
        from: "Manchester United",
        to: "Al Nassr"
      },
      {
        date: "2018-07-10",
        type: "Transfer",
        from: "Real Madrid",
        to: "Juventus"
      }
    ],
    injuries: [
      {
        season: "2021/22",
        injury: "Knee discomfort",
        from: "2022-03-05",
        until: "2022-03-19",
        days: 14,
        gamesMissed: 2
      }
    ]
  },

  {
    id: 3,
    name: "Kylian Mbappé",
    position: "Forward",
    age: 25,
    nationality: "France",
    club: "Real Madrid",
    marketValue: "€180M",
    dob: "1998-12-20",
    height: "1.78 m",
    preferredFoot: "Right",
    photoUrl: "https://encrypted-tbn2.gstatic.com/licensed-image?q=tbn:ANd9GcSkR9NBs2QfNrym3iBSm1pK-qS655S1zYQITn_NGD-uaJzF7AYX9sJYI_KSLvAdoCJFQN-anZ4fSGKCz0s",
    performanceDataJson: {
      "TFG Rating Trend": {
        "Sep 2024": 910,
        "Mar 2026": 930,
        "Predicted 2028": 950
      },
      "Radar Chart Metrics": {
        Passes: 82,
        "Chances Created": 88,
        Shots: 92,
        Touches: 85,
        "Ball Recovery": 65,
        "Defensive Actions": 55,
        "Aerial Duels": 70,
        "Possession Regains": 80,
        Dribbles: 96
      },
      "Positional Traits": {
        Category: "Explosive winger",
        Overall: 93,
        "Defensive work rate": 65,
        "Passing + Dribbling": 90,
        "Speed and runs in behind": 99
      }
    },
    games: 34,
    minutes: 2900,
    goals: 29,
    nonPenaltyGoals: 27,
    assists: 10,
    xg: 30.2,
    xa: 9.4,
    yellowCards: 4,
    redCards: 0,
    averageRating: 8.5,
    transfers: [
      {
        date: "2024-07-01",
        type: "Transfer",
        from: "Paris Saint-Germain",
        to: "Real Madrid"
      }
    ],
    injuries: [
      {
        season: "2020/21",
        injury: "Ankle sprain",
        from: "2021-01-20",
        until: "2021-02-05",
        days: 16,
        gamesMissed: 4
      }
    ]
  },

  {
    id: 4,
    name: "Erling Haaland",
    position: "Forward",
    age: 23,
    nationality: "Norway",
    club: "Manchester City",
    marketValue: "€200M",
    dob: "2000-07-21",
    height: "1.94 m",
    preferredFoot: "Left",
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/3/3c/Erling_Haaland_2023_%28fullcropped%29.jpg",
    performanceDataJson: {
      "TFG Rating Trend": {
        "Sep 2024": 900,
        "Mar 2026": 920,
        "Predicted 2028": 940
      },
      "Radar Chart Metrics": {
        Passes: 70,
        "Chances Created": 75,
        Shots: 99,
        Touches: 78,
        "Ball Recovery": 68,
        "Defensive Actions": 60,
        "Aerial Duels": 95,
        "Possession Regains": 72,
        Dribbles: 70
      },
      "Positional Traits": {
        Category: "Target striker",
        Overall: 91,
        "Defensive work rate": 62,
        "Passing + Dribbling": 78,
        "Speed and runs in behind": 92
      }
    },
    games: 33,
    minutes: 2750,
    goals: 36,
    nonPenaltyGoals: 34,
    assists: 5,
    xg: 35.8,
    xa: 4.1,
    yellowCards: 2,
    redCards: 0,
    averageRating: 8.3,
    transfers: [
      {
        date: "2022-07-01",
        type: "Transfer",
        from: "Borussia Dortmund",
        to: "Manchester City"
      }
    ],
    injuries: [
      {
        season: "2022/23",
        injury: "Muscle fatigue",
        from: "2022-10-15",
        until: "2022-10-25",
        days: 10,
        gamesMissed: 2
      }
    ]
  },

  {
    id: 5,
    name: "Kevin De Bruyne",
    position: "Midfielder",
    age: 32,
    nationality: "Belgium",
    club: "Manchester City",
    marketValue: "€80M",
    dob: "1991-06-28",
    height: "1.81 m",
    preferredFoot: "Right",
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/4/48/Kevin_De_Bruyne_201807091.jpg",
    performanceDataJson: {
      "TFG Rating Trend": {
        "Sep 2024": 915,
        "Mar 2026": 905,
        "Predicted 2028": 880
      },
      "Radar Chart Metrics": {
        Passes: 99,
        "Chances Created": 99,
        Shots: 85,
        Touches: 97,
        "Ball Recovery": 72,
        "Defensive Actions": 65,
        "Aerial Duels": 55,
        "Possession Regains": 80,
        Dribbles: 88
      },
      "Positional Traits": {
        Category: "Creative midfielder",
        Overall: 94,
        "Defensive work rate": 70,
        "Passing + Dribbling": 99,
        "Speed and runs in behind": 78
      }
    },
    games: 27,
    minutes: 2200,
    goals: 9,
    nonPenaltyGoals: 8,
    assists: 18,
    xg: 7.3,
    xa: 19.6,
    yellowCards: 4,
    redCards: 0,
    averageRating: 8.2,
    transfers: [
      {
        date: "2015-08-30",
        type: "Transfer",
        from: "VfL Wolfsburg",
        to: "Manchester City"
      }
    ],
    injuries: [
      {
        season: "2023/24",
        injury: "Hamstring injury",
        from: "2023-08-12",
        until: "2023-11-01",
        days: 81,
        gamesMissed: 12
      }
    ]
  },

  {
    id: 6,
    name: "Vinicius Junior",
    position: "Forward",
    age: 23,
    nationality: "Brazil",
    club: "Real Madrid",
    marketValue: "€150M",
    dob: "2000-07-12",
    height: "1.76 m",
    preferredFoot: "Right",
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/2/22/Vin%C3%ADcius_J%C3%BAnior_2018_%28cropped%29.jpg",
    performanceDataJson: {
      "TFG Rating Trend": {
        "Sep 2024": 890,
        "Mar 2026": 910,
        "Predicted 2028": 930
      },
      "Radar Chart Metrics": {
        Passes: 80,
        "Chances Created": 90,
        Shots: 88,
        Touches: 86,
        "Ball Recovery": 60,
        "Defensive Actions": 55,
        "Aerial Duels": 50,
        "Possession Regains": 78,
        Dribbles: 97
      },
      "Positional Traits": {
        Category: "Dribbling winger",
        Overall: 92,
        "Defensive work rate": 60,
        "Passing + Dribbling": 95,
        "Speed and runs in behind": 96
      }
    },
    games: 31,
    minutes: 2600,
    goals: 20,
    nonPenaltyGoals: 19,
    assists: 11,
    xg: 18.9,
    xa: 12.4,
    yellowCards: 6,
    redCards: 1,
    averageRating: 8.1,
    transfers: [
      {
        date: "2018-07-12",
        type: "Transfer",
        from: "Flamengo",
        to: "Real Madrid"
      }
    ],
    injuries: [
      {
        season: "2022/23",
        injury: "Groin strain",
        from: "2022-09-10",
        until: "2022-09-24",
        days: 14,
        gamesMissed: 3
      }
    ]
  },

  {
    id: 7,
    name: "Jude Bellingham",
    position: "Midfielder",
    age: 21,
    nationality: "England",
    club: "Real Madrid",
    marketValue: "€150M",
    dob: "2003-06-29",
    height: "1.86 m",
    preferredFoot: "Right",
    performanceDataJson: {
      "TFG Rating Trend": {
        "Sep 2024": 880,
        "Mar 2026": 905,
        "Predicted 2028": 930
      },
      "Radar Chart Metrics": {
        Passes: 88,
        "Chances Created": 86,
        Shots: 82,
        Touches: 90,
        "Ball Recovery": 80,
        "Defensive Actions": 78,
        "Aerial Duels": 75,
        "Possession Regains": 82,
        Dribbles: 84
      },
      "Positional Traits": {
        Category: "Box-to-box midfielder",
        Overall: 91,
        "Defensive work rate": 85,
        "Passing + Dribbling": 88,
        "Speed and runs in behind": 86
      }
    },
    games: 33,
    minutes: 2850,
    goals: 17,
    nonPenaltyGoals: 16,
    assists: 9,
    xg: 15.7,
    xa: 8.1,
    yellowCards: 7,
    redCards: 0,
    averageRating: 8,
    transfers: [
      {
        date: "2023-07-01",
        type: "Transfer",
        from: "Borussia Dortmund",
        to: "Real Madrid"
      }
    ],
    injuries: [
      {
        season: "2021/22",
        injury: "Knee knock",
        from: "2022-02-01",
        until: "2022-02-14",
        days: 13,
        gamesMissed: 3
      }
    ]
  },

  {
    id: 8,
    name: "Bukayo Saka",
    position: "Forward",
    age: 22,
    nationality: "England",
    club: "Arsenal",
    marketValue: "€120M",
    dob: "2001-09-05",
    height: "1.78 m",
    preferredFoot: "Left",
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/f/f0/1_bukayo_saka_arsenal_2025.jpg",
    performanceDataJson: {
      "TFG Rating Trend": {
        "Sep 2024": 870,
        "Mar 2026": 895,
        "Predicted 2028": 920
      },
      "Radar Chart Metrics": {
        Passes: 84,
        "Chances Created": 90,
        Shots: 86,
        Touches: 88,
        "Ball Recovery": 72,
        "Defensive Actions": 70,
        "Aerial Duels": 60,
        "Possession Regains": 80,
        Dribbles: 90
      },
      "Positional Traits": {
        Category: "Inverted winger",
        Overall: 90,
        "Defensive work rate": 78,
        "Passing + Dribbling": 92,
        "Speed and runs in behind": 88
      }
    },
    games: 35,
    minutes: 3000,
    goals: 16,
    nonPenaltyGoals: 15,
    assists: 13,
    xg: 15.1,
    xa: 12.8,
    yellowCards: 3,
    redCards: 0,
    averageRating: 7.9,
    transfers: [
      {
        date: "2018-07-01",
        type: "Youth promotion",
        from: "Arsenal U18",
        to: "Arsenal First Team"
      }
    ],
    injuries: [
      {
        season: "2023/24",
        injury: "Ankle knock",
        from: "2023-10-05",
        until: "2023-10-15",
        days: 10,
        gamesMissed: 2
      }
    ]
  },

  {
    id: 9,
    name: "Pedri",
    position: "Midfielder",
    age: 21,
    nationality: "Spain",
    club: "Barcelona",
    marketValue: "€100M",
    dob: "2002-11-25",
    height: "1.74 m",
    preferredFoot: "Right",
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/7/76/Pedri_%28cropped%29.jpg",
    performanceDataJson: {
      "TFG Rating Trend": {
        "Sep 2024": 860,
        "Mar 2026": 880,
        "Predicted 2028": 910
      },
      "Radar Chart Metrics": {
        Passes: 92,
        "Chances Created": 90,
        Shots: 75,
        Touches: 94,
        "Ball Recovery": 78,
        "Defensive Actions": 72,
        "Aerial Duels": 50,
        "Possession Regains": 82,
        Dribbles: 88
      },
      "Positional Traits": {
        Category: "Technical midfielder",
        Overall: 89,
        "Defensive work rate": 72,
        "Passing + Dribbling": 94,
        "Speed and runs in behind": 80
      }
    },
    games: 28,
    minutes: 2300,
    goals: 6,
    nonPenaltyGoals: 6,
    assists: 9,
    xg: 4.8,
    xa: 9.9,
    yellowCards: 5,
    redCards: 0,
    averageRating: 7.7,
    transfers: [
      {
        date: "2020-08-20",
        type: "Transfer",
        from: "Las Palmas",
        to: "Barcelona"
      }
    ],
    injuries: [
      {
        season: "2022/23",
        injury: "Thigh muscle strain",
        from: "2023-02-15",
        until: "2023-03-25",
        days: 38,
        gamesMissed: 8
      }
    ]
  },

  {
    id: 10,
    name: "Gavi",
    position: "Midfielder",
    age: 19,
    nationality: "Spain",
    club: "Barcelona",
    marketValue: "€90M",
    dob: "2004-08-05",
    height: "1.73 m",
    preferredFoot: "Right",
    performanceDataJson: {
      "TFG Rating Trend": {
        "Sep 2024": 850,
        "Mar 2026": 870,
        "Predicted 2028": 900
      },
      "Radar Chart Metrics": {
        Passes: 88,
        "Chances Created": 84,
        Shots: 72,
        Touches: 90,
        "Ball Recovery": 82,
        "Defensive Actions": 80,
        "Aerial Duels": 55,
        "Possession Regains": 84,
        Dribbles: 82
      },
      "Positional Traits": {
        Category: "Aggressive midfielder",
        Overall: 88,
        "Defensive work rate": 88,
        "Passing + Dribbling": 86,
        "Speed and runs in behind": 82
      }
    },
    games: 29,
    minutes: 2400,
    goals: 5,
    nonPenaltyGoals: 5,
    assists: 7,
    xg: 4.2,
    xa: 7.4,
    yellowCards: 10,
    redCards: 1,
    averageRating: 7.5,
    transfers: [
      {
        date: "2021-07-01",
        type: "Youth promotion",
        from: "Barcelona B",
        to: "Barcelona"
      }
    ],
    injuries: [
      {
        season: "2023/24",
        injury: "ACL injury",
        from: "2023-11-19",
        until: "2024-08-01",
        days: 256,
        gamesMissed: 30
      }
    ]
  },

  {
    id: 11,
    name: "David Mella",
    position: "Unknown",
    age: null,
    nationality: "Unknown",
    club: "Unknown",
    marketValue: "N/A",
    preferredFoot: null,
    averageRating: null,
    transfers: [],
    injuries: [],
    gamesHistory: []
  }
]

export default players
