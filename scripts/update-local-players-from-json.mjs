#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import process from 'process'
import vm from 'vm'
import ts from 'typescript'
import { createRequire } from 'module'

const PLAYER_FIELD_ORDER = [
  'id',
  'name',
  'position',
  'age',
  'nationality',
  'club',
  'marketValue',
  'dob',
  'height',
  'weight',
  'preferredFoot',
  'photoUrl',
  'performanceDataJson',
  'games',
  'minutes',
  'goals',
  'nonPenaltyGoals',
  'assists',
  'xg',
  'xa',
  'yellowCards',
  'redCards',
  'averageRating',
  'transfers',
  'injuries'
]

const args = process.argv.slice(2)
if (args.length === 0) {
  console.error('Usage: node scripts/update-local-players-from-json.mjs <scraped-json> [more-json-files...]')
  process.exit(1)
}

const projectRoot = process.cwd()
const localPlayersPath = path.join(projectRoot, 'lib', 'local-players.ts')
if (!fs.existsSync(localPlayersPath)) {
  console.error(`Could not find lib/local-players.ts at ${localPlayersPath}`)
  process.exit(1)
}

const localPlayersSource = fs.readFileSync(localPlayersPath, 'utf8')
const players = loadExistingPlayers(localPlayersSource, localPlayersPath)

const nameToIndex = new Map(players.map((player, index) => [normalizeName(player.name), index]))
let nextId = players.reduce((max, player) => Math.max(max, Number(player.id) || 0), 0) + 1

const processedFiles = []

for (const input of args) {
  const jsonPath = path.isAbsolute(input) ? input : path.join(projectRoot, input)
  if (!fs.existsSync(jsonPath)) {
    console.warn(`Skipping ${input} – file not found`)
    continue
  }

  const scraped = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
  const normalizedName = normalizeName(scraped.player_name || scraped.name)
  if (!normalizedName) {
    console.warn(`Skipping ${input} – missing player_name`)
    continue
  }

  const existingIndex = nameToIndex.get(normalizedName)
  const existingPlayer = existingIndex != null ? players[existingIndex] : undefined
  const id = existingPlayer?.id ?? nextId++

  const updates = buildPlayerFromScraped(scraped, id, existingPlayer)

  if (existingIndex != null) {
    players[existingIndex] = mergePlayers(existingPlayer, updates)
  } else {
    players.push(mergePlayers({}, updates))
    nameToIndex.set(normalizedName, players.length - 1)
  }

  processedFiles.push(path.basename(jsonPath))
}

if (processedFiles.length === 0) {
  console.error('No valid scraped data files were processed. Aborting without writing changes.')
  process.exit(1)
}

const updatedSource = rebuildLocalPlayersSource(localPlayersSource, players)
fs.writeFileSync(localPlayersPath, updatedSource)

console.log(`Updated lib/local-players.ts using ${processedFiles.join(', ')}`)

function loadExistingPlayers(source, filePath) {
  const localRequire = createRequire(filePath)
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 }
  })

  const module = { exports: {} }
  const context = vm.createContext({
    module,
    exports: module.exports,
    require: localRequire,
    __dirname: path.dirname(filePath),
    __filename: filePath,
    console
  })
  const script = new vm.Script(transpiled.outputText, { filename: filePath })
  script.runInContext(context)

  const exportedPlayers = module.exports.players || module.exports.default
  if (!Array.isArray(exportedPlayers)) {
    throw new Error('Unable to load players array from local-players.ts')
  }
  return exportedPlayers.map((player) => ({ ...player }))
}

function normalizeName(value) {
  return (value || '').trim().toLowerCase()
}

function buildPlayerFromScraped(scraped, id, existing) {
  const personal = scraped.personal_info || {}
  const careerStats = scraped.career_stats || []
  const valuations = scraped.valuations || {}
  const injuries = scraped.injury_history || scraped.injuries || []

  const dobInfo = parseDob(personal.dob)

  const aggregate = (key) =>
    careerStats.reduce((total, row) => {
      const value = parseNumber(row[key])
      return total + value
    }, 0)

  const minutesPlayed = careerStats.reduce((total, row) => {
    const raw = row.minutes || row.mins
    return total + parseNumber(raw)
  }, 0)

  return {
    id,
    name: scraped.player_name || existing?.name || 'Unknown Player',
    position: selectPosition(personal.position, existing?.position),
    age: dobInfo.age ?? existing?.age ?? null,
    nationality: personal.citizenship || existing?.nationality || 'Unknown',
    club: personal.current_club || existing?.club || 'Unknown',
    marketValue: valuations.current_value || existing?.marketValue || 'N/A',
    dob: dobInfo.dob ?? existing?.dob,
    height: personal.height || existing?.height,
    preferredFoot: personal.preferred_foot || existing?.preferredFoot || null,
    games: positiveOrUndefined(aggregate('appearances')),
    minutes: positiveOrUndefined(minutesPlayed),
    goals: positiveOrUndefined(aggregate('goals')),
    nonPenaltyGoals: positiveOrUndefined(aggregate('goals')),
    assists: positiveOrUndefined(aggregate('assists')),
    yellowCards: positiveOrUndefined(aggregate('yellow_cards')),
    redCards: positiveOrUndefined(aggregate('red_cards')),
    transfers: existing?.transfers || [],
    injuries: buildInjuries(injuries, existing?.injuries),
    performanceDataJson: existing?.performanceDataJson,
    photoUrl: existing?.photoUrl,
    averageRating: existing?.averageRating ?? null,
    xg: existing?.xg,
    xa: existing?.xa,
    gamesHistory: careerStats
  }
}

