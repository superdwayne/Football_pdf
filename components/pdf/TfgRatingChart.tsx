import { Line } from "@nivo/line"

interface TrendRow {
  period: string
  value: number
}

interface TfgRatingChartProps {
  rows: TrendRow[]
}

export function TfgRatingChart({ rows }: TfgRatingChartProps) {
  if (!rows || rows.length === 0) return null

  const data = [
    {
      id: "TFG Rating",
      data: rows.map((r) => ({ x: r.period, y: Number(r.value) || 0 })),
    },
  ]

  const values = data[0].data.map((d) => d.y as number)
  const min = Math.min(...values)
  const max = Math.max(...values)

  return (
    <div style={{ width: 400, height: 260 }}>
      <Line
        width={400}
        height={260}
        data={data}
        margin={{ top: 20, right: 20, bottom: 40, left: 40 }}
        xScale={{ type: "point" }}
        yScale={{ type: "linear", min: min - 20, max: max + 20, stacked: false }}
        curve="monotoneX"
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 0,
          tickPadding: 8,
        }}
        axisLeft={{
          tickSize: 0,
          tickPadding: 6,
        }}
        colors={["rgba(217,119,6,0.9)"]}
        lineWidth={2}
        enablePoints={true}
        pointSize={4}
        pointColor="#0f172a"
        pointBorderWidth={1}
        pointBorderColor="rgba(217,119,6,0.9)"
        enableArea={true}
        areaOpacity={0.12}
        enableGridX={false}
        enableGridY={true}
        theme={{
          text: {
            fill: "#d1fae5",
            fontSize: 10,
          },
          grid: { line: { stroke: "rgba(31,41,55,0.7)", strokeWidth: 1 } },
        }}
        legends={[]}
      />
    </div>
  )
}
