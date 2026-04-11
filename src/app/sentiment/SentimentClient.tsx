'use client'

import { useState, useMemo } from 'react'
import { MetricCard } from '@/components/cards/MetricCard'
import { SentimentPieChart } from '@/components/charts/SentimentPieChart'
import { DateRangePicker, getComparisonRange, formatRangeLabel } from '@/components/ui/date-range-picker'
import type { DateRange } from '@/components/ui/date-range-picker'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { translateComment } from '@/lib/utils/commentTranslator'
import type { CommentWithMeta } from '@/lib/data'

type BrandFilter = 'rov' | 'mlbbth'
type SentimentFilter = 'all' | 'positive' | 'negative' | 'neutral'

function formatDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getDefaultRange(): DateRange {
  const now = new Date()
  const end = formatDateStr(now)
  const start = new Date(now)
  start.setDate(start.getDate() - 6)
  return { start: formatDateStr(start), end }
}

function filterByRange(comments: CommentWithMeta[], range: DateRange): CommentWithMeta[] {
  return comments.filter((c) => {
    if (!c.published_at) return false
    const date = c.published_at.split('T')[0]
    return date >= range.start && date <= range.end
  })
}

function calcChange(current: number, previous: number): number {
  return previous > 0 ? ((current - previous) / previous) * 100 : 0
}

export function SentimentClient({ comments }: { comments: CommentWithMeta[] }) {
  const [brand, setBrand] = useState<BrandFilter>('rov')
  const [sentiment, setSentiment] = useState<SentimentFilter>('all')
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultRange)

  const compRange = useMemo(() => getComparisonRange(dateRange), [dateRange])
  const currentLabel = formatRangeLabel(dateRange)
  const compLabel = formatRangeLabel(compRange)

  // 品牌篩選
  const brandComments = useMemo(() => {
    return comments.filter((c) => brand === 'rov' ? c.is_own : !c.is_own)
  }, [comments, brand])

  // 日期篩選
  const currentComments = useMemo(() => filterByRange(brandComments, dateRange), [brandComments, dateRange])
  const previousComments = useMemo(() => filterByRange(brandComments, compRange), [brandComments, compRange])

  // KPI
  const positive = currentComments.filter((c) => c.sentiment_label === 'positive').length
  const negative = currentComments.filter((c) => c.sentiment_label === 'negative').length
  const neutral = currentComments.filter((c) => c.sentiment_label === 'neutral').length
  const total = currentComments.length

  const prevPositive = previousComments.filter((c) => c.sentiment_label === 'positive').length
  const prevTotal = previousComments.length
  const prevPositivePct = prevTotal > 0 ? (prevPositive / prevTotal) * 100 : 0
  const currentPositivePct = total > 0 ? (positive / total) * 100 : 0

  // 圓餅圖
  const pieData = [
    { name: '正面', value: positive },
    { name: '負面', value: negative },
    { name: '中立', value: neutral },
  ]

  // 情緒篩選後的留言列表
  const filteredComments = useMemo(() => {
    let filtered = currentComments
    if (sentiment !== 'all') filtered = filtered.filter((c) => c.sentiment_label === sentiment)
    return filtered
  }, [currentComments, sentiment])

  const hasData = total > 0

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* 標題 + 日期選擇器 */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">情緒分析</h2>
          <p className="text-sm text-muted-foreground mt-1">留言情緒追蹤與趨勢</p>
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* 品牌切換 */}
      <div className="flex gap-2">
        {([
          { key: 'rov' as const, label: 'ROV' },
          { key: 'mlbbth' as const, label: 'MLBBTH' },
        ]).map((item) => (
          <button
            key={item.key}
            onClick={() => setBrand(item.key)}
            className={cn(
              'px-3 py-1.5 text-sm rounded-md transition-colors',
              brand === item.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-accent'
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {!hasData ? (
        <div className="rounded-lg border border-border p-12 text-center space-y-2">
          <p className="text-lg font-medium text-muted-foreground">尚無留言資料</p>
          <p className="text-sm text-muted-foreground">需接上留言爬蟲後才會有情緒分析數據</p>
        </div>
      ) : (
        <>
          {/* KPI 卡片 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="正面留言"
              value={`${total > 0 ? ((positive / total) * 100).toFixed(0) : 0}%`}
              change={calcChange(currentPositivePct, prevPositivePct)}
              subtitle={`${positive} 則 · vs ${compLabel}`}
            />
            <MetricCard
              title="負面留言"
              value={`${total > 0 ? ((negative / total) * 100).toFixed(0) : 0}%`}
              subtitle={`${negative} 則`}
            />
            <MetricCard
              title="中立留言"
              value={`${total > 0 ? ((neutral / total) * 100).toFixed(0) : 0}%`}
              subtitle={`${neutral} 則`}
            />
            <MetricCard
              title="留言總數"
              value={total}
              change={calcChange(total, prevTotal)}
              subtitle={`vs ${compLabel}`}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SentimentPieChart data={pieData} title={`情緒分佈 — ${currentLabel}`} />

            {/* 留言瀏覽 */}
            <div className="bg-card rounded-lg border border-border">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-semibold">留言瀏覽</h3>
                <div className="flex items-center gap-1">
                  {([
                    { key: 'all' as const, label: '全部' },
                    { key: 'positive' as const, label: '正面' },
                    { key: 'negative' as const, label: '負面' },
                    { key: 'neutral' as const, label: '中立' },
                  ]).map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setSentiment(item.key)}
                      className={cn(
                        'px-2.5 py-1 text-xs rounded-md border transition-colors',
                        sentiment === item.key
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-card text-muted-foreground border-border hover:bg-accent'
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="divide-y divide-border max-h-[400px] overflow-auto">
                {filteredComments.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    沒有符合篩選條件的留言
                  </div>
                ) : (
                  filteredComments.map((c) => (
                    <div key={c.id} className="p-3 flex items-start gap-2">
                      <Badge
                        variant="outline"
                        className={cn('shrink-0 text-xs',
                          c.sentiment_label === 'positive' ? 'border-green-300 text-green-700 bg-green-50' :
                          c.sentiment_label === 'negative' ? 'border-red-300 text-red-700 bg-red-50' :
                          'border-gray-300 text-gray-600'
                        )}
                      >
                        {c.sentiment_label === 'positive' ? '正面' : c.sentiment_label === 'negative' ? '負面' : '中立'}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm">{c.comment_text || '（無文字）'}</p>
                        <p className="text-xs text-blue-600 mt-0.5">{translateComment(c.comment_text || '')}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{c.author_name || '匿名'}</span>
                          <span>{c.published_at ? new Date(c.published_at).toLocaleDateString('zh-TW') : '-'}</span>
                          <span>{c.likes_count} 讚</span>
                          {c.post_url && (
                            <a
                              href={c.post_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:text-blue-700 hover:underline"
                            >
                              查看原文
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
