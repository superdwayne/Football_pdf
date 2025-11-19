import { Bar } from "@nivo/bar"

interface PositionalRow {
  trait: string
  value: number
}

interface PositionalTraitsChartProps {
  rows: PositionalRow[]
}

export function PositionalTraitsChart({ rows }: PositionalTraitsChartProps) {
  if (!rows || rows.length === 0) return null

  const data = rows.map((r) => ({ trait: r.trait, score: Number(r.value) || 0 }))

  return (
    <div style={{ width: 400, height: 220 }}>
      <Bar
        width={400}
        height={220}
        data={data}
        keys={["score"]}
        indexBy="trait"
        layout="horizontal"
        margin={{ top: 10, right: 20, bottom: 30, left: 80 }}
        padding={0.3}
        colors={["rgba(34,197,94,0.8)"]}
        borderRadius={2}
        enableLabel={false}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 0,
          tickPadding: 6,
        }}
        axisLeft={{
          tickSize: 0,
          tickPadding: 6,
        }}
        theme={{
          text: {
            fill: "#d1fae5",
            fontSize: 10,
          },
          axis: {
            ticks: { text: { fill: "#d1fae5" } },
          },
          grid: { line: { stroke: "rgba(31,41,55,0.7)", strokeWidth: 1 } },
        }}
        legends={[]}
      />
    </div>
  )
}
