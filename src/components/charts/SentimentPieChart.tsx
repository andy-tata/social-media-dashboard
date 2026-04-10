'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type DataPoint = {
  name: string
  value: number
}

const COLORS = {
  positive: '#22c55e',
  negative: '#ef4444',
  neutral: '#94a3b8',
}

type SentimentPieChartProps = {
  data: DataPoint[]
  title?: string
}

export function SentimentPieChart({ data, title = '情緒分佈' }: SentimentPieChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
              label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={
                    entry.name === '正面' ? COLORS.positive :
                    entry.name === '負面' ? COLORS.negative :
                    COLORS.neutral
                  }
                />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value} 則`, '']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
