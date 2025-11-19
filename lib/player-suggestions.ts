// Popular football players for suggestions
// This list can be expanded or fetched from API in the future
export const POPULAR_PLAYERS = [
  "Lionel Messi",
  "Cristiano Ronaldo",
  "Kylian Mbappé",
  "Erling Haaland",
  "Kevin De Bruyne",
  "Mohamed Salah",
  "Karim Benzema",
  "Robert Lewandowski",
  "Virgil van Dijk",
  "Luka Modrić",
  "Neymar",
  "Harry Kane",
  "Sadio Mané",
  "Son Heung-min",
  "Bruno Fernandes",
  "Jude Bellingham",
  "Vinícius Júnior",
  "Phil Foden",
  "Bukayo Saka",
  "Jadon Sancho",
  "Antoine Griezmann",
  "Thomas Müller",
  "Manuel Neuer",
  "Thibaut Courtois",
  "Alisson",
  "Ederson",
  "Marc-André ter Stegen",
  "Jan Oblak",
  "Gianluigi Donnarumma",
  "David de Gea",
]

export function getRandomPlayer(): string {
  const randomIndex = Math.floor(Math.random() * POPULAR_PLAYERS.length)
  return POPULAR_PLAYERS[randomIndex]
}

export function getRandomPlayers(count: number = 3): string[] {
  const shuffled = [...POPULAR_PLAYERS].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

