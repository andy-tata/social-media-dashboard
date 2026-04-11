'use client'

import { useState, useMemo } from 'react'
import { MetricCard } from '@/components/cards/MetricCard'
import { EngagementLineChart } from '@/components/charts/EngagementLineChart'
import { SentimentCompareCard } from '@/components/charts/SentimentCompareCard'
import { DateRangePicker, getComparisonRange, formatRangeLabel } from '@/components/ui/date-range-picker'
import type { DateRange } from '@/components/ui/date-range-picker'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { PostWithPage, DailyMetricRow } from '@/lib/data'

type Props = {
  posts: PostWithPage[]
  dailyTrend: DailyMetricRow[]
}

type BrandFilter = 'all' | 'rov' | 'mlbbth'

function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getDefaultRange(): DateRange {
  const now = new Date()
  const end = formatDate(now)
  const start = new Date(now)
  start.setDate(start.getDate() - 6) // 近 7 天
  return { start: formatDate(start), end }
}

function filterByRange(posts: PostWithPage[], range: DateRange): PostWithPage[] {
  return posts.filter((p) => {
    if (!p.published_at) return false
    const date = p.published_at.split('T')[0]
    return date >= range.start && date <= range.end
  })
}

function getEngagement(p: PostWithPage) {
  return p.reactions_total + p.comments_count + p.shares_count
}

function calcBrandMetrics(posts: PostWithPage[]) {
  const count = posts.length
  const totalEngagement = posts.reduce((s, p) => s + getEngagement(p), 0)
  const avgEngagement = count > 0 ? Math.round(totalEngagement / count) : 0
  return { count, totalEngagement, avgEngagement }
}

function calcChange(current: number, previous: number): number {
  return previous > 0 ? ((current - previous) / previous) * 100 : 0
}

