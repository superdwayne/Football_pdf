export interface ChartDataSegments {
  radarChartMetrics: Record<string, any>
  positionalTraits: Record<string, any>
  tfgRatingTrend: Record<string, any>
  advancedStats: Record<string, any>
}

const normalizeKey = (key: string) =>
  key
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")

const parseToObject = (value: any): Record<string, any> => {
  if (!value) return {}
  if (typeof value === "object") {
    return value
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value)
      if (parsed && typeof parsed === "object") {
        return parsed
      }
    } catch (error) {
      console.warn("Failed to parse chart segment string", error)
    }
  }
  return {}
}

const rawPositionalTraitsToNormalized = (raw: Record<string, any>) => {
  if (!raw || Object.keys(raw).length === 0) {
    return {}
  }

  if (raw.Overall !== undefined || raw.Category !== undefined) {
    return raw
  }

  return {
    Category: raw.category || "",
    Overall: raw.overall || 0,
    DefensiveWorkRate:
      raw.defensiveWorkRate || raw["Defensive work rate"] || 0,
    PassingDribbling:
      raw.passingAndDribbling || raw["Passing + Dribbling"] || 0,
    SpeedRunsInBehind:
      raw.speedAndRunsInBehind || raw["Speed and runs in behind"] || 0,
  }
}

const findMatchingSegment = (
  performanceData: Record<string, any>,
  aliases: string[],
  fallbackValues: any[] = []
): Record<string, any> => {
  const aliasSet = new Set(aliases.map((alias) => normalizeKey(alias)))

  for (const key of Object.keys(performanceData)) {
    if (aliasSet.has(normalizeKey(key))) {
      return parseToObject(performanceData[key])
    }
  }

  for (const fallback of fallbackValues) {
    const parsedFallback = parseToObject(fallback)
    if (Object.keys(parsedFallback).length > 0) {
      return parsedFallback
    }
  }

  return {}
}

const locatePerformanceField = (fields: Record<string, any>) => {
  if (!fields) return { key: null, value: null }

  const candidateKey = Object.keys(fields).find((key) =>
    normalizeKey(key).includes("performancedata")
  )

  return {
    key: candidateKey || "Performance Data JSON",
    value:
      (candidateKey && fields[candidateKey]) ||
      fields["Performance Data JSON"],
  }
}

export function extractChartDataFromPerformanceFields(fields: Record<string, any>) {
  const { key: fieldName, value: rawValue } = locatePerformanceField(fields)
  if (!rawValue) {
    return { chartData: null, performanceData: {}, usedField: fieldName }
  }

  let performanceData: Record<string, any> = {}
  if (typeof rawValue === "string") {
    try {
      performanceData = JSON.parse(rawValue || "{}")
    } catch (error) {
      console.warn("Failed to parse Performance Data JSON string", error)
      performanceData = {}
    }
  } else if (typeof rawValue === "object") {
    performanceData = rawValue
  }

  const chartData: ChartDataSegments = {
    radarChartMetrics: findMatchingSegment(
      performanceData,
      ["RadarChartMetrics", "Radar Chart Metrics", "RadarChart", "radarChartMetrics"],
      [
        performanceData.RadarChartMetrics,
        performanceData["Radar Chart Metrics"],
        performanceData.radarChartMetrics,
      ]
    ),
    positionalTraits: rawPositionalTraitsToNormalized(
      performanceData.PositionalTraits ||
        performanceData["Positional Traits"] ||
        performanceData.positionalTraits ||
        {}
    ),
    tfgRatingTrend: findMatchingSegment(
      performanceData,
      ["TFGRatingTrend", "TFG Rating Trend", "tfgRatingTrend"],
      [
        performanceData.TFGRatingTrend,
        performanceData["TFG Rating Trend"],
        performanceData.tfgRatingTrend,
      ]
    ),
    advancedStats: findMatchingSegment(
      performanceData,
      ["AdvancedStats", "advancedStats"],
      [performanceData.AdvancedStats, performanceData.advancedStats]
    ),
  }

  return { chartData, performanceData, usedField: fieldName }
}
