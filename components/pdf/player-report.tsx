import React from "react"
import type { ProcessedPlayerData } from "@/lib/data-processor"

interface PlayerReportProps {
  data: ProcessedPlayerData
}

export function PlayerReport({ data }: PlayerReportProps) {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-"
    const parsed = new Date(dateStr)
    return Number.isNaN(parsed.getTime())
      ? dateStr
      : parsed.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
  }

  const formatMinutesAsHours = (minutes: number) => {
    const totalMinutes = Number.isFinite(minutes) ? minutes : 0
    const hours = Math.floor(totalMinutes / 60)
    const mins = totalMinutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const metrics = {
    totalGames: data.leagueAppearances.reduce((sum, app) => sum + (app.games || 0), 0),
    totalAssists: data.leagueAppearances.reduce((sum, app) => sum + (app.assists || 0), 0),
    totalYellow: data.leagueAppearances.reduce((sum, app) => sum + (app.yellowCards || 0), 0),
    totalSecondYellow: data.leagueAppearances.reduce((sum, app) => sum + (app.secondYellow || 0), 0),
    totalRed: data.leagueAppearances.reduce((sum, app) => sum + (app.redCards || 0), 0),
    totalOwnGoals: data.leagueAppearances.reduce((sum, app) => sum + (app.ownGoals || 0), 0),
    totalMinutes: data.leagueAppearances.reduce((sum, app) => sum + (app.minutes || 0), 0),
  }

  const rating = Math.round(data.statistics.averageRating * 10)

  const radarRows = data.chartData?.radarChartMetrics
    ? Object.entries(data.chartData.radarChartMetrics).map(([metric, value]) => ({ metric, value }))
    : []

  const positionalRows = data.chartData?.positionalTraits
    ? Object.entries(data.chartData.positionalTraits).map(([trait, value]) => ({ trait, value }))
    : []

  const ratingTrendRows = data.chartData?.tfgRatingTrend
    ? Object.entries(data.chartData.tfgRatingTrend).map(([period, value]) => ({ period, value }))
    : []

  const sectionClass = "rounded-lg border border-emerald-800/40 bg-emerald-950/30 backdrop-blur" as const
  const sectionTitleClass = "text-xs font-semibold tracking-[0.18em] uppercase text-amber-100" as const
  const bodyTextClass = "text-xs text-emerald-50" as const

  return (
    <div
      className="min-h-screen bg-emerald-900 text-emerald-50 px-6 py-6"
      style={{
        fontFamily: "'Inter', 'DM Sans', Arial, sans-serif",
        maxWidth: "760px",
        margin: "0 auto",
        boxSizing: "border-box",
      }}
    >
      <header className="flex items-center justify-between border-b border-emerald-700 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full border border-amber-300 flex items-center justify-center text-sm font-semibold">
            PIF
          </div>
          <div>
            <p className="text-sm font-semibold tracking-[0.2em] uppercase">PIF</p>
            <p className="text-[10px] text-emerald-200/70 tracking-[0.25em] uppercase">Scouting Report</p>
          </div>
        </div>
        <div className="flex items-center gap-6 text-[10px] font-medium text-emerald-200">
          <span>36k views</span>
          <span>4k shares</span>
          <span>n/a</span>
        </div>
      </header>

      <main className="space-y-4">
        <section className={`${sectionClass} p-4`}>
          <div className="flex items-start gap-4">
            <div className="h-28 w-28 rounded-md border border-emerald-700 bg-emerald-800 flex items-center justify-center overflow-hidden">
              {data.profile.photo ? (
                <img src={data.profile.photo} alt={data.profile.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs text-emerald-200">No Photo</span>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-black tracking-wide uppercase text-amber-50">{data.profile.name}</h1>
                  {data.profile.currentTeam?.name && (
                    <p className="text-xs text-emerald-200 mt-1">{data.profile.currentTeam.name}</p>
                  )}
                </div>
                <div className="rounded-lg border border-amber-400/60 bg-amber-500/10 px-4 py-3 text-right">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-amber-200">TFG Player Rating</p>
                  <p className="text-3xl font-bold text-amber-100">{rating}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-y-3 gap-x-6 text-[11px] text-emerald-100">
                <div>
                  <span className="font-medium text-emerald-200/80">Date of Birth</span>
                  <div>{formatDate(data.profile.dob)}</div>
                </div>
                <div>
                  <span className="font-medium text-emerald-200/80">Age</span>
                  <div>{data.profile.age || "-"}</div>
                </div>
                <div>
                  <span className="font-medium text-emerald-200/80">Nationality</span>
                  <div>{data.profile.nationality}</div>
                </div>
                <div>
                  <span className="font-medium text-emerald-200/80">Height</span>
                  <div>{data.profile.height || "-"}</div>
                </div>
                <div>
                  <span className="font-medium text-emerald-200/80">Preferred Foot</span>
                  <div>{data.profile.preferredFoot || "-"}</div>
                </div>
                <div>
                  <span className="font-medium text-emerald-200/80">Minutes Played</span>
                  <div>{formatMinutesAsHours(metrics.totalMinutes)}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={`${sectionClass} p-4`}>
          <p className={sectionTitleClass}>Key Metrics</p>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[{ label: "Games", value: metrics.totalGames },
              { label: "Assists", value: metrics.totalAssists },
              { label: "Yellow", value: metrics.totalYellow },
              { label: "Red", value: metrics.totalRed },
              { label: "Own Goals", value: metrics.totalOwnGoals },
              { label: "Minutes", value: metrics.totalMinutes },
            ].map((metric) => (
              <div key={metric.label} className="rounded-md border border-emerald-800/60 bg-emerald-950/40 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.28em] text-emerald-200/70">{metric.label}</p>
                <p className="text-lg font-semibold text-amber-100">{metric.value ?? "-"}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          <section className={`${sectionClass} p-4 space-y-2`}>
            <p className={sectionTitleClass}>Positions Played</p>
            <table className="mt-3 w-full border-separate border-spacing-y-1 text-xs">
              <thead className="text-emerald-200/80">
                <tr>
                  <th className="text-left">Position</th>
                  <th className="text-right">Apps</th>
                  <th className="text-right">Goals</th>
                  <th className="text-right">Assists</th>
                </tr>
              </thead>
              <tbody>
                {(data.positions.length ? data.positions : [{ position: "-", appearances: 0, goals: 0, assists: 0 }]).map((pos, idx) => (
                  <tr key={`${pos.position}-${idx}`} className="text-emerald-50/90">
                    <td className="rounded-l-md bg-emerald-950/50 px-3 py-2">{pos.position}</td>
                    <td className="bg-emerald-950/50 px-3 py-2 text-right">{pos.appearances ?? "-"}</td>
                    <td className="bg-emerald-950/50 px-3 py-2 text-right">{pos.goals ?? "-"}</td>
                    <td className="rounded-r-md bg-emerald-950/50 px-3 py-2 text-right">{pos.assists ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className={`${sectionClass} p-4`}>
            <p className={sectionTitleClass}>League Appearances</p>
            <table className="mt-3 w-full border-separate border-spacing-y-1 text-[11px]">
              <thead className="text-emerald-200/80">
                <tr>
                  <th className="text-left">Season</th>
                  <th className="text-left">Competition</th>
                  <th className="text-right">Games</th>
                  <th className="text-right">Assists</th>
                  <th className="text-right">Yellow</th>
                  <th className="text-right">Red</th>
                </tr>
              </thead>
              <tbody>
                {(data.leagueAppearances.length ? data.leagueAppearances : [{ season: "-", competition: "-", games: 0, assists: 0, yellowCards: 0, redCards: 0 }]).map((app, idx) => (
                  <tr key={`${app.season}-${idx}`} className="text-emerald-50/90">
                    <td className="rounded-l-md bg-emerald-950/50 px-3 py-2">{app.season}</td>
                    <td className="bg-emerald-950/50 px-3 py-2">{app.competition}</td>
                    <td className="bg-emerald-950/50 px-3 py-2 text-right">{app.games ?? "-"}</td>
                    <td className="bg-emerald-950/50 px-3 py-2 text-right">{app.assists ?? "-"}</td>
                    <td className="bg-emerald-950/50 px-3 py-2 text-right">{app.yellowCards ?? "-"}</td>
                    <td className="rounded-r-md bg-emerald-950/50 px-3 py-2 text-right">{app.redCards ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <section className={`${sectionClass} p-4 space-y-2`}>
            <p className={sectionTitleClass}>Performance Outlook</p>
            <div className="rounded-lg border border-emerald-800/60 bg-emerald-950/40 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.28em] text-emerald-200/70">Average Rating</p>
              <p className="mt-1 text-2xl font-semibold text-amber-100">{data.statistics.averageRating.toFixed(1)}</p>
              <p className={bodyTextClass}>Current TFG evaluation based on available match data.</p>
            </div>
            <div className="rounded-lg border border-emerald-800/60 bg-emerald-950/40 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.28em] text-emerald-200/70">Total Contributions</p>
              <p className="mt-1 text-2xl font-semibold text-amber-100">{data.statistics.totalGoals + data.statistics.totalAssists}</p>
              <p className={bodyTextClass}>Combined goals and assists across recorded competitions.</p>
            </div>
          </section>

          <section className={`${sectionClass} p-4`}>
            <p className={sectionTitleClass}>General Strengths and Weaknesses</p>
            <div
              className="mt-2 grid gap-4"
              style={{ gridTemplateColumns: "1.4fr 2.6fr" }}
            >
              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-[0.28em] text-emerald-200/70 mb-2">Strengths</p>
                <ul className="space-y-2 text-xs text-emerald-50">
                  {(data.strengths.length ? data.strengths : [{ category: "No data", percentile: 0 }]).slice(0, 5).map((strength, idx) => (
                    <li key={`strength-${idx}`} className="flex items-center justify-between rounded-md bg-emerald-950/50 px-3 py-2">
                      <span>{strength.category}</span>
                      <span className="text-amber-200">{strength.percentile}th percentile</span>
                    </li>
                  ))}
                </ul>
                <p className="text-[10px] uppercase tracking-[0.28em] text-emerald-200/70 mb-2 mt-4">Weaknesses</p>
                <ul className="space-y-2 text-xs text-emerald-50">
                  {(data.weaknesses.length ? data.weaknesses : [{ category: "No data", percentile: 0 }]).slice(0, 5).map((weakness, idx) => (
                    <li key={`weakness-${idx}`} className="flex items-center justify-between rounded-md bg-emerald-950/50 px-3 py-2">
                      <span>{weakness.category}</span>
                      <span className="text-emerald-200">{weakness.percentile}th percentile</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                {data.chartData?.radarChartMetrics && radarRows.length > 0 ? (
                  <>
                    <div className="relative h-64">
                      <canvas
                        id="radarChart"
                        className="h-full"
                        style={{ width: "96%", margin: "0 auto", display: "block" }}
                      />
                    </div>
                    <table className="mt-2 w-full text-[11px] text-emerald-50">
                      <thead>
                        <tr>
                          <th className="text-left text-emerald-200/80">Metric</th>
                          <th className="text-right text-emerald-200/80">Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {radarRows.map((row) => (
                          <tr key={row.metric} className="text-emerald-50/90">
                            <td className="pt-1 pb-1 text-xs uppercase tracking-[0.18em]">{row.metric}</td>
                            <td className="text-right">{row.value ?? 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                ) : (
                  <div className="h-64 flex items-center justify-center rounded-md bg-emerald-950/50 text-emerald-200/50 text-xs">
                    Chart data not available
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Positional Traits Chart */}
        {data.chartData?.positionalTraits && positionalRows.length > 0 && (
          <section className={`${sectionClass} p-4`}>
            <p className={sectionTitleClass}>Club Specific Positional Traits</p>
            <div className="mt-2 space-y-3">
              {data.chartData.positionalTraits.Category && (
                <div className="mb-3 rounded-md bg-amber-500/10 border border-amber-400/60 px-3 py-2">
                  <p className="text-xs font-semibold text-amber-100">Category - {data.chartData.positionalTraits.Category}</p>
                </div>
              )}
              <div className="relative h-40">
                <canvas
                  id="positionalTraitsChart"
                  className="h-full"
                  style={{ width: "88%", margin: "0 auto", display: "block" }}
                />
              </div>
              <table className="w-full text-[11px] text-emerald-50">
                <thead>
                  <tr>
                    <th className="text-left text-emerald-200/80">Trait</th>
                    <th className="text-right text-emerald-200/80">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {positionalRows.map((row) => (
                    <tr key={row.trait} className="text-emerald-50/90">
                      <td className="pt-1 pb-1 text-xs uppercase tracking-[0.18em]">{row.trait}</td>
                      <td className="text-right">{row.value ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* TFG Performance Analysis */}
        {data.chartData?.tfgRatingTrend && data.chartData.tfgRatingTrend && (
          <section className={`${sectionClass} p-4`}>
            <p className={sectionTitleClass}>TFG Performance Analysis</p>
            <div className="mt-2 space-y-3">
              <div className="relative h-56">
                <canvas
                  id="tfgRatingChart"
                  className="h-full"
                  style={{ width: "88%", margin: "0 auto", display: "block" }}
                />
              </div>
              {ratingTrendRows.length > 0 && (
                <table className="w-full text-[11px] text-emerald-50">
                  <thead>
                    <tr>
                      <th className="text-left text-emerald-200/80">Period</th>
                      <th className="text-right text-emerald-200/80">TFG Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ratingTrendRows.map((row) => (
                      <tr key={row.period} className="text-emerald-50/90">
                        <td className="pt-1 pb-1 text-xs uppercase tracking-[0.18em]">{row.period}</td>
                        <td className="text-right">{row.value ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div className="mt-3 flex gap-4 justify-center">
                <div className="rounded-lg border border-amber-400/60 bg-amber-500/10 px-4 py-2">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-emerald-200/70">Current TFG Player Rating</p>
                  <p className="mt-1 text-xl font-semibold text-amber-100">{rating}</p>
                </div>
                {data.chartData.tfgRatingTrend["Predicted 2028"] && (
                  <div className="rounded-lg border border-amber-400/60 bg-amber-500/10 px-4 py-2">
                    <p className="text-[10px] uppercase tracking-[0.28em] text-emerald-200/70">Predicted 2028 TFG Player Rating</p>
                    <p className="mt-1 text-xl font-semibold text-amber-100">{data.chartData.tfgRatingTrend["Predicted 2028"]}</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <section className={`${sectionClass} p-4`}>
            <p className={sectionTitleClass}>Transfer History</p>
            <table className="mt-3 w-full border-separate border-spacing-y-1 text-xs">
              <thead className="text-emerald-200/80">
                <tr>
                  <th className="text-left">Date</th>
                  <th className="text-left">Type</th>
                  <th className="text-left">From</th>
                  <th className="text-left">To</th>
                </tr>
              </thead>
              <tbody>
                {(data.transfers.length ? data.transfers : [{ date: "-", type: "-", from: "-", to: "-" }]).map((transfer, idx) => (
                  <tr key={`transfer-${idx}`} className="text-emerald-50/90">
                    <td className="rounded-l-md bg-emerald-950/50 px-3 py-2">{formatDate(transfer.date)}</td>
                    <td className="bg-emerald-950/50 px-3 py-2">{transfer.type}</td>
                    <td className="bg-emerald-950/50 px-3 py-2">{transfer.from}</td>
                    <td className="rounded-r-md bg-emerald-950/50 px-3 py-2">{transfer.to}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className={`${sectionClass} p-4`}>
            <p className={sectionTitleClass}>Injury Record</p>
            <table className="mt-3 w-full border-separate border-spacing-y-1 text-xs">
              <thead className="text-emerald-200/80">
                <tr>
                  <th className="text-left">Season</th>
                  <th className="text-left">Injury</th>
                  <th className="text-left">From</th>
                  <th className="text-left">Until</th>
                  <th className="text-right">Days</th>
                </tr>
              </thead>
              <tbody>
                {(data.injuries.length ? data.injuries : [{ season: "-", injury: "-", from: "-", until: "-", days: 0 }]).map((injury, idx) => (
                  <tr key={`injury-${idx}`} className="text-emerald-50/90">
                    <td className="rounded-l-md bg-emerald-950/50 px-3 py-2">{injury.season}</td>
                    <td className="bg-emerald-950/50 px-3 py-2">{injury.injury}</td>
                    <td className="bg-emerald-950/50 px-3 py-2">{injury.from}</td>
                    <td className="bg-emerald-950/50 px-3 py-2">{injury.until}</td>
                    <td className="rounded-r-md bg-emerald-950/50 px-3 py-2 text-right">{injury.days ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </main>

      <footer className="mt-6 border-t border-emerald-700 pt-3 text-center text-[10px] text-emerald-300">
        Generated by the PIF Scouting Intelligence Platform
      </footer>
    </div>
  )
}