export function DashboardClient({ posts, dailyTrend }: Props) {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultRange)
  const [postFilter, setPostFilter] = useState<BrandFilter>('all')

  const compRange = useMemo(() => getComparisonRange(dateRange), [dateRange])

  // 根據日期範圍篩選貼文
  const currentPosts = useMemo(() => filterByRange(posts, dateRange), [posts, dateRange])
  const previousPosts = useMemo(() => filterByRange(posts, compRange), [posts, compRange])

  // ROV 指標
  const rovCurrent = calcBrandMetrics(currentPosts.filter((p) => p.is_own))
  const rovPrevious = calcBrandMetrics(previousPosts.filter((p) => p.is_own))

  // MLBBTH 指標
  const mlbbCurrent = calcBrandMetrics(currentPosts.filter((p) => !p.is_own))
  const mlbbPrevious = calcBrandMetrics(previousPosts.filter((p) => !p.is_own))

  // 期間標籤
  const currentLabel = formatRangeLabel(dateRange)
  const compLabel = formatRangeLabel(compRange)

  // 趨勢圖：只顯示選定期間的資料
  const trendData = useMemo(() => {
    return dailyTrend
      .filter((d) => d.date >= dateRange.start && d.date <= dateRange.end)
      .map((d) => ({
        date: d.date,
        aov: d.aov_engagement,
        mlbb: d.mlbb_engagement,
      }))
  }, [dailyTrend, dateRange, compRange])

  // 情緒分析：依反應表情分類
  const sentimentData = useMemo(() => {
    const calc = (posts: PostWithPage[]) => {
      const positive = posts.reduce((s, p) => s + p.reaction_like + p.reaction_love, 0)
      const negative = posts.reduce((s, p) => s + p.reaction_sad + p.reaction_angry, 0)
      const neutral = posts.reduce((s, p) => s + p.reaction_haha + p.reaction_wow, 0)
      return { positive, negative, neutral, total: positive + negative + neutral }
    }
    return {
      rov: calc(currentPosts.filter((p) => p.is_own)),
      mlbb: calc(currentPosts.filter((p) => !p.is_own)),
    }
  }, [currentPosts])

  // Top 5 互動貼文：根據品牌篩選，按互動數排序
  const topPosts = useMemo(() => {
    let filtered = currentPosts
    if (postFilter === 'rov') filtered = filtered.filter((p) => p.is_own)
    else if (postFilter === 'mlbbth') filtered = filtered.filter((p) => !p.is_own)
    return [...filtered].sort((a, b) => getEngagement(b) - getEngagement(a)).slice(0, 5)
  }, [currentPosts, postFilter])

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* 標題 + 日期選擇器 */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">總覽儀表板</h2>
          <p className="text-sm text-muted-foreground mt-1">Facebook 社群表現一覽 — ROV vs MLBBTH</p>
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* 雙品牌 KPI 對比 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-blue-200 bg-blue-50/30 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-blue-600">ROV — {currentLabel}</h3>
          <div className="grid grid-cols-3 gap-3">
            <MetricCard
              title="貼文數"
              value={rovCurrent.count}
              change={calcChange(rovCurrent.count, rovPrevious.count)}
              subtitle={`vs ${compLabel}`}
            />
            <MetricCard
              title="平均互動數"
              value={rovCurrent.avgEngagement.toLocaleString()}
              change={calcChange(rovCurrent.avgEngagement, rovPrevious.avgEngagement)}
              subtitle={`vs ${compLabel}`}
            />
            <MetricCard
              title="總互動數"
              value={rovCurrent.totalEngagement.toLocaleString()}
              change={calcChange(rovCurrent.totalEngagement, rovPrevious.totalEngagement)}
              subtitle={`vs ${compLabel}`}
            />
          </div>
        </div>

        <div className="rounded-lg border border-red-200 bg-red-50/30 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-red-500">MLBBTH — {currentLabel}</h3>
          <div className="grid grid-cols-3 gap-3">
            <MetricCard
              title="貼文數"
              value={mlbbCurrent.count}
              change={calcChange(mlbbCurrent.count, mlbbPrevious.count)}
              subtitle={`vs ${compLabel}`}
            />
            <MetricCard
              title="平均互動數"
              value={mlbbCurrent.avgEngagement.toLocaleString()}
              change={calcChange(mlbbCurrent.avgEngagement, mlbbPrevious.avgEngagement)}
              subtitle={`vs ${compLabel}`}
            />
            <MetricCard
              title="總互動數"
              value={mlbbCurrent.totalEngagement.toLocaleString()}
              change={calcChange(mlbbCurrent.totalEngagement, mlbbPrevious.totalEngagement)}
              subtitle={`vs ${compLabel}`}
            />
          </div>
        </div>
      </div>

      {/* 圖表區 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <EngagementLineChart data={trendData} title={`每日平均互動數趨勢（${currentLabel}）`} />
        <SentimentCompareCard rov={sentimentData.rov} mlbb={sentimentData.mlbb} />
      </div>

      {/* 最新貼文動態 */}
      <div className="bg-card rounded-lg border border-border">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold">Top 5 互動貼文</h3>
          <div className="flex items-center gap-1">
            {([
              { key: 'all', label: '全部' },
              { key: 'rov', label: 'ROV' },
              { key: 'mlbbth', label: 'MLBBTH' },
            ] as const).map((item) => (
              <button
                key={item.key}
                onClick={() => setPostFilter(item.key)}
                className={cn(
                  'px-2.5 py-1 text-xs rounded-md border transition-colors',
                  postFilter === item.key
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-muted-foreground border-border hover:bg-accent'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="divide-y divide-border">
          {topPosts.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              此期間沒有貼文資料
            </div>
          ) : (
            topPosts.map((post, idx) => (
              <div key={post.id} className="p-4 flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground mt-0.5">
                  {idx + 1}
                </span>
                <Badge variant={post.is_own ? 'default' : 'secondary'} className="shrink-0 text-xs mt-0.5">
                  {post.is_own ? 'ROV' : 'MLBBTH'}
                </Badge>
                <div className="flex-1 min-w-0">
                  {post.post_url ? (
                    <a
                      href={post.post_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm line-clamp-2 hover:text-blue-600 hover:underline transition-colors"
                    >
                      {post.post_text || '（無文字）'}
                    </a>
                  ) : (
                    <p className="text-sm line-clamp-2">{post.post_text || '（無文字）'}</p>
                  )}
                  <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                    <span>{post.published_at ? new Date(post.published_at).toLocaleDateString('zh-TW') : '-'}</span>
                    <span>{post.reactions_total.toLocaleString()} 反應</span>
                    <span>{post.comments_count.toLocaleString()} 留言</span>
                    <span>{post.shares_count.toLocaleString()} 分享</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium">{getEngagement(post).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">互動數</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