function selectPosition(scrapedPosition, fallback) {
  if (scrapedPosition && typeof scrapedPosition === 'string') {
    return scrapedPosition.split(',')[0].trim()
  }
  return fallback || 'Unknown'
}

function parseDob(value) {
  if (!value || typeof value !== 'string') {
    return { dob: undefined, age: undefined }
  }

  const parts = value.split('(')
  const dateRaw = parts[0].trim()
  const ageMatch = value.match(/\((\d{1,2})\)/)

  const parsedDate = Date.parse(dateRaw)
  const dob = Number.isNaN(parsedDate) ? undefined : new Date(parsedDate).toISOString().split('T')[0]
  const ageFromDate = dob ? Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : undefined
  const age = ageFromDate ?? (ageMatch ? Number(ageMatch[1]) : undefined)

  return { dob, age }
}

function parseNumber(value) {
  if (value == null) return 0
  if (typeof value === 'number' && !Number.isNaN(value)) return value
  const cleaned = String(value).replace(/[^0-9.-]/g, '')
  if (!cleaned) return 0
  const parsed = Number(cleaned)
  return Number.isNaN(parsed) ? 0 : parsed
}

function positiveOrUndefined(value) {
  if (!value) return undefined
  return value
}

function buildInjuries(scrapedInjuries, fallback) {
  if (Array.isArray(scrapedInjuries) && scrapedInjuries.length > 0) {
    return scrapedInjuries.map((injury) => ({
      season: injury.season || injury.period || 'Unknown',
      injury: injury.injury_type || injury.injury || 'Unknown',
      from: injury.from_date || injury.from || '',
      until: injury.until_date || injury.until || '',
      days: parseNumber(injury.days_missed || injury.days) || 0,
      gamesMissed: parseNumber(injury.games_missed || injury.gamesMissed) || 0
    }))
  }
  return fallback || []
}

function mergePlayers(base, updates) {
  const result = { ...base }
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      result[key] = value
    }
  }
  return result
}

function rebuildLocalPlayersSource(originalSource, playersArray) {
  const playersDeclaration = 'export const players'
  const declarationIndex = originalSource.indexOf(playersDeclaration)
  if (declarationIndex === -1) {
    throw new Error('Could not find players declaration in local-players.ts')
  }

  const exportDefaultIndex = originalSource.indexOf('export default players', declarationIndex)
  if (exportDefaultIndex === -1) {
    throw new Error('Could not find export default players statement')
  }

  const prefix = originalSource.slice(0, declarationIndex)
  const suffix = originalSource.slice(exportDefaultIndex)

  const serializedPlayers = playersArray
    .map((player) => serializePlayer(player, 2))
    .join(',\n\n')

  const playersBlock = `${playersDeclaration}: LocalPlayer[] = [\n${serializedPlayers}\n]\n\n`

  return `${prefix}${playersBlock}${suffix}`
}

function serializePlayer(player, indentLevel = 0) {
  const indent = ' '.repeat(indentLevel)
  const innerIndent = ' '.repeat(indentLevel + 2)

  const keys = new Set(Object.keys(player))
  const orderedKeys = PLAYER_FIELD_ORDER.filter((key) => keys.has(key))
  for (const key of orderedKeys) {
    keys.delete(key)
  }
  const remainingKeys = Array.from(keys).sort()
  const finalKeys = [...orderedKeys, ...remainingKeys]

  const lines = finalKeys
    .map((key) => {
      const value = player[key]
      if (value === undefined) return null
      return `${innerIndent}${key}: ${serializeValue(value, indentLevel + 2)}`
    })
    .filter(Boolean)

  return `${indent}{\n${lines.join(',\n')}\n${indent}}`
}

function serializeValue(value, indentLevel) {
  if (value === null) return 'null'
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (typeof value === 'string') {
    return `"${value.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/"/g, '\\"')}"`
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    const items = value
      .map((item) => `${' '.repeat(indentLevel + 2)}${serializeValue(item, indentLevel + 2)}`)
      .join(',\n')
    return `[
${items}
${' '.repeat(indentLevel)}]`
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value)
    if (entries.length === 0) return '{}'
    const lines = entries
      .map(([key, val]) => {
        const safeKey = /^[$A-Z_][0-9A-Z_$]*$/i.test(key) ? key : `"${key}"`
        return `${' '.repeat(indentLevel + 2)}${safeKey}: ${serializeValue(val, indentLevel + 2)}`
      })
      .join(',\n')
    return `{
${lines}
${' '.repeat(indentLevel)}}`
  }
  return 'undefined'
}
