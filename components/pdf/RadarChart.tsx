import { Radar } from "@nivo/radar"

interface RadarRow {
  metric: string
  value: number
}

interface RadarChartProps {
  rows: RadarRow[]
}

export function RadarChart({ rows }: RadarChartProps) {
  if (!rows || rows.length === 0) return null

  const data = rows.map((r) => ({ metric: r.metric, value: Number(r.value) || 0 }))

  return (
    <div style={{ width: 400, height: 260 }}>
      <Radar
        width={400}
        height={260}
        data={data}
        keys={["value"]}
        indexBy="metric"
        maxValue={100}
        margin={{ top: 20, right: 40, bottom: 40, left: 40 }}
        curve="linearClosed"
        borderWidth={2}
        borderColor="rgba(217,119,6,0.9)"
        gridLabelOffset={14}
        dotSize={4}
        dotColor="#0f172a"
        dotBorderWidth={1}
        colors={["rgba(217,119,6,0.6)"]}
        fillOpacity={0.25}
        blendMode="normal"
        gridShape="circular"
        theme={{
          text: {
            fill: "#d1fae5",
            fontSize: 10,
          },
          grid: { line: { stroke: "rgba(31,41,55,0.8)", strokeWidth: 1 } },
          axis: {
            domain: { line: { stroke: "rgba(31,41,55,0.8)", strokeWidth: 1 } },
            ticks: {
              line: { stroke: "rgba(31,41,55,0.8)", strokeWidth: 1 },
              text: { fill: "#d1fae5" },
            },
          },
        }}
      />
    </div>
  )
}
