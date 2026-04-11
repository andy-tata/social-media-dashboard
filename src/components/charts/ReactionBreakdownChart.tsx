'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type DataPoint = {
  name: string
  rov: number
  mlbb: number
}

type ReactionBreakdownChartProps = {
  data: DataPoint[]
  title?: string
}

export function ReactionBreakdownChart({ data, title = '反應表情構成（排除 Like）' }: ReactionBreakdownChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-xs text-muted-foreground">各反應佔總反應的百分比，比較兩品牌粉絲的情緒特質</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 50, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              type="number"
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => `${v}%`}
            />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={50} />
            <Tooltip formatter={(value) => [`${Number(value).toFixed(2)}%`, '']} />
            <Legend />
            <Bar dataKey="rov" name="ROV" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            <Bar dataKey="mlbb" name="MLBBTH" fill="#ef4444" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
