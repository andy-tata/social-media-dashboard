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
  label: string
  aov: number
  mlbb: number
}

type ComparisonChartProps = {
  data: DataPoint[]
  title?: string
  valueLabel?: string
}

export function ComparisonChart({ data, title = '競品對比', valueLabel }: ComparisonChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis dataKey="label" type="category" tick={{ fontSize: 12 }} width={80} />
            <Tooltip formatter={(value) => [valueLabel ? `${value} ${valueLabel}` : value, '']} />
            <Legend />
            <Bar dataKey="aov" name="ROV" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            <Bar dataKey="mlbb" name="MLBBTH" fill="#ef4444" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
