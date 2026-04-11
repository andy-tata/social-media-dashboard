'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type SentimentData = {
  positive: number
  negative: number
  neutral: number
  total: number
}

type SentimentCompareCardProps = {
  rov: SentimentData
  mlbb: SentimentData
  title?: string
}

function Pct({ value, total }: { value: number; total: number }) {
  const pct = total > 0 ? (value / total) * 100 : 0
  return `${pct.toFixed(1)}%`
}

function SentimentBar({ data, label, color }: { data: SentimentData; label: string; color: string }) {
  const { positive, negative, neutral, total } = data
  const posPct = total > 0 ? (positive / total) * 100 : 0
  const negPct = total > 0 ? (negative / total) * 100 : 0
  const neuPct = total > 0 ? (neutral / total) * 100 : 0

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className={`text-sm font-semibold ${color}`}>{label}</span>
        <span className="text-xs text-muted-foreground">{total.toLocaleString()} 反應</span>
      </div>

      {/* 堆疊條 */}
      <div className="h-6 rounded-full overflow-hidden flex bg-muted">
        {posPct > 0 && (
          <div
            className="bg-green-500 flex items-center justify-center text-[10px] text-white font-medium"
            style={{ width: `${Math.max(posPct, 3)}%` }}
          >
            {posPct >= 8 ? `${posPct.toFixed(0)}%` : ''}
          </div>
        )}
        {neuPct > 0 && (
          <div
            className="bg-amber-400 flex items-center justify-center text-[10px] text-white font-medium"
            style={{ width: `${Math.max(neuPct, 3)}%` }}
          >
            {neuPct >= 8 ? `${neuPct.toFixed(0)}%` : ''}
          </div>
        )}
        {negPct > 0 && (
          <div
            className="bg-red-500 flex items-center justify-center text-[10px] text-white font-medium"
            style={{ width: `${Math.max(negPct, 3)}%` }}
          >
            {negPct >= 8 ? `${negPct.toFixed(0)}%` : ''}
          </div>
        )}
      </div>

      {/* 數字明細 */}
      <div className="flex gap-4 text-xs">
        <span className="text-green-600">
          正面 <Pct value={positive} total={total} />
        </span>
        <span className="text-amber-600">
          中立 <Pct value={neutral} total={total} />
        </span>
        <span className="text-red-500">
          負面 <Pct value={negative} total={total} />
        </span>
      </div>
    </div>
  )
}

export function SentimentCompareCard({ rov, mlbb, title = '情緒分析概覽' }: SentimentCompareCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-xs text-muted-foreground">
          依反應表情分類：Like+Love = 正面 / Haha+Wow = 中立 / Sad+Angry = 負面
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <SentimentBar data={rov} label="ROV" color="text-blue-600" />
        <SentimentBar data={mlbb} label="MLBBTH" color="text-red-500" />

        {/* 圖例 */}
        <div className="flex items-center gap-4 pt-2 border-t border-border">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs text-muted-foreground">正面</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <span className="text-xs text-muted-foreground">中立</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-xs text-muted-foreground">負面</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
