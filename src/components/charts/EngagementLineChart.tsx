'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type DataPoint = {
  date: string
  aov: number | null
  mlbb: number | null
}

type EngagementLineChartProps = {
  data: DataPoint[]
  title?: string
}

export function EngagementLineChart({ data, title }: EngagementLineChartProps) {
  // 動態計算實際資料天數
  const dayCount = data.length
  const chartTitle = title || (dayCount > 0 ? `每日平均互動數趨勢（近 ${dayCount} 天）` : '每日平均互動數趨勢')

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{chartTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => v.slice(5)} // 只顯示 MM-DD
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value) => [`${Number(value).toLocaleString()}`, '']}
              labelFormatter={(label) => `日期：${label}`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="aov"
              name="傳說對決"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="mlbb"
              name="MLBB"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
