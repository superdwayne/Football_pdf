/**
 * Test script to verify chart data extraction from Airtable
 * Run this to debug why charts aren't showing in PDF
 */

const AIRTABLE_BASE_ID = "appLkDMJZrxnOCpPF"
const AIRTABLE_TABLE_ID = "tblwfa8UVh8Uoigp5"
const CRISTIANO_RONALDO_RECORD_ID = "rec3CjeE6r8RfTEd8"

// This simulates what happens in the PDF route
async function testChartDataExtraction() {
  console.log("Testing chart data extraction for Cristiano Ronaldo...")
  
  // Simulate the Performance Data JSON from Airtable
  const performanceDataJSON = `{
    "Radar Chart Metrics": {
      "Passes": 100,
      "ChancesCreated": 100,
      "Shots": 100,
      "Touches": 100,
      "BallRecovery": 40,
      "DefensiveActions": 0,
      "AerialDuels": 0,
      "PossessionRegains": 50,
      "Dribbles": 100
    },
    "AdvancedStats": {
      "shots": {
        "total": 6000,
        "onTarget": 2400,
        "accuracy": 40
      },
      "passes": {
        "total": 180000,
        "accurate": 153000,
        "accuracy": 85
      },
      "dribbles": {
        "attempted": 24000,
        "successful": 14400,
        "successRate": 60
      },
      "tackles": {
        "total": 1200,
        "won": 840,
        "successRate": 70
      },
      "interceptions": 0,
      "clearances": 0,
      "fouls": {
        "committed": 0,
        "suffered": 0
      }
    },
    "Positional Traits": {
      "Category": "Versatile player",
      "Overall": 67,
      "DefensiveWorkRate": 0,
      "PassingDribbling": 100,
      "SpeedRunsInBehind": 100
    },
    "TFG Rating Trend": {
      "Sep 2024": 880,
      "Mar 2026": 900,
      "Predicted 2028": 1035
    }
  }`

  try {
    const performanceData = JSON.parse(performanceDataJSON)
    console.log("✅ Performance Data JSON parsed successfully")
    console.log("Keys in performanceData:", Object.keys(performanceData))
    
    // Extract chart data (same logic as in route)
    const rawPositionalTraits = 
      performanceData.PositionalTraits || 
      performanceData["Positional Traits"] || 
      performanceData.positionalTraits || 
      {}
    
    console.log("Raw positional traits:", rawPositionalTraits)
    console.log("Has Overall?", rawPositionalTraits.Overall !== undefined)
    console.log("Has Category?", rawPositionalTraits.Category !== undefined)
    
    let normalizedPositionalTraits: any = {}
    if (rawPositionalTraits && Object.keys(rawPositionalTraits).length > 0) {
      if (rawPositionalTraits.Overall !== undefined || rawPositionalTraits.Category !== undefined) {
        normalizedPositionalTraits = rawPositionalTraits
        console.log("✅ Using positional traits directly (already PascalCase)")
      } else {
        console.log("⚠️ Normalizing from camelCase format")
      }
    }
    
    const chartData = {
      radarChartMetrics: 
        performanceData.RadarChartMetrics || 
        performanceData["Radar Chart Metrics"] || 
        performanceData.radarChartMetrics || 
        {},
      positionalTraits: normalizedPositionalTraits,
      tfgRatingTrend: 
        performanceData.TFGRatingTrend || 
        performanceData["TFG Rating Trend"] || 
        performanceData.tfgRatingTrend || 
        {},
      advancedStats: 
        performanceData.AdvancedStats || 
        performanceData.advancedStats || 
        {},
    }
    
    console.log("\n📊 Chart Data Extraction Results:")
    console.log("Radar Chart Metrics:", {
      hasData: Object.keys(chartData.radarChartMetrics).length > 0,
      keys: Object.keys(chartData.radarChartMetrics),
      sample: chartData.radarChartMetrics
    })
    console.log("Positional Traits:", {
      hasData: Object.keys(chartData.positionalTraits).length > 0,
      keys: Object.keys(chartData.positionalTraits),
      sample: chartData.positionalTraits
    })
    console.log("TFG Rating Trend:", {
      hasData: Object.keys(chartData.tfgRatingTrend).length > 0,
      keys: Object.keys(chartData.tfgRatingTrend),
      sample: chartData.tfgRatingTrend
    })
    console.log("Advanced Stats:", {
      hasData: Object.keys(chartData.advancedStats).length > 0,
      keys: Object.keys(chartData.advancedStats)
    })
    
    // Check if data would pass the PDF component checks
    const wouldShowRadarChart = chartData.radarChartMetrics && Object.keys(chartData.radarChartMetrics).length > 0
    const wouldShowPositionalTraits = chartData.positionalTraits && Object.keys(chartData.positionalTraits).length > 0
    const wouldShowTFGRating = chartData.tfgRatingTrend && Object.keys(chartData.tfgRatingTrend).length > 0
    
    console.log("\n🎯 PDF Chart Visibility:")
    console.log("Radar Chart would show:", wouldShowRadarChart ? "✅ YES" : "❌ NO")
    console.log("Positional Traits Chart would show:", wouldShowPositionalTraits ? "✅ YES" : "❌ NO")
    console.log("TFG Rating Chart would show:", wouldShowTFGRating ? "✅ YES" : "❌ NO")
    
  } catch (error) {
    console.error("❌ Error:", error)
  }
}

// Run the test
testChartDataExtraction()




