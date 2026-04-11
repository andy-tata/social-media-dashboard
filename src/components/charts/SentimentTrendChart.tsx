'use client'

import {
  AreaChart,
  Area,
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
  rov_positive: number
  rov_negative: number
  mlbb_positive: number
  mlbb_negative: number
}

type SentimentTrendChartProps = {
  data: DataPoint[]
  title?: string
}

export function SentimentTrendChart({ data, title = '反應情緒趨勢' }: SentimentTrendChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-xs text-muted-foreground">正面比例 = (Like + Love) / 總反應</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => v.slice(5)}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => `${v}%`}
              domain={[0, 100]}
            />
            <Tooltip
              formatter={(value, name) => {
                const labels: Record<string, string> = {
                  rov_positive: 'ROV 正面',
                  rov_negative: 'ROV 負面',
                  mlbb_positive: 'MLBBTH 正面',
                  mlbb_negative: 'MLBBTH 負面',
                }
                return [`${Number(value).toFixed(1)}%`, labels[String(name)] || String(name)]
              }}
              labelFormatter={(label) => `日期：${label}`}
            />
            <Legend
              formatter={(value) => {
                const labels: Record<string, string> = {
                  rov_positive: 'ROV 正面',
                  rov_negative: 'ROV 負面',
                  mlbb_positive: 'MLBBTH 正面',
                  mlbb_negative: 'MLBBTH 負面',
                }
                return labels[value] || value
              }}
            />
            <Area
              type="monotone"
              dataKey="rov_positive"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.15}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Area
              type="monotone"
              dataKey="mlbb_positive"
              stroke="#ef4444"
              fill="#ef4444"
              fillOpacity={0.15}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
